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
