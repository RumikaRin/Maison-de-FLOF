import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateSessionState,
  hashSessionMetadata,
} from "../src/lib/auth/session-registry.ts";

const now = new Date("2026-07-26T12:00:00.000Z");

const activeSession = {
  userId: "user-1",
  expiresAt: new Date("2026-08-25T12:00:00.000Z"),
  revokedAt: null,
  user: {
    email: "customer@example.com",
    sessionVersion: 4,
    role: { type: "CUSTOMER" as const },
  },
};

test("active registry session returns current identity and role", () => {
  assert.deepEqual(
    evaluateSessionState(activeSession, {
      userId: "user-1",
      sessionVersion: 4,
      now,
    }),
    {
      valid: true,
      email: "customer@example.com",
      role: "CUSTOMER",
      sessionVersion: 4,
    },
  );
});

test("revoked, expired, mismatched-owner and stale-version sessions fail", () => {
  assert.deepEqual(
    evaluateSessionState(
      { ...activeSession, revokedAt: new Date("2026-07-26T11:00:00.000Z") },
      { userId: "user-1", sessionVersion: 4, now },
    ),
    { valid: false },
  );
  assert.deepEqual(
    evaluateSessionState(
      { ...activeSession, expiresAt: now },
      { userId: "user-1", sessionVersion: 4, now },
    ),
    { valid: false },
  );
  assert.deepEqual(
    evaluateSessionState(activeSession, {
      userId: "other-user",
      sessionVersion: 4,
      now,
    }),
    { valid: false },
  );
  assert.deepEqual(
    evaluateSessionState(activeSession, {
      userId: "user-1",
      sessionVersion: 3,
      now,
    }),
    { valid: false },
  );
});

test("session metadata is stored only as deterministic hashes", () => {
  const hash = hashSessionMetadata("Mozilla/5.0");
  assert.ok(hash);
  assert.equal(hash.length, 64);
  assert.equal(hash, hashSessionMetadata("Mozilla/5.0"));
  assert.notEqual(hash, "Mozilla/5.0");
  assert.equal(hashSessionMetadata(undefined), null);
});
