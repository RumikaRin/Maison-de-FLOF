import assert from "node:assert/strict";
import test from "node:test";
import {
  BUNDLE_BUDGETS,
  evaluateBundleBudgets,
} from "../scripts/check-bundle-budgets.ts";

test("bundle budgets accept exact shared and route boundaries", () => {
  assert.deepEqual(BUNDLE_BUDGETS, {
    sharedBytes: 115 * 1024,
    routeBytes: 210 * 1024,
  });
  assert.doesNotThrow(() =>
    evaluateBundleBudgets(
      {
        sharedBytes: 115 * 1024,
        routes: {
          "/": 210 * 1024,
          "/products": 180 * 1024,
        },
      },
      BUNDLE_BUDGETS,
    ),
  );
});

test("bundle budgets report shared and route regressions", () => {
  assert.throws(
    () =>
      evaluateBundleBudgets(
        {
          sharedBytes: 115 * 1024 + 1,
          routes: { "/products": 210 * 1024 + 1 },
        },
        BUNDLE_BUDGETS,
      ),
    /BUNDLE_BUDGET_EXCEEDED:shared.*\/products/s,
  );
});
