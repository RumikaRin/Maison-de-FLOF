import { expect, test } from "@playwright/test";
import bcrypt from "bcryptjs";
import { TEST_FIXTURES } from "../scripts/test-db-fixtures.ts";
import { createTestDatabase } from "../tests/integration/helpers/test-database.ts";
import { login, loginAsCustomer } from "./helpers/auth.ts";

test("customer can export only their own privacy archive", async ({ page }) => {
  await loginAsCustomer(page);
  await page.getByRole("button", { name: /Dữ liệu & quyền riêng tư|Data & Privacy/i }).click();
  await expect(
    page.getByRole("heading", { name: /Dữ liệu & quyền riêng tư|Data & privacy/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Tải dữ liệu của tôi|Download my data/i }),
  ).toBeVisible();
  const response = await page.request.get("/api/profile/data-export");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/json");
  expect(response.headers()["content-disposition"]).toContain("attachment");
  const body = await response.json();
  expect(body.profile.email).toBe(TEST_FIXTURES.customerEmail);
  expect(JSON.stringify(body)).not.toMatch(
    /password|access_token|refresh_token|sessionToken|secretCiphertext/,
  );
});

test("account deletion requires explicit confirmation and current password", async ({
  page,
}) => {
  await loginAsCustomer(page);
  const response = await page.request.delete("/api/profile/delete-account", {
    data: {
      confirmation: "DELETE",
      password: "wrong-password",
    },
  });
  expect(response.status()).toBe(403);
});

test("confirmed account deletion anonymizes the owner and revokes the active session", async ({
  page,
}) => {
  const database = createTestDatabase();
  const role = await database.role.findUniqueOrThrow({
    where: { type: "CUSTOMER" },
  });
  const email = `privacy-delete-${Date.now()}@flof.test`;
  const user = await database.user.create({
    data: {
      email,
      emailVerified: new Date(),
      password: await bcrypt.hash(TEST_FIXTURES.password, 12),
      name: "Privacy Delete E2E",
      privacyConsentAt: new Date(),
      roleId: role.id,
      customer: { create: {} },
    },
  });

  try {
    await login(page, email, /\/profile$/);
    const response = await page.request.delete("/api/profile/delete-account", {
      data: {
        confirmation: "DELETE",
        password: TEST_FIXTURES.password,
      },
    });
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({
      data: { deleted: true },
    });

    const profileResponse = await page.request.get("/api/profile");
    expect(profileResponse.status()).toBe(401);
    const anonymized = await database.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(anonymized.email).toMatch(/@privacy\.invalid$/);
    expect(anonymized.deletionRequestedAt).not.toBeNull();
  } finally {
    await database.auditLog.deleteMany({ where: { actorId: user.id } });
    await database.customer.deleteMany({ where: { userId: user.id } });
    await database.user.deleteMany({ where: { id: user.id } });
    await database.$disconnect();
  }
});

test("retention cron fails closed without a valid secret", async ({ request }) => {
  const response = await request.get("/api/cron/apply-retention");
  expect(response.status()).toBe(401);
});
