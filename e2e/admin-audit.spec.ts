import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  createTestDatabase,
  resetHttpApiFixtures,
} from "../tests/integration/helpers/test-database.ts";
import { TEST_FIXTURES } from "../scripts/test-db-fixtures.ts";
import { loginAsAdmin, loginAsCustomer } from "./helpers/auth.ts";

const database = createTestDatabase();

test.beforeEach(async () => {
  await resetHttpApiFixtures(database);
  await database.auditLog.deleteMany({
    where: { entityType: "IntegrationAudit" },
  });
  const actor = await database.user.findUniqueOrThrow({
    where: { email: TEST_FIXTURES.adminEmail },
    select: { id: true, email: true },
  });
  await database.auditLog.createMany({
    data: [
      {
        actorId: actor.id,
        actorEmail: actor.email,
        action: "INTEGRATION_AUDIT_CREATED",
        entityType: "IntegrationAudit",
        entityId: "integration-audit-1",
        beforeData: { status: "OLD" },
        afterData: { status: "NEW" },
      },
      {
        actorId: actor.id,
        actorEmail: actor.email,
        action: "INTEGRATION_AUDIT_UPDATED",
        entityType: "IntegrationAudit",
        entityId: "integration-audit-2",
      },
    ],
  });
});

test.afterEach(async () => {
  await database.auditLog.deleteMany({
    where: { entityType: "IntegrationAudit" },
  });
  await resetHttpApiFixtures(database);
});

test.afterAll(async () => {
  await database.$disconnect();
});

test("ADMIN can filter paginated audit history and inspect sanitized diffs", async ({
  page,
}) => {
  await loginAsAdmin(page);

  const response = await page.request.get(
    "/api/admin/audit-logs?entityType=IntegrationAudit&action=INTEGRATION_AUDIT_CREATED&page=1&limit=10",
  );
  expect(response.status()).toBe(200);
  const body = (await response.json()) as {
    data: Array<{
      action: string;
      entityType: string;
      beforeData: unknown;
      afterData: unknown;
    }>;
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
  expect(body.data).toHaveLength(1);
  expect(body.data[0]).toMatchObject({
    action: "INTEGRATION_AUDIT_CREATED",
    entityType: "IntegrationAudit",
    beforeData: { status: "OLD" },
    afterData: { status: "NEW" },
  });
  expect(body.pagination).toEqual({
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
  });

  await page.goto("/admin/audit");
  await expect(
    page.getByRole("heading", {
      name: "Nhật ký kiểm toán / Audit history",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText("INTEGRATION_AUDIT_CREATED")).toBeVisible();
  await expect(page.getByText("IntegrationAudit").first()).toBeVisible();
  await expect(page.getByText(/\"status\": \"NEW\"/)).toBeVisible();
  await expect(page.locator("thead")).toHaveClass(/text-warm-800/);
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
});

test("CUSTOMER cannot read audit history", async ({ page }) => {
  await loginAsCustomer(page);
  const response = await page.request.get("/api/admin/audit-logs");
  expect(response.status()).toBe(403);
});
