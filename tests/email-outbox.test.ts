import test from "node:test";
import assert from "node:assert/strict";
import {
  dispatchOutboxRecord,
  OutboxDispatchError,
} from "../src/lib/email-outbox.ts";

test("outbox dispatches a valid order confirmation", async () => {
  const calls: unknown[] = [];

  await dispatchOutboxRecord(
    {
      type: "ORDER_CONFIRMATION",
      payload: {
        email: "user@example.com",
        fullName: "User",
        orderNumber: "FLOF-001",
        total: 125000,
      },
    },
    async (...args) => {
      calls.push(args);
    },
  );

  assert.deepEqual(calls, [
    ["user@example.com", "User", "FLOF-001", 125000],
  ]);
});

test("outbox rejects unsupported record types", async () => {
  await assert.rejects(
    () =>
      dispatchOutboxRecord(
        { type: "UNKNOWN", payload: {} },
        async () => undefined,
      ),
    (error) =>
      error instanceof OutboxDispatchError &&
      error.code === "UNSUPPORTED_TYPE",
  );
});

test("outbox rejects malformed order confirmation payloads", async () => {
  await assert.rejects(
    () =>
      dispatchOutboxRecord(
        {
          type: "ORDER_CONFIRMATION",
          payload: { email: "user@example.com" },
        },
        async () => undefined,
      ),
    (error) =>
      error instanceof OutboxDispatchError &&
      error.code === "INVALID_PAYLOAD",
  );
});
