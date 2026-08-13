import assert from "node:assert/strict";
import test from "node:test";
import { getRateLimitPolicy } from "../src/lib/security/rate-limit-policy.ts";

test("every public write has a separate bounded distributed policy", () => {
  assert.deepEqual(getRateLimitPolicy("/api/quote-request", "POST"), {
    keyPrefix: "quote",
    limiter: "publicWrite",
    limit: 5,
    windowMs: 60_000,
  });
  assert.deepEqual(getRateLimitPolicy("/api/chat", "POST"), {
    keyPrefix: "guest-chat",
    limiter: "publicWrite",
    limit: 5,
    windowMs: 60_000,
  });
  assert.equal(getRateLimitPolicy("/api/reviews", "POST")?.keyPrefix, "review");
  assert.equal(
    getRateLimitPolicy("/api/auth/register", "POST")?.keyPrefix,
    "register",
  );
  assert.equal(
    getRateLimitPolicy("/api/auth/forgot-password", "POST")?.keyPrefix,
    "forgot-password",
  );
  assert.equal(
    getRateLimitPolicy("/api/auth/reset-password", "POST")?.keyPrefix,
    "reset-password",
  );
  assert.equal(
    getRateLimitPolicy("/api/auth/resend-verification", "POST")?.keyPrefix,
    "resend-verification",
  );
});

test("read requests do not consume stricter public-write budgets", () => {
  assert.deepEqual(getRateLimitPolicy("/api/reviews", "GET"), {
    keyPrefix: "api",
    limiter: "api",
    limit: 60,
    windowMs: 60_000,
  });
});
