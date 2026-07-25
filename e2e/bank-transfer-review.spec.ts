import { expect, test } from "@playwright/test";
import { P1_FIXTURES, TEST_FIXTURES } from "../scripts/test-db-fixtures.ts";
import { createTestDatabase } from "../tests/integration/helpers/test-database.ts";
import {
  loginAsAdmin,
  loginAsCustomer,
  loginAsSecondCustomer,
} from "./helpers/auth.ts";

const database = createTestDatabase();

async function cleanup() {
  const idempotencyRows = await database.checkoutIdempotency.findMany({
    where: { key: { startsWith: P1_FIXTURES.idempotencyPrefix } },
    select: { orderId: true },
  });
  const orderIds = idempotencyRows.flatMap(({ orderId }) =>
    orderId ? [orderId] : [],
  );
  const orders = await database.order.findMany({
    where: { id: { in: orderIds } },
    select: {
      id: true,
      payment: { select: { id: true } },
      items: { select: { paintId: true, quantity: true } },
    },
  });
  const auditEntityIds = [
    ...orderIds,
    ...orders.flatMap(({ payment }) => payment ? [payment.id] : []),
  ];
  for (const order of orders) {
    for (const item of order.items) {
      await database.paint.update({
        where: { id: item.paintId },
        data: {
          stock: { increment: item.quantity },
          soldCount: { decrement: item.quantity },
        },
      });
    }
  }
  await database.$transaction([
    database.review.deleteMany({
      where: { comment: { startsWith: P1_FIXTURES.namespace } },
    }),
    database.auditLog.deleteMany({ where: { entityId: { in: auditEntityIds } } }),
    database.orderStatusHistory.deleteMany({ where: { orderId: { in: orderIds } } }),
    database.inventoryTransaction.deleteMany({
      where: { referenceId: { in: orderIds } },
    }),
    database.orderItem.deleteMany({ where: { orderId: { in: orderIds } } }),
    database.payment.deleteMany({ where: { orderId: { in: orderIds } } }),
    database.checkoutIdempotency.deleteMany({
      where: { key: { startsWith: P1_FIXTURES.idempotencyPrefix } },
    }),
    database.order.deleteMany({ where: { id: { in: orderIds } } }),
  ]);
}

test.beforeEach(cleanup);
test.afterEach(cleanup);
test.afterAll(async () => database.$disconnect());

test("bank transfer checkout becomes a verified-purchase review", async ({
  browser,
}) => {
  const customerContext = await browser.newContext();
  const otherContext = await browser.newContext();
  const adminContext = await browser.newContext();
  const customerPage = await customerContext.newPage();
  const otherPage = await otherContext.newPage();
  const adminPage = await adminContext.newPage();
  await loginAsCustomer(customerPage);
  await loginAsSecondCustomer(otherPage);
  await loginAsAdmin(adminPage);

  const paint = await database.paint.findUniqueOrThrow({
    where: { sku: P1_FIXTURES.productSku },
  });
  const initialStock = paint.stock;
  const idempotencyKey = `${P1_FIXTURES.idempotencyPrefix}${Date.now()}-transfer`;
  const checkout = await customerPage.request.post("/api/orders", {
    headers: { "Idempotency-Key": idempotencyKey },
    data: {
      items: [{ paintId: paint.id, quantity: 1 }],
      paymentMethod: "TRANSFER",
      note: P1_FIXTURES.namespace,
      shipping: {
        fullName: "P1 Customer",
        phone: "0901234567",
        addressLine1: "1 P1 Street",
        district: "Hoan Kiem",
        province: "Ha Noi",
      },
    },
  });
  expect(checkout.status()).toBe(201);
  const body = (await checkout.json()) as {
    order: { id: string; paymentId: string; paymentStatus: string };
  };
  expect(body.order.paymentStatus).toBe("PENDING");

  const persisted = await database.order.findUniqueOrThrow({
    where: { orderNumber: body.order.id },
    include: { payment: true, items: true },
  });
  expect(persisted.payment?.method).toBe("TRANSFER");
  expect(persisted.items).toHaveLength(1);
  expect(
    await database.paint.findUnique({
      where: { id: paint.id },
      select: { stock: true },
    }),
  ).toEqual({ stock: initialStock - 1 });

  const confirmation = await adminPage.request.patch("/api/admin/payments", {
    data: {
      paymentId: body.order.paymentId,
      transactionCode: `${P1_FIXTURES.namespace}transfer`,
      action: "CONFIRM",
    },
  });
  expect(confirmation.status()).toBe(200);
  const processingRace = await Promise.all([
    adminPage.request.patch(`/api/orders/${body.order.id}`, {
      data: { status: "PROCESSING" },
    }),
    adminPage.request.patch(`/api/orders/${body.order.id}`, {
      data: { status: "PROCESSING" },
    }),
  ]);
  expect(
    processingRace.map((response) => response.status()).sort(),
  ).toEqual(expect.arrayContaining([200]));
  expect(
    processingRace.every((response) => [200, 409].includes(response.status())),
  ).toBe(true);
  expect(
    await database.orderStatusHistory.count({
      where: { orderId: persisted.id, newStatus: "PROCESSING" },
    }),
  ).toBe(1);
  for (const status of ["SHIPPING", "COMPLETED"]) {
    expect(
      (
        await adminPage.request.patch(`/api/orders/${body.order.id}`, {
          data: { status },
        })
      ).status(),
    ).toBe(200);
  }

  const reviewData = {
    paintId: paint.id,
    rating: 5,
    comment: `${P1_FIXTURES.namespace}verified review`,
  };
  expect(
    (await otherPage.request.post("/api/reviews", { data: reviewData })).status(),
  ).toBe(403);
  const reviewResponse = await customerPage.request.post("/api/reviews", {
    data: reviewData,
  });
  expect(reviewResponse.status()).toBe(201);
  expect(
    await database.review.findUnique({
      where: {
        paintId_userId: {
          paintId: paint.id,
          userId: await database.user
            .findUniqueOrThrow({ where: { email: TEST_FIXTURES.customerEmail } })
            .then(({ id }) => id),
        },
      },
      select: { rating: true, comment: true },
    }),
  ).toEqual({ rating: 5, comment: reviewData.comment });

  const refundPayload = {
    paymentId: body.order.paymentId,
    transactionCode: `${P1_FIXTURES.namespace}refund`,
    action: "REFUND",
  };
  const refunds = await Promise.all([
    adminPage.request.patch("/api/admin/payments", { data: refundPayload }),
    adminPage.request.patch("/api/admin/payments", { data: refundPayload }),
  ]);
  expect(refunds.map((response) => response.status()).sort()).toEqual([200, 409]);
  expect(
    await database.payment.findUnique({
      where: { id: body.order.paymentId },
      select: { status: true, refundCode: true },
    }),
  ).toEqual({
    status: "REFUNDED",
    refundCode: refundPayload.transactionCode,
  });
  expect(
    await database.auditLog.count({
      where: {
        entityId: body.order.paymentId,
        action: "PAYMENT_REFUNDED",
      },
    }),
  ).toBe(1);

  await customerContext.close();
  await otherContext.close();
  await adminContext.close();
});
