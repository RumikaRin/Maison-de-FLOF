import { expect, test } from "@playwright/test";

test("locale middleware preserves prefixed UI URLs and excludes API routes", async ({
  request,
}) => {
  const unprefixed = await request.get("/products", { maxRedirects: 0 });
  expect([307, 308]).toContain(unprefixed.status());
  expect(unprefixed.headers().location).toMatch(/\/vi\/products$/);

  for (const path of ["/vi/products", "/en/products"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(await response.text()).toContain(
      `<html lang="${path.startsWith("/en") ? "en" : "vi"}"`,
    );
  }

  const prefixedApi = await request.get("/vi/api/products", {
    maxRedirects: 0,
  });
  expect([307, 308]).toContain(prefixedApi.status());
  expect(prefixedApi.headers().location).toMatch(/\/api\/products$/);

  const authCallback = await request.get("/api/auth/session", {
    maxRedirects: 0,
  });
  expect(authCallback.status()).toBe(200);
  expect(authCallback.headers().location).toBeUndefined();

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const sitemapXml = await sitemap.text();
  expect(sitemapXml).toContain("/vi/products");
  expect(sitemapXml).toContain("/en/products");
  expect(sitemapXml).toContain('hreflang="vi"');
  expect(sitemapXml).toContain('hreflang="en"');

  const unsupported = await request.get("/fr/products", { maxRedirects: 0 });
  expect([307, 308]).toContain(unsupported.status());
  expect(unsupported.headers().location).toMatch(/\/vi\/products$/);
});

test("language switch keeps the equivalent route and synchronizes document language", async ({
  page,
}) => {
  await page.goto("/vi/products");
  await expect(page).toHaveURL(/\/vi\/products$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");

  await page
    .getByRole("button", { name: "Switch language to English" })
    .click();
  await expect(page).toHaveURL(/\/en\/products$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  await page.getByRole("link", { name: "Colors" }).click();
  await expect(page).toHaveURL(/\/en\/colors$/);
});
