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
  const homeAppInlineStyles = await page.locator("[style]").evaluateAll((nodes) =>
    nodes
      // MapLibre sizes its rendering canvases at runtime. Next.js AppRouterAnnouncer
      // injects an internal live-region. Those library- and framework-owned
      // attributes do not introduce inline styles in application markup.
      .filter((node) => {
        if (node.tagName === "CANVAS" || node.tagName === "NEXT-ROUTE-ANNOUNCER" || node.id === "__next-route-announcer__") return false;
        if (node.closest?.("next-route-announcer")) return false;
        const root = typeof node.getRootNode === "function" ? node.getRootNode() : null;
        if (
          root &&
          root instanceof ShadowRoot &&
          (root.host?.tagName === "NEXT-ROUTE-ANNOUNCER" ||
            (root.host as HTMLElement)?.getAttribute?.("name") === "next-route-announcer")
        ) {
          return false;
        }
        return true;
      })
      .map((node) => ({
        tag: node.tagName,
        className: node.getAttribute("class"),
        style: node.getAttribute("style"),
      })),
  );
  expect(homeAppInlineStyles).toEqual([]);
  const homeStyleBlocks = await page.locator("style").evaluateAll((nodes) =>
    nodes.map((node) => ({
      nonce: node.getAttribute("nonce"),
      text: node.textContent,
    })),
  );
  expect(homeStyleBlocks).toEqual([]);
  const mobileMenuButton = page.locator("button.xl\\:hidden").filter({ hasText: /Danh mục|Menu/i });
  if (await mobileMenuButton.isVisible()) {
    await mobileMenuButton.click();
  }
  await expect(page.getByRole("link", { name: /Sản phẩm|Products/i }).first())
    .toBeVisible();

  await page.goto("/products");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /P1 Paint 5L|Majestic/i }).first(),
  ).toBeVisible();

  await page.goto(`/products/${P1_FIXTURES.productSlug}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const productInlineStyles = await page.locator("[style]").evaluateAll((nodes) =>
    nodes.filter((node) => {
      if (node.tagName === "CANVAS" || node.tagName === "NEXT-ROUTE-ANNOUNCER" || node.id === "__next-route-announcer__") return false;
      if (node.closest?.("next-route-announcer")) return false;
      const root = typeof node.getRootNode === "function" ? node.getRootNode() : null;
      if (
        root &&
        root instanceof ShadowRoot &&
        (root.host?.tagName === "NEXT-ROUTE-ANNOUNCER" ||
          (root.host as HTMLElement)?.getAttribute?.("name") === "next-route-announcer")
      ) {
        return false;
      }
      return true;
    }),
  );
  expect(productInlineStyles).toHaveLength(0);
  await expect(
    page
      .getByTestId("product-buy-now")
      .or(
        page
          .locator("main")
          .getByRole("button", { name: /Mua ngay|Buy now/i })
          .first(),
      ),
  ).toBeVisible();

  await page.goto("/color-visualizer");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15000 });
  await page.goto("/find-dealer");
  await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15000 });

  await page.goto("/login");
  await expect(page.getByLabel("Email")).toBeVisible({ timeout: 15000 });
  await expect(page.getByLabel(/Mật khẩu|Password/)).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("button", { name: /Đăng nhập|Login/i })).toBeEnabled({ timeout: 15000 });
  await page.getByLabel("Email").fill("missing@example.com");
  await page.getByLabel(/Mật khẩu|Password/).fill("Wrong-password-1");
  await page.getByRole("button", { name: /Đăng nhập|Login/i }).click();
  await expect(
    page
      .getByTestId("login-error")
      .or(
        page
          .locator("main")
          .getByRole("alert")
          .filter({ hasText: /invalid|incorrect|không đúng|thất bại/i }),
      ),
  ).toBeVisible({ timeout: 15000 });
  const loginInlineStyles = await page.locator("[style]").evaluateAll((nodes) =>
    nodes.filter((node) => {
      if (node.tagName === "CANVAS" || node.tagName === "NEXT-ROUTE-ANNOUNCER" || node.id === "__next-route-announcer__") return false;
      if (node.closest?.("next-route-announcer")) return false;
      const root = typeof node.getRootNode === "function" ? node.getRootNode() : null;
      if (
        root &&
        root instanceof ShadowRoot &&
        (root.host?.tagName === "NEXT-ROUTE-ANNOUNCER" ||
          (root.host as HTMLElement)?.getAttribute?.("name") === "next-route-announcer")
      ) {
        return false;
      }
      return true;
    }),
  );
  expect(loginInlineStyles).toHaveLength(0);
  expect(cspErrors).toEqual([]);
});
