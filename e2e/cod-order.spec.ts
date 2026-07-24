import { expect, test } from "@playwright/test";
import { TEST_FIXTURES } from "../scripts/test-db-fixtures.ts";
import { loginAsAdmin, loginAsCustomer } from "./helpers/auth.ts";

test("customer places a COD order and admin confirms it", async ({ page }) => {
  await loginAsCustomer(page);

  await page.goto(`/products/${TEST_FIXTURES.productSlug}`);
  await page.getByRole("button", { name: /Mua ngay|Buy now/i }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await page
    .getByRole("button", { name: /Tiến hành thanh toán|Checkout|Thanh toán/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/checkout/);

  await page.getByLabel(/Họ và tên|Full Name/).fill("Integration Customer");
  await page.getByLabel(/Số điện thoại|Phone/).fill("0900000000");
  await page.getByLabel(/Tỉnh|Province/).fill("Ha Noi");
  await page.getByLabel(/Quận|District/).fill("Cau Giay");
  await page.getByLabel(/Địa chỉ nhận hàng|Address/).fill("15 Cau Giay");
  await page
    .getByRole("button", { name: /Thanh toán khi nhận hàng|Cash on Delivery/ })
    .click();
  await page.getByRole("button", { name: /Đặt Hàng|Place Order/ }).click();

  await expect(
    page.getByRole("heading", { name: /Đặt hàng thành công|Order Successful/ }),
  ).toBeVisible();

  await page.goto("/profile");
  const orderNumber = await page
    .locator("span.font-mono")
    .filter({ hasText: /^FLOF-/ })
    .first()
    .textContent();
  expect(orderNumber).toMatch(/^FLOF-/);

  await page.context().clearCookies();
  await loginAsAdmin(page);
  await page.goto("/admin/orders");
  const row = page.getByRole("row").filter({ hasText: orderNumber! });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: /Chờ duyệt|Pending/ }).click();
  await page.getByRole("button", { name: /Đã xác nhận|Confirmed/ }).click();
  await expect(row).toContainText(/Đã xác nhận|CONFIRMED|Confirmed/);
});
