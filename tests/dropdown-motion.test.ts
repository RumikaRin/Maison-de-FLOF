import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("globals.css defines fl-mega-panel with entry, exit, and visibility transitions", async () => {
  const css = await readFile("src/app/globals.css", "utf8");
  for (const needle of [
    ".fl-mega-panel",
    ".fl-mega-panel.is-open",
    "fl-item-reveal",
    "visibility",
    "pointer-events",
  ]) {
    assert.ok(css.includes(needle), `missing ${needle} in globals.css`);
  }
});

test("Header.tsx uses fl-mega-panel and does not use hidden attribute for mega panel", async () => {
  const header = await readFile("src/components/layout/Header.tsx", "utf8");
  assert.ok(header.includes("fl-mega-panel"), "Header.tsx must use fl-mega-panel class");
  assert.ok(!header.includes("hidden={!open}"), "Header.tsx must not abruptly hide panel with hidden attribute");
  assert.ok(header.includes("fl-panel-col-1"), "Header.tsx must include staggered column classes");
});
