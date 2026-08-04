import { expect, test } from "@playwright/test";

import { TEST_FIXTURES } from "../scripts/test-db-fixtures.ts";

test("bottom navigation follows the mobile route policy", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });

  for (const [path, bottomNav] of [
    ["/vi/products", true],
    ["/vi/cart", false],
    [`/vi/products/${TEST_FIXTURES.productSlug}`, false],
  ] as const) {
    await page.goto(path);

    await expect(page.getByLabel("Mobile navigation")).toHaveCount(
      bottomNav ? 1 : 0,
    );
  }
});

test("catalogue filter sheet returns focus and preserves the chosen grid density", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/vi/products");

  const trigger = page.getByRole("button", { name: /Bộ lọc|Filters/i });
  await trigger.click();
  await expect(
    page.getByRole("dialog", { name: /Bộ lọc sản phẩm|Product Filters/i }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();

  await page.getByRole("button", { name: "1 column grid" }).click();
  await expect(page.locator("[data-mobile-grid='1']")).toBeVisible();
});

test("product purchase action replaces navigation and cart checkout action remains safe-area aware", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`/vi/products/${TEST_FIXTURES.productSlug}`);

  await page.getByRole("button", { name: /Thêm vào giỏ|Add to cart/i }).first().click();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.locator('[data-mobile-action="product-purchase"]')).toBeVisible();
  await expect(page.getByLabel("Mobile navigation")).toHaveCount(0);

  await page.goto("/vi/cart");
  await expect(page.locator('[data-mobile-action="cart-checkout"]')).toHaveCount(1);
  await expect(page.getByLabel("Mobile navigation")).toHaveCount(0);
});
