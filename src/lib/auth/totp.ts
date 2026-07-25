import { createHmac, timingSafeEqual } from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const TOTP_STEP_MS = 30_000;

export function encodeBase32(input: Uint8Array) {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of input) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

export function decodeBase32(value: string) {
  const normalized = value.toUpperCase().replace(/=+$/g, "").replace(/\s+/g, "");
  if (!normalized || /[^A-Z2-7]/.test(normalized)) {
    throw new Error("Invalid base32 secret");
  }

  let bits = 0;
  let accumulator = 0;
  const output: number[] = [];
  for (const character of normalized) {
    accumulator =
      (accumulator << 5) | BASE32_ALPHABET.indexOf(character);
    bits += 5;
    if (bits >= 8) {
      output.push((accumulator >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Uint8Array.from(output);
}

export function generateTotpCode(
  secret: Uint8Array,
  nowMs = Date.now(),
  digits = 6,
) {
  if (!Number.isInteger(digits) || digits < 6 || digits > 8) {
    throw new Error("TOTP digits must be between 6 and 8");
  }
  const counter = BigInt(Math.floor(nowMs / TOTP_STEP_MS));
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(counter);
  const digest = createHmac("sha1", secret).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return (binary % 10 ** digits).toString().padStart(digits, "0");
}

export function verifyTotpCode(
  secret: Uint8Array,
  code: string,
  nowMs = Date.now(),
  window = 1,
) {
  if (!/^\d{6}$/.test(code) || !Number.isInteger(window) || window < 0) {
    return false;
  }
  const candidate = Buffer.from(code);
  for (let offset = -window; offset <= window; offset += 1) {
    const expected = Buffer.from(
      generateTotpCode(secret, nowMs + offset * TOTP_STEP_MS),
    );
    if (
      candidate.length === expected.length &&
      timingSafeEqual(candidate, expected)
    ) {
      return true;
    }
  }
  return false;
}
