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
  // Province and ward are searchable selects fed by the official 34-province
  // dataset (post-2025-merger units) — pick real values, no free text.
  await page.getByLabel(/Tỉnh|Province/).click();
  await page.getByRole("option", { name: "Thành phố Hà Nội" }).click();
  await page.getByLabel(/Phường|Ward/).click();
  await page.getByRole("option", { name: "Phường Ba Đình" }).click();
  await page.getByLabel(/Địa chỉ nhận hàng|Address/).fill("15 Cau Giay");
  // Payment methods are radios since the checkout redesign; COD is the
  // pre-selected default, so assert it rather than clicking a button.
  await expect(
    page.getByRole("radio", { name: /Thanh toán khi nhận hàng|Cash on Delivery/ }),
  ).toBeChecked();
  await page.getByRole("button", { name: /Đặt hàng|Place Order/i }).click();

  await expect(
    page.getByRole("heading", { name: /Đặt hàng thành công|Order Successful/ }),
  ).toBeVisible();

  await page.goto("/profile");
  // The order-history redesign renders the number as a table cell.
  const orderNumber = await page
    .getByRole("cell")
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
