import { createHash, randomBytes } from "node:crypto";

const IDENTIFIER_PREFIX = "password-reset:";

export function passwordResetIdentifier(email: string) {
  return `${IDENTIFIER_PREFIX}${email.trim().toLowerCase()}`;
}

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateResetToken() {
  return randomBytes(32).toString("hex");
}
