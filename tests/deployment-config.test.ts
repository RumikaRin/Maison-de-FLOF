import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

type VercelConfig = {
  crons?: Array<{ path?: string; schedule?: string }>;
};

test("Vercel config schedules only the non-VNPay email outbox cron", async () => {
  const source = await readFile(
    new URL("../vercel.json", import.meta.url),
    "utf8",
  );
  const config = JSON.parse(source) as VercelConfig;

  assert.deepEqual(config.crons, [
    {
      path: "/api/cron/process-outbox",
      schedule: "5 0 * * *",
    },
  ]);

  const cron = config.crons?.[0];
  assert.equal(cron?.schedule?.trim().split(/\s+/).length, 5);
  assert.doesNotMatch(cron?.path ?? "", /vnpay|expire-unpaid-orders/i);
});
