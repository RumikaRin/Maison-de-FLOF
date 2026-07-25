import { PrismaClient } from "@prisma/client";
import { assertTestDatabaseUrl } from "../../../scripts/assert-test-database.ts";
import { TEST_FIXTURES } from "../../../scripts/test-db-fixtures.ts";

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

export async function resetCustomerWorkflowFixtures(database: PrismaClient) {
  const [quotes, reviews, messages, orders, testUsers] = await Promise.all([
    database.quoteRequest.findMany({
      where: { email: { startsWith: "integration-workflow-" } },
      select: { id: true },
    }),
    database.review.findMany({
      where: { comment: { startsWith: "integration-workflow-" } },
      select: { id: true },
    }),
    database.message.findMany({
      where: { content: { startsWith: "integration-workflow-" } },
      select: { conversationId: true },
    }),
    database.order.findMany({
      where: { orderNumber: { startsWith: "INTEGRATION-WORKFLOW-" } },
      select: { id: true },
    }),
    database.user.findMany({
      where: { email: { endsWith: "@flof.test" } },
      select: { id: true },
    }),
  ]);

  const quoteIds = quotes.map(({ id }) => id);
  const reviewIds = reviews.map(({ id }) => id);
  const conversationIds = [
    ...new Set(messages.map(({ conversationId }) => conversationId)),
  ];
  const orderIds = orders.map(({ id }) => id);
  const userIds = testUsers.map(({ id }) => id);
  const auditedEntityIds = [...quoteIds, ...reviewIds, ...conversationIds];

  await database.$transaction([
    database.auditLog.deleteMany({
      where: { entityId: { in: auditedEntityIds } },
    }),
    database.notification.deleteMany({
      where: {
        userId: { in: userIds },
        type: { in: ["REVIEW", "QUOTE", "SYSTEM"] },
      },
    }),
    database.message.deleteMany({
      where: { conversationId: { in: conversationIds } },
    }),
    database.conversation.deleteMany({
      where: { id: { in: conversationIds } },
    }),
    database.review.deleteMany({ where: { id: { in: reviewIds } } }),
    database.quoteRequest.deleteMany({ where: { id: { in: quoteIds } } }),
    database.orderStatusHistory.deleteMany({
      where: { orderId: { in: orderIds } },
    }),
    database.orderItem.deleteMany({ where: { orderId: { in: orderIds } } }),
    database.payment.deleteMany({ where: { orderId: { in: orderIds } } }),
    database.checkoutIdempotency.deleteMany({
      where: { orderId: { in: orderIds } },
    }),
    database.order.deleteMany({ where: { id: { in: orderIds } } }),
  ]);
}

export async function resetHttpApiFixtures(database: PrismaClient) {
  const [categories, quotes, reviews, messages, testUsers] = await Promise.all([
    database.category.findMany({
      where: { slug: { startsWith: "integration-http-" } },
      select: { id: true },
    }),
    database.quoteRequest.findMany({
      where: { email: { startsWith: "integration-http-" } },
      select: { id: true },
    }),
    database.review.findMany({
      where: { comment: { startsWith: "integration-http-" } },
      select: { id: true },
    }),
    database.message.findMany({
      where: { content: { startsWith: "integration-http-" } },
      select: { conversationId: true },
    }),
    database.user.findMany({
      where: {
        email: {
          in: [
            TEST_FIXTURES.customerEmail,
            TEST_FIXTURES.resetEmail,
            TEST_FIXTURES.adminEmail,
          ],
        },
      },
      select: { id: true },
    }),
  ]);

  const categoryIds = categories.map(({ id }) => id);
  const quoteIds = quotes.map(({ id }) => id);
  const reviewIds = reviews.map(({ id }) => id);
  const conversationIds = [
    ...new Set(messages.map(({ conversationId }) => conversationId)),
  ];
  const userIds = testUsers.map(({ id }) => id);
  const auditedEntityIds = [
    ...categoryIds,
    ...quoteIds,
    ...reviewIds,
    ...conversationIds,
  ];

  await database.$transaction([
    database.auditLog.deleteMany({
      where: { entityId: { in: auditedEntityIds } },
    }),
    database.notification.deleteMany({
      where: {
        userId: { in: userIds },
        type: { in: ["REVIEW", "QUOTE", "SYSTEM"] },
      },
    }),
    database.message.deleteMany({
      where: { conversationId: { in: conversationIds } },
    }),
    database.conversation.deleteMany({
      where: { id: { in: conversationIds } },
    }),
    database.review.deleteMany({ where: { id: { in: reviewIds } } }),
    database.quoteRequest.deleteMany({ where: { id: { in: quoteIds } } }),
    database.category.deleteMany({ where: { id: { in: categoryIds } } }),
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
