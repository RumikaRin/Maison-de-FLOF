import assert from "node:assert/strict";
import test from "node:test";
import { getRateLimitPolicy } from "../src/lib/security/rate-limit-policy.ts";

test("quote and guest chat writes use separate bounded policy keys", () => {
  assert.deepEqual(getRateLimitPolicy("/api/quote-request"), {
    keyPrefix: "quote",
    limiter: "publicWrite",
  });
  assert.deepEqual(getRateLimitPolicy("/api/chat"), {
    keyPrefix: "guest-chat",
    limiter: "publicWrite",
  });
});
