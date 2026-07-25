import assert from "node:assert/strict";
import test, { after, before, beforeEach } from "node:test";
import {
  loadTestFixtures,
  TEST_FIXTURES,
} from "../../scripts/test-db-fixtures.ts";
import { ApiError } from "../../src/lib/api-auth.ts";
import {
  createCategory,
  createProduct,
  deactivateCategory,
  deactivateProduct,
  deleteColor,
  updateCategory,
  updateProduct,
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

test("admin product lifecycle commits relations, inventory and audit atomically", async () => {
  const [admin, category, supplier] = await Promise.all([
    database.user.findUniqueOrThrow({
      where: { email: TEST_FIXTURES.adminEmail },
    }),
    database.category.findUniqueOrThrow({
      where: { slug: "integration-paints" },
    }),
    database.supplier.findUniqueOrThrow({
      where: { slug: "flof-integration" },
    }),
  ]);
  const actor = { id: admin.id, email: admin.email };
  await database.paintColor.createMany({
    data: [
      {
        code: "INTEGRATION-ADMIN-RED",
        name: "Integration red",
        hex: "#AA0000",
        toneFamily: "Warm",
        colorFamily: "Red",
      },
      {
        code: "INTEGRATION-ADMIN-BLUE",
        name: "Integration blue",
        hex: "#0000AA",
        toneFamily: "Cool",
        colorFamily: "Blue",
      },
    ],
  });

  const input = {
    sku: "INTEGRATION-ADMIN-PAINT-5L",
    name: "Integration Admin Paint",
    nameEn: "Integration Admin Paint",
    categoryId: category.id,
    supplierId: supplier.id,
    description: "Catalog integration fixture",
    descriptionEn: "Catalog integration fixture",
    paintType: "INTERIOR" as const,
    finish: "MATTE" as const,
    volume: 5,
    volumeUnit: "L",
    price: 450000,
    costPrice: 270000,
    discountPercent: 5,
    stock: 7,
    colorCodes: ["INTEGRATION-ADMIN-RED", "INTEGRATION-ADMIN-BLUE"],
  };
  const created = await createProduct(database, actor, input);

  assert.equal(created.colors.length, 2);
  assert.equal(
    await database.inventoryTransaction.count({
      where: { paintId: created.id, type: "IMPORT", quantity: 7 },
    }),
    1,
  );
  assert.equal(
    await database.auditLog.count({
      where: { entityId: created.id, action: "PRODUCT_CREATED" },
    }),
    1,
  );

  await assert.rejects(
    () => createProduct(database, actor, input),
    (error: unknown) => error instanceof ApiError && error.status === 409,
  );
  assert.equal(
    await database.paint.count({ where: { sku: input.sku } }),
    1,
  );

  const updated = await updateProduct(database, actor, {
    ...input,
    id: created.id,
    name: "Integration Admin Paint Updated",
    colorCodes: ["INTEGRATION-ADMIN-BLUE"],
  });
  assert.deepEqual(
    updated.colors.map(({ color }) => color.code),
    ["INTEGRATION-ADMIN-BLUE"],
  );

  await deactivateProduct(database, actor, created.id);
  assert.equal(
    (
      await database.paint.findUniqueOrThrow({
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
          in: ["PRODUCT_CREATED", "PRODUCT_UPDATED", "PRODUCT_DEACTIVATED"],
        },
      },
    }),
    3,
  );
});

test("admin color deletion rejects linked colors and audits successful deletion", async () => {
  const [admin, seededPaint] = await Promise.all([
    database.user.findUniqueOrThrow({
      where: { email: TEST_FIXTURES.adminEmail },
    }),
    database.paint.findUniqueOrThrow({
      where: { sku: TEST_FIXTURES.productSku },
    }),
  ]);
  const actor = { id: admin.id, email: admin.email };
  const [unlinked, linked] = await Promise.all([
    database.paintColor.create({
      data: {
        code: "INTEGRATION-ADMIN-UNLINKED",
        name: "Unlinked integration color",
        hex: "#111111",
        toneFamily: "Neutral",
        colorFamily: "Black",
      },
    }),
    database.paintColor.create({
      data: {
        code: "INTEGRATION-ADMIN-LINKED",
        name: "Linked integration color",
        hex: "#222222",
        toneFamily: "Neutral",
        colorFamily: "Black",
      },
    }),
  ]);
  await database.paintColorLink.create({
    data: { paintId: seededPaint.id, colorId: linked.id },
  });

  await deleteColor(database, actor, unlinked.id);
  assert.equal(
    await database.paintColor.count({ where: { id: unlinked.id } }),
    0,
  );
  assert.equal(
    await database.auditLog.count({
      where: { entityId: unlinked.id, action: "COLOR_DELETED" },
    }),
    1,
  );

  await assert.rejects(
    () => deleteColor(database, actor, linked.id),
    (error: unknown) => error instanceof ApiError && error.status === 409,
  );
  assert.equal(
    await database.paintColor.count({ where: { id: linked.id } }),
    1,
  );
});
