import { expect, test, type Page } from "@playwright/test";
import { loginAsAdmin, loginAsCustomer } from "./helpers/auth.ts";

const viewports = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

for (const viewport of viewports) {
  test(`public journeys fit the ${viewport.name} viewport`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const path of [
      "/products",
      "/login",
      "/register",
      "/verify-email",
      "/checkout",
      "/color-visualizer",
      "/find-dealer",
    ]) {
      await page.goto(path);
      await expect(page.locator("main").first()).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });

  test(`profile security and privacy fit the ${viewport.name} viewport`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await loginAsCustomer(page);
    await page
      .getByRole("button", { name: /Phiên đăng nhập|Signed-in Sessions/i })
      .click();
    await expect(
      page.getByRole("heading", {
        name: /Phiên đăng nhập|Signed-in sessions/i,
      }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page
      .getByRole("button", { name: /Dữ liệu & quyền riêng tư|Data & Privacy/i })
      .click();
    await expectNoHorizontalOverflow(page);
  });

  test(`audit and notifications fit the ${viewport.name} viewport`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await loginAsAdmin(page);
    await page.goto("/admin/audit");
    await expect(
      page.getByRole("heading", {
        name: "Nhật ký kiểm toán / Audit history",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: /Mở thông báo|Open notifications/i })
      .click();
    await expectNoHorizontalOverflow(page);
  });
}

for (const scenario of [
  {
    name: "dealer directory",
    path: "/find-dealer",
    api: "**/api/dealers",
  },
  {
    name: "blog listing",
    path: "/blog",
    api: "**/api/blog",
  },
]) {
  test(`${scenario.name} exposes an accessible retry after a 5xx`, async ({
    page,
  }) => {
    let failuresRemaining = 1;
    await page.route(scenario.api, async (route) => {
      if (failuresRemaining > 0) {
        failuresRemaining -= 1;
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: { message: "Temporary failure" } }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto(scenario.path);
    const errorState = page.locator("section[role='alert']");
    await expect(errorState).toBeVisible();
    const retry = page.getByRole("button", { name: /Thử lại|Retry/i });
    await expect(retry).toBeVisible();
    await retry.focus();
    await retry.click();
    await expect(errorState).toHaveCount(0);
    await expect(page.getByRole("heading").first()).toBeVisible();
  });
}
