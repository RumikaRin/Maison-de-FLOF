import assert from "node:assert/strict";
import test, { after, before, beforeEach } from "node:test";
import { loadTestFixtures, TEST_FIXTURES } from "../../scripts/test-db-fixtures.ts";
import { getOrderAccessWhere } from "../../src/lib/order-access.ts";
import { processCheckout } from "../../src/services/checkout.service.ts";
import {
  createTestDatabase,
  resetCommerceFixtures,
} from "./helpers/test-database.ts";

const database = createTestDatabase();

before(async () => {
  await loadTestFixtures();
});

beforeEach(async () => {
  await resetCommerceFixtures(database);
});

after(async () => {
  await database.$disconnect();
});

test("customers are scoped to their own orders while admins can query all or by email", async () => {
  const [customer, admin, paint] = await Promise.all([
    database.user.findUniqueOrThrow({
      where: { email: TEST_FIXTURES.customerEmail },
    }),
    database.user.findUniqueOrThrow({
      where: { email: TEST_FIXTURES.adminEmail },
    }),
    database.paint.findUniqueOrThrow({
      where: { sku: TEST_FIXTURES.productSku },
    }),
  ]);

  await processCheckout(
    {
      items: [{ paintId: paint.id, quantity: 1 }],
      paymentMethod: "COD",
      shipping: {
        fullName: "Integration Customer",
        phone: "0900000000",
        addressLine1: "15 Cau Giay",
        district: "Cau Giay",
        province: "Ha Noi",
      },
    },
    { id: customer.id, email: customer.email },
    "integration-order-access-0001",
    "127.0.0.1",
    "",
    { database },
  );

  const customerUser = { email: customer.email, role: "CUSTOMER" };
  const adminUser = { email: admin.email, role: "ADMIN" };

  assert.equal(
    await database.order.count({
      where: getOrderAccessWhere(customerUser, admin.email),
    }),
    1,
  );
  assert.equal(
    await database.order.count({ where: getOrderAccessWhere(adminUser, null) }),
    1,
  );
  assert.equal(
    await database.order.count({
      where: getOrderAccessWhere(adminUser, customer.email),
    }),
    1,
  );
  assert.equal(
    await database.order.count({
      where: getOrderAccessWhere(adminUser, "missing@flof.test"),
    }),
    0,
  );
});
