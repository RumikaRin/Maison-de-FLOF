import assert from "node:assert/strict";
import test from "node:test";
import { P1_FIXTURES, TEST_FIXTURES } from "../../scripts/test-db-fixtures.ts";
import { processCheckout } from "../../src/services/checkout.service.ts";
import { createTestDatabase } from "./helpers/test-database.ts";

const database = createTestDatabase();
const keyPrefix = `${P1_FIXTURES.idempotencyPrefix}concurrency-`;

async function cleanup() {
  const keys = await database.checkoutIdempotency.findMany({
    where: { key: { startsWith: keyPrefix } },
    select: { orderId: true },
  });
  const orderIds = keys.flatMap(({ orderId }) => orderId ? [orderId] : []);
  const orderNumbers = await database.order.findMany({
    where: { id: { in: orderIds } },
    select: { orderNumber: true },
  });
  await database.$transaction([
    database.orderStatusHistory.deleteMany({ where: { orderId: { in: orderIds } } }),
    database.inventoryTransaction.deleteMany({ where: { referenceId: { in: orderIds } } }),
    database.orderItem.deleteMany({ where: { orderId: { in: orderIds } } }),
    database.payment.deleteMany({ where: { orderId: { in: orderIds } } }),
    database.checkoutIdempotency.deleteMany({
      where: { key: { startsWith: keyPrefix } },
    }),
    database.emailOutbox.deleteMany({
      where: {
        OR: orderNumbers.map(({ orderNumber }) => ({
          payload: { path: ["orderNumber"], equals: orderNumber },
        })),
      },
    }),
    database.order.deleteMany({ where: { id: { in: orderIds } } }),
  ]);
  await database.paint.update({
    where: { sku: P1_FIXTURES.productSku },
    data: { stock: 20, soldCount: 0 },
  });
  await database.coupon.update({
    where: { code: TEST_FIXTURES.couponCode },
    data: { usageLimit: 1000, usageCount: 0 },
  });
}

async function fixtureContext() {
  const [user, paint] = await Promise.all([
    database.user.findUniqueOrThrow({
      where: { email: TEST_FIXTURES.customerEmail },
    }),
    database.paint.findUniqueOrThrow({
      where: { sku: P1_FIXTURES.productSku },
    }),
  ]);
  return {
    user: { id: user.id, email: user.email },
    paint,
    input: {
      items: [{ paintId: paint.id, quantity: 1 }],
      paymentMethod: "COD" as const,
      note: keyPrefix,
      shipping: {
        fullName: "P1 Concurrent Customer",
        phone: "0901234567",
        addressLine1: "1 P1 Street",
        district: "Hoan Kiem",
        province: "Ha Noi",
      },
    },
  };
}

test.beforeEach(cleanup);
test.afterEach(cleanup);
test.after(async () => database.$disconnect());

test("P1 concurrency: identical checkout key returns one order to both callers", async () => {
  const { user, input } = await fixtureContext();
  const key = `${keyPrefix}same-key`;
  const results = await Promise.all([
    processCheckout(input, user, key, "127.0.0.1", "", { database }),
    processCheckout(input, user, key, "127.0.0.1", "", { database }),
  ]);
  const ids = results.map((result) => result.newOrderId ?? result.existingOrderId);
  assert.equal(new Set(ids).size, 1);
  assert.equal(
    await database.checkoutIdempotency.count({ where: { key } }),
    1,
  );
  assert.equal(
    await database.order.count({ where: { id: ids[0] } }),
    1,
  );
});

test("P1 concurrency: stock contention cannot oversell", async () => {
  const { user, paint, input } = await fixtureContext();
  await database.paint.update({ where: { id: paint.id }, data: { stock: 1 } });
  const results = await Promise.allSettled([
    processCheckout(input, user, `${keyPrefix}stock-a`, "127.0.0.1", "", { database }),
    processCheckout(input, user, `${keyPrefix}stock-b`, "127.0.0.1", "", { database }),
  ]);
  assert.equal(results.filter(({ status }) => status === "fulfilled").length, 1);
  assert.deepEqual(
    await database.paint.findUnique({
      where: { id: paint.id },
      select: { stock: true, soldCount: true },
    }),
    { stock: 0, soldCount: 1 },
  );
});

test("P1 concurrency: coupon usage never exceeds its limit", async () => {
  const { user, input } = await fixtureContext();
  await database.coupon.update({
    where: { code: TEST_FIXTURES.couponCode },
    data: { usageLimit: 1, usageCount: 0 },
  });
  const couponInput = { ...input, couponCode: TEST_FIXTURES.couponCode };
  const results = await Promise.allSettled([
    processCheckout(couponInput, user, `${keyPrefix}coupon-a`, "127.0.0.1", "", { database }),
    processCheckout(couponInput, user, `${keyPrefix}coupon-b`, "127.0.0.1", "", { database }),
  ]);
  assert.equal(results.filter(({ status }) => status === "fulfilled").length, 1);
  assert.equal(
    await database.coupon
      .findUniqueOrThrow({ where: { code: TEST_FIXTURES.couponCode } })
      .then(({ usageCount }) => usageCount),
    1,
  );
});
