import { db } from "@/lib/db";
import {
  generateResetToken,
  hashResetToken,
  passwordResetIdentifier,
} from "@/lib/password-reset-token";

export {
  generateResetToken,
  hashResetToken,
  passwordResetIdentifier,
} from "@/lib/password-reset-token";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function createPasswordResetToken(email: string) {
  const normalized = email.trim().toLowerCase();
  const identifier = passwordResetIdentifier(normalized);
  const rawToken = generateResetToken();
  const tokenHash = hashResetToken(rawToken);
  const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  // Drop previous unused tokens for this email
  await db.verificationToken.deleteMany({ where: { identifier } });

  await db.verificationToken.create({
    data: {
      identifier,
      token: tokenHash,
      expires,
    },
  });

  return { rawToken, expires, email: normalized };
}

export async function consumePasswordResetToken(email: string, rawToken: string) {
  const identifier = passwordResetIdentifier(email);
  const tokenHash = hashResetToken(rawToken);
  const record = await db.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier,
        token: tokenHash,
      },
    },
  });

  if (!record || record.expires < new Date()) {
    if (record) {
      await db.verificationToken
        .delete({
          where: { identifier_token: { identifier, token: tokenHash } },
        })
        .catch(() => undefined);
    }
    return false;
  }

  await db.verificationToken.delete({
    where: { identifier_token: { identifier, token: tokenHash } },
  });
  return true;
}
