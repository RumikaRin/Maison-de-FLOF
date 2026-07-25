import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { TEST_FIXTURES } from "../scripts/test-db-fixtures.ts";
import { assertTestDatabaseUrl } from "../scripts/assert-test-database.ts";
import {
  decodeBase32,
  generateTotpCode,
} from "../src/lib/auth/totp.ts";

function createTestDatabase() {
  return new PrismaClient({
    datasourceUrl: assertTestDatabaseUrl(process.env.TEST_DATABASE_URL),
  });
}

test("enabled administrator MFA rejects password-only login and accepts TOTP", async ({
  browser,
}) => {
  const database = createTestDatabase();
  let adminId = "";
  try {
    const admin = await database.user.findUniqueOrThrow({
      where: { email: TEST_FIXTURES.adminEmail },
      select: { id: true },
    });
    adminId = admin.id;
    await database.mfaCredential.deleteMany({ where: { userId: admin.id } });
  } finally {
    await database.$disconnect();
  }

  const setupContext = await browser.newContext();
  const setupPage = await setupContext.newPage();
  await setupPage.goto("/login");
  await setupPage.getByLabel("Email").fill(TEST_FIXTURES.adminEmail);
  await setupPage.getByLabel(/Mật khẩu|Password/).fill(TEST_FIXTURES.password);
  await setupPage.getByRole("button", { name: /Đăng nhập|Login/i }).click();
  await expect(setupPage).toHaveURL(/\/admin$/);

  const setup = await setupPage.evaluate(async () => {
    const response = await fetch("/api/profile/mfa/setup", { method: "POST" });
    return { status: response.status, body: await response.json() };
  });
  expect(setup.status).toBe(200);
  expect(setup.body.secret).toMatch(/^[A-Z2-7]+$/);
  expect(setup.body.otpauthUri).toMatch(/^otpauth:\/\/totp\//);

  const code = generateTotpCode(decodeBase32(setup.body.secret));
  const enabled = await setupPage.evaluate(async (totpCode) => {
    const response = await fetch("/api/profile/mfa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: totpCode }),
    });
    return { status: response.status, body: await response.json() };
  }, code);
  expect(enabled.status).toBe(200);
  expect(enabled.body.recoveryCodes).toHaveLength(10);
  await setupContext.close();

  const loginContext = await browser.newContext();
  const loginPage = await loginContext.newPage();
  try {
    await loginPage.goto("/login");
    await loginPage.getByLabel("Email").fill(TEST_FIXTURES.adminEmail);
    await loginPage
      .getByLabel(/Mật khẩu|Password/)
      .fill(TEST_FIXTURES.password);
    await loginPage.getByRole("button", { name: /Đăng nhập|Login/i }).click();
    await expect(loginPage).toHaveURL(/\/login$/);

    const mfaInput = loginPage.getByLabel(/Mã xác thực|Authentication code/i);
    await expect(mfaInput).toBeVisible();
    await mfaInput.fill(
      generateTotpCode(decodeBase32(setup.body.secret)),
    );
    await loginPage.getByRole("button", { name: /Đăng nhập|Login/i }).click();
    await expect(loginPage).toHaveURL(/\/admin$/);

    const verificationDatabase = createTestDatabase();
    try {
      const credential = await verificationDatabase.mfaCredential.findUniqueOrThrow({
        where: { userId: adminId },
      });
      const storedHashes = credential.recoveryCodeHashes as string[];
      expect(storedHashes).toHaveLength(10);
      expect(storedHashes).not.toContain(enabled.body.recoveryCodes[0]);
      await expect(
        verificationDatabase.auditLog.count({
          where: { actorId: adminId, action: "MFA_ENABLED" },
        }),
      ).resolves.toBeGreaterThan(0);
    } finally {
      await verificationDatabase.$disconnect();
    }
  } finally {
    const cleanupDatabase = createTestDatabase();
    try {
      await cleanupDatabase.mfaCredential.deleteMany({
        where: { userId: adminId },
      });
    } finally {
      await cleanupDatabase.$disconnect();
      await loginContext.close();
    }
  }
});
