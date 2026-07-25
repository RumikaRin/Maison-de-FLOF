import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateCoverageGates,
  parseLcovReport,
  summarizeCoverage,
  type CoverageGateConfig,
} from "../scripts/run-coverage-gates.ts";

function record(
  file: string,
  coverage: {
    lines: [hit: number, found: number];
    branches: [hit: number, found: number];
    functions: [hit: number, found: number];
  },
) {
  return [
    "TN:",
    `SF:${file}`,
    `FNF:${coverage.functions[1]}`,
    `FNH:${coverage.functions[0]}`,
    `BRF:${coverage.branches[1]}`,
    `BRH:${coverage.branches[0]}`,
    `LH:${coverage.lines[0]}`,
    `LF:${coverage.lines[1]}`,
    "end_of_record",
  ].join("\n");
}

const config: CoverageGateConfig = {
  global: { lines: 70, functions: 70, branches: 65 },
  critical: { lines: 85, functions: 80, branches: 75 },
  criticalFiles: ["src/lib/commerce.ts"],
};

test("parseLcovReport extracts per-file coverage counters", () => {
  const files = parseLcovReport(
    record("src\\lib\\commerce.ts", {
      lines: [9, 10],
      branches: [8, 10],
      functions: [7, 10],
    }),
  );

  assert.deepEqual(files, [
    {
      file: "src/lib/commerce.ts",
      lines: { hit: 9, found: 10, percent: 90 },
      branches: { hit: 8, found: 10, percent: 80 },
      functions: { hit: 7, found: 10, percent: 70 },
    },
  ]);
});

test("summarizeCoverage aggregates counters before calculating percentages", () => {
  const files = parseLcovReport(
    [
      record("src/lib/commerce.ts", {
        lines: [1, 2],
        branches: [1, 4],
        functions: [1, 2],
      }),
      record("src/lib/permissions.ts", {
        lines: [2, 2],
        branches: [3, 4],
        functions: [2, 2],
      }),
    ].join("\n"),
  );

  assert.deepEqual(summarizeCoverage(files), {
    lines: { hit: 3, found: 4, percent: 75 },
    branches: { hit: 4, found: 8, percent: 50 },
    functions: { hit: 3, found: 4, percent: 75 },
  });
});

test("evaluateCoverageGates passes exact threshold boundaries", () => {
  const report = [
    record("src/lib/commerce.ts", {
      lines: [85, 100],
      branches: [75, 100],
      functions: [80, 100],
    }),
    record("src/lib/catalog-page-data.ts", {
      lines: [55, 100],
      branches: [55, 100],
      functions: [60, 100],
    }),
  ].join("\n");

  const result = evaluateCoverageGates(report, config);

  assert.equal(result.ok, true);
  assert.deepEqual(result.failures, []);
  assert.deepEqual(result.missingCriticalFiles, []);
});

test("evaluateCoverageGates fails below global or critical budgets", () => {
  const report = [
    record("src/lib/commerce.ts", {
      lines: [84, 100],
      branches: [75, 100],
      functions: [80, 100],
    }),
    record("src/lib/catalog-page-data.ts", {
      lines: [54, 100],
      branches: [54, 100],
      functions: [59, 100],
    }),
  ].join("\n");

  const result = evaluateCoverageGates(report, config);

  assert.equal(result.ok, false);
  assert.deepEqual(
    result.failures.map((failure) => [failure.scope, failure.metric]),
    [
      ["global", "lines"],
      ["global", "branches"],
      ["global", "functions"],
      ["critical", "lines"],
    ],
  );
});

test("evaluateCoverageGates fails when a configured critical file is not measured", () => {
  const report = record("src/lib/catalog-page-data.ts", {
    lines: [70, 100],
    branches: [65, 100],
    functions: [70, 100],
  });

  const result = evaluateCoverageGates(report, config);

  assert.equal(result.ok, false);
  assert.deepEqual(result.missingCriticalFiles, ["src/lib/commerce.ts"]);
});
