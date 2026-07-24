import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { loginAsAdmin, loginAsCustomer } from "./helpers/auth.ts";

const publicPages = [
  "/",
  "/products",
  "/colors",
  "/login",
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
