import assert from "node:assert/strict";
import test from "node:test";
import { discoverApiOperations } from "../scripts/api-route-inventory.ts";
import {
  CRITICAL_API_OPERATIONS,
  validateOpenApiCoverage,
} from "../scripts/validate-openapi-coverage.ts";

test("API inventory discovers every route file and exported operation", async () => {
  const inventory = await discoverApiOperations();

  assert.equal(new Set(inventory.map(({ file }) => file)).size, 52);
  assert.equal(inventory.length, 99);
  assert.ok(
    inventory.some(
      ({ path, method }) =>
        path === "/api/orders/{orderNumber}" && method === "patch",
    ),
  );
});

test("OpenAPI covers every critical route and reusable contract schema", async () => {
  const document = await validateOpenApiCoverage();

  assert.equal(document.openapi, "3.1.0");
  assert.equal(Object.keys(document.paths ?? {}).length, 9);
  assert.equal(Object.keys(CRITICAL_API_OPERATIONS).length, 9);
});
