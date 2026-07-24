import assert from "node:assert/strict";
import test from "node:test";
import { canAddCatalogItemToCart } from "../src/lib/catalog-result.ts";

test("fallback catalog content can never be added to the cart", () => {
  assert.equal(
    canAddCatalogItemToCart({
      source: "fallback",
      commerceAvailable: false,
    }),
    false,
  );
});

test("database catalog content remains commerce-enabled", () => {
  assert.equal(
    canAddCatalogItemToCart({
      source: "database",
      commerceAvailable: true,
    }),
    true,
  );
});
