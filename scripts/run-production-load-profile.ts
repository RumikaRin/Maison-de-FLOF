import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import {
  runBoundedLoadScenario,
  type LoadScenario,
} from "../src/lib/testing/load-gate.ts";

type Fetcher = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export type ProductionLoadScenario = LoadScenario & {
  name: string;
  method: "GET";
  path: string;
  warmupRequests: 1;
};

export function requireProductionBaseUrl(value: string | undefined): URL {
  if (!value?.trim()) {
    throw new Error("DEPLOYMENT_BASE_URL is required");
  }

  const url = new URL(value);
  if (url.protocol !== "https:") {
    throw new Error("DEPLOYMENT_BASE_URL must use HTTPS");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("DEPLOYMENT_BASE_URL must be an origin without credentials or query data");
  }
  url.pathname = "/";
  return url;
}

export function createProductionLoadScenarios(
  baseUrl: URL,
  fetcher: Fetcher = fetch,
): ProductionLoadScenario[] {
  const definitions: Array<{
    name: string;
    path: string;
    expectedStatuses: number[];
  }> = [
    { name: "products", path: "/api/products", expectedStatuses: [200] },
    { name: "colors", path: "/api/colors", expectedStatuses: [200] },
    { name: "blog", path: "/api/blog", expectedStatuses: [200] },
    { name: "profile-rejection", path: "/api/profile", expectedStatuses: [401] },
  ];

  return definitions.map((definition) => ({
    ...definition,
    method: "GET" as const,
    warmupRequests: 1 as const,
    totalRequests: 9,
    concurrency: 2,
    maxP95Ms: 2_500,
    maxUnexpectedRatio: 0,
    async execute() {
      const requestUrl = new URL(definition.path, baseUrl);
      const response = await fetcher(requestUrl, {
        method: "GET",
        headers: {
          accept: "application/json",
          "user-agent": "flof-production-load-check/1.0",
        },
      });
      await response.arrayBuffer();
      return { status: response.status };
    },
  }));
}

export async function runProductionLoadProfile(
  environment: NodeJS.ProcessEnv = process.env,
): Promise<boolean> {
  const baseUrl = requireProductionBaseUrl(environment.DEPLOYMENT_BASE_URL);
  const scenarios = createProductionLoadScenarios(baseUrl);
  let allPassed = true;

  for (const scenario of scenarios) {
    const warmup = await scenario.execute(-1);
    const result = await runBoundedLoadScenario(scenario);
    const warmupPassed =
      scenario.expectedStatuses.includes(warmup.status) && warmup.status < 500;
    const statuses = Object.entries(
      [{ status: warmup.status }, ...result.samples].reduce<Record<string, number>>((counts, sample) => {
        const key = String(sample.status);
        counts[key] = (counts[key] ?? 0) + 1;
        return counts;
      }, {}),
    )
      .sort(([left], [right]) => Number(left) - Number(right))
      .map(([status, count]) => `${status}:${count}`)
      .join(",");
    const passed = warmupPassed && result.ok;
    const status = passed ? "PASS" : "FAIL";
    console.log(
      JSON.stringify({
        scenario: scenario.name,
        status,
        requests: scenario.warmupRequests + result.samples.length,
        p95Ms: result.p95Ms,
        statuses,
      }),
    );
    allPassed = allPassed && passed;
  }

  return allPassed;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  runProductionLoadProfile()
    .then((passed) => {
      if (!passed) process.exitCode = 1;
    })
    .catch((error) => {
      console.error(
        JSON.stringify({
          scenario: "configuration",
          status: "FAIL",
          code: error instanceof Error ? error.message : "UNKNOWN_ERROR",
        }),
      );
      process.exitCode = 1;
    });
}
