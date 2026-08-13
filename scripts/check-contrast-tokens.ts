/**
 * Contrast gate for the Atelier Editorial design system.
 *
 * Parses the `--fl-*` OKLCH tokens straight out of `src/app/globals.css` (so the
 * stylesheet stays the single source of truth) and asserts every ink/surface
 * pairing declared in `design.md` against the WCAG AA floor:
 *
 *   - body text        >= 4.5:1
 *   - large display    >= 3.0:1
 *   - focus ring / UI  >= 3.0:1
 *
 * Every colour-drench band is checked with its paired ink, because a band that
 * looks good and fails AA is the failure mode this system is most exposed to.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CSS_PATH = path.join(HERE, "..", "src", "app", "globals.css");

type Oklch = { l: number; c: number; h: number; alpha: number };

const TOKEN_PATTERN =
  /--(fl-[a-z0-9-]+)\s*:\s*oklch\(\s*([0-9.]+)%\s+([0-9.]+)\s+([0-9.]+)\s*(?:\/\s*([0-9.]+)\s*)?\)/g;

function parseTokens(css: string): Map<string, Oklch> {
  const tokens = new Map<string, Oklch>();
  for (const match of css.matchAll(TOKEN_PATTERN)) {
    const [, name, l, c, h, alpha] = match;
    tokens.set(name, {
      l: Number(l) / 100,
      c: Number(c),
      h: Number(h),
      alpha: alpha === undefined ? 1 : Number(alpha),
    });
  }
  return tokens;
}

/** OKLCH -> OKLab -> linear sRGB, per the CSS Color 4 conversion matrices. */
function oklchToLinearSrgb({ l, c, h }: Oklch): [number, number, number] {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const lp = l + 0.3963377774 * a + 0.2158037573 * b;
  const mp = l - 0.1055613458 * a - 0.0638541728 * b;
  const sp = l - 0.0894841775 * a - 1.291485548 * b;

  const lc = lp ** 3;
  const mc = mp ** 3;
  const sc = sp ** 3;

  return [
    4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc,
    -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc,
    -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc,
  ];
}

/** WCAG 2.x relative luminance. Linear sRGB is already the right space. */
function relativeLuminance(color: Oklch): number {
  const [r, g, b] = oklchToLinearSrgb(color).map((v) => Math.min(1, Math.max(0, v)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: Oklch, b: Oklch): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

type Requirement = "body" | "large" | "ui";
const FLOOR: Record<Requirement, number> = { body: 4.5, large: 3, ui: 3 };

type Pair = {
  fg: string;
  bg: string;
  requirement: Requirement;
  note: string;
};

/** Every pairing `design.md` permits. Anything not listed here is not allowed. */
const PAIRS: Pair[] = [
  // Paper surfaces
  { fg: "fl-ink", bg: "fl-paper", requirement: "body", note: "body on paper" },
  { fg: "fl-ink", bg: "fl-paper-2", requirement: "body", note: "body on recessed panel" },
  { fg: "fl-ink", bg: "fl-paper-3", requirement: "body", note: "body on input well" },
  { fg: "fl-ink-2", bg: "fl-paper", requirement: "body", note: "supporting copy on paper" },
  { fg: "fl-ink-2", bg: "fl-paper-2", requirement: "body", note: "supporting copy on panel" },
  { fg: "fl-ink-3", bg: "fl-paper", requirement: "large", note: "metadata / disabled on paper" },

  // Action
  { fg: "fl-accent", bg: "fl-paper", requirement: "body", note: "teal link on paper" },
  { fg: "fl-accent", bg: "fl-paper-2", requirement: "body", note: "teal link on panel" },
  { fg: "fl-accent-ink", bg: "fl-accent", requirement: "body", note: "label on solid teal" },
  { fg: "fl-accent-ink", bg: "fl-accent-hover", requirement: "body", note: "label on teal hover" },
  { fg: "fl-focus", bg: "fl-paper", requirement: "ui", note: "focus ring on paper" },
  { fg: "fl-focus", bg: "fl-paper-2", requirement: "ui", note: "focus ring on panel" },

  // Feedback
  { fg: "fl-danger", bg: "fl-paper", requirement: "body", note: "error text on paper" },
  { fg: "fl-success", bg: "fl-paper", requirement: "body", note: "success text on paper" },

  // Espresso field
  { fg: "fl-on-dark", bg: "fl-espresso", requirement: "body", note: "body on espresso" },

  // Colour-drench bands, each with its paired ink
  { fg: "fl-on-dark", bg: "fl-drench-sage", requirement: "body", note: "body on sage band" },
  { fg: "fl-on-dark", bg: "fl-drench-clay", requirement: "body", note: "body on clay band" },
  { fg: "fl-on-dark", bg: "fl-drench-slate", requirement: "body", note: "body on slate band" },
  { fg: "fl-espresso", bg: "fl-drench-ochre", requirement: "body", note: "body on ochre band" },

  // A band's focus ring uses its own ink, not teal.
  { fg: "fl-on-dark", bg: "fl-drench-sage", requirement: "ui", note: "focus ring on sage band" },
  { fg: "fl-on-dark", bg: "fl-drench-clay", requirement: "ui", note: "focus ring on clay band" },
  { fg: "fl-on-dark", bg: "fl-drench-slate", requirement: "ui", note: "focus ring on slate band" },
  { fg: "fl-espresso", bg: "fl-drench-ochre", requirement: "ui", note: "focus ring on ochre band" },
];

function main(): void {
  const tokens = parseTokens(readFileSync(CSS_PATH, "utf8"));
  if (tokens.size === 0) {
    console.error(`No --fl-* OKLCH tokens found in ${CSS_PATH}.`);
    process.exit(1);
  }

  const failures: string[] = [];
  const rows: string[] = [];

  for (const pair of PAIRS) {
    const fg = tokens.get(pair.fg);
    const bg = tokens.get(pair.bg);
    if (!fg || !bg) {
      failures.push(`missing token: ${!fg ? `--${pair.fg}` : `--${pair.bg}`} (${pair.note})`);
      continue;
    }
    const ratio = contrastRatio(fg, bg);
    const floor = FLOOR[pair.requirement];
    const ok = ratio >= floor;
    rows.push(
      `${ok ? "pass" : "FAIL"}  ${ratio.toFixed(2).padStart(5)}:1  (min ${floor.toFixed(1)})  ${pair.note}`,
    );
    if (!ok) {
      failures.push(
        `${pair.note}: --${pair.fg} on --${pair.bg} is ${ratio.toFixed(2)}:1, needs ${floor.toFixed(1)}:1`,
      );
    }
  }

  console.log(`Atelier contrast gate — ${PAIRS.length} pairings, ${tokens.size} tokens parsed\n`);
  console.log(rows.join("\n"));

  if (failures.length > 0) {
    console.error(`\n${failures.length} pairing(s) below the AA floor:\n`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }

  console.log("\nAll pairings meet the AA floor.");
}

main();
