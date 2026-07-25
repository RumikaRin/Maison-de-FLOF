import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  consumeEmailVerificationToken,
  createEmailVerificationToken,
  emailVerificationIdentifier,
  isCredentialEmailVerified,
  type EmailVerificationDatabase,
  type EmailVerificationTransaction,
} from "../src/lib/auth/email-verification.ts";

type TokenRecord = {
  identifier: string;
  token: string;
  expires: Date;
};

function createFakeDatabase() {
  const tokens = new Map<string, TokenRecord>();
  const users = new Map<string, { emailVerified: Date | null }>([
    ["customer@example.com", { emailVerified: null }],
  ]);

  const keyFor = (identifier: string, token: string) =>
    `${identifier}:${token}`;

  const database: EmailVerificationDatabase = {
    verificationToken: {
      async deleteMany({ where }: { where: { identifier: string } }) {
        let count = 0;
        for (const [key, record] of tokens) {
          if (record.identifier === where.identifier) {
            tokens.delete(key);
            count += 1;
          }
        }
        return { count };
      },
      async create({ data }: { data: TokenRecord }) {
        tokens.set(keyFor(data.identifier, data.token), data);
        return data;
      },
      async findUnique({
        where,
      }: {
        where: {
          identifier_token: { identifier: string; token: string };
        };
      }) {
        const { identifier, token } = where.identifier_token;
        return tokens.get(keyFor(identifier, token)) ?? null;
      },
      async delete({
        where,
      }: {
        where: {
          identifier_token: { identifier: string; token: string };
        };
      }) {
        const { identifier, token } = where.identifier_token;
        tokens.delete(keyFor(identifier, token));
      },
    },
    user: {
      async update({
        where,
        data,
      }: {
        where: { email: string };
        data: { emailVerified: Date };
      }) {
        const user = users.get(where.email);
        if (!user) throw new Error("missing user");
        user.emailVerified = data.emailVerified;
        return user;
      },
    },
    async $transaction<T>(
      operation: (transaction: EmailVerificationTransaction) => Promise<T>,
    ) {
      return operation(database);
    },
  };

  return { database, tokens, users };
}

test("email verification tokens are random, normalized and stored only as hashes", async () => {
  const { database, tokens } = createFakeDatabase();
  const now = new Date("2026-07-26T00:00:00.000Z");

  const first = await createEmailVerificationToken(
    database,
    " Customer@Example.com ",
    now,
  );
  const second = await createEmailVerificationToken(
    database,
    "customer@example.com",
    now,
  );

  assert.notEqual(first.token, second.token);
  assert.equal(second.email, "customer@example.com");
  assert.equal(tokens.size, 1);
  const [stored] = [...tokens.values()];
  assert.equal(
    stored.identifier,
    emailVerificationIdentifier("customer@example.com"),
  );
  assert.equal(
    stored.token,
    createHash("sha256").update(second.token).digest("hex"),
  );
  assert.notEqual(stored.token, second.token);
  assert.equal(stored.expires.toISOString(), "2026-07-27T00:00:00.000Z");
});

test("a verification token is single-use and marks the user verified atomically", async () => {
  const { database, tokens, users } = createFakeDatabase();
  const now = new Date("2026-07-26T00:00:00.000Z");
  const issued = await createEmailVerificationToken(
    database,
    "customer@example.com",
    now,
  );

  assert.equal(
    await consumeEmailVerificationToken(
      database,
      issued.email,
      issued.token,
      new Date("2026-07-26T00:05:00.000Z"),
    ),
    true,
  );
  assert.equal(tokens.size, 0);
  assert.equal(
    users.get(issued.email)?.emailVerified?.toISOString(),
    "2026-07-26T00:05:00.000Z",
  );
  assert.equal(
    await consumeEmailVerificationToken(
      database,
      issued.email,
      issued.token,
      new Date("2026-07-26T00:06:00.000Z"),
    ),
    false,
  );
});

test("expired verification tokens are removed without verifying the user", async () => {
  const { database, tokens, users } = createFakeDatabase();
  const issued = await createEmailVerificationToken(
    database,
    "customer@example.com",
    new Date("2026-07-24T00:00:00.000Z"),
  );

  assert.equal(
    await consumeEmailVerificationToken(
      database,
      issued.email,
      issued.token,
      new Date("2026-07-26T00:00:00.000Z"),
    ),
    false,
  );
  assert.equal(tokens.size, 0);
  assert.equal(users.get(issued.email)?.emailVerified, null);
});

test("credential login requires an email verification timestamp", () => {
  assert.equal(isCredentialEmailVerified(null), false);
  assert.equal(isCredentialEmailVerified(undefined), false);
  assert.equal(
    isCredentialEmailVerified(new Date("2026-07-26T00:00:00.000Z")),
    true,
  );
});
