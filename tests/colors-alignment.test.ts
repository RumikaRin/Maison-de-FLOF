import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("ColorExplorerSection on homepage uses uniform swatch height and equalized label height", async () => {
  const code = await readFile("src/components/features/home/ColorExplorerSection.tsx", "utf8");
  // Swatches must have a consistent height, e.g. h-14, instead of jumping between h-12 and h-20
  assert.ok(
    !code.includes('isSelected ? "h-16') && !code.includes('isSelected ? "h-20'),
    "Homepage color swatches must not jump in height when selected",
  );
  assert.ok(
    code.includes("h-10") || code.includes("min-h-[2.5rem]"),
    "Homepage color labels must have equalized height (e.g. h-10)",
  );
});

test("ColorsClient on catalog page uses uniform swatch height and equalized label height", async () => {
  const code = await readFile("src/components/features/colors/ColorsClient.tsx", "utf8");
  assert.ok(
    !code.includes('isSelected ? "h-20" : "h-12"'),
    "Catalog color swatches must not jump between h-12 and h-20",
  );
  assert.ok(
    code.includes("h-10") || code.includes("min-h-[2.5rem]"),
    "Catalog color labels must have equalized height (e.g. h-10)",
  );
  assert.ok(
    code.includes("data-lenis-prevent"),
    "Catalog color selector must have data-lenis-prevent for horizontal scrolling",
  );
});
