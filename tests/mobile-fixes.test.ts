import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("globals.css disables multi-strip slice on mobile to eliminate sub-pixel seams and fractures", async () => {
  const css = await readFile("src/app/globals.css", "utf8");
  assert.ok(
    css.includes("@media (max-width: 767px)") || css.includes("@media (max-width:767px)"),
    "globals.css must have mobile media query for slice strips",
  );
  assert.ok(
    css.includes(".fl-slice-strip:not(:first-child)") || css.includes("display: none !important"),
    "globals.css must hide non-first strips on mobile to render a seamless full-width image",
  );
});

test("ColorExplorerSection aligns color family swatches with uniform height and stable label baselines", async () => {
  const code = await readFile("src/components/features/home/ColorExplorerSection.tsx", "utf8");
  // Container must use items-start to avoid varying label heights pushing swatches out of alignment
  assert.ok(
    code.includes("items-start"),
    "Family selector container must use items-start for consistent top alignment",
  );
  // Swatches must have consistent height rather than jumping between h-12 and h-20
  assert.ok(
    !code.includes('isSelected ? "h-20" : "h-12"'),
    "Family swatches must not jump drastically between h-12 and h-20",
  );
  // Labels must have a stable min-height so 1-line and 2-line labels don't cause jagged layout
  assert.ok(
    code.includes("min-h-[2.25rem]") || code.includes("min-h-[2.5rem]") || code.includes("h-10"),
    "Family selector labels must specify a minimum height for stable baseline",
  );
});
