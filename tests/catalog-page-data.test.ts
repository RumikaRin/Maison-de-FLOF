import assert from "node:assert/strict";
import test from "node:test";
import { getColorsPageData, getProductsPageData } from "../src/lib/catalog-page-data.ts";

const failingCatalogDatabase = {
  paint: {
    findMany: async () => {
      throw new Error("database unavailable");
    },
  },
  category: {
    findMany: async () => {
      throw new Error("database unavailable");
    },
  },
  supplier: {
    findMany: async () => {
      throw new Error("database unavailable");
    },
  },
  paintColor: {
    findMany: async () => {
      throw new Error("database unavailable");
    },
  },
};

test("products page data falls back to static catalog content when database is unavailable", async () => {
  const data = await getProductsPageData(failingCatalogDatabase);

  assert.equal(data.source, "fallback");
  assert.equal(data.commerceAvailable, false);
  assert.ok(data.mappedProducts.length > 0);
  assert.ok(data.categories.length > 0);
  assert.ok(data.suppliers.length > 0);
  assert.equal(data.mappedProducts[0].supplier.name, "Maison de FLOF");
});

test("products page marks successful database results as commerce-enabled", async () => {
  const data = await getProductsPageData({
    paint: { findMany: async () => [] },
    category: { findMany: async () => [] },
    supplier: { findMany: async () => [] },
  });

  assert.equal(data.source, "database");
  assert.equal(data.commerceAvailable, true);
});

test("colors page data falls back to static swatches when database is unavailable", async () => {
  const colors = await getColorsPageData(failingCatalogDatabase);

  assert.ok(colors.length > 0);
  assert.equal(colors[0].code, "0001");
});
