import assert from "node:assert/strict";
import test, { after, beforeEach } from "node:test";
import { processEmailOutboxRecord } from "../../src/lib/process-email-outbox.ts";
import { createTestDatabase } from "./helpers/test-database.ts";

const database = createTestDatabase();

beforeEach(async () => {
  await database.emailOutbox.deleteMany();
});

after(async () => {
  await database.$disconnect();
});

test("failed delivery persists a retryable outbox transition", async () => {
  const record = await database.emailOutbox.create({
    data: {
      type: "ORDER_CONFIRMATION",
      payload: {
        email: "customer.integration@flof.test",
        fullName: "Integration Customer",
        orderNumber: "FLOF-OUTBOX-1",
        total: 500000,
      },
    },
  });
  const now = new Date("2026-07-24T10:00:00.000Z");

  const result = await processEmailOutboxRecord(
    database,
    record,
    async () => {
      throw new Error("synthetic provider outage");
    },
    () => now,
  );
  const persisted = await database.emailOutbox.findUniqueOrThrow({
    where: { id: record.id },
  });

  assert.deepEqual(result, {
    id: record.id,
    status: "FAILED",
    error: "UNKNOWN_ERROR",
  });
  assert.equal(persisted.status, "FAILED");
  assert.equal(persisted.retryCount, 1);
  assert.equal(persisted.error, "UNKNOWN_ERROR");
  assert.equal(
    persisted.nextRetryAt?.toISOString(),
    "2026-07-24T10:01:00.000Z",
  );
});

test("successful retry clears failure metadata and marks the record sent", async () => {
  const record = await database.emailOutbox.create({
    data: {
      type: "ORDER_CONFIRMATION",
      payload: {
        email: "customer.integration@flof.test",
        fullName: "Integration Customer",
        orderNumber: "FLOF-OUTBOX-2",
        total: 500000,
      },
      status: "FAILED",
      error: "UNKNOWN_ERROR",
      retryCount: 1,
      nextRetryAt: new Date("2026-07-24T10:00:00.000Z"),
    },
  });

  const result = await processEmailOutboxRecord(
    database,
    record,
    async () => undefined,
  );
  const persisted = await database.emailOutbox.findUniqueOrThrow({
    where: { id: record.id },
  });

  assert.deepEqual(result, { id: record.id, status: "SENT" });
  assert.equal(persisted.status, "SENT");
  assert.equal(persisted.error, null);
  assert.equal(persisted.nextRetryAt, null);
  assert.equal(persisted.retryCount, 1);
});
