import { isMainModule } from "./is-main-module.ts";

export const expectedSmokeRoutes = [
  "/",
  "/products",
  "/colors",
  "/blog",
  "/find-dealer",
  "/robots.txt",
  "/sitemap.xml",
  "/api/products?limit=1",
  "/admin",
  "/api/cron/process-outbox",
  "/api/cron/apply-retention",
] as const;

export function evaluateSecurityHeaders(headers: Headers) {
  const failures: string[] = [];
  for (const name of [
    "strict-transport-security",
    "x-content-type-options",
    "x-frame-options",
  ]) {
    if (!headers.get(name)) failures.push(name);
  }

  const csp = headers.get("content-security-policy") ?? "";
  if (!csp) failures.push("content-security-policy");
  if (csp.includes("'unsafe-eval'")) {
    failures.push("content-security-policy:unsafe-eval");
  }

  return failures;
}

export type SmokeResult = {
  route: string;
  status: number;
  passed: boolean;
  failures: string[];
};

function hasExpectedStatus(
  route: string,
  status: number,
  location: string | null,
) {
  if (route === "/admin") {
    return (
      status === 302 ||
      status === 307 ||
      Boolean(location?.includes("/login"))
    );
  }
  if (route.startsWith("/api/cron/")) return status === 401;
  return status >= 200 && status < 400;
}

export async function runDeploymentSmoke(
  baseUrl: string,
  request: typeof fetch = fetch,
) {
  const origin = new URL(baseUrl).origin;
  const results: SmokeResult[] = [];

  for (const route of expectedSmokeRoutes) {
    const response = await request(new URL(route, origin), {
      redirect: route === "/admin" ? "manual" : "follow",
      signal: AbortSignal.timeout(15_000),
    });
    const failures: string[] = [];

    if (
      !hasExpectedStatus(
        route,
        response.status,
        response.headers.get("location"),
      )
    ) {
      failures.push(`status:${response.status}`);
    }
    if (route === "/") {
      failures.push(...evaluateSecurityHeaders(response.headers));
    }

    results.push({
      route,
      status: response.status,
      passed: failures.length === 0,
      failures,
    });
  }

  return results;
}

if (isMainModule(import.meta.url, process.argv[1])) {
  const baseUrl = process.env.DEPLOYMENT_BASE_URL?.trim();
  if (!baseUrl) {
    console.error("Missing variable name: DEPLOYMENT_BASE_URL");
    process.exitCode = 1;
  } else {
    try {
      const results = await runDeploymentSmoke(baseUrl);
      console.table(results);
      if (results.some((result) => !result.passed)) process.exitCode = 1;
    } catch {
      console.error(
        JSON.stringify({
          status: "FAIL",
          code: "DEPLOYMENT_SMOKE_FAILED",
        }),
      );
      process.exitCode = 1;
    }
  }
}
