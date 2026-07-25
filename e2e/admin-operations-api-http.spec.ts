import { expect, test } from "@playwright/test";
import { P1_FIXTURES, TEST_FIXTURES } from "../scripts/test-db-fixtures.ts";
import { createTestDatabase } from "../tests/integration/helpers/test-database.ts";
import { loginAsAdmin, loginAsCustomer } from "./helpers/auth.ts";

const database = createTestDatabase();
const createdEmail = "integration-p1-admin-created@example.com";

async function cleanup() {
  const created = await database.user.findUnique({ where: { email: createdEmail } });
  if (created) {
    await database.$transaction([
      database.auditLog.deleteMany({ where: { entityId: created.id } }),
      database.customer.deleteMany({ where: { userId: created.id } }),
      database.user.delete({ where: { id: created.id } }),
    ]);
  }
  const paint = await database.paint.findUnique({
    where: { sku: P1_FIXTURES.productSku },
  });
  if (paint) {
    const transactions = await database.inventoryTransaction.findMany({
      where: { paintId: paint.id, reason: P1_FIXTURES.namespace },
      select: { id: true, quantity: true },
    });
    const importedQuantity = transactions.reduce(
      (total, transaction) => total + transaction.quantity,
      0,
    );
    await database.$transaction([
      database.paint.update({
        where: { id: paint.id },
        data: { stock: { decrement: importedQuantity } },
      }),
      database.auditLog.deleteMany({
        where: {
          entityId: paint.id,
          action: "INVENTORY_IMPORTED",
        },
      }),
      database.inventoryTransaction.deleteMany({
        where: { id: { in: transactions.map(({ id }) => id) } },
      }),
    ]);
  }
  const admin = await database.user.findUnique({
    where: { email: TEST_FIXTURES.adminEmail },
  });
  if (admin) {
    await database.notification.deleteMany({
      where: { userId: admin.id, title: { startsWith: P1_FIXTURES.namespace } },
    });
  }
}

test.beforeEach(cleanup);
test.afterEach(cleanup);
test.afterAll(async () => database.$disconnect());

