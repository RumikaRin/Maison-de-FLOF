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

  assert.ok(data.mappedProducts.length > 0);
  assert.ok(data.categories.length > 0);
  assert.ok(data.suppliers.length > 0);
  assert.equal(data.mappedProducts[0].supplier.name, "Maison de FLOF");
});

test("colors page data falls back to static swatches when database is unavailable", async () => {
  const colors = await getColorsPageData(failingCatalogDatabase);

  assert.ok(colors.length > 0);
  assert.equal(colors[0].code, "0001");
});
