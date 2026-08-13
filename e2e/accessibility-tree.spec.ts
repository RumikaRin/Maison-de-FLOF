import { expect, test } from "@playwright/test";

type AXNode = {
  role?: { value?: string };
  name?: { value?: string };
  ignored?: boolean;
};

test("primary storefront exposes named landmarks and controls in Chromium AX tree", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "CDP accessibility tree is Chromium-only");
  await page.goto("/products");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const session = await page.context().newCDPSession(page);
  const tree = await session.send("Accessibility.getFullAXTree") as {
    nodes: AXNode[];
  };
  const exposed = tree.nodes.filter((node) => !node.ignored);
  const roles = exposed.map((node) => node.role?.value);
  const namedLinks = exposed.filter(
    (node) => node.role?.value === "link" && Boolean(node.name?.value),
  );
  const namedButtons = exposed.filter(
    (node) => node.role?.value === "button" && Boolean(node.name?.value),
  );

  expect(roles).toContain("main");
  expect(roles).toContain("heading");
  expect(namedLinks.length).toBeGreaterThan(3);
  expect(namedButtons.length).toBeGreaterThan(0);
});

test("login controls expose accessible names in Chromium AX tree", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "CDP accessibility tree is Chromium-only");
  await page.goto("/login");
  await expect(page.getByLabel("Email")).toBeVisible();
  const session = await page.context().newCDPSession(page);
  const document = await session.send("DOM.getDocument") as {
    root: { nodeId: number };
  };
  async function getControl(selector: string) {
    const selected = await session.send("DOM.querySelector", {
      nodeId: document.root.nodeId,
      selector,
    }) as { nodeId: number };
    const tree = await session.send("Accessibility.getPartialAXTree", {
      nodeId: selected.nodeId,
      fetchRelatives: false,
    }) as {
      nodes: AXNode[];
    };
    return tree.nodes.find((node) => !node.ignored);
  }
  const email = await getControl('input[type="email"]');
  const password = await getControl('input[type="password"]');
  const submit = await getControl('button[type="submit"]');

  expect(email?.role?.value).toBe("textbox");
  expect(email?.name?.value).toMatch(/^email$/i);
  expect(password?.name?.value).toMatch(/Mật khẩu|Password/i);
  expect(submit?.name?.value).toMatch(/Đăng nhập|Login/i);
});
