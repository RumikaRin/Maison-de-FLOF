/**
 * Drift gate between design.md (the locked system) and its implementation.
 *
 * design.md is the rule; globals.css and tailwind.config.ts are the
 * implementation. When they disagree, this fails rather than letting a page
 * silently reference a token that does not exist.
 */

import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = path.join(import.meta.dirname, "..");
const DESIGN_MD = readFileSync(path.join(ROOT, "design.md"), "utf8");
const GLOBALS_CSS = readFileSync(path.join(ROOT, "src", "app", "globals.css"), "utf8");
const TAILWIND_CONFIG = readFileSync(path.join(ROOT, "tailwind.config.ts"), "utf8");
const EDITORIAL_DIR = path.join(ROOT, "src", "components", "ui", "editorial");

function declaredTokenNames(source: string): Set<string> {
  return new Set([...source.matchAll(/--(fl-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
}

function readFilesRecursively(dir: string): { file: string; content: string }[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return readFilesRecursively(full);
    return [{ file: path.relative(ROOT, full), content: readFileSync(full, "utf8") }];
  });
}

test("every token documented in design.md is declared in globals.css", () => {
  const documented = declaredTokenNames(DESIGN_MD);
  const implemented = declaredTokenNames(GLOBALS_CSS);

  assert.ok(documented.size > 30, `design.md should document the full token set, found ${documented.size}`);

  const missing = [...documented].filter((token) => !implemented.has(token));
  assert.deepEqual(missing, [], `tokens in design.md but not in globals.css: ${missing.join(", ")}`);
});

test("globals.css declares no --fl-* token that design.md does not document", () => {
  const documented = declaredTokenNames(DESIGN_MD);
  const implemented = declaredTokenNames(GLOBALS_CSS);

  const undocumented = [...implemented].filter((token) => !documented.has(token));
  assert.deepEqual(
    undocumented,
    [],
    `tokens in globals.css but not in design.md: ${undocumented.join(", ")}`,
  );
});

test("no --fl-* token is redefined under .dark — public surfaces are light-only", () => {
  // design.md § Colour mode. Everything after the `.dark {` block up to its
  // closing brace must not touch the atelier tokens.
  const darkBlock = GLOBALS_CSS.match(/\.dark\s*\{([\s\S]*?)\n\s*\}/);
  assert.ok(darkBlock, "expected a .dark token block to still exist for /admin");
  assert.equal(
    /--fl-/.test(darkBlock[1]),
    false,
    "the .dark block must not redefine --fl-* tokens",
  );
});

test("tailwind exposes the atelier namespace without self-referencing CSS variables", () => {
  // addVariablesForColors emits `--<key>: <value>`. A key named `fl-paper` whose
  // value is `var(--fl-paper)` would produce a circular declaration.
  assert.match(TAILWIND_CONFIG, /atelier:\s*\{/, "expected an `atelier` colour namespace");

  const selfReferencing = [
    ...TAILWIND_CONFIG.matchAll(/"?([a-z0-9-]+)"?:\s*"var\(--([a-z0-9-]+)\)"/g),
  ].filter(([, key, variable]) => key === variable);

  assert.deepEqual(
    selfReferencing.map(([match]) => match),
    [],
    "a Tailwind colour key must not share its name with the --* variable it points at",
  );
});

test("editorial primitives reference tokens by name, never inline colour values", () => {
  const inlineColour = /(?:#[0-9a-fA-F]{3,8}\b|\boklch\(|\brgba?\()/;

  for (const { file, content } of readFilesRecursively(EDITORIAL_DIR)) {
    const offending = content
      .split("\n")
      .map((line, index) => ({ line, number: index + 1 }))
      // SwatchChip legitimately paints a caller-supplied paint value, and the
      // selected/hover rings are the two shadows design.md permits.
      .filter(({ line }) => inlineColour.test(line) && !line.includes("rgb(0_0_0/0.08)"));

    assert.deepEqual(
      offending.map(({ number, line }) => `${file}:${number} ${line.trim()}`),
      [],
      `${file} must reference --fl-* tokens, not inline colour values`,
    );
  }
});

test("drench bands never dim their own text with an opacity utility", () => {
  // The contrast gate measures token pairs. An `opacity-*` utility on text
  // inside a band blends the ink toward the band colour at render time, which
  // the gate cannot see — axe caught 13 such nodes at 3.51-4.47:1 against a
  // 4.5:1 floor. Hierarchy inside a band comes from size and case, not alpha.
  const bandFiles = [
    "src/components/features/home/VisualizerPromoSection.tsx",
    "src/components/features/home/ExpertBlogsSection.tsx",
    "src/components/features/home/HomeClient.tsx",
    "src/app/find-dealer/page.tsx",
    "src/components/features/visualizer/VisualizerClient.tsx",
  ];

  for (const file of bandFiles) {
    const content = readFileSync(path.join(ROOT, file), "utf8");
    const offenders = content
      .split("\n")
      .map((line, index) => ({ line: line.trim(), number: index + 1 }))
      // `active:opacity-80` and `group-hover:opacity-*` are interaction states,
      // not a resting contrast reduction.
      .filter(({ line }) => /(?<![-:\w])opacity-(?:[6-9][0-9])\b/.test(line));

    assert.deepEqual(
      offenders.map(({ number, line }) => `${file}:${number} ${line.slice(0, 90)}`),
      [],
      `${file} dims text inside a colour-drench band — see design.md § Theme`,
    );
  }

  const css = GLOBALS_CSS;
  const drenchLabel = css.match(/\.fl-drench \.fl-label \{([\s\S]*?)\}/);
  assert.ok(drenchLabel, "expected a .fl-drench .fl-label rule");
  assert.equal(
    /opacity\s*:/.test(drenchLabel[1]),
    false,
    ".fl-drench .fl-label must not set opacity — it drops 11px metadata below AA",
  );
});

test("no public control collapses below the 24px target-size floor", () => {
  // WCAG 2.2 target size (minimum) is 24x24. `md:min-h-0` reverted controls to
  // bare text height on desktop, which axe reported at 18.8px.
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) {
        if (entry === "admin") continue;
        walk(full);
        continue;
      }
      if (!entry.endsWith(".tsx")) continue;
      const content = readFileSync(full, "utf8");
      if (content.includes("md:min-h-0")) offenders.push(path.relative(ROOT, full));
    }
  };
  walk(path.join(ROOT, "src"));

  assert.deepEqual(offenders, [], "these files collapse a control below 24px on desktop");
});

test("editorial primitives do not use the retired slop utilities", () => {
  const retired = [
    "bezel-outer",
    "bezel-inner",
    "btn-island",
    "eyebrow-pill",
    "animate-aurora",
    "animate-float",
    "aurora-background",
  ];

  for (const { file, content } of readFilesRecursively(EDITORIAL_DIR)) {
    for (const utility of retired) {
      assert.equal(
        content.includes(utility),
        false,
        `${file} uses retired utility "${utility}" — see design.md § Notes`,
      );
    }
  }
});
