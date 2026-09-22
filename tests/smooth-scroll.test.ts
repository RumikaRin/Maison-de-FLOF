import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import test from "node:test";

test("lenis dependency exists in package.json", async () => {
  const pkg = JSON.parse(await readFile("package.json", "utf8"));
  assert.ok(
    pkg.dependencies && pkg.dependencies.lenis,
    "lenis must be in package.json dependencies",
  );
});

test("globals.css contains Lenis smooth scroll classes", async () => {
  const css = await readFile("src/app/globals.css", "utf8");
  for (const needle of [
    "html.lenis",
    ".lenis.lenis-smooth",
    "[data-lenis-prevent]",
    ".lenis.lenis-stopped",
  ]) {
    assert.ok(css.includes(needle), `missing ${needle} in globals.css`);
  }
});

test("SmoothScrollProvider module exists", async () => {
  await access("src/providers/smooth-scroll-provider.tsx");
});

test("SmoothScrollProvider supports dynamic import and reduced motion", async () => {
  const code = await readFile("src/providers/smooth-scroll-provider.tsx", "utf8");
  assert.ok(code.includes('"use client"'), "must be client component");
  assert.ok(code.includes("prefers-reduced-motion"), "must check reduced motion");
  assert.ok(code.includes('import("lenis")'), "must dynamically import lenis");
});

test("ScrollToTop uses scrollToTopLenis", async () => {
  const code = await readFile("src/components/ui/scroll-to-top.tsx", "utf8");
  assert.ok(code.includes("scrollToTopLenis"), "ScrollToTop must use scrollToTopLenis");
});

test("drawers and modal containers isolate scrolling with data-lenis-prevent", async () => {
  let colorDrawer = await readFile("src/components/ui/color-detail-drawer.tsx", "utf8");
  if (colorDrawer.includes("from")) {
    colorDrawer = await readFile("src/components/features/colors/color-detail-drawer.tsx", "utf8");
  }
  const mobileSheet = await readFile("src/components/ui/mobile-sheet.tsx", "utf8");
  assert.ok(colorDrawer.includes("data-lenis-prevent"), "color-detail-drawer must have data-lenis-prevent");
  assert.ok(mobileSheet.includes("data-lenis-prevent"), "mobile-sheet must have data-lenis-prevent");
});
