import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { TEST_FIXTURES } from "../scripts/test-db-fixtures.ts";
import { createTestDatabase } from "../tests/integration/helpers/test-database.ts";
import { loginAsCustomer } from "./helpers/auth.ts";

const database = createTestDatabase();

async function cleanup() {
  const user = await database.user.findUnique({
    where: { email: TEST_FIXTURES.customerEmail },
    select: { id: true },
  });
  if (!user) return;
  await database.visualizerDesign.deleteMany({
    where: {
      userId: user.id,
      name: { startsWith: "Visualizer E2E" },
    },
  });
}

test.beforeEach(cleanup);
test.afterEach(cleanup);
test.afterAll(async () => {
  await cleanup();
  await database.$disconnect();
});

test("guest can experiment but receives a login prompt when saving", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/color-visualizer");
  await expect(
    page.getByRole("button", { name: /Mặt tiền nhà|House Facade/i }),
  ).toBeVisible();
  await page
    .getByLabel(/Tên thiết kế mới|New design name/i)
    .fill("Visualizer E2E guest");
  await page.getByRole("button", { name: /^Lưu$|^Save$/i }).click();
  await expect(
    page.getByRole("link", { name: /Đăng nhập|Sign in/i }),
  ).toBeVisible();
});

test("customer can save, reopen, rename and delete an owned design", async ({
  page,
}) => {
  await loginAsCustomer(page);
  await page.goto("/color-visualizer");
  await expect(
    page.getByRole("button", { name: /Mặt tiền nhà|House Facade/i }),
  ).toBeVisible();
  await page
    .getByLabel(/Tên thiết kế mới|New design name/i)
    .fill("Visualizer E2E initial");
  await page.getByRole("button", { name: /^Lưu$|^Save$/i }).click();

  const nameInput = page.getByLabel(
    /Tên thiết kế Visualizer E2E initial|Design name Visualizer E2E initial/i,
  );
  await expect(nameInput).toBeVisible();
  await page.getByRole("button", { name: /Mở ·|Open ·/i }).click();
  await nameInput.fill("Visualizer E2E renamed");
  await page
    .getByRole("button", {
      name: /Đổi tên Visualizer E2E initial|Rename Visualizer E2E initial/i,
    })
    .click();
  await expect(
    page.getByLabel(
      /Tên thiết kế Visualizer E2E renamed|Design name Visualizer E2E renamed/i,
    ),
  ).toBeVisible();

  const owner = await database.user.findUniqueOrThrow({
    where: { email: TEST_FIXTURES.customerEmail },
  });
  await expect
    .poll(() =>
      database.visualizerDesign.count({
        where: { userId: owner.id, name: "Visualizer E2E renamed" },
      }),
    )
    .toBe(1);

  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    accessibility.violations
      .filter(
        (violation) =>
          violation.impact === "critical" || violation.impact === "serious",
      )
      .map((violation) => ({
        id: violation.id,
        nodes: violation.nodes.map((node) => ({
          target: node.target,
          html: node.html,
          summary: node.failureSummary,
        })),
      })),
  ).toEqual([]);

  await page
    .getByRole("button", {
      name: /Xóa Visualizer E2E renamed|Delete Visualizer E2E renamed/i,
    })
    .click();
  await expect(
    page.getByLabel(
      /Tên thiết kế Visualizer E2E renamed|Design name Visualizer E2E renamed/i,
    ),
  ).toHaveCount(0);
});
