import { createHash } from "node:crypto";

export function hashCheckoutRequest(input: unknown) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

export function isValidIdempotencyKey(value: string | null) {
  return Boolean(value && value.length >= 16 && value.length <= 200);
}
