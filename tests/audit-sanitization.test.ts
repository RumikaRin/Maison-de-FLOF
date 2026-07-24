import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeAuditData } from "../src/lib/audit.ts";

test("audit sanitizer removes sensitive keys recursively", () => {
  const result = sanitizeAuditData({
    email: "admin@example.com",
    password: "hash",
    nested: {
      access_token: "access",
      refreshToken: "refresh",
      authorization: "Bearer secret",
      safe: "value",
    },
    values: [
      { idToken: "id-token", count: 2 },
      { apiSecret: "secret", enabled: true },
    ],
  });

  assert.deepEqual(result, {
    email: "admin@example.com",
    nested: {
      safe: "value",
    },
    values: [
      { count: 2 },
      { enabled: true },
    ],
  });
});

test("audit sanitizer converts dates and non-finite numbers safely", () => {
  assert.deepEqual(
    sanitizeAuditData({
      createdAt: new Date("2026-07-24T00:00:00.000Z"),
      invalid: Number.NaN,
      amount: 125000,
    }),
    {
      createdAt: "2026-07-24T00:00:00.000Z",
      invalid: null,
      amount: 125000,
    },
  );
});
