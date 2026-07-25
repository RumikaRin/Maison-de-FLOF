import assert from "node:assert/strict";
import test, { after, before, beforeEach } from "node:test";
import { loadTestFixtures } from "../../scripts/test-db-fixtures.ts";
import {
  createTestDatabase,
  resetAdminCatalogFixtures,
} from "./helpers/test-database.ts";

const database = createTestDatabase();

before(async () => {
  await loadTestFixtures();
});

beforeEach(async () => {
  await resetAdminCatalogFixtures(database);
});

after(async () => {
  await resetAdminCatalogFixtures(database);
  await database.$disconnect();
});

test("admin catalog cleanup removes only namespaced fixtures", async () => {
  await database.category.create({
    data: {
      name: "Integration cleanup",
      slug: "integration-admin-cleanup",
    },
  });

  await resetAdminCatalogFixtures(database);

  assert.equal(
    await database.category.count({
      where: { slug: "integration-admin-cleanup" },
    }),
    0,
  );
  assert.equal(
    await database.category.count({ where: { slug: "integration-paints" } }),
    1,
  );
});
