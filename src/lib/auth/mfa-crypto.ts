import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const FORMAT_VERSION = "v1";

export function parseMfaEncryptionKey(value: string | undefined) {
  if (!value) throw new Error("AUTH_MFA_ENCRYPTION_KEY is not configured");
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) {
    throw new Error("AUTH_MFA_ENCRYPTION_KEY must decode to exactly 32 bytes");
  }
  return key;
}

export function encryptMfaSecret(secret: string, keyValue: string | undefined) {
  const key = parseMfaEncryptionKey(keyValue);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    FORMAT_VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptMfaSecret(
  encrypted: string,
  keyValue: string | undefined,
) {
  const key = parseMfaEncryptionKey(keyValue);
  const [version, ivValue, tagValue, ciphertextValue, extra] =
    encrypted.split(".");
  if (
    version !== FORMAT_VERSION ||
    !ivValue ||
    !tagValue ||
    !ciphertextValue ||
    extra
  ) {
    throw new Error("Invalid MFA ciphertext");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
