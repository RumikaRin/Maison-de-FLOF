import assert from "node:assert/strict";
import test from "node:test";
import {
  decryptMfaSecret,
  encryptMfaSecret,
  parseMfaEncryptionKey,
} from "../src/lib/auth/mfa-crypto.ts";

const key = Buffer.alloc(32, 7).toString("base64");
const wrongKey = Buffer.alloc(32, 8).toString("base64");

test("MFA secret encryption round trips without plaintext in ciphertext", () => {
  const encrypted = encryptMfaSecret("JBSWY3DPEHPK3PXP", key);
  assert.equal(encrypted.includes("JBSWY3DPEHPK3PXP"), false);
  assert.equal(decryptMfaSecret(encrypted, key), "JBSWY3DPEHPK3PXP");
});

test("MFA secret decryption fails with a different key", () => {
  const encrypted = encryptMfaSecret("JBSWY3DPEHPK3PXP", key);
  assert.throws(() => decryptMfaSecret(encrypted, wrongKey));
});

test("MFA encryption requires exactly 32 bytes", () => {
  assert.equal(parseMfaEncryptionKey(key).length, 32);
  assert.throws(() => parseMfaEncryptionKey(""));
  assert.throws(() => parseMfaEncryptionKey(Buffer.alloc(16).toString("base64")));
});
