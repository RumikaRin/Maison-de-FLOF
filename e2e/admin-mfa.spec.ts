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

  await setupPage.goto("/profile");
  await setupPage.getByRole("button", { name: /Bảo mật|Security/i }).click();
  await setupPage
    .getByRole("button", { name: /Thiết lập MFA|Set up MFA/i })
    .click();

  const secret = (await setupPage.locator("output").first().textContent())?.trim();
  const otpauthUri = (await setupPage.locator("output").nth(1).textContent())?.trim();
  expect(secret).toMatch(/^[A-Z2-7]+$/);
  expect(otpauthUri).toMatch(/^otpauth:\/\/totp\//);

  const code = generateTotpCode(decodeBase32(secret!));
  await setupPage.getByLabel(/Mã 6 chữ số|6-digit code/i).fill(code);
  await setupPage
    .getByRole("button", { name: /Xác minh và bật MFA|Verify and enable MFA/i })
    .click();
  await expect(setupPage.locator('span[role="status"]')).toContainText(
    /MFA đang bật|MFA enabled/i,
  );
  const recoveryCodes = setupPage.getByRole("list", {
    name: /Mã khôi phục|Recovery codes/i,
  }).getByRole("listitem");
  await expect(recoveryCodes).toHaveCount(10);
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
      generateTotpCode(decodeBase32(secret!)),
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
      await expect(
        verificationDatabase.auditLog.count({
          where: { actorId: adminId, action: "MFA_ENABLED" },
        }),
      ).resolves.toBeGreaterThan(0);
    } finally {
      await verificationDatabase.$disconnect();
    }

    await loginPage.goto("/profile");
    await loginPage.getByRole("button", { name: /Bảo mật|Security/i }).click();
    await loginPage
      .getByLabel(/^Mật khẩu$|^Password$/i)
      .fill(TEST_FIXTURES.password);
    await loginPage
      .getByLabel(/Mã xác thực hoặc khôi phục|Authentication or recovery code/i)
      .fill(generateTotpCode(decodeBase32(secret!)));
    await loginPage.getByRole("button", { name: /^Tắt MFA$|^Disable MFA$/i }).click();
    await expect(loginPage.locator('span[role="status"]')).toContainText(
      /MFA chưa bật|MFA disabled/i,
    );

    const disabledDatabase = createTestDatabase();
    try {
      await expect(
        disabledDatabase.mfaCredential.findUnique({ where: { userId: adminId } }),
      ).resolves.toBeNull();
      await expect(
        disabledDatabase.auditLog.count({
          where: { actorId: adminId, action: "MFA_DISABLED" },
        }),
      ).resolves.toBeGreaterThan(0);
    } finally {
      await disabledDatabase.$disconnect();
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
