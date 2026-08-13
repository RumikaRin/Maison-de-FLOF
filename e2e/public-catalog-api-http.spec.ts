import { expect, test } from "@playwright/test";
import { P1_FIXTURES } from "../scripts/test-db-fixtures.ts";
import { createTestDatabase } from "../tests/integration/helpers/test-database.ts";

const database = createTestDatabase();

test.afterAll(async () => {
  await database.$disconnect();
});

test("public catalog APIs match persisted P1 records", async ({ request }) => {
  const persisted = await database.paint.findUniqueOrThrow({
    where: { sku: P1_FIXTURES.productSku },
    select: { id: true, slug: true, sku: true },
  });

  const listResponse = await request.get("/api/products?page=1&limit=100");
  expect(listResponse.status()).toBe(200);
  const list = (await listResponse.json()) as {
    data: Array<{ id: string; slug: string; sku: string }>;
    total: number;
    page: number;
    limit: number;
  };
  expect(list.page).toBe(1);
  expect(list.limit).toBe(100);
  expect(list.total).toBeGreaterThanOrEqual(1);
  expect(list.data).toContainEqual(expect.objectContaining(persisted));

  const detailResponse = await request.get(
    `/api/products/${P1_FIXTURES.productSlug}`,
  );
  expect(detailResponse.status()).toBe(200);
  expect(await detailResponse.json()).toEqual(
    expect.objectContaining(persisted),
  );
  expect(
    (await request.get("/api/products/integration-p1-missing")).status(),
  ).toBe(404);

  const suppliers = await (
    await request.get("/api/suppliers")
  ).json() as Array<{ slug: string }>;
  expect(suppliers).toContainEqual(
    expect.objectContaining({ slug: P1_FIXTURES.supplierSlug }),
  );

  const colorsResponse = await request.get("/api/colors?page=1&limit=100");
  expect(colorsResponse.status()).toBe(200);
  const colors = (await colorsResponse.json()) as {
    data: Array<{ code: string }>;
  };
  expect(colors.data).toContainEqual(
    expect.objectContaining({ code: P1_FIXTURES.colorCode }),
  );

  const collections = await (
    await request.get("/api/color-collections")
  ).json() as Array<{ slug: string; colors: Array<{ code: string }> }>;
  expect(collections).toContainEqual(
    expect.objectContaining({
      slug: P1_FIXTURES.collectionSlug,
      colors: expect.arrayContaining([
        expect.objectContaining({ code: P1_FIXTURES.colorCode }),
      ]),
    }),
  );

  const blogsResponse = await request.get("/api/blog?page=1&limit=100");
  expect(blogsResponse.status()).toBe(200);
  const blogs = (await blogsResponse.json()) as {
    data: Array<{ slug: string }>;
  };
  expect(blogs.data).toContainEqual(
    expect.objectContaining({ slug: P1_FIXTURES.articleSlug }),
  );
  const blogDetail = await request.get(
    `/api/blog/${P1_FIXTURES.articleSlug}`,
  );
  expect(blogDetail.status()).toBe(200);
  const blogPayload = (await blogDetail.json()) as {
    slug: string;
    relatedBlogs: Array<{ slug: string; category: string }>;
  };
  expect(blogPayload).toEqual(
    expect.objectContaining({ slug: P1_FIXTURES.articleSlug }),
  );
  expect(blogPayload.relatedBlogs.length).toBeLessThanOrEqual(3);
  expect(blogPayload.relatedBlogs[0]).toEqual(
    expect.objectContaining({
      slug: P1_FIXTURES.relatedArticleSlugs[0],
      category: "Integration Color",
    }),
  );
  expect(blogPayload.relatedBlogs).not.toContainEqual(
    expect.objectContaining({ slug: P1_FIXTURES.articleSlug }),
  );
  expect((await request.get("/api/blog/integration-p1-missing")).status()).toBe(
    404,
  );
});

test("public pagination rejects invalid bounds and preserves response shape", async ({
  request,
}) => {
  for (const path of [
    "/api/products?page=0&limit=10",
    "/api/colors?page=1&limit=101",
    "/api/dealers?page=nope&limit=10",
    "/api/blog?page=1&limit=0",
  ]) {
    expect((await request.get(path)).status(), path).toBe(400);
  }

  const dealers = await request.get("/api/dealers?page=1&limit=10");
  expect(dealers.status()).toBe(200);
  expect(await dealers.json()).toEqual(
    expect.objectContaining({
      data: expect.any(Array),
      page: 1,
      limit: 10,
      total: expect.any(Number),
    }),
  );
});
