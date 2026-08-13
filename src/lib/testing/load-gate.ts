import { performance } from "node:perf_hooks";

export type LoadSample = {
  status: number;
  durationMs: number;
};

export type LoadBudget = {
  expectedStatuses: number[];
  maxP95Ms: number;
  maxUnexpectedRatio: number;
};

export type LoadEvaluation = {
  ok: boolean;
  p95Ms: number;
  unexpectedCount: number;
  unexpectedRatio: number;
  serverErrorCount: number;
  failures: Array<"server-errors" | "unexpected-responses" | "p95">;
};

export type LoadScenario = LoadBudget & {
  totalRequests: number;
  concurrency: number;
  execute: (index: number) => Promise<{ status: number }>;
};

export type LoadScenarioResult = LoadEvaluation & {
  samples: LoadSample[];
};

export function percentile(values: number[], targetPercentile: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const rank = Math.ceil((targetPercentile / 100) * sorted.length);
  return sorted[Math.max(0, Math.min(sorted.length - 1, rank - 1))];
}

export function evaluateLoadBudget(
  samples: LoadSample[],
  budget: LoadBudget,
): LoadEvaluation {
  const expectedStatuses = new Set(budget.expectedStatuses);
  const unexpectedCount = samples.filter(
    (sample) => !expectedStatuses.has(sample.status),
  ).length;
  const serverErrorCount = samples.filter((sample) => sample.status >= 500).length;
  const unexpectedRatio =
    samples.length === 0 ? 0 : unexpectedCount / samples.length;
  const p95Ms = percentile(
    samples.map((sample) => sample.durationMs),
    95,
  );
  const failures: LoadEvaluation["failures"] = [];

  if (serverErrorCount > 0) failures.push("server-errors");
  if (unexpectedRatio > budget.maxUnexpectedRatio) {
    failures.push("unexpected-responses");
  }
  if (p95Ms > budget.maxP95Ms) failures.push("p95");

  return {
    ok: failures.length === 0,
    p95Ms,
    unexpectedCount,
    unexpectedRatio,
    serverErrorCount,
    failures,
  };
}

export async function runBoundedLoadScenario(
  scenario: LoadScenario,
): Promise<LoadScenarioResult> {
  const samples: LoadSample[] = [];
  let nextIndex = 0;
  const workerCount = Math.min(scenario.concurrency, scenario.totalRequests);

  async function worker() {
    while (nextIndex < scenario.totalRequests) {
      const requestIndex = nextIndex;
      nextIndex += 1;
      const startedAt = performance.now();
      try {
        const response = await scenario.execute(requestIndex);
        samples.push({
          status: response.status,
          durationMs: Math.round(performance.now() - startedAt),
        });
      } catch {
        samples.push({
          status: 0,
          durationMs: Math.round(performance.now() - startedAt),
        });
      }
    }
  }

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      await worker();
    }),
  );

  return {
    ...evaluateLoadBudget(samples, scenario),
    samples,
  };
}
