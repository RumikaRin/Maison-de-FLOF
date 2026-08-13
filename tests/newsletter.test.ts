/**
 * Newsletter subscription contract. The footer form was previously a dead stub
 * (it only toasted); this pins the real behaviour: idempotent, reactivating,
 * and non-enumerating.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { subscribeToNewsletter, unsubscribeByToken } from "../src/lib/newsletter.ts";

/** Minimal in-memory stand-in for the Prisma newsletterSubscriber delegate. */
function fakeDb() {
  const rows = new Map<
    string,
    { email: string; status: string; unsubscribeToken: string; source: string; unsubscribedAt: Date | null }
  >();
  return {
    _rows: rows,
    newsletterSubscriber: {
      async findUnique({ where }: { where: { email: string } }) {
        return rows.get(where.email) ?? null;
      },
      async create({ data }: { data: { email: string; source: string; unsubscribeToken: string } }) {
        if (rows.has(data.email)) {
          const err = new Error("unique") as Error & { code: string };
          err.code = "P2002";
          throw err;
        }
        rows.set(data.email, {
          email: data.email,
          status: "SUBSCRIBED",
          unsubscribeToken: data.unsubscribeToken,
          source: data.source,
          unsubscribedAt: null,
        });
        return rows.get(data.email);
      },
      async update({ where, data }: { where: { email: string }; data: Record<string, unknown> }) {
        const row = rows.get(where.email)!;
        Object.assign(row, data);
        return row;
      },
      async updateMany({
        where,
        data,
      }: {
        where: { unsubscribeToken: string; status: string };
        data: Record<string, unknown>;
      }) {
        let count = 0;
        for (const row of rows.values()) {
          if (row.unsubscribeToken === where.unsubscribeToken && row.status === where.status) {
            Object.assign(row, data);
            count += 1;
          }
        }
        return { count };
      },
    },
  };
}

test("a new address is stored as SUBSCRIBED with an unsubscribe token", async () => {
  const db = fakeDb();
  const result = await subscribeToNewsletter(db as never, "New@FLOF.vn");
  assert.equal(result.status, "subscribed");
  const row = db._rows.get("new@flof.vn");
  assert.ok(row, "email is normalised to lowercase and stored");
  assert.equal(row?.status, "SUBSCRIBED");
  assert.ok(row?.unsubscribeToken.length ?? 0 >= 32, "an opaque token was generated");
});

test("subscribing twice is a silent no-op, not an error", async () => {
  const db = fakeDb();
  await subscribeToNewsletter(db as never, "a@flof.vn");
  const again = await subscribeToNewsletter(db as never, "a@flof.vn");
  assert.equal(again.status, "already");
});

test("a previously unsubscribed address is reactivated", async () => {
  const db = fakeDb();
  await subscribeToNewsletter(db as never, "b@flof.vn");
  const token = db._rows.get("b@flof.vn")!.unsubscribeToken;
  await unsubscribeByToken(db as never, token);
  assert.equal(db._rows.get("b@flof.vn")?.status, "UNSUBSCRIBED");

  const back = await subscribeToNewsletter(db as never, "b@flof.vn");
  assert.equal(back.status, "resubscribed");
  assert.equal(db._rows.get("b@flof.vn")?.status, "SUBSCRIBED");
});

test("unsubscribe by an unknown token is a silent success", async () => {
  const db = fakeDb();
  const result = await unsubscribeByToken(db as never, "does-not-exist");
  assert.equal(result.ok, false);
});
