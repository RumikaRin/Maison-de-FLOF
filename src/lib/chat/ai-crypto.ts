import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "node:crypto";

const FORMAT_VERSION = "enc:v1";

function getEncryptionKey(): Buffer {
  const rawSecret =
    process.env.AI_ENCRYPTION_KEY ||
    process.env.AUTH_SECRET ||
    "maison-de-flof-ai-provider-default-vault-secret-2026";
  return createHash("sha256").update(rawSecret).digest();
}

/**
 * Encrypts an AI Provider API Key using AES-256-GCM.
 * Idempotent: returns as-is if already encrypted or empty.
 */
export function encryptAiApiKey(plainText: string | undefined): string {
  if (!plainText || !plainText.trim()) return "";
  const trimmed = plainText.trim();
  if (trimmed.startsWith(`${FORMAT_VERSION}:`)) {
    return trimmed;
  }

  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(trimmed, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    FORMAT_VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");
}

/**
 * Decrypts an AES-256-GCM encrypted AI Provider API Key.
 * Backwards compatible: returns unencrypted string if not prefixed with enc:v1:
 */
export function decryptAiApiKey(cipherText: string | undefined): string {
  if (!cipherText || !cipherText.trim()) return "";
  const trimmed = cipherText.trim();
  if (!trimmed.startsWith(`${FORMAT_VERSION}:`)) {
    return trimmed; // Legacy plaintext
  }

  const parts = trimmed.split(":");
  if (parts.length !== 5 || parts[0] !== "enc" || parts[1] !== "v1") return "";
  const [, , ivStr, tagStr, ctStr] = parts;

  try {
    const key = getEncryptionKey();
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(ivStr, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagStr, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(ctStr, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch (err) {
    console.error("[ai-crypto] Failed to decrypt API key:", err);
    return "";
  }
}
