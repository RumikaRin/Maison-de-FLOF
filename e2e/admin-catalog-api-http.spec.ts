import { expect, test } from "@playwright/test";
import { createTestDatabase } from "../tests/integration/helpers/test-database.ts";
import { loginAsAdmin, loginAsCustomer } from "./helpers/auth.ts";

const database = createTestDatabase();
const marker = "integration-p1-http-";

async function cleanup() {
  const paints = await database.paint.findMany({
    where: { sku: { startsWith: "INTEGRATION-P1-HTTP-" } },
    select: { id: true },
  });
  const colors = await database.paintColor.findMany({
    where: { code: { startsWith: "integration-p1-http-" } },
    select: { id: true },
  });
  const collections = await database.colorCollection.findMany({
    where: { slug: { startsWith: marker } },
    select: { id: true },
  });
  const suppliers = await database.supplier.findMany({
    where: { slug: { startsWith: marker } },
    select: { id: true },
  });
  const entityIds = [
    ...paints.map(({ id }) => id),
    ...colors.map(({ id }) => id),
    ...collections.map(({ id }) => id),
    ...suppliers.map(({ id }) => id),
  ];
  await database.$transaction([
    database.auditLog.deleteMany({ where: { entityId: { in: entityIds } } }),
    database.inventoryTransaction.deleteMany({
      where: { paintId: { in: paints.map(({ id }) => id) } },
    }),
    database.paintColorLink.deleteMany({
      where: {
        OR: [
          { paintId: { in: paints.map(({ id }) => id) } },
          { colorId: { in: colors.map(({ id }) => id) } },
        ],
      },
    }),
    database.paint.deleteMany({ where: { id: { in: paints.map(({ id }) => id) } } }),
    database.paintColor.deleteMany({ where: { id: { in: colors.map(({ id }) => id) } } }),
    database.colorCollection.deleteMany({
      where: { id: { in: collections.map(({ id }) => id) } },
    }),
    database.supplier.deleteMany({
      where: { id: { in: suppliers.map(({ id }) => id) } },
    }),
  ]);
}

test.beforeEach(cleanup);
test.afterEach(cleanup);
test.afterAll(async () => database.$disconnect());

test("admin supplier, collection, color, product, and promotion persist through HTTP", async ({
  page,
}) => {
  await loginAsAdmin(page);
  const stamp = Date.now();
  const supplierData = {
    name: "P1 HTTP Supplier",
    slug: `${marker}${stamp}-supplier`,
    website: "",
    phone: "",
    email: "",
    address: "",
    contact: "",
    description: "",
    isActive: true,
  };
  const supplierResponse = await page.request.post("/api/admin/suppliers", {
    data: supplierData,
  });
  expect(supplierResponse.status()).toBe(201);
  const supplier = (await supplierResponse.json()) as { id: string };

  const collectionData = {
    name: "P1 HTTP Collection",
    nameEn: "P1 HTTP Collection",
    slug: `${marker}${stamp}-collection`,
    description: "",
    image: "",
    year: 2026,
    isActive: true,
  };
  const collectionResponse = await page.request.post("/api/admin/collections", {
    data: collectionData,
  });
  expect(collectionResponse.status()).toBe(201);
  const collection = (await collectionResponse.json()) as { id: string };

  const colorData = {
    code: `${marker}${stamp}-color`,
    name: "P1 HTTP Blue",
    nameEn: "P1 HTTP Blue",
    hex: "#315B7D",
    toneFamily: "COOL",
    colorFamily: "BLUE",
    collectionId: collection.id,
  };
  const colorResponse = await page.request.post("/api/admin/colors", {
    data: colorData,
  });
  expect(colorResponse.status()).toBe(201);
  const color = (await colorResponse.json()) as { id: string };

  const category = await database.category.findUniqueOrThrow({
    where: { slug: "integration-paints" },
  });
  const productData = {
    sku: `INTEGRATION-P1-HTTP-${stamp}`,
    name: "P1 HTTP Paint",
    nameEn: "P1 HTTP Paint",
    categoryId: category.id,
    supplierId: supplier.id,
    description: "",
    descriptionEn: "",
    paintType: "INTERIOR",
    finish: "MATTE",
    volume: 5,
    volumeUnit: "L",
    price: 600000,
    costPrice: 350000,
    discountPercent: 0,
    stock: 3,
    colors: [colorData.code],
  };
  const productResponse = await page.request.post("/api/admin/products", {
    data: productData,
  });
  expect(productResponse.status()).toBe(201);
  const product = (await productResponse.json()) as { id: string };

  expect(
    (
      await page.request.patch("/api/admin/products/promotions", {
        data: { paintId: product.id, discountPercent: 15 },
      })
    ).status(),
  ).toBe(200);
  expect(
    await database.paint.findUnique({
      where: { id: product.id },
      select: {
        supplierId: true,
        discountPercent: true,
        stock: true,
        colors: { select: { colorId: true } },
      },
    }),
  ).toEqual({
    supplierId: supplier.id,
    discountPercent: 15,
    stock: 3,
    colors: [{ colorId: color.id }],
  });

  for (const path of [
    "/api/admin/suppliers",
    "/api/admin/collections",
    "/api/admin/colors",
    "/api/admin/products",
  ]) {
    expect((await page.request.get(path)).status(), path).toBe(200);
  }
});

test("customer cannot mutate any P1 admin catalog endpoint", async ({ page }) => {
  await loginAsCustomer(page);
  const responses = await Promise.all([
    page.request.post("/api/admin/suppliers", { data: {} }),
    page.request.post("/api/admin/collections", { data: {} }),
    page.request.post("/api/admin/colors", { data: {} }),
    page.request.post("/api/admin/products", { data: {} }),
    page.request.patch("/api/admin/products/promotions", { data: {} }),
  ]);
  expect(responses.map((response) => response.status())).toEqual([
    403, 403, 403, 403, 403,
  ]);
});
