import { expect, test } from "@playwright/test";
import { P1_FIXTURES } from "../scripts/test-db-fixtures.ts";

test("storefront navigation, catalog, and auth form work in the browser matrix", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("main")).toBeVisible();
  await expect(page.getByRole("link", { name: /Sản phẩm|Products/i }).first())
    .toBeVisible();

  await page.goto("/products");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /P1 Paint 5L/i }).first(),
  ).toBeVisible();

  await page.goto(`/products/${P1_FIXTURES.productSlug}`);
  await expect(page.getByRole("heading", { name: "P1 Paint 5L" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Mua ngay|Buy now/i })).toBeVisible();

  await page.goto("/login");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel(/Mật khẩu|Password/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Đăng nhập|Login/i })).toBeEnabled();
});
