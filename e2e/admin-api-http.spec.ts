import { expect, test } from "@playwright/test";
import {
  createTestDatabase,
  resetHttpApiFixtures,
} from "../tests/integration/helpers/test-database.ts";
import { loginAsAdmin, loginAsCustomer } from "./helpers/auth.ts";

const database = createTestDatabase();

test.beforeEach(async () => {
  await resetHttpApiFixtures(database);
});

test.afterAll(async () => {
  await resetHttpApiFixtures(database);
  await database.$disconnect();
});

test("HTTP fixture cleanup is namespaced", async () => {
  await database.category.create({
    data: {
      name: "HTTP cleanup fixture",
      slug: "integration-http-cleanup",
    },
  });

  await resetHttpApiFixtures(database);

  await expect(
    database.category.findUnique({
      where: { slug: "integration-http-cleanup" },
    }),
  ).resolves.toBeNull();
  await expect(
    database.category.findUnique({
      where: { slug: "integration-paints" },
    }),
  ).resolves.not.toBeNull();
});

test("ADMIN can manage a category through HTTP with audit history", async ({
  page,
}) => {
  const slug = `integration-http-category-${Date.now()}`;
  const category = {
    name: "HTTP Category",
    nameEn: "HTTP Category",
    slug,
    description: "Created through authenticated HTTP E2E",
    image: "",
    sortOrder: 25,
    isActive: true,
  };

  await loginAsAdmin(page);
  const createdResponse = await page.request.post("/api/admin/categories", {
    data: category,
  });
  expect(createdResponse.status()).toBe(201);
  const created = (await createdResponse.json()) as { id: string };

  const duplicateResponse = await page.request.post("/api/admin/categories", {
    data: category,
  });
  expect(duplicateResponse.status()).toBe(409);

  const updatedResponse = await page.request.patch("/api/admin/categories", {
    data: {
      ...category,
      id: created.id,
      name: "HTTP Category Updated",
      sortOrder: 30,
    },
  });
  expect(updatedResponse.status()).toBe(200);

  const deletedResponse = await page.request.delete(
    `/api/admin/categories?id=${encodeURIComponent(created.id)}`,
  );
  expect(deletedResponse.status()).toBe(200);

  await expect(
    database.category.findUnique({
      where: { id: created.id },
      select: { isActive: true },
    }),
  ).resolves.toEqual({ isActive: false });
  await expect(
    database.auditLog.findMany({
      where: { entityType: "Category", entityId: created.id },
      orderBy: { createdAt: "asc" },
      select: { action: true },
    }),
  ).resolves.toEqual([
    { action: "CATEGORY_CREATED" },
    { action: "CATEGORY_UPDATED" },
    { action: "CATEGORY_DEACTIVATED" },
  ]);
});

test("CUSTOMER is denied admin catalog mutations", async ({ page }) => {
  const slug = `integration-http-denied-${Date.now()}`;

  await loginAsCustomer(page);
  const response = await page.request.post("/api/admin/categories", {
    data: {
      name: "Denied HTTP Category",
      nameEn: "",
      slug,
      description: "",
      image: "",
      sortOrder: 0,
      isActive: true,
    },
  });

  expect(response.status()).toBe(403);
  await expect(
    database.category.findUnique({ where: { slug } }),
  ).resolves.toBeNull();
});
