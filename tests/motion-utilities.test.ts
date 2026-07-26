import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import test from "node:test";

test("globals.css contains the motion-upgrade utilities", async () => {
  const css = await readFile("src/app/globals.css", "utf8");
  for (const needle of [
    "--fl-dur-reveal",
    ".fl-letters",
    ".fl-mask-line",
    ".fl-stagger",
    ".fl-blurup",
    ".fl-curtain-l",
    ".fl-curtain-u",
    ".fl-curtain-x",
    ".fl-rule-draw",
    ".fl-photo-zoomout",
    ".fl-band-grow",
    ".fl-slice-strip",
    ".fl-draw",
  ]) {
    assert.ok(css.includes(needle), `missing ${needle}`);
  }
});

test("motion-upgrade block never uses an anonymous view() timeline", async () => {
  const css = await readFile("src/app/globals.css", "utf8");
  const marker = css.indexOf("Motion upgrade");
  assert.ok(marker !== -1, "motion-upgrade block missing");
  const block = css.slice(marker);
  // Declaration usage only — the `@supports (animation-timeline: view())`
  // feature-detect query is legitimate and must not trip this gate.
  assert.ok(
    !/(?<!@supports \()animation-timeline:\s*view\(/.test(block),
    "anonymous view() declaration found — must use a named view timeline",
  );
});

test("motion runtime modules exist", async () => {
  await access("src/lib/fl-reveal.ts");
  await access("src/lib/fl-slice.ts");
});
