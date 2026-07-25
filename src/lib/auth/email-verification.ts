import { createHash, randomBytes } from "node:crypto";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export function isCredentialEmailVerified(
  value: Date | null | undefined,
): boolean {
  return value instanceof Date && Number.isFinite(value.getTime());
}

type VerificationTokenWhere = {
  identifier_token: { identifier: string; token: string };
};

export type EmailVerificationTransaction = {
  verificationToken: {
    deleteMany(input: {
      where: { identifier: string };
    }): Promise<{ count: number }>;
    create(input: {
      data: { identifier: string; token: string; expires: Date };
    }): Promise<unknown>;
    findUnique(input: {
      where: VerificationTokenWhere;
    }): Promise<{ identifier: string; token: string; expires: Date } | null>;
    delete(input: { where: VerificationTokenWhere }): Promise<unknown>;
  };
  user: {
    update(input: {
      where: { email: string };
      data: { emailVerified: Date };
    }): Promise<unknown>;
  };
};

export type EmailVerificationDatabase = EmailVerificationTransaction & {
  $transaction<T>(
    operation: (transaction: EmailVerificationTransaction) => Promise<T>,
  ): Promise<T>;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashEmailVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function emailVerificationIdentifier(email: string) {
  return `email-verification:${normalizeEmail(email)}`;
}

export async function createEmailVerificationToken(
  database: Pick<EmailVerificationTransaction, "verificationToken">,
  email: string,
  now = new Date(),
) {
  const normalizedEmail = normalizeEmail(email);
  const identifier = emailVerificationIdentifier(normalizedEmail);
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashEmailVerificationToken(token);
  const expires = new Date(now.getTime() + EMAIL_VERIFICATION_TTL_MS);

  await database.verificationToken.deleteMany({ where: { identifier } });
  await database.verificationToken.create({
    data: { identifier, token: tokenHash, expires },
  });

  return { email: normalizedEmail, token, expires };
}

export async function consumeEmailVerificationToken(
  database: EmailVerificationDatabase,
  email: string,
  token: string,
  now = new Date(),
) {
  const normalizedEmail = normalizeEmail(email);
  const identifier = emailVerificationIdentifier(normalizedEmail);
  const tokenHash = hashEmailVerificationToken(token);
  const where = {
    identifier_token: { identifier, token: tokenHash },
  };

  return database.$transaction(async (transaction) => {
    const record = await transaction.verificationToken.findUnique({ where });
    if (!record) return false;

    if (record.expires <= now) {
      await transaction.verificationToken.delete({ where });
      return false;
    }

    await transaction.user.update({
      where: { email: normalizedEmail },
      data: { emailVerified: now },
    });
    await transaction.verificationToken.delete({ where });
    return true;
  });
}
