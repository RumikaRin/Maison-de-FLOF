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
