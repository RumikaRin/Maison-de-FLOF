import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateLoadBudget,
  percentile,
  runBoundedLoadScenario,
} from "../src/lib/testing/load-gate.ts";

test("percentile uses nearest-rank ordering", () => {
  assert.equal(percentile([], 95), 0);
  assert.equal(percentile([40, 10, 20, 50, 30], 95), 50);
  assert.equal(percentile([40, 10, 20, 50, 30], 50), 30);
});

test("evaluateLoadBudget passes exact p95 and unexpected-response budgets", () => {
  const result = evaluateLoadBudget(
    Array.from({ length: 99 }, () => ({ status: 200, durationMs: 100 })).concat({
      status: 401,
      durationMs: 100,
    }),
    {
      expectedStatuses: [200],
      maxP95Ms: 100,
      maxUnexpectedRatio: 0.01,
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.p95Ms, 100);
  assert.equal(result.unexpectedRatio, 0.01);
  assert.deepEqual(result.failures, []);
});

test("evaluateLoadBudget fails on server errors, unexpected ratio, and slow p95", () => {
  const result = evaluateLoadBudget(
    [
      { status: 200, durationMs: 10 },
      { status: 401, durationMs: 20 },
      { status: 500, durationMs: 30 },
      { status: 200, durationMs: 400 },
    ],
    {
      expectedStatuses: [200],
      maxP95Ms: 100,
      maxUnexpectedRatio: 0.01,
    },
  );

  assert.equal(result.ok, false);
  assert.deepEqual(result.failures, [
    "server-errors",
    "unexpected-responses",
    "p95",
  ]);
});

test("runBoundedLoadScenario respects configured concurrency", async () => {
  let inFlight = 0;
  let maxInFlight = 0;

  const result = await runBoundedLoadScenario({
    totalRequests: 6,
    concurrency: 2,
    expectedStatuses: [204],
    maxP95Ms: 1_000,
    maxUnexpectedRatio: 0,
    async execute() {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight -= 1;
      return { status: 204 };
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.samples.length, 6);
  assert.equal(maxInFlight, 2);
});
