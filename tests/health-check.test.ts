import assert from "node:assert/strict";
import test from "node:test";
import { checkSystemHealth } from "../src/lib/health/health-check.ts";

test("returns healthy when db and redis are up", async () => {
  const result = await checkSystemHealth({
    dbPing: async () => {},
    redisPing: async () => true,
    resendApiKey: "re_test_key_123",
    uptimeProvider: () => 1234,
  });

  assert.equal(result.status, "healthy");
  assert.equal(result.services.database.status, "up");
  assert.equal(result.services.redis.status, "up");
  assert.equal(result.services.email.status, "configured");
  assert.equal(result.uptimeSeconds, 1234);
});

test("returns degraded when db is up but redis ping fails", async () => {
  const result = await checkSystemHealth({
    dbPing: async () => {},
    redisPing: async () => false,
    resendApiKey: "re_test_key_123",
  });

  assert.equal(result.status, "degraded");
  assert.equal(result.services.database.status, "up");
  assert.equal(result.services.redis.status, "down");
});

test("returns unhealthy when db ping fails", async () => {
  const result = await checkSystemHealth({
    dbPing: async () => {
      throw new Error("Connection refused");
    },
    redisPing: async () => true,
  });

  assert.equal(result.status, "unhealthy");
  assert.equal(result.services.database.status, "down");
});

test("marks redis as disabled when no redisPing is provided", async () => {
  const result = await checkSystemHealth({
    dbPing: async () => {},
    resendApiKey: "re_12345",
  });

  assert.equal(result.status, "healthy");
  assert.equal(result.services.redis.status, "disabled");
});
