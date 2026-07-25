import assert from "node:assert/strict";
import test from "node:test";
import {
  decodeBase32,
  encodeBase32,
  generateTotpCode,
  verifyTotpCode,
} from "../src/lib/auth/totp.ts";

const rfcSecret = new TextEncoder().encode("12345678901234567890");
const rfcVectors = [
  [59, "94287082"],
  [1_111_111_109, "07081804"],
  [1_111_111_111, "14050471"],
  [1_234_567_890, "89005924"],
  [2_000_000_000, "69279037"],
  [20_000_000_000, "65353130"],
] as const;

test("TOTP matches RFC 6238 SHA-1 vectors", () => {
  for (const [unixSeconds, expected] of rfcVectors) {
    assert.equal(
      generateTotpCode(rfcSecret, unixSeconds * 1000, 8),
      expected,
    );
  }
});

test("TOTP verification accepts a one-step window and rejects malformed codes", () => {
  const now = 1_234_567_890_000;
  const previous = generateTotpCode(rfcSecret, now - 30_000);
  const next = generateTotpCode(rfcSecret, now + 30_000);
  assert.equal(verifyTotpCode(rfcSecret, previous, now), true);
  assert.equal(verifyTotpCode(rfcSecret, next, now), true);
  assert.equal(verifyTotpCode(rfcSecret, "12345", now), false);
  assert.equal(verifyTotpCode(rfcSecret, "abcdef", now), false);
});

test("base32 encoding round trips binary secrets", () => {
  const encoded = encodeBase32(rfcSecret);
  assert.deepEqual(decodeBase32(encoded), rfcSecret);
});
