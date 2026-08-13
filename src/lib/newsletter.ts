import { randomBytes } from "node:crypto";

export type NewsletterResult =
  | { status: "subscribed" }
  | { status: "already" }
  | { status: "resubscribed" };

/**
 * The slice of the Prisma client this module needs. Kept structural — and this
 * file imports nothing from `@/` — so the pure logic is unit-testable under
 * `node --test` without the path-alias loader.
 */
export type NewsletterDb = {
  newsletterSubscriber: {
    findUnique(args: {
      where: { email: string };
      select?: { status: boolean };
    }): Promise<{ status: string } | null>;
    create(args: {
      data: { email: string; source: string; unsubscribeToken: string };
    }): Promise<unknown>;
    update(args: {
      where: { email: string };
      data: Record<string, unknown>;
    }): Promise<unknown>;
    updateMany(args: {
      where: { unsubscribeToken: string; status: string };
      data: Record<string, unknown>;
    }): Promise<{ count: number }>;
  };
};

/**
 * Idempotent newsletter subscription.
 *
 * - A brand-new address is stored SUBSCRIBED.
 * - An address that already subscribed is a silent no-op (never an error, so the
 *   endpoint cannot be used to probe which addresses are on the list).
 * - An address that previously unsubscribed is reactivated.
 *
 * The unique constraint on `email` makes it race-safe: two concurrent submits
 * collapse to one row (P2002 on the loser is treated as "already").
 */
export async function subscribeToNewsletter(
  database: NewsletterDb,
  email: string,
  source = "footer",
): Promise<NewsletterResult> {
  const normalized = email.trim().toLowerCase();

  const existing = await database.newsletterSubscriber.findUnique({
    where: { email: normalized },
    select: { status: true },
  });

  if (existing) {
    if (existing.status === "SUBSCRIBED") return { status: "already" };
    await database.newsletterSubscriber.update({
      where: { email: normalized },
      data: { status: "SUBSCRIBED", unsubscribedAt: null, source },
    });
    return { status: "resubscribed" };
  }

  try {
    await database.newsletterSubscriber.create({
      data: {
        email: normalized,
        source,
        unsubscribeToken: randomBytes(24).toString("hex"),
      },
    });
    return { status: "subscribed" };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return { status: "already" };
    }
    throw error;
  }
}

/** One-click unsubscribe by opaque token. Unknown token is a silent no-op. */
export async function unsubscribeByToken(
  database: NewsletterDb,
  token: string,
): Promise<{ ok: boolean }> {
  const result = await database.newsletterSubscriber.updateMany({
    where: { unsubscribeToken: token, status: "SUBSCRIBED" },
    data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() },
  });
  return { ok: result.count > 0 };
}
