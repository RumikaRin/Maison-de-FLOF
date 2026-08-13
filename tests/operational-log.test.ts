import assert from "node:assert/strict";
import test from "node:test";
import { buildOperationalLog } from "../src/lib/operations/log.ts";

test("operational logs preserve safe release diagnostics", () => {
  const record = buildOperationalLog("info", "cron.outbox.completed", {
    route: "/api/cron/process-outbox",
    correlationId: "iad1::request-id",
    durationMs: 42,
    processed: 3,
    succeeded: 2,
    failed: 1,
    errorCode: "PROVIDER_ERROR",
  });

  assert.equal(record.event, "cron.outbox.completed");
  assert.equal(record.severity, "info");
  assert.equal(record.route, "/api/cron/process-outbox");
  assert.equal(record.correlationId, "iad1::request-id");
  assert.equal(record.durationMs, 42);
  assert.equal(record.processed, 3);
  assert.equal(record.errorCode, "PROVIDER_ERROR");
  assert.match(String(record.timestamp), /^\d{4}-\d{2}-\d{2}T/);
});

test("operational logs remove sensitive and raw error fields recursively", () => {
  const record = buildOperationalLog("error", "cron.outbox.failed", {
    authorization: "Bearer secret-value",
    email: "user@example.com",
    payload: { orderNumber: "FLOF-1" },
    error: new Error("provider-secret-detail"),
    stack: "secret stack",
    nested: {
      accessToken: "token-value",
      credential: "credential-value",
      safeCount: 4,
    },
  });

  const serialized = JSON.stringify(record);
  assert.doesNotMatch(
    serialized,
    /secret-value|user@example\.com|FLOF-1|provider-secret-detail|token-value|credential-value|secret stack/,
  );
  assert.deepEqual(record.nested, { safeCount: 4 });
});
