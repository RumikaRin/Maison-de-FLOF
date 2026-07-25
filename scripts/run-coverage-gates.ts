import { spawnSync } from "node:child_process";
import { isMainModule } from "./is-main-module.ts";

export type CoverageMetricName = "lines" | "branches" | "functions";

export type CoverageMetric = {
  hit: number;
  found: number;
  percent: number;
};

export type FileCoverage = {
  file: string;
  lines: CoverageMetric;
  branches: CoverageMetric;
  functions: CoverageMetric;
};

export type CoverageThresholds = Record<CoverageMetricName, number>;

export type CoverageGateConfig = {
  global: CoverageThresholds;
  critical: CoverageThresholds;
  criticalFiles: string[];
};

export type CoverageGateFailure = {
  scope: "global" | "critical";
  metric: CoverageMetricName;
  actual: number;
  expected: number;
};

export type CoverageGateResult = {
  ok: boolean;
  global: Record<CoverageMetricName, CoverageMetric>;
  critical: Record<CoverageMetricName, CoverageMetric>;
  failures: CoverageGateFailure[];
  missingCriticalFiles: string[];
  measuredFiles: string[];
};

export const coverageGateConfig: CoverageGateConfig = {
  global: { lines: 70, functions: 70, branches: 65 },
  critical: { lines: 85, functions: 80, branches: 75 },
  criticalFiles: [
    "src/lib/admin/admin-api-policy.ts",
    "src/lib/commerce.ts",
    "src/lib/idempotency.ts",
    "src/lib/order-validation.ts",
    "src/lib/payment-policy.ts",
    "src/lib/permissions.ts",
    "src/lib/rate-limiter.ts",
    "src/lib/security/headers.ts",
    "src/lib/security/rate-limit-policy.ts",
  ],
};

const coverageIncludeGlobs = ["src/lib/**/*.ts"];
const unitTestGlob = "tests/*.test.ts";
const metricNames: CoverageMetricName[] = ["lines", "branches", "functions"];

function normalizeCoveragePath(file: string) {
  return file.replaceAll("\\", "/").replace(/^\.\//, "");
}

function percent(hit: number, found: number) {
  if (found === 0) return 100;
  return Math.round((hit / found) * 10000) / 100;
}

function metric(hit: number, found: number): CoverageMetric {
  return { hit, found, percent: percent(hit, found) };
}

export function parseLcovReport(report: string): FileCoverage[] {
  return report
    .split("end_of_record")
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      let file = "";
      let linesHit = 0;
      let linesFound = 0;
      let branchesHit = 0;
      let branchesFound = 0;
      let functionsHit = 0;
      let functionsFound = 0;

      for (const line of record.split(/\r?\n/)) {
        const [key, rawValue] = line.split(":", 2);
        const value = Number(rawValue);
        if (key === "SF") file = normalizeCoveragePath(rawValue);
        if (key === "LH") linesHit = value;
        if (key === "LF") linesFound = value;
        if (key === "BRH") branchesHit = value;
        if (key === "BRF") branchesFound = value;
        if (key === "FNH") functionsHit = value;
        if (key === "FNF") functionsFound = value;
      }

      return {
        file,
        lines: metric(linesHit, linesFound),
        branches: metric(branchesHit, branchesFound),
        functions: metric(functionsHit, functionsFound),
      };
    })
    .filter((file) => file.file);
}

export function summarizeCoverage(files: FileCoverage[]) {
  const totals = {
    lines: { hit: 0, found: 0 },
    branches: { hit: 0, found: 0 },
    functions: { hit: 0, found: 0 },
  };

  for (const file of files) {
    for (const name of metricNames) {
      totals[name].hit += file[name].hit;
      totals[name].found += file[name].found;
    }
  }

  return {
    lines: metric(totals.lines.hit, totals.lines.found),
    branches: metric(totals.branches.hit, totals.branches.found),
    functions: metric(totals.functions.hit, totals.functions.found),
  };
}

export function evaluateCoverageGates(
  report: string,
  config: CoverageGateConfig = coverageGateConfig,
): CoverageGateResult {
  const files = parseLcovReport(report);
  const measuredFileSet = new Set(files.map((file) => file.file));
  const criticalFileSet = new Set(
    config.criticalFiles.map((file) => normalizeCoveragePath(file)),
  );
  const missingCriticalFiles = [...criticalFileSet].filter(
    (file) => !measuredFileSet.has(file),
  );
  const criticalFiles = files.filter((file) => criticalFileSet.has(file.file));
  const global = summarizeCoverage(files);
  const critical = summarizeCoverage(criticalFiles);
  const failures: CoverageGateFailure[] = [];

  for (const metricName of metricNames) {
    const actual = global[metricName].percent;
    const expected = config.global[metricName];
    if (actual < expected) {
      failures.push({ scope: "global", metric: metricName, actual, expected });
    }
  }

  for (const metricName of metricNames) {
    const actual = critical[metricName].percent;
    const expected = config.critical[metricName];
    if (actual < expected) {
      failures.push({
        scope: "critical",
        metric: metricName,
        actual,
        expected,
      });
    }
  }

  return {
    ok: failures.length === 0 && missingCriticalFiles.length === 0,
    global,
    critical,
    failures,
    missingCriticalFiles,
    measuredFiles: [...measuredFileSet].sort(),
  };
}

function formatMetric(summary: Record<CoverageMetricName, CoverageMetric>) {
  return `lines=${summary.lines.percent}% functions=${summary.functions.percent}% branches=${summary.branches.percent}%`;
}

function runNodeCoverage() {
  const args = [
    "--experimental-strip-types",
    "--experimental-test-coverage",
    "--test-reporter=lcov",
    ...coverageIncludeGlobs.map((glob) => `--test-coverage-include=${glob}`),
    "--test",
    unitTestGlob,
  ];
  return spawnSync(process.execPath, args, {
    encoding: "utf8",
    env: process.env,
  });
}

if (isMainModule(import.meta.url, process.argv[1])) {
  const coverage = runNodeCoverage();
  if (coverage.error || coverage.status !== 0) {
    console.error("COVERAGE_TEST_RUN_FAILED");
    if (coverage.stdout) process.stdout.write(coverage.stdout);
    if (coverage.stderr) process.stderr.write(coverage.stderr);
    process.exitCode = coverage.status ?? 1;
  } else {
    const result = evaluateCoverageGates(coverage.stdout);
    console.log(`Coverage global: ${formatMetric(result.global)}`);
    console.log(`Coverage critical: ${formatMetric(result.critical)}`);
    if (result.missingCriticalFiles.length > 0) {
      console.error(
        `Coverage missing critical files: ${result.missingCriticalFiles.join(", ")}`,
      );
    }
    for (const failure of result.failures) {
      console.error(
        `Coverage ${failure.scope} ${failure.metric} ${failure.actual}% below ${failure.expected}%`,
      );
    }
    if (!result.ok) process.exitCode = 1;
  }
}
