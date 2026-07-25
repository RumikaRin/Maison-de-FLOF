import assert from "node:assert/strict";
import test, { after, before, beforeEach } from "node:test";
import {
  loadTestFixtures,
  TEST_FIXTURES,
} from "../../scripts/test-db-fixtures.ts";
import { ApiError } from "../../src/lib/api-auth.ts";
import {
  createCategory,
  deactivateCategory,
  updateCategory,
} from "../../src/lib/admin/catalog-service.ts";
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

test("admin category lifecycle persists audit evidence and rejects duplicate slugs", async () => {
  const admin = await database.user.findUniqueOrThrow({
    where: { email: TEST_FIXTURES.adminEmail },
  });
  const actor = { id: admin.id, email: admin.email };

  const created = await createCategory(database, actor, {
    name: "Integration Interior",
    nameEn: "Integration Interior",
    slug: "integration-admin-interior",
    description: "Integration fixture",
    image: null,
    sortOrder: 90,
    isActive: true,
  });

  assert.equal(created.slug, "integration-admin-interior");
  assert.equal(
    await database.auditLog.count({
      where: {
        entityId: created.id,
        action: "CATEGORY_CREATED",
      },
    }),
    1,
  );

  await assert.rejects(
    () =>
      createCategory(database, actor, {
        name: "Duplicate",
        nameEn: null,
        slug: "integration-admin-interior",
        description: null,
        image: null,
        sortOrder: 91,
        isActive: true,
      }),
    (error: unknown) => error instanceof ApiError && error.status === 409,
  );

  const updated = await updateCategory(database, actor, {
    id: created.id,
    name: "Integration Interior Updated",
    nameEn: null,
    slug: "integration-admin-interior-updated",
    description: null,
    image: null,
    sortOrder: 92,
    isActive: true,
  });
  assert.equal(updated.slug, "integration-admin-interior-updated");

  await deactivateCategory(database, actor, created.id);
  assert.equal(
    (
      await database.category.findUniqueOrThrow({
        where: { id: created.id },
      })
    ).isActive,
    false,
  );
  assert.equal(
    await database.auditLog.count({
      where: {
        entityId: created.id,
        action: {
          in: [
            "CATEGORY_CREATED",
            "CATEGORY_UPDATED",
            "CATEGORY_DEACTIVATED",
          ],
        },
      },
    }),
    3,
  );
});
