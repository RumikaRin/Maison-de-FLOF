import assert from "node:assert/strict";
import test from "node:test";
import {
  getCachedSession,
  setCachedSession,
  invalidateCachedSession,
  invalidateUserSessionCache,
} from "../src/lib/auth/session-cache.ts";

test("session cache handles missing Redis environment safely without throwing", async () => {
  // Without Redis env, cache calls should gracefully return null / succeed safely
  const cached = await getCachedSession("test-session-id");
  assert.equal(cached, null);

  await setCachedSession("test-session-id", {
    id: "test-session-id",
    userId: "user-123",
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    revokedAt: null,
    user: {
      email: "user@flof.vn",
      sessionVersion: 1,
      role: { type: "CUSTOMER" },
    },
  });

  await invalidateCachedSession("test-session-id");
  await invalidateUserSessionCache("user-123");
});
