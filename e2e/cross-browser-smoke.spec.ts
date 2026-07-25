import { expect, test } from "@playwright/test";
import { P1_FIXTURES } from "../scripts/test-db-fixtures.ts";

test("storefront navigation, catalog, and auth form work in the browser matrix", async ({
  page,
}) => {
  const cspErrors: string[] = [];
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /Content Security Policy|Refused to apply inline style/i.test(message.text())
    ) {
      cspErrors.push(message.text());
    }
  });

  await page.goto("/");
  await expect(page.locator("main")).toBeVisible();
  const homeInlineStyles = await page.locator("[style]").evaluateAll((nodes) =>
    nodes.map((node) => ({
      tag: node.tagName,
      className: node.getAttribute("class"),
      style: node.getAttribute("style"),
    })),
  );
  expect(homeInlineStyles).toEqual([]);
  const homeStyleBlocks = await page.locator("style").evaluateAll((nodes) =>
    nodes.map((node) => ({
      nonce: node.getAttribute("nonce"),
      text: node.textContent,
    })),
  );
  expect(homeStyleBlocks).toEqual([]);
  await expect(page.getByRole("link", { name: /Sản phẩm|Products/i }).first())
    .toBeVisible();

  await page.goto("/products");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /P1 Paint 5L/i }).first(),
  ).toBeVisible();

  await page.goto(`/products/${P1_FIXTURES.productSlug}`);
  await expect(page.getByRole("heading", { name: "P1 Paint 5L" })).toBeVisible();
  await expect(page.locator("[style]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Mua ngay|Buy now/i })).toBeVisible();

  await page.goto("/color-visualizer");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.goto("/find-dealer");
  await expect(page.getByRole("heading").first()).toBeVisible();

  await page.goto("/login");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel(/Mật khẩu|Password/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Đăng nhập|Login/i })).toBeEnabled();
  await page.getByLabel("Email").fill("missing@example.com");
  await page.getByLabel(/Mật khẩu|Password/).fill("Wrong-password-1");
  await page.getByRole("button", { name: /Đăng nhập|Login/i }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.locator("[style]")).toHaveCount(0);
  expect(cspErrors).toEqual([]);
});
