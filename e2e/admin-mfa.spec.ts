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
  await expect(setupPage).toHaveURL(/\/profile$/);
  const setupSecurityTab = setupPage.getByTestId("profile-tab-security").or(
    setupPage.getByRole("button", { name: /Bảo mật|Security/i }),
  );
  await expect(setupSecurityTab).toBeVisible({ timeout: 15000 });
  await setupSecurityTab.click();
  await expect(setupSecurityTab).toHaveAttribute("aria-current", "true");

  const setupMfaButton = setupPage.getByTestId("mfa-setup-button").or(
    setupPage.getByRole("button", { name: /Thiết lập MFA|Set up MFA/i }),
  );
  await expect(setupMfaButton).toBeVisible({ timeout: 15000 });
  await setupMfaButton.click();

  const secret = (await setupPage.locator("output").first().textContent())?.trim();
  const otpauthUri = (await setupPage.locator("output").nth(1).textContent())?.trim();
  expect(secret).toMatch(/^[A-Z2-7]+$/);
  expect(otpauthUri).toMatch(/^otpauth:\/\/totp\//);

  const code = generateTotpCode(decodeBase32(secret!));
  const verifyCodeInput = setupPage.getByTestId("mfa-verify-code").or(
    setupPage.getByLabel(/Mã 6 chữ số|6-digit code/i),
  );
  await verifyCodeInput.fill(code);
  const verifySubmitButton = setupPage.getByTestId("mfa-verify-submit").or(
    setupPage.getByRole("button", { name: /Xác minh và bật MFA|Verify and enable MFA/i }),
  );
  await verifySubmitButton.click();
  await expect(setupPage.locator('span[role="status"]')).toContainText(
    /MFA đang bật|MFA enabled/i,
    { timeout: 15000 },
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

    // 1. Navigation to /profile and URL verification
    await loginPage.goto("/profile");
    await expect(loginPage).toHaveURL(/\/profile$/);

    // 2. Security tab visibility and activation
    const securityTab = loginPage.getByTestId("profile-tab-security").or(
      loginPage.getByRole("button", { name: /Bảo mật|Security/i }),
    );
    await expect(securityTab).toBeVisible({ timeout: 15000 });
    await securityTab.click();
    await expect(securityTab).toHaveAttribute("aria-current", "true");

    // 3. MFA enabled state assertion
    await expect(loginPage.locator('span[role="status"]')).toContainText(
      /MFA đang bật|MFA enabled/i,
      { timeout: 15000 },
    );

    // 4. Disable MFA form visibility assertion
    const disableForm = loginPage.getByTestId("mfa-disable-form");
    await expect(disableForm).toBeVisible({ timeout: 15000 });

    // 5. Fill disable inputs using stable data-testid selectors
    const disablePasswordInput = loginPage.getByTestId("mfa-disable-password").or(
      loginPage.getByLabel(/^Mật khẩu$|^Password$/i),
    );
    await expect(disablePasswordInput).toBeVisible();
    await disablePasswordInput.fill(TEST_FIXTURES.password);

    const disableCodeInput = loginPage.getByTestId("mfa-disable-code").or(
      loginPage.getByLabel(/Mã xác thực hoặc khôi phục|Authentication or recovery code/i),
    );
    await expect(disableCodeInput).toBeVisible();
    await disableCodeInput.fill(generateTotpCode(decodeBase32(secret!)));

    // 6. Click disable MFA button
    const disableSubmitButton = loginPage.getByTestId("mfa-disable-submit").or(
      loginPage.getByRole("button", { name: /^Tắt MFA$|^Disable MFA$/i }),
    );
    await expect(disableSubmitButton).toBeEnabled();
    await disableSubmitButton.click();

    // 7. Verify status updated to disabled
    await expect(loginPage.locator('span[role="status"]')).toContainText(
      /MFA chưa bật|MFA disabled/i,
      { timeout: 15000 },
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
