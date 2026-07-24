import assert from "node:assert/strict";
import test from "node:test";
import {
  CRITICAL_API_OPERATIONS,
  validateOpenApiCoverage,
} from "../scripts/validate-openapi-coverage.ts";

test("OpenAPI covers every critical route and reusable contract schema", async () => {
  const document = await validateOpenApiCoverage();

  assert.equal(document.openapi, "3.1.0");
  assert.equal(Object.keys(document.paths ?? {}).length, 9);
  assert.equal(Object.keys(CRITICAL_API_OPERATIONS).length, 9);
});
