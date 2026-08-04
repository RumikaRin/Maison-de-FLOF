import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { loginAsAdmin, loginAsCustomer } from "./helpers/auth.ts";

const publicPages = [
  "/",
  "/products",
  "/colors",
  "/blog",
  "/color-visualizer",
  "/find-dealer",
  "/login",
  "/register",
  "/verify-email",
  "/cart",
  "/quote-request",
];

async function expectNoBlockingViolations(page: Page) {
  // Scan the settled UI; transient entrance opacity can otherwise produce
  // false contrast failures from colors blended mid-animation.
  await page.waitForTimeout(1_200);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  const blocking = results.violations.filter(
    (item) => item.impact === "critical" || item.impact === "serious",
  );

  expect(
    blocking.map((violation) => ({
      id: violation.id,
      nodes: violation.nodes.slice(0, 8).map((node) => ({
        target: node.target,
        html: node.html,
        data: node.any[0]?.data,
      })),
    })),
  ).toEqual([]);
}

for (const path of publicPages) {
  test(`has no serious accessibility violations: ${path}`, async ({ page }) => {
    await page.goto(path);
    await expectNoBlockingViolations(page);
  });
}

test("products mobile controls and cards have no serious accessibility violations", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/products");
  await expectNoBlockingViolations(page);
});

test("opened product filters keep an accessible mobile dialog", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vi/products");
  await page.getByRole("button", { name: /Bộ lọc|Filters/i }).click();
  await expect(
    page.getByRole("dialog", { name: /Bộ lọc sản phẩm|Product Filters/i }),
  ).toBeVisible();
  await expectNoBlockingViolations(page);
});

test("profile has no serious accessibility violations", async ({ page }) => {
  await loginAsCustomer(page);
  await page.goto("/profile");
  await expectNoBlockingViolations(page);
});

test("admin orders has no serious accessibility violations", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/orders");
  await expectNoBlockingViolations(page);
});

test("admin audit and notification surfaces have no serious accessibility violations", async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.goto("/admin/audit");
  await page
    .getByRole("button", { name: /Mở thông báo|Open notifications/i })
    .click();
  await expectNoBlockingViolations(page);
});
