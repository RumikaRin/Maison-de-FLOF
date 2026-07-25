import { expect, test, type APIRequestContext } from "@playwright/test";
import {
  runBoundedLoadScenario,
  type LoadScenarioResult,
} from "../src/lib/testing/load-gate.ts";

type ApiScenario = {
  name: string;
  totalRequests: number;
  concurrency: number;
  expectedStatuses: number[];
  maxP95Ms: number;
  maxUnexpectedRatio: number;
  execute: (
    request: APIRequestContext,
    index: number,
  ) => Promise<{ status: number }>;
};

const scenarios: ApiScenario[] = [
  {
    name: "catalog",
    totalRequests: 40,
    concurrency: 8,
    expectedStatuses: [200],
    maxP95Ms: 1_500,
    maxUnexpectedRatio: 0.01,
    execute: async (request) => {
      const response = await request.get("/api/products?page=1&limit=20", {
        headers: { "x-real-ip": "198.51.100.101" },
      });
      return { status: response.status() };
    },
  },
  {
    name: "auth rejection",
    totalRequests: 20,
    concurrency: 4,
    expectedStatuses: [401],
    maxP95Ms: 1_500,
    maxUnexpectedRatio: 0.01,
    execute: async (request) => {
      const response = await request.get("/api/profile", {
        headers: { "x-real-ip": "198.51.100.102" },
      });
      return { status: response.status() };
    },
  },
  {
    name: "checkout validation",
    totalRequests: 20,
    concurrency: 4,
    expectedStatuses: [401],
    maxP95Ms: 2_000,
    maxUnexpectedRatio: 0.01,
    execute: async (request, index) => {
      const response = await request.post("/api/orders", {
        headers: {
          "Idempotency-Key": `integration-p1-load-${index}`,
          "x-real-ip": "198.51.100.103",
        },
        data: {},
      });
      return { status: response.status() };
    },
  },
  {
    name: "admin dashboard rejection",
    totalRequests: 20,
    concurrency: 4,
    expectedStatuses: [401],
    maxP95Ms: 1_500,
    maxUnexpectedRatio: 0.01,
    execute: async (request) => {
      const response = await request.get("/api/admin/dashboard", {
        headers: { "x-real-ip": "198.51.100.104" },
      });
      return { status: response.status() };
    },
  },
];

function summarize(result: LoadScenarioResult) {
  return {
    p95Ms: result.p95Ms,
    unexpectedCount: result.unexpectedCount,
    unexpectedRatio: result.unexpectedRatio,
    serverErrorCount: result.serverErrorCount,
    failures: result.failures,
  };
}

for (const scenario of scenarios) {
  test(`${scenario.name} stays inside bounded load budget`, async ({
    request,
  }) => {
    const result = await runBoundedLoadScenario({
      totalRequests: scenario.totalRequests,
      concurrency: scenario.concurrency,
      expectedStatuses: scenario.expectedStatuses,
      maxP95Ms: scenario.maxP95Ms,
      maxUnexpectedRatio: scenario.maxUnexpectedRatio,
      execute: (index) => scenario.execute(request, index),
    });

    expect(result.samples).toHaveLength(scenario.totalRequests);
    expect(result.ok, JSON.stringify(summarize(result))).toBe(true);
  });
}
