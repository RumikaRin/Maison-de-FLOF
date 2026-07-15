import assert from "node:assert/strict";
import test from "node:test";
import { getHomePageData } from "../src/lib/home-page-data.ts";

const failingDatabase = {
  paint: {
    findMany: async () => {
      throw new Error("database unavailable");
    },
  },
  paintColor: {
    findMany: async () => {
      throw new Error("database unavailable");
    },
  },
  blog: {
    findMany: async () => {
      throw new Error("database unavailable");
    },
  },
};

test("home page data falls back to curated static content when database is unavailable", async () => {
  const data = await getHomePageData(failingDatabase);

  assert.ok(data.mappedProducts.length > 0);
  assert.ok(data.colors.length > 0);
  assert.equal(data.mappedProducts[0].supplier.name, "Maison de FLOF");
  assert.equal(data.colors[0].code, "0001");
  assert.deepEqual(data.mappedBlogs, []);
});
