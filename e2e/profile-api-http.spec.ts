import { expect, test } from "@playwright/test";
import bcrypt from "bcryptjs";
import { P1_FIXTURES, TEST_FIXTURES } from "../scripts/test-db-fixtures.ts";
import { createTestDatabase } from "../tests/integration/helpers/test-database.ts";
import { loginAsCustomer, loginAsSecondCustomer } from "./helpers/auth.ts";

const database = createTestDatabase();

async function resetProfileFixtures() {
  const users = await database.user.findMany({
    where: {
      email: { in: [TEST_FIXTURES.customerEmail, P1_FIXTURES.customerTwoEmail] },
    },
    include: { customer: true },
  });
  const userIds = users.map(({ id }) => id);
  const customerIds = users.flatMap(({ customer }) =>
    customer ? [customer.id] : [],
  );
  await database.$transaction([
    database.address.deleteMany({ where: { userId: { in: userIds } } }),
    database.wishlist.deleteMany({
      where: { customerId: { in: customerIds } },
    }),
    database.wishlistColor.deleteMany({
      where: { customerId: { in: customerIds } },
    }),
    database.user.updateMany({
      where: { id: { in: userIds } },
      data: { name: "Integration Customer", phone: null },
    }),
  ]);
}

test.beforeEach(resetProfileFixtures);
test.afterEach(async () => {
  await resetProfileFixtures();
  await database.user.update({
    where: { email: TEST_FIXTURES.customerEmail },
    data: { password: await bcrypt.hash(TEST_FIXTURES.password, 12) },
  });
});
test.afterAll(async () => database.$disconnect());

test("profile, saved colors, and saved products stay owner-scoped", async ({
  browser,
  request,
}) => {
  expect((await request.get("/api/profile")).status()).toBe(401);

  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  await loginAsCustomer(pageA);
  await loginAsSecondCustomer(pageB);

  const updated = await pageA.request.patch("/api/profile", {
    data: { name: "P1 Customer A", phone: "0901234567" },
  });
  expect(updated.status()).toBe(200);
  expect(await pageA.request.get("/api/profile").then((r) => r.json())).toEqual(
    expect.objectContaining({
      email: TEST_FIXTURES.customerEmail,
      name: "P1 Customer A",
      phone: "0901234567",
    }),
  );
  expect(await pageB.request.get("/api/profile").then((r) => r.json())).toEqual(
    expect.objectContaining({ email: P1_FIXTURES.customerTwoEmail }),
  );

  const paint = await database.paint.findUniqueOrThrow({
    where: { sku: P1_FIXTURES.productSku },
  });
  expect(
    (
      await pageA.request.post("/api/profile/favorites", {
        data: { code: P1_FIXTURES.colorCode },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await pageA.request.post("/api/profile/favorite-products", {
        data: { paintId: paint.id },
      })
    ).status(),
  ).toBe(200);
  expect(await pageA.request.get("/api/profile/favorites").then((r) => r.json()))
    .toContain(P1_FIXTURES.colorCode);
  expect(
    await pageA.request
      .get("/api/profile/favorite-products")
      .then((r) => r.json()),
  ).toEqual(
    expect.arrayContaining([expect.objectContaining({ id: paint.id })]),
  );
  expect(await pageB.request.get("/api/profile/favorites").then((r) => r.json()))
    .not.toContain(P1_FIXTURES.colorCode);
  expect(
    await pageB.request
      .get("/api/profile/favorite-products")
      .then((r) => r.json()),
  ).toEqual([]);

  const persisted = await database.user.findUniqueOrThrow({
    where: { email: TEST_FIXTURES.customerEmail },
    include: {
      customer: { include: { wishlists: true, wishlistColors: true } },
    },
  });
  expect(persisted.customer?.wishlists).toHaveLength(1);
  expect(persisted.customer?.wishlistColors).toHaveLength(1);
  await contextA.close();
  await contextB.close();
});

test("address mutations reject cross-customer ownership and password changes validate current secret", async ({
  browser,
}) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  await loginAsCustomer(pageA);
  await loginAsSecondCustomer(pageB);

  const addressData = {
    name: "P1 Customer",
    phone: "0901234567",
    province: "Ha Noi",
    district: "Hoan Kiem",
    address: P1_FIXTURES.addressLabel,
    isDefault: true,
  };
  const createdResponse = await pageA.request.post("/api/profile/addresses", {
    data: addressData,
  });
  expect(createdResponse.status()).toBe(201);
  const created = (await createdResponse.json()) as { id: string };

  expect(
    (
      await pageB.request.patch("/api/profile/addresses", {
        data: { ...addressData, id: created.id, address: "hijacked" },
      })
    ).status(),
  ).toBe(404);
  expect(
    (
      await pageB.request.delete(
        `/api/profile/addresses?id=${encodeURIComponent(created.id)}`,
      )
    ).status(),
  ).toBe(404);
  expect(
    await database.address.findUnique({
      where: { id: created.id },
      select: { user: { select: { email: true } }, addressLine1: true },
    }),
  ).toEqual({
    user: { email: TEST_FIXTURES.customerEmail },
    addressLine1: P1_FIXTURES.addressLabel,
  });

  expect(
    (
      await pageA.request.post("/api/profile/password", {
        data: { currentPassword: "wrong-password", newPassword: "P1-New-2026!" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await pageA.request.post("/api/profile/password", {
        data: {
          currentPassword: TEST_FIXTURES.password,
          newPassword: "P1-New-2026!",
        },
      })
    ).status(),
  ).toBe(200);
  const passwordHash = await database.user
    .findUniqueOrThrow({ where: { email: TEST_FIXTURES.customerEmail } })
    .then(({ password }) => password);
  expect(await bcrypt.compare("P1-New-2026!", passwordHash!)).toBe(true);

  expect(
    (
      await pageA.request.delete(
        `/api/profile/addresses?id=${encodeURIComponent(created.id)}`,
      )
    ).status(),
  ).toBe(200);
  expect(await database.address.findUnique({ where: { id: created.id } })).toBeNull();
  await contextA.close();
  await contextB.close();
});