test("admin inventory, user, notification, dashboard, and media guards persist correctly", async ({
  page,
}) => {
  await loginAsAdmin(page);
  const paint = await database.paint.findUniqueOrThrow({
    where: { sku: P1_FIXTURES.productSku },
  });
  const beforeStock = paint.stock;
  const inventoryPayload = {
    paintId: paint.id,
    quantity: 2,
    costPrice: Number(paint.costPrice),
    reason: P1_FIXTURES.namespace,
  };
  const inventory = await Promise.all([
    page.request.post("/api/admin/inventory", { data: inventoryPayload }),
    page.request.post("/api/admin/inventory", { data: inventoryPayload }),
  ]);
  expect(inventory.map((response) => response.status())).toEqual([201, 201]);
  expect(
    await database.paint.findUnique({
      where: { id: paint.id },
      select: { stock: true },
    }),
  ).toEqual({ stock: beforeStock + 4 });
  expect(
    await database.inventoryTransaction.count({
      where: { paintId: paint.id, reason: P1_FIXTURES.namespace },
    }),
  ).toBe(2);

  const createdResponse = await page.request.post("/api/admin/users", {
    data: {
      name: "P1 Created User",
      email: createdEmail,
      password: "P1-Created-2026!",
      role: "CUSTOMER",
    },
  });
  expect(createdResponse.status()).toBe(201);
  const created = (await createdResponse.json()) as { id: string };
  expect(
    (
      await page.request.patch("/api/admin/users", {
        data: { id: created.id, role: "STAFF" },
      })
    ).status(),
  ).toBe(200);
  expect(
    await database.user.findUnique({
      where: { id: created.id },
      select: { role: { select: { type: true } } },
    }),
  ).toEqual({ role: { type: "STAFF" } });

  const admin = await database.user.findUniqueOrThrow({
    where: { email: TEST_FIXTURES.adminEmail },
  });
  expect(
    (
      await page.request.patch("/api/admin/users", {
        data: { id: admin.id, role: "CUSTOMER" },
      })
    ).status(),
  ).toBe(400);
  const notification = await database.notification.create({
    data: {
      userId: admin.id,
      type: "SYSTEM",
      title: `${P1_FIXTURES.namespace}notification`,
      message: "P1 notification",
    },
  });
  const notifications = await page.request.get("/api/admin/notifications");
  expect(notifications.status()).toBe(200);
  expect(notifications.headers()["cache-control"]).toBe("private, no-store");
  const notificationEtag = notifications.headers().etag;
  expect(notificationEtag).toMatch(/^"notifications-/);
  if (!notificationEtag) throw new Error("Notification ETag is required");
  expect(await notifications.json()).toEqual(
    expect.objectContaining({
      notifications: expect.arrayContaining([
        expect.objectContaining({ id: notification.id, isRead: false }),
      ]),
    }),
  );
  const unchangedNotifications = await page.request.get(
    "/api/admin/notifications",
    { headers: { "If-None-Match": notificationEtag } },
  );
  expect(unchangedNotifications.status()).toBe(304);
  expect(await unchangedNotifications.body()).toHaveLength(0);
  expect(
    (
      await page.request.get("/api/admin/notifications?type=INVALID")
    ).status(),
  ).toBe(400);
  expect(
    (
      await page.request.patch(
        `/api/admin/notifications/${notification.id}/read`,
      )
    ).status(),
  ).toBe(200);
  expect(
    await database.notification.findUnique({
      where: { id: notification.id },
      select: { isRead: true },
    }),
  ).toEqual({ isRead: true });
  const changedNotifications = await page.request.get(
    "/api/admin/notifications",
    { headers: { "If-None-Match": notificationEtag } },
  );
  expect(changedNotifications.status()).toBe(200);
  expect(changedNotifications.headers().etag).not.toBe(notificationEtag);

  const dashboard = await page.request.get("/api/admin/dashboard");
  expect(dashboard.status()).toBe(200);
  expect(await dashboard.json()).toEqual(
    expect.objectContaining({
      stats: expect.objectContaining({
        colorsCount: await database.paintColor.count(),
      }),
      dailyRevenue: expect.any(Array),
    }),
  );

  const media = await page.request.post("/api/admin/media", { data: {} });
  expect([400, 503]).toContain(media.status());
});

test("customer is denied admin operations", async ({ page }) => {
  await loginAsCustomer(page);
  const responses = await Promise.all([
    page.request.get("/api/admin/inventory"),
    page.request.get("/api/admin/users"),
    page.request.get("/api/admin/notifications"),
    page.request.get("/api/admin/dashboard"),
    page.request.get("/api/admin/media"),
  ]);
  expect(responses.map((response) => response.status())).toEqual([
    403, 403, 403, 403, 403,
  ]);
});

test("notification polling pauses while the admin tab is hidden", async ({
  page,
}) => {
  let notificationRequests = 0;
  await page.clock.install();
  await page.addInitScript(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () =>
        (window as typeof window & { __notificationHidden?: boolean })
          .__notificationHidden
          ? "hidden"
          : "visible",
    });
  });
  await page.route("**/api/admin/notifications?**", async (route) => {
    notificationRequests += 1;
    await route.continue();
  });

  await loginAsAdmin(page);
  await expect.poll(() => notificationRequests).toBeGreaterThan(0);
  const visibleRequestCount = notificationRequests;

  await page.evaluate(() => {
    (window as typeof window & { __notificationHidden?: boolean })
      .__notificationHidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.fastForward(120_000);
  expect(notificationRequests).toBe(visibleRequestCount);

  await page.evaluate(() => {
    (window as typeof window & { __notificationHidden?: boolean })
      .__notificationHidden = false;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect
    .poll(() => notificationRequests)
    .toBeGreaterThan(visibleRequestCount);
});
