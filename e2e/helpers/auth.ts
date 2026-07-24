import { expect, type Page } from "@playwright/test";
import { TEST_FIXTURES } from "../../scripts/test-db-fixtures.ts";

export async function login(
  page: Page,
  email: string,
  expectedPath: RegExp,
) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel(/Mật khẩu|Password/).fill(TEST_FIXTURES.password);
  await page.getByRole("button", { name: /Đăng nhập|Login/i }).click();
  await expect(page).toHaveURL(expectedPath);
}

export async function loginAsCustomer(page: Page) {
  await login(page, TEST_FIXTURES.customerEmail, /\/profile$/);
}

export async function loginAsAdmin(page: Page) {
  await login(page, TEST_FIXTURES.adminEmail, /\/admin$/);
}
