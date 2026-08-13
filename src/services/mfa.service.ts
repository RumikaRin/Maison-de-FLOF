import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { decryptMfaSecret, encryptMfaSecret } from "@/lib/auth/mfa-crypto";
import {
  decodeBase32,
  encodeBase32,
  verifyTotpCode,
} from "@/lib/auth/totp";

const RECOVERY_CODE_COUNT = 10;

function hashRecoveryCode(code: string) {
  return createHash("sha256")
    .update(code.trim().toUpperCase())
    .digest("hex");
}

function recoveryHashes(value: Prisma.JsonValue) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function matchesRecoveryCode(hashes: string[], code: string) {
  const candidate = Buffer.from(hashRecoveryCode(code));
  return hashes.findIndex((hash) => {
    const expected = Buffer.from(hash);
    return (
      candidate.length === expected.length &&
      timingSafeEqual(candidate, expected)
    );
  });
}

function generateRecoveryCodes() {
  return Array.from({ length: RECOVERY_CODE_COUNT }, () => {
    const value = randomBytes(8).toString("hex").toUpperCase();
    return `${value.slice(0, 4)}-${value.slice(4, 8)}-${value.slice(8, 12)}-${value.slice(12)}`;
  });
}

export async function beginMfaSetup(userId: string, email: string) {
  const existing = await db.mfaCredential.findUnique({
    where: { userId },
    select: { enabledAt: true },
  });
  if (existing?.enabledAt) throw new Error("MFA_ALREADY_ENABLED");

  const secret = encodeBase32(randomBytes(20));
  const secretCiphertext = encryptMfaSecret(
    secret,
    process.env.AUTH_MFA_ENCRYPTION_KEY,
  );
  await db.mfaCredential.upsert({
    where: { userId },
    update: {
      secretCiphertext,
      enabledAt: null,
      recoveryCodeHashes: [],
    },
    create: {
      userId,
      secretCiphertext,
      recoveryCodeHashes: [],
    },
  });

  const issuer = process.env.NEXT_PUBLIC_APP_NAME || "Maison de FLOF";
  const label = `${issuer}:${email}`;
  const uri = new URL(`otpauth://totp/${encodeURIComponent(label)}`);
  uri.searchParams.set("secret", secret);
  uri.searchParams.set("issuer", issuer);
  uri.searchParams.set("algorithm", "SHA1");
  uri.searchParams.set("digits", "6");
  uri.searchParams.set("period", "30");
  return { secret, otpauthUri: uri.toString() };
}

export async function enableMfa(userId: string, code: string) {
  const credential = await db.mfaCredential.findUnique({ where: { userId } });
  if (!credential || credential.enabledAt) return null;
  const secret = decryptMfaSecret(
    credential.secretCiphertext,
    process.env.AUTH_MFA_ENCRYPTION_KEY,
  );
  if (!verifyTotpCode(decodeBase32(secret), code)) return null;

  const recoveryCodes = generateRecoveryCodes();
  await db.mfaCredential.update({
    where: { userId },
    data: {
      enabledAt: new Date(),
      recoveryCodeHashes: recoveryCodes.map(hashRecoveryCode),
    },
  });
  return recoveryCodes;
}

export async function verifyMfaForLogin(userId: string, code: string | undefined) {
  const credential = await db.mfaCredential.findUnique({ where: { userId } });
  if (!credential?.enabledAt) return true;
  if (!code) return false;

  const secret = decryptMfaSecret(
    credential.secretCiphertext,
    process.env.AUTH_MFA_ENCRYPTION_KEY,
  );
  if (verifyTotpCode(decodeBase32(secret), code)) return true;

  return db.$transaction(
    async (transaction) => {
      const current = await transaction.mfaCredential.findUnique({
        where: { userId },
      });
      if (!current?.enabledAt) return false;
      const hashes = recoveryHashes(current.recoveryCodeHashes);
      const recoveryIndex = matchesRecoveryCode(hashes, code);
      if (recoveryIndex < 0) return false;
      await transaction.mfaCredential.update({
        where: { userId },
        data: {
          recoveryCodeHashes: hashes.filter(
            (_, index) => index !== recoveryIndex,
          ),
        },
      });
      return true;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function disableMfa(userId: string, code: string) {
  const valid = await verifyMfaForLogin(userId, code);
  if (!valid) return false;
  const credential = await db.mfaCredential.findUnique({
    where: { userId },
    select: { enabledAt: true },
  });
  if (!credential?.enabledAt) return false;
  await db.$transaction([
    db.mfaCredential.delete({ where: { userId } }),
    db.user.update({
      where: { id: userId },
      data: { sessionVersion: { increment: 1 } },
    }),
  ]);
  return true;
}
