import { PrismaClient } from "@prisma/client";
import { assertTestDatabaseUrl } from "../../../scripts/assert-test-database.ts";

export function createTestDatabase() {
  return new PrismaClient({
    datasourceUrl: assertTestDatabaseUrl(process.env.TEST_DATABASE_URL),
  });
}

export async function resetAdminCatalogFixtures(database: PrismaClient) {
  const [paints, colors, categories, suppliers, collections] = await Promise.all([
    database.paint.findMany({
      where: { sku: { startsWith: "INTEGRATION-ADMIN-" } },
      select: { id: true },
    }),
    database.paintColor.findMany({
      where: { code: { startsWith: "INTEGRATION-ADMIN-" } },
      select: { id: true },
    }),
    database.category.findMany({
      where: { slug: { startsWith: "integration-admin-" } },
      select: { id: true },
    }),
    database.supplier.findMany({
      where: { slug: { startsWith: "integration-admin-" } },
      select: { id: true },
    }),
    database.colorCollection.findMany({
      where: { slug: { startsWith: "integration-admin-" } },
      select: { id: true },
    }),
  ]);

  const paintIds = paints.map(({ id }) => id);
  const colorIds = colors.map(({ id }) => id);
  const categoryIds = categories.map(({ id }) => id);
  const supplierIds = suppliers.map(({ id }) => id);
  const collectionIds = collections.map(({ id }) => id);
  const entityIds = [
    ...paintIds,
    ...colorIds,
    ...categoryIds,
    ...supplierIds,
    ...collectionIds,
  ];

  await database.$transaction([
    database.auditLog.deleteMany({
      where: { entityId: { in: entityIds } },
    }),
    database.review.deleteMany({ where: { paintId: { in: paintIds } } }),
    database.inventoryTransaction.deleteMany({
      where: { paintId: { in: paintIds } },
    }),
    database.paintColorLink.deleteMany({
      where: {
        OR: [
          { paintId: { in: paintIds } },
          { colorId: { in: colorIds } },
        ],
      },
    }),
    database.paint.deleteMany({ where: { id: { in: paintIds } } }),
    database.paintColor.deleteMany({ where: { id: { in: colorIds } } }),
    database.colorCollection.deleteMany({
      where: { id: { in: collectionIds } },
    }),
    database.category.deleteMany({ where: { id: { in: categoryIds } } }),
    database.supplier.deleteMany({ where: { id: { in: supplierIds } } }),
  ]);
}

export async function resetCommerceFixtures(database: PrismaClient) {
  await database.orderStatusHistory.deleteMany();
  await database.inventoryTransaction.deleteMany();
  await database.orderItem.deleteMany();
  await database.payment.deleteMany();
  await database.checkoutIdempotency.deleteMany();
  await database.emailOutbox.deleteMany();
  await database.notification.deleteMany();
  await database.order.deleteMany();
  await database.paint.updateMany({
    where: { sku: "FLOF-INTEGRATION-5L" },
    data: { stock: 20, soldCount: 0 },
  });
  await database.coupon.updateMany({
    where: { code: "INTEGRATION10" },
    data: { usageCount: 0 },
  });
}
