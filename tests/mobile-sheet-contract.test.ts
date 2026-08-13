import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const file = path.join(
  import.meta.dirname,
  "..",
  "src",
  "components",
  "ui",
  "mobile-sheet.tsx",
);

test("MobileSheet owns dialog semantics, focus return, scroll lock, and reduced-motion-safe animation", () => {
  const source = readFileSync(file, "utf8");

  for (const requirement of [
    "aria-modal=\"true\"",
    "role=\"dialog\"",
    "document.body.style.overflow",
    "previousFocus",
    "event.key === \"Escape\"",
    "prefers-reduced-motion",
  ]) {
    assert.match(
      source,
      new RegExp(requirement.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});
