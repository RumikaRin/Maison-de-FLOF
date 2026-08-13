import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { TEST_FIXTURES } from "../scripts/test-db-fixtures.ts";
import { assertTestDatabaseUrl } from "../scripts/assert-test-database.ts";
import {
  createEmailVerificationToken,
  emailVerificationIdentifier,
} from "../src/lib/auth/email-verification.ts";

const REGISTER_EMAIL = "register.e2e@flof.test";
const REGISTER_PASSWORD = "Register-E2E-2026!";
const RESET_TOKEN = "flof-reset-token-for-e2e-2026-00000000000000000000";
const RESET_PASSWORD = "Reset-E2E-2026!";

function createTestDatabase() {
  return new PrismaClient({
    datasourceUrl: assertTestDatabaseUrl(process.env.TEST_DATABASE_URL),
  });
}

test("guest registers a customer account and can sign in", async ({ page }) => {
  const database = createTestDatabase();
  try {
    await database.user.deleteMany({ where: { email: REGISTER_EMAIL } });
  } finally {
    await database.$disconnect();
  }

  await page.goto("/register");
  await page.getByLabel(/Họ và tên|Full Name/).fill("Registration E2E");
  await page.getByLabel("Email").fill(REGISTER_EMAIL);
  await page.getByLabel(/^Mật khẩu$|^Password$/).fill(REGISTER_PASSWORD);
  await page
    .getByLabel(/Xác nhận mật khẩu|Confirm Password/)
    .fill(REGISTER_PASSWORD);
  await page
    .getByLabel(/Tôi đồng ý|I consent to FLOF processing/i)
    .check();
  await page.getByRole("button", { name: /Đăng ký tài khoản|Sign Up/i }).click();

  // Verification is optional for customers: registration signs them straight in
  // and lands on the profile. They can confirm the address later from settings.
  await expect(page).toHaveURL(/\/profile$/);

  const tokenDatabase = createTestDatabase();
  let verificationToken = "";
  try {
    const unverifiedUser = await tokenDatabase.user.findUnique({
      where: { email: REGISTER_EMAIL },
      select: { emailVerified: true },
    });
    expect(unverifiedUser?.emailVerified).toBeNull();
    // Still unverified, yet already signed in — that is the intended policy.
    const verification = await createEmailVerificationToken(
      tokenDatabase,
      REGISTER_EMAIL,
    );
    verificationToken = verification.token;
  } finally {
    await tokenDatabase.$disconnect();
  }

  await page.goto(
    `/verify-email?email=${encodeURIComponent(REGISTER_EMAIL)}&token=${encodeURIComponent(verificationToken)}`,
  );
  await expect(
    page.getByText(/Email đã được xác minh|email has been verified/i),
  ).toBeVisible();
  await page
    .locator("main")
    .getByRole("link", { name: /Đăng nhập|Login/i })
    .click();
  await page.getByLabel("Email").fill(REGISTER_EMAIL);
  await page.getByLabel(/Mật khẩu|Password/).fill(REGISTER_PASSWORD);
  await page.getByRole("button", { name: /Đăng nhập|Login/i }).click();
  await expect(page).toHaveURL(/\/profile$/);

  const verificationDatabase = createTestDatabase();
  try {
    const user = await verificationDatabase.user.findUnique({
      where: { email: REGISTER_EMAIL },
      include: { customer: true, role: true },
    });
    expect(user?.role.type).toBe("CUSTOMER");
    expect(user?.customer).not.toBeNull();
    expect(user?.emailVerified).not.toBeNull();
    await expect(
      verificationDatabase.verificationToken.findFirst({
        where: { identifier: emailVerificationIdentifier(REGISTER_EMAIL) },
      }),
    ).resolves.toBeNull();
  } finally {
    await verificationDatabase.$disconnect();
  }
});

test("customer consumes a reset token and signs in with the new password", async ({
  page,
}) => {
  const database = createTestDatabase();
  const identifier = `password-reset:${TEST_FIXTURES.resetEmail}`;
  try {
    await database.verificationToken.deleteMany({ where: { identifier } });
    await database.verificationToken.create({
      data: {
        identifier,
        token: createHash("sha256").update(RESET_TOKEN).digest("hex"),
        expires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
  } finally {
    await database.$disconnect();
  }

  await page.goto(
    `/reset-password?email=${encodeURIComponent(TEST_FIXTURES.resetEmail)}&token=${encodeURIComponent(RESET_TOKEN)}`,
  );
  await page.getByLabel(/Mật khẩu mới|New password/).fill(RESET_PASSWORD);
  await page
    .getByLabel(/Xác nhận mật khẩu|Confirm password/)
    .fill(RESET_PASSWORD);
  await page
    .getByRole("button", { name: /Đặt lại mật khẩu|Reset password/i })
    .click();

  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Email").fill(TEST_FIXTURES.resetEmail);
  await page.getByLabel(/Mật khẩu|Password/).fill(RESET_PASSWORD);
  await page.getByRole("button", { name: /Đăng nhập|Login/i }).click();
  await expect(page).toHaveURL(/\/profile$/);

  const verificationDatabase = createTestDatabase();
  try {
    await expect(
      verificationDatabase.verificationToken.findUnique({
        where: {
          identifier_token: {
            identifier,
            token: createHash("sha256").update(RESET_TOKEN).digest("hex"),
          },
        },
      }),
    ).resolves.toBeNull();
  } finally {
    await verificationDatabase.$disconnect();
  }
});
