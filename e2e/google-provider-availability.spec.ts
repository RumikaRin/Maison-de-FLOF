import { expect, test } from "@playwright/test";

test("credential-only deployments do not advertise Google OAuth", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Google" })).toHaveCount(0);

  await page.goto("/register");
  await expect(page.getByRole("button", { name: "Google" })).toHaveCount(0);
});
