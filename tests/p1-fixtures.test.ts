import assert from "node:assert/strict";
import test from "node:test";
import { P1_FIXTURES } from "../scripts/test-db-fixtures.ts";

test("P1 mutable fixture identifiers are isolated by namespace", () => {
  const identifiers = [
    P1_FIXTURES.supplierSlug,
    P1_FIXTURES.collectionSlug,
    P1_FIXTURES.colorCode,
    P1_FIXTURES.productSlug,
    P1_FIXTURES.articleSlug,
    P1_FIXTURES.idempotencyPrefix,
    P1_FIXTURES.addressLabel,
  ];

  assert.equal(P1_FIXTURES.namespace, "integration-p1-");
  for (const identifier of identifiers) {
    assert.match(identifier, /^integration-p1-/);
  }
  assert.match(P1_FIXTURES.productSku, /^INTEGRATION-P1-/);
  assert.match(P1_FIXTURES.orderNumberPrefix, /^INTEGRATION-P1-/);
  assert.match(P1_FIXTURES.customerTwoEmail, /@example\.com$/);
  assert.match(P1_FIXTURES.loadAccountEmail, /@example\.com$/);
});
