import assert from "node:assert/strict";
import test, { after, before, beforeEach } from "node:test";
import { loadTestFixtures, TEST_FIXTURES } from "../../scripts/test-db-fixtures.ts";
import { processCheckout } from "../../src/services/checkout.service.ts";
import {
  createTestDatabase,
  resetCommerceFixtures,
} from "./helpers/test-database.ts";

const database = createTestDatabase();

function checkoutInput(paintId: string, quantity = 2) {
  return {
    items: [{ paintId, quantity }],
    paymentMethod: "COD" as const,
    shipping: {
      fullName: "Integration Customer",
      phone: "0900000000",
      addressLine1: "15 Cau Giay",
      district: "Cau Giay",
      province: "Ha Noi",
    },
  };
}

async function fixtureCustomerAndPaint() {
  return Promise.all([
    database.user.findUniqueOrThrow({
      where: { email: TEST_FIXTURES.customerEmail },
    }),
    database.paint.findUniqueOrThrow({
      where: { sku: TEST_FIXTURES.productSku },
    }),
  ]);
}

before(async () => {
  await loadTestFixtures();
});

beforeEach(async () => {
  await resetCommerceFixtures(database);
});

after(async () => {
  await database.$disconnect();
});

test("COD checkout commits order, stock, inventory, payment and outbox atomically", async () => {
  const [customer, paint] = await fixtureCustomerAndPaint();
  const input = checkoutInput(paint.id);

  const result = await processCheckout(
    input,
    { id: customer.id, email: customer.email },
    "integration-checkout-00000001",
    "127.0.0.1",
    "",
    { database },
  );

  assert.ok(result.newOrderId);
  assert.equal(
    await database.order.count({ where: { id: result.newOrderId } }),
    1,
  );
  assert.equal(
    (await database.paint.findUniqueOrThrow({ where: { id: paint.id } })).stock,
    18,
  );
  assert.equal(
    await database.inventoryTransaction.count({
      where: { referenceId: result.newOrderId, quantity: -2 },
    }),
    1,
  );
  assert.equal(
    await database.payment.count({
      where: { orderId: result.newOrderId, amount: 1000000 },
    }),
    1,
  );
  assert.equal(
    await database.emailOutbox.count({
      where: { type: "ORDER_CONFIRMATION", status: "PENDING" },
    }),
    1,
  );
});

test("replaying an idempotency key returns the original order without duplicate writes", async () => {
  const [customer, paint] = await fixtureCustomerAndPaint();
  const input = checkoutInput(paint.id);
  const key = "integration-checkout-00000002";

  const first = await processCheckout(
    input,
    { id: customer.id, email: customer.email },
    key,
    "127.0.0.1",
    "",
    { database },
  );
  const replay = await processCheckout(
    input,
    { id: customer.id, email: customer.email },
    key,
    "127.0.0.1",
    "",
    { database },
  );

  assert.deepEqual(replay, { existingOrderId: first.newOrderId });
  assert.equal(await database.order.count(), 1);
  assert.equal(await database.inventoryTransaction.count(), 1);
  assert.equal(await database.emailOutbox.count(), 1);
  assert.equal(
    (await database.paint.findUniqueOrThrow({ where: { id: paint.id } })).stock,
    18,
  );
});

test("insufficient stock rolls back order, idempotency and related writes", async () => {
  const [customer, paint] = await fixtureCustomerAndPaint();
  await database.paint.update({
    where: { id: paint.id },
    data: { stock: 1 },
  });

  await assert.rejects(
    processCheckout(
      checkoutInput(paint.id),
      { id: customer.id, email: customer.email },
      "integration-checkout-00000003",
      "127.0.0.1",
      "",
      { database },
    ),
    /không đủ tồn kho/,
  );

  assert.equal(await database.order.count(), 0);
  assert.equal(await database.checkoutIdempotency.count(), 0);
  assert.equal(await database.inventoryTransaction.count(), 0);
  assert.equal(await database.payment.count(), 0);
  assert.equal(await database.emailOutbox.count(), 0);
  assert.equal(
    (await database.paint.findUniqueOrThrow({ where: { id: paint.id } })).stock,
    1,
  );
});
