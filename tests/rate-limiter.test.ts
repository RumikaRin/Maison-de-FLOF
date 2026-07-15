import assert from "node:assert/strict";
import test from "node:test";
import { getClientIp } from "../src/lib/ip.ts";
import { UnifiedRateLimiter } from "../src/lib/rate-limiter.ts";
import { getRateLimitPolicy } from "../src/lib/security/rate-limit-policy.ts";

// Helper to mock request headers
function mockRequest(headersDict: Record<string, string>): Request {
  const headers = new Headers();
  for (const [key, value] of Object.entries(headersDict)) {
    headers.set(key, value);
  }
  return { headers } as unknown as Request;
}

test("getClientIp prioritizes x-real-ip and cf-connecting-ip", () => {
  const req1 = mockRequest({ "x-real-ip": "1.1.1.1", "cf-connecting-ip": "2.2.2.2" });
  assert.equal(getClientIp(req1), "1.1.1.1");

  const req2 = mockRequest({ "cf-connecting-ip": "2.2.2.2", "x-forwarded-for": "3.3.3.3" });
  assert.equal(getClientIp(req2), "2.2.2.2");
});

test("getClientIp parses x-forwarded-for correctly and takes first IP", () => {
  const req = mockRequest({ "x-forwarded-for": " 192.168.1.100, 10.0.0.1, 8.8.8.8 " });
  assert.equal(getClientIp(req), "192.168.1.100");
});

test("getClientIp returns fallback 127.0.0.1 when no headers match", () => {
  const req = mockRequest({});
  assert.equal(getClientIp(req), "127.0.0.1");
});

test("UnifiedRateLimiter in-memory limits request frequency correctly", async () => {
  // Limit of 3 requests per 1000ms
  const limiter = new UnifiedRateLimiter(1000, 3);
  const key = "test-client";

  // First 3 requests should be allowed
  const r1 = await limiter.checkLimit(key);
  assert.equal(r1.success, true);
  assert.equal(r1.remaining, 2);

  const r2 = await limiter.checkLimit(key);
  assert.equal(r2.success, true);
  assert.equal(r2.remaining, 1);

  const r3 = await limiter.checkLimit(key);
  assert.equal(r3.success, true);
  assert.equal(r3.remaining, 0);

  // 4th request should exceed the limit
  const r4 = await limiter.checkLimit(key);
  assert.equal(r4.success, false);
  assert.equal(r4.remaining, 0);
});

test("UnifiedRateLimiter falls back to memory rate limiting if Redis connection fails", async () => {
  // Set invalid Upstash Redis URL to trigger connection error
  process.env.UPSTASH_REDIS_REST_URL = "https://invalid-database-url-12345.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "invalid-token";

  const limiter = new UnifiedRateLimiter(1000, 2);
  const key = "test-client-fallback";

  // Should log error but complete successfully due to fallback
  const r1 = await limiter.checkLimit(key);
  assert.equal(r1.success, true);
  assert.equal(r1.remaining, 1);

  const r2 = await limiter.checkLimit(key);
  assert.equal(r2.success, true);
  assert.equal(r2.remaining, 0);

  const r3 = await limiter.checkLimit(key);
  assert.equal(r3.success, false);

  // Clean up
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

test("rate limit policy protects credentials login and account registration separately", () => {
  assert.deepEqual(getRateLimitPolicy("/api/auth/callback/credentials"), {
    keyPrefix: "auth",
    limiter: "auth",
  });
  assert.deepEqual(getRateLimitPolicy("/api/auth/register"), {
    keyPrefix: "register",
    limiter: "auth",
  });
  assert.deepEqual(getRateLimitPolicy("/api/products"), {
    keyPrefix: "api",
    limiter: "api",
  });
  assert.equal(getRateLimitPolicy("/api/auth/session"), null);
});
