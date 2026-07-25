import assert from "node:assert/strict";
import test from "node:test";
import { discoverApiOperations } from "../scripts/api-route-inventory.ts";
import { validateOpenApiCoverage } from "../scripts/validate-openapi-coverage.ts";

test("API inventory discovers every route file and exported operation", async () => {
  const inventory = await discoverApiOperations();

  assert.equal(new Set(inventory.map(({ file }) => file)).size, 61);
  assert.equal(inventory.length, 109);
  assert.ok(
    inventory.some(
      ({ path, method }) =>
        path === "/api/orders/{orderNumber}" && method === "patch",
    ),
  );
  assert.ok(
    inventory.some(
      ({ path, method }) =>
        path === "/api/profile/data-export" && method === "get",
    ),
  );
  assert.ok(
    inventory.some(
      ({ path, method }) =>
        path === "/api/profile/delete-account" && method === "delete",
    ),
  );
});

test("OpenAPI covers every source operation and reusable contract schema", async () => {
  const { document, sourceOperations, documentedOperations } =
    await validateOpenApiCoverage();

  assert.equal(document.openapi, "3.1.0");
  assert.equal(sourceOperations.length, 109);
  assert.equal(documentedOperations.length, 109);
});
