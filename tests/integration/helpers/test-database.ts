import { PrismaClient } from "@prisma/client";
import { assertTestDatabaseUrl } from "../../../scripts/assert-test-database.ts";

export function createTestDatabase() {
  return new PrismaClient({
    datasourceUrl: assertTestDatabaseUrl(process.env.TEST_DATABASE_URL),
  });
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
