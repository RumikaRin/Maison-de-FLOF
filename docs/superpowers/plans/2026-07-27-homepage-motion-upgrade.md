# Homepage Motion Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved motion system (spec: `docs/superpowers/specs/2026-07-27-homepage-motion-upgrade-design.md`) on the homepage: letter cascade, masked rises, staggered lists, blur-up cards, directional curtains, mosaic, scroll zoom-out, band-grow, slice drift, underline draw, ornaments O1/O2/O3, and the adapted DotField (O5/O6).

**Architecture:** CSS-only utilities appended to `globals.css` (double-gated by `html.fl-js` + `prefers-reduced-motion`), driven by two tiny dependency-free modules — `fl-reveal.ts` (IntersectionObserver class toggler) and `fl-slice.ts` (scroll-velocity CSSOM writer) — plus three small components (`CascadeText`, `SliceImage`, adapted `DotField`). Scroll-linked effects use **named** view timelines only (anonymous `view()` inside an `overflow: hidden` plate binds to the plate itself and pins at 50% — bug class already fixed once in this repo).

**Tech Stack:** Next.js 15 App Router, Tailwind, plain CSS in `src/app/globals.css`, `node --test` for unit gates, Playwright-core scratch scripts for browser verification.

**Hard constraints (violating any of these fails CI):**
- No `style={{...}}` in any `.tsx` under `src/` (`tests/no-inline-style.test.ts` scans for it). Runtime `element.style.setProperty` from `.ts` modules is allowed (CSSOM is CSP-exempt).
- No `<motion.` elements.
- Animate only `transform`, `opacity`, `clip-path`, `stroke-dashoffset`, and entrance-only `filter: blur(≤8px)`.
- Admin surfaces untouched. Bundle budgets: shared 115 KiB, route 210 KiB.
- Commit after every task. Run `npm run lint && npm run typecheck` before every commit; run `npm test` where the task says so.

---

### Task 1: Test scaffold for the new motion layer

**Files:**
- Create: `tests/motion-utilities.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
  assert.ok(
    !/animation-timeline:\s*view\(/.test(block),
    "anonymous view() found — must use a named view timeline",
  );
});

test("motion runtime modules exist", async () => {
  await access("src/lib/fl-reveal.ts");
  await access("src/lib/fl-slice.ts");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx tsx --test tests/motion-utilities.test.ts` (or `npm test` — same runner)
Expected: FAIL — `missing --fl-dur-reveal` and `motion runtime modules exist` fails.

- [ ] **Step 3: Commit the red test**

```bash
git add tests/motion-utilities.test.ts
git commit -m "test: add failing gate for homepage motion utilities"
```

---

### Task 2: CSS foundation — entrance utilities (M1–M6) + scroll-linked (M7–M8) + slice + ornament draw

**Files:**
- Modify: `src/app/globals.css` — append the whole block below **at the end of the file** (after the `next-route-announcer` rules).

- [ ] **Step 1: Append the motion-upgrade block**

```css
/* --- Motion upgrade — spec: docs/superpowers/specs/2026-07-27-homepage-motion-upgrade-design.md
   Entrance from-states are double-gated: `html.fl-js` (added by fl-reveal on
   mount) AND prefers-reduced-motion: no-preference. No JS, or reduced motion,
   means no from-state ever applies — the page renders fully settled.
   Scroll-linked utilities additionally sit behind @supports and use NAMED
   view timelines only (anonymous view() inside an overflow-hidden plate binds
   to the plate itself and pins at 50% — see the .fl-photo-plate note above). */

:root {
  /* Reveal-length duration for curtains/masks. The three design.md duration
     tokens top out at 360ms, which reads abrupt on a 700px image plate. */
  --fl-dur-reveal: 640ms;
}

/* M1 · Hero letter cascade — load-once, pure CSS, no JS gate (must play even
   before hydration). CascadeText renders one span per letter. */
@media (prefers-reduced-motion: no-preference) {
  @keyframes fl-letter-in {
    from { opacity: 0; transform: translateY(0.5em); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fl-letters > span {
    display: inline-block;
    animation: fl-letter-in var(--fl-dur-slow) var(--fl-ease-out) both;
  }
  .fl-letters > span:nth-child(1) { animation-delay: 55ms; }
  .fl-letters > span:nth-child(2) { animation-delay: 110ms; }
  .fl-letters > span:nth-child(3) { animation-delay: 165ms; }
  .fl-letters > span:nth-child(4) { animation-delay: 220ms; }
  .fl-letters > span:nth-child(5) { animation-delay: 275ms; }
  .fl-letters > span:nth-child(6) { animation-delay: 330ms; }
  .fl-letters > span:nth-child(7) { animation-delay: 385ms; }
  .fl-letters > span:nth-child(8) { animation-delay: 440ms; }
  .fl-letters > span:nth-child(9) { animation-delay: 495ms; }
  .fl-letters > span:nth-child(10) { animation-delay: 550ms; }
  .fl-letters > span:nth-child(11) { animation-delay: 605ms; }
  .fl-letters > span:nth-child(12) { animation-delay: 660ms; }
  .fl-letters > span:nth-child(13) { animation-delay: 715ms; }
  .fl-letters > span:nth-child(14) { animation-delay: 770ms; }
  .fl-letters > span:nth-child(15) { animation-delay: 825ms; }
  .fl-letters > span:nth-child(16) { animation-delay: 880ms; }
  .fl-letters > span:nth-child(17) { animation-delay: 935ms; }
  .fl-letters > span:nth-child(18) { animation-delay: 990ms; }
  .fl-letters > span:nth-child(19) { animation-delay: 1045ms; }
  .fl-letters > span:nth-child(20) { animation-delay: 1100ms; }
  .fl-letters > span:nth-child(21) { animation-delay: 1155ms; }
  .fl-letters > span:nth-child(22) { animation-delay: 1210ms; }
  .fl-letters > span:nth-child(23) { animation-delay: 1265ms; }
  .fl-letters > span:nth-child(24) { animation-delay: 1320ms; }
  .fl-letters > span:nth-child(25) { animation-delay: 1375ms; }
  .fl-letters > span:nth-child(26) { animation-delay: 1430ms; }
  .fl-letters > span:nth-child(27) { animation-delay: 1485ms; }
  .fl-letters > span:nth-child(28) { animation-delay: 1540ms; }
  /* Opts an element out of the .fl-hero-cascade line animation so the letter
     cascade is the only motion it carries. */
  .fl-hero-cascade > .fl-cascade-skip { animation: none; }
}

/* M2–M6 · IO entrances. `[data-fl-io]` marks the cluster root; fl-reveal adds
   `.is-in` once. Rest states are the defaults; from-states only exist under
   the double gate. */
.fl-mask-line { overflow: hidden; }
.fl-curtain-l, .fl-curtain-u, .fl-curtain-x { clip-path: inset(0); }

@media (prefers-reduced-motion: no-preference) {
  .fl-js [data-fl-io] .fl-mask-line > * {
    transition: transform var(--fl-dur-reveal) var(--fl-ease-out);
  }
  .fl-js [data-fl-io] .fl-stagger > * {
    transition:
      opacity var(--fl-dur-slow) var(--fl-ease-out),
      transform var(--fl-dur-slow) var(--fl-ease-out),
      filter var(--fl-dur-reveal) var(--fl-ease-out);
  }
  .fl-js [data-fl-io] .fl-stagger > :nth-child(2) { transition-delay: 120ms; }
  .fl-js [data-fl-io] .fl-stagger > :nth-child(3) { transition-delay: 240ms; }
  .fl-js [data-fl-io] .fl-stagger > :nth-child(4) { transition-delay: 360ms; }
  .fl-js [data-fl-io] .fl-stagger > :nth-child(5) { transition-delay: 480ms; }
  .fl-js [data-fl-io] .fl-stagger > :nth-child(6) { transition-delay: 600ms; }
  .fl-js [data-fl-io] .fl-stagger > :nth-child(7) { transition-delay: 720ms; }
  .fl-js [data-fl-io] .fl-stagger > :nth-child(8) { transition-delay: 840ms; }
  .fl-js [data-fl-io] .fl-stagger > :nth-child(n + 9) { transition-delay: 900ms; }
  .fl-js [data-fl-io] .fl-blurup {
    transition:
      opacity var(--fl-dur-reveal) var(--fl-ease-out),
      transform var(--fl-dur-reveal) var(--fl-ease-out),
      filter var(--fl-dur-reveal) var(--fl-ease-out);
  }
  .fl-js .fl-curtain-l, .fl-js .fl-curtain-u, .fl-js .fl-curtain-x {
    transition: clip-path var(--fl-dur-reveal) var(--fl-ease-out);
  }
  .fl-js [data-fl-io] .fl-mosaic > :nth-child(2) { transition-delay: 120ms; }
  .fl-js [data-fl-io] .fl-mosaic > :nth-child(3) { transition-delay: 240ms; }
  .fl-js [data-fl-io] .fl-mosaic > :nth-child(4) { transition-delay: 360ms; }
  .fl-rule-draw {
    transform-origin: left;
    transition: transform var(--fl-dur-reveal) var(--fl-ease-out);
  }

  /* from-states */
  .fl-js [data-fl-io]:not(.is-in) .fl-mask-line > * { transform: translateY(112%); }
  .fl-js [data-fl-io]:not(.is-in) .fl-stagger > :not(.fl-blurup) {
    opacity: 0;
    transform: translateY(12px);
  }
  .fl-js [data-fl-io]:not(.is-in) .fl-blurup {
    opacity: 0;
    transform: translateY(16px);
    filter: blur(8px);
  }
  .fl-js [data-fl-io]:not(.is-in) .fl-curtain-l { clip-path: inset(0 100% 0 0); }
  .fl-js [data-fl-io]:not(.is-in) .fl-curtain-u { clip-path: inset(100% 0 0 0); }
  .fl-js [data-fl-io]:not(.is-in) .fl-curtain-x { clip-path: inset(0 50% 0 50%); }
  .fl-js [data-fl-io]:not(.is-in) .fl-rule-draw { transform: scaleX(0); }
}

/* M7 · Scroll zoom-out + M8 · band-grow — scroll-linked, named timelines. */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    @keyframes fl-photo-zoomout {
      from { transform: scale(1.22); }
      to { transform: scale(1); }
    }
    .fl-photo-zoomout {
      animation: fl-photo-zoomout linear both;
      animation-timeline: --fl-photo-plate;
      animation-range: cover 0% cover 85%;
    }
    @keyframes fl-photo-zoomout-soft {
      from { transform: scale(1.12); }
      to { transform: scale(1); }
    }
    .fl-photo-zoomout-soft { animation-name: fl-photo-zoomout-soft; }

    /* clip-path only — zero layout shift; content is never distorted. */
    @keyframes fl-band-grow {
      from { clip-path: inset(0 4% round 16px); }
      to { clip-path: inset(0 round 0); }
    }
    .fl-band-grow {
      view-timeline-name: --fl-band;
      animation: fl-band-grow linear both;
      animation-timeline: --fl-band;
      animation-range: entry 0% entry 100%;
    }
  }
}

/* M10 · Slice drift — 4 vertical strips of one photo. Strip offsets are
   stylesheet-only; fl-slice.ts writes a single unitless --fl-slice-v via
   CSSOM. With no JS or reduced motion the calc() collapses to 0 and the
   photo is seamless. */
.fl-slice { display: flex; }
.fl-slice-strip { position: relative; flex: 1 1 0%; overflow: hidden; }
.fl-slice-strip .fl-slice-img { width: 400%; max-width: none; left: 0; }
.fl-slice-strip:nth-child(2) .fl-slice-img { left: -100%; }
.fl-slice-strip:nth-child(3) .fl-slice-img { left: -200%; }
.fl-slice-strip:nth-child(4) .fl-slice-img { left: -300%; }
.fl-slice-strip:nth-child(1) { --fl-strip-amp: -24px; }
.fl-slice-strip:nth-child(2) { --fl-strip-amp: 18px; }
.fl-slice-strip:nth-child(3) { --fl-strip-amp: -14px; }
.fl-slice-strip:nth-child(4) { --fl-strip-amp: 22px; }

@media (prefers-reduced-motion: no-preference) {
  .fl-js .fl-slice-strip {
    transform: translateY(calc(var(--fl-slice-v, 0) * var(--fl-strip-amp)));
    will-change: transform;
  }
  .fl-js [data-fl-io]:not(.is-in) .fl-slice-strip { opacity: 0; }
  /* Entrance is a one-shot keyframe (not a transition) so later --fl-slice-v
     updates apply instantly instead of lagging behind a 640ms transition. */
  @keyframes fl-strip-in {
    from { opacity: 0; transform: translateY(var(--fl-strip-amp)); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fl-js [data-fl-io].is-in .fl-slice-strip {
    animation: fl-strip-in var(--fl-dur-reveal) var(--fl-ease-out) backwards;
  }
  .fl-js [data-fl-io].is-in .fl-slice-strip:nth-child(2) { animation-delay: 90ms; }
  .fl-js [data-fl-io].is-in .fl-slice-strip:nth-child(3) { animation-delay: 180ms; }
  .fl-js [data-fl-io].is-in .fl-slice-strip:nth-child(4) { animation-delay: 270ms; }
}

/* Ornaments · O1–O3 — decorative SVG strokes that self-draw once on entry.
   Each ornament sets --fl-draw-len per path via a scoping class. */
.fl-draw {
  stroke-dasharray: var(--fl-draw-len);
  stroke-dashoffset: 0;
}
@media (prefers-reduced-motion: no-preference) {
  .fl-js .fl-draw { transition: stroke-dashoffset 1200ms var(--fl-ease-in-out); }
  .fl-js [data-fl-io]:not(.is-in) .fl-draw { stroke-dashoffset: var(--fl-draw-len); }
  .fl-js [data-fl-io] .fl-orn-fade {
    transition: opacity var(--fl-dur-reveal) var(--fl-ease-out) 900ms;
  }
  .fl-js [data-fl-io]:not(.is-in) .fl-orn-fade { opacity: 0; }
}
.fl-orn-arc .fl-draw-outer { --fl-draw-len: 302; }
.fl-orn-arc .fl-draw-inner { --fl-draw-len: 208; }
.fl-orn-blueprint .fl-draw { --fl-draw-len: 560; }

/* M9 · Underline draw — draws from the left on hover, exits right. Replaces
   the decoration-thickness hover on TypographicLink. */
.fl-underline {
  background-image: linear-gradient(currentColor, currentColor);
  background-repeat: no-repeat;
  background-position: right bottom;
  background-size: 0% 1px;
  padding-bottom: 2px;
}
@media (prefers-reduced-motion: no-preference) {
  .fl-underline { transition: background-size var(--fl-dur-base) var(--fl-ease-out); }
}
.group:hover .fl-underline,
.group:focus-visible .fl-underline {
  background-position: left bottom;
  background-size: 100% 1px;
}
```

- [ ] **Step 2: Create empty runtime modules so the file-existence test can pass later** — skip; they are Task 3/5. Instead run only the CSS tests now:

Run: `npx tsx --test tests/motion-utilities.test.ts`
Expected: first two tests PASS, `motion runtime modules exist` still FAILS (modules come in Tasks 3 and 5).

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add motion-upgrade CSS utilities (M1-M10, ornament draw)"
```

---

### Task 3: `fl-reveal.ts` orchestrator + mount + `fl-slice.ts` math core

**Files:**
- Create: `src/lib/fl-reveal.ts`
- Create: `src/lib/fl-slice.ts`
- Create: `tests/fl-slice-math.test.ts`
- Modify: `src/components/features/home/HomeClient.tsx`

- [ ] **Step 1: Write the failing math test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { clampVelocity, decayVelocity } from "../src/lib/fl-slice";

test("clampVelocity maps pixel deltas into [-1, 1]", () => {
  assert.equal(clampVelocity(0), 0);
  assert.equal(clampVelocity(60), 1);
  assert.equal(clampVelocity(-600), -1);
  assert.ok(Math.abs(clampVelocity(30) - 0.5) < 1e-9);
});

test("decayVelocity lerps toward target and snaps to zero below epsilon", () => {
  const v1 = decayVelocity(0, 1);
  assert.ok(v1 > 0 && v1 < 1);
  assert.equal(decayVelocity(0.0005, 0), 0);
  let v = 1;
  for (let i = 0; i < 200; i++) v = decayVelocity(v, 0);
  assert.equal(v, 0);
});
```

- [ ] **Step 2: Run to verify it fails** — `npx tsx --test tests/fl-slice-math.test.ts` → FAIL (module not found).

- [ ] **Step 3: Create `src/lib/fl-slice.ts`**

```ts
/* Slice-drift runtime (spec M10). Pure math is exported for unit tests; the
   DOM part writes exactly one custom property per plate via CSSOM, which the
   production CSP permits (style-src-attr blocks parsed attributes, not CSSOM). */

export function clampVelocity(deltaPx: number, maxPx = 60): number {
  return Math.max(-1, Math.min(1, deltaPx / maxPx));
}

export function decayVelocity(
  current: number,
  target: number,
  lerp = 0.14,
  epsilon = 0.001,
): number {
  const next = current + (target - current) * lerp;
  return Math.abs(next) < epsilon && Math.abs(target) < epsilon ? 0 : next;
}

export function initFlSlice(): () => void {
  if (typeof window === "undefined") return () => {};
  const plates = Array.from(
    document.querySelectorAll<HTMLElement>("[data-fl-slice]"),
  );
  if (!plates.length) return () => {};
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  const visible = new Set<HTMLElement>();
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const el = entry.target as HTMLElement;
      if (entry.isIntersecting) visible.add(el);
      else {
        visible.delete(el);
        el.style.setProperty("--fl-slice-v", "0");
      }
    }
  });
  plates.forEach((plate) => io.observe(plate));

  let lastY = window.scrollY;
  let value = 0;
  let target = 0;
  let raf = 0;
  let running = false;

  const step = () => {
    value = decayVelocity(value, target);
    target *= 0.82;
    for (const plate of visible) {
      plate.style.setProperty("--fl-slice-v", value.toFixed(4));
    }
    if (value === 0 && Math.abs(target) < 0.001) {
      running = false;
      return;
    }
    raf = requestAnimationFrame(step);
  };

  const onScroll = () => {
    const y = window.scrollY;
    target = clampVelocity(y - lastY);
    lastY = y;
    if (!running && visible.size) {
      running = true;
      raf = requestAnimationFrame(step);
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    window.removeEventListener("scroll", onScroll);
    cancelAnimationFrame(raf);
    io.disconnect();
  };
}
```

- [ ] **Step 4: Run math tests** — `npx tsx --test tests/fl-slice-math.test.ts` → PASS (both).

- [ ] **Step 5: Create `src/lib/fl-reveal.ts`**

```ts
/* Entrance orchestrator (spec M2–M6, ornaments). Toggles classes only — no
   inline styles. Without this module the page renders fully settled, because
   every from-state in globals.css is gated behind `html.fl-js`. */

export function initFlReveal(): () => void {
  if (typeof window === "undefined") return () => {};
  document.documentElement.classList.add("fl-js");

  const targets = Array.from(
    document.querySelectorAll<HTMLElement>("[data-fl-io]"),
  );
  const settleAll = () => targets.forEach((t) => t.classList.add("is-in"));

  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    typeof IntersectionObserver === "undefined"
  ) {
    settleAll();
    return () => {};
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
  );
  targets.forEach((t) => io.observe(t));
  return () => io.disconnect();
}
```

- [ ] **Step 6: Mount both in `HomeClient.tsx`**

Add to the imports:

```tsx
import { initFlReveal } from "@/lib/fl-reveal";
import { initFlSlice } from "@/lib/fl-slice";
```

Add a new effect directly after the existing online/offline `useEffect` (which ends `}, []);` around line 62):

```tsx
  useEffect(() => {
    const disposeReveal = initFlReveal();
    const disposeSlice = initFlSlice();
    return () => {
      disposeReveal();
      disposeSlice();
    };
  }, []);
```

- [ ] **Step 7: Full check** — `npm run lint && npm run typecheck && npx tsx --test tests/motion-utilities.test.ts tests/fl-slice-math.test.ts` → all PASS (module-existence test now green).

- [ ] **Step 8: Commit**

```bash
git add src/lib/fl-reveal.ts src/lib/fl-slice.ts tests/fl-slice-math.test.ts src/components/features/home/HomeClient.tsx
git commit -m "feat: add fl-reveal orchestrator and fl-slice velocity runtime"
```

---

### Task 4: Hero — letter cascade (M1), zoom-out photo (M7-soft), plate-line stagger, O1 ornament

**Files:**
- Create: `src/components/ui/editorial/CascadeText.tsx`
- Modify: `src/components/ui/editorial/index.ts` (add export)
- Modify: `src/components/features/home/HeroSection.tsx`

- [ ] **Step 1: Create `CascadeText.tsx`**

```tsx
/* M1 — per-letter cascade. Letters are aria-hidden; screen readers and SEO
   read the sr-only sentence. `\n` in `text` becomes a <br>. CSS drives the
   55ms/letter delays (globals.css caps at 28 letter spans). */

export function CascadeText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={className}>
      <span className="sr-only">{text.replace(/\n/g, " ")}</span>
      <span aria-hidden="true" className="fl-letters">
        {Array.from(text).map((ch, i) =>
          ch === "\n" ? (
            <br key={i} />
          ) : (
            <span key={i}>{ch === " " ? " " : ch}</span>
          ),
        )}
      </span>
    </span>
  );
}
```

In `src/components/ui/editorial/index.ts` add:

```ts
export { CascadeText } from "./CascadeText";
```

- [ ] **Step 2: Rework `HeroSection.tsx`**

Import: change the editorial import to `import { TypographicLink, CascadeText } from "@/components/ui/editorial";`

Replace the `<h1>` block (currently the conditional with two `<br>`-split lines):

```tsx
          <h1 className="fl-display fl-cascade-skip mt-fl-xs text-fl-display text-atelier-on-dark">
            <CascadeText
              text={
                language === "vi"
                  ? "Màu sơn cho\nngôi nhà Việt"
                  : "Colour for\nVietnamese homes"
              }
            />
          </h1>
```

Replace the hero image className (currently `fl-photo-parallax fl-photo-parallax-soft object-cover object-center`) with:

```
fl-photo-zoomout fl-photo-zoomout-soft object-cover object-center
```

and update the comment above it: the fold now relaxes from 1.12 scale to rest as it scrolls out (scale-only — a translate at scale 1.0 would expose the plate edge).

Plate line (the strip under the hero): on the inner flex container (`mx-auto flex w-full max-w-[100rem] flex-col gap-fl-2xs …`) add `data-fl-io` and the class `fl-stagger`.

O1 ornament — insert directly before that plate-line inner container's three spans, as the first child:

```tsx
        <svg
          aria-hidden="true"
          viewBox="0 0 44 44"
          className="fl-orn-fade hidden h-5 w-5 shrink-0 text-atelier-ink-3 lg:block"
        >
          <line x1="22" y1="4" x2="22" y2="40" stroke="currentColor" strokeWidth="1" />
          <line x1="4" y1="22" x2="40" y2="22" stroke="currentColor" strokeWidth="1" />
          <circle cx="22" cy="22" r="9" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
```

and append a fourth `.fl-label` span after the existing three:

```tsx
        <span className="fl-label hidden xl:inline">21.0405° B · 105.8342° Đ</span>
```

- [ ] **Step 3: Checks** — `npm run lint && npm run typecheck` → PASS. Start `npm run dev` if not running; load `http://localhost:3000/vi`, confirm the headline cascades letter by letter and screen-reader text exists (`grep "sr-only"` in rendered HTML: `curl -s http://localhost:3000/vi | grep -o 'sr-only[^<]*'`).

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/editorial/CascadeText.tsx src/components/ui/editorial/index.ts src/components/features/home/HeroSection.tsx
git commit -m "feat: hero letter cascade, zoom-out fold, plate-line stagger, O1 marks"
```

---

### Task 5: `SliceImage` + integrate slice drift (M10) into Store Overview and Visualizer stage

**Files:**
- Create: `src/components/ui/slice-image.tsx`
- Modify: `src/components/features/home/StoreOverviewSection.tsx:84-96`
- Modify: `src/components/features/home/VisualizerPromoSection.tsx:96-118`

- [ ] **Step 1: Create `slice-image.tsx`**

```tsx
import { CspImage } from "@/components/ui/csp-image";
import { cn } from "@/lib/utils";

const STRIPS = [0, 1, 2, 3];

/* M10 — one photo as 4 vertical strips. Strip geometry and drift amplitudes
   live in globals.css (nth-child rules); fl-slice.ts drives --fl-slice-v.
   Never combine with parallax/curtain/hover-zoom — one strong idea per plate. */
export function SliceImage({
  src,
  alt,
  sizes,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={alt}
      data-fl-slice
      data-fl-io
      className={cn("fl-slice absolute inset-0", className)}
    >
      {STRIPS.map((k) => (
        <span key={k} aria-hidden="true" className="fl-slice-strip">
          <CspImage
            src={src}
            alt=""
            fill
            sizes={sizes}
            className="fl-slice-img object-cover"
          />
        </span>
      ))}
    </span>
  );
}
```

- [ ] **Step 2: Store Overview lead image** — in `StoreOverviewSection.tsx`, replace the plate content (the `fl-photo-plate` div containing the parallax `<Image>`):

```tsx
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-surface bg-atelier-paper-2">
              <SliceImage
                src="/generated/hero-cinematic.jpg"
                alt={
                  language === "vi"
                    ? "Không gian sống với sơn FLOF"
                    : "A living space with FLOF paint"
                }
                sizes="(min-width: 1024px) 60vw, 100vw"
              />
            </div>
```

(The `fl-photo-plate` class and the `fl-photo-parallax` image are removed here — sliced plates carry no parallax.) Add the import `import { SliceImage } from "@/components/ui/slice-image";` and remove the now-unused `CspImage as Image` import if nothing else in the file uses it (the file has only this one image — remove it).

- [ ] **Step 3: Visualizer stage** — in `VisualizerPromoSection.tsx`, replace the stage `<Link>` contents (lines 97–118: the `fl-photo-plate` link wrapping the parallax wrapper + `<Image>`):

```tsx
            <Link
              href="/color-visualizer"
              className="block overflow-hidden rounded-surface"
            >
              <span className="relative block aspect-[16/10] w-full">
                <SliceImage
                  src="/visualizer_mockup.webp"
                  alt={
                    language === "vi"
                      ? "Giao diện công cụ phối màu"
                      : "Colour visualizer interface"
                  }
                  sizes="(min-width: 1024px) 60vw, 100vw"
                />
              </span>
            </Link>
```

Add the `SliceImage` import. Keep the `Image` import (the 4-room grid below still uses it).

- [ ] **Step 4: Checks** — `npm run lint && npm run typecheck && npm test` → PASS (includes `no-inline-style` — SliceImage has no style props). In the browser: scroll fast past Store Overview; strips shear apart and snap seamless ≤1s after stopping. `prefers-reduced-motion` (DevTools emulation): image seamless and static.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/slice-image.tsx src/components/features/home/StoreOverviewSection.tsx src/components/features/home/VisualizerPromoSection.tsx
git commit -m "feat: slice-drift plates for store overview and visualizer stage"
```

---

### Task 6: Promotion (Majestic) — curtain, masked heading, staggers, O2 arcs

**Files:**
- Modify: `src/components/features/home/PromotionSection.tsx`

- [ ] **Step 1: Apply classes**

1. Root: add `data-fl-io` to the `EditorialSection` (it spreads `...props`):
   `<EditorialSection rhythm="generous" frame className="fl-rise bg-atelier-paper" data-fl-io>`
2. Image plate div (line 31): add `fl-curtain-l`:
   `className="fl-photo-plate fl-curtain-l relative aspect-[4/3] w-full overflow-hidden rounded-surface bg-atelier-paper-2"`
   (The image keeps `fl-photo-parallax`; the curtain clips the plate, so the two never fight over `transform`.)
3. Heading (line 71): wrap in a mask. Replace the `<h2>` with:

```tsx
          <div className="fl-mask-line mt-fl-xs">
            <h2 className="fl-display text-fl-display-s text-atelier-ink">
              {language === "vi"
                ? "Đúng sắc cho từng bề mặt"
                : "The right shade for every surface"}
            </h2>
          </div>
```

4. SpecLedger (line 84): `className="fl-stagger mt-fl-lg w-full"` (its grid children stagger; 8-step cap + n+9 catch-all covers 2-col cells).
5. Swatch rail (line 51): add `fl-stagger` to the rail div's className.

- [ ] **Step 2: O2 ornament** — inside the `<figure>` (line 30), insert before the plate div:

```tsx
          <svg
            aria-hidden="true"
            viewBox="0 0 200 160"
            className="fl-orn-arc pointer-events-none absolute -left-fl-lg -top-fl-lg hidden w-40 lg:block"
          >
            <circle className="fl-draw fl-draw-outer" cx="96" cy="80" r="48" fill="none" stroke="var(--fl-drench-clay)" strokeWidth="1.2" />
            <circle className="fl-draw fl-draw-inner" cx="124" cy="80" r="33" fill="none" stroke="var(--fl-rule-strong)" strokeWidth="1" />
          </svg>
```

(`--fl-drench-clay` / `--fl-rule-strong` are existing tokens; SVG presentation attributes are not style attributes, so the CSP and the inline-style test are unaffected.)

- [ ] **Step 3: Checks** — `npm run lint && npm run typecheck`; in browser: plate wipes open left→right, heading rises from its mask, ledger rows stagger, arcs draw once. Reduced-motion: everything settled instantly.

- [ ] **Step 4: Commit**

```bash
git add src/components/features/home/PromotionSection.tsx
git commit -m "feat: majestic curtain reveal, masked heading, staggers, O2 arcs"
```

---

### Task 7: Color Explorer + Featured Products entrances (M2/M3/M4)

**Files:**
- Modify: `src/components/features/home/ColorExplorerSection.tsx`
- Modify: `src/components/features/home/FeaturedProductsSection.tsx`

- [ ] **Step 1: Color Explorer** (Read the file first; anchors below)

1. Root element of the section (the outermost `EditorialSection`/`section` — grep `Duyệt màu theo không khí` and walk up to the section root): add `data-fl-io`.
2. The `h2` carrying "Duyệt màu theo không khí": wrap exactly like the Promotion heading — outer `div.fl-mask-line` keeps the heading's margin classes, `h2` keeps the rest.
3. The family-strip container (the horizontal row of family chips, grep `selectedFamily` chip buttons): add `fl-stagger` to its container className.
4. The swatch-code grid (grep `MÃ MÀU`): add `fl-stagger` to the grid container className.
5. Do NOT touch the room-preview `AnimatePresence` crossfade or the product strip at the bottom.

- [ ] **Step 2: Featured Products**

1. Section root (outermost element of the component): add `data-fl-io`.
2. Lead article grid (line 138 `article.grid grid-cols-1 gap-y-fl-md py-fl-lg…`): add `fl-stagger` to its className.
3. Lead image `Link` (line 139–141): add `fl-blurup` to its className.
4. The secondary product row below the lead (second `<Image>` usage around line 217 — grep for it): add `fl-blurup` to each product card's outermost element and `fl-stagger` to their shared parent container.
5. Tab-switch crossfade (`safeMotion.div`) stays untouched.

- [ ] **Step 3: Checks** — `npm run lint && npm run typecheck`; browser: cards blur-up staggered once; tab switching still crossfades; chips stagger.

- [ ] **Step 4: Commit**

```bash
git add src/components/features/home/ColorExplorerSection.tsx src/components/features/home/FeaturedProductsSection.tsx
git commit -m "feat: explorer and featured-product entrances"
```

---

### Task 8: Band-grow (M8) + Expert Blogs entrances + O3 blueprint

**Files:**
- Modify: `src/components/features/home/VisualizerPromoSection.tsx`
- Modify: `src/components/features/home/ExpertBlogsSection.tsx`

- [ ] **Step 1: Sage band grow + blueprint**

In `VisualizerPromoSection.tsx`:

1. DrenchBand (line 45): `className="fl-rise fl-band-grow relative py-fl-3xl md:py-fl-4xl"` and add `data-fl-io` on the inner `mx-auto` container (line 46) — the container also gets `fl-orn-blueprint relative`:
   `<div className="fl-orn-blueprint relative mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,1.5rem)]" data-fl-io>`
2. Benefits `dl` (line 65): `className="fl-stagger mt-fl-lg"`.
3. Heading (line 53): wrap in `div.fl-mask-line` (same pattern as Task 6, keep `mt-fl-xs` on the wrapper).
4. Room grid (line 121): add `fl-mosaic` and per-tile curtains — container: `className="fl-mosaic mt-fl-sm grid grid-cols-2 gap-fl-sm sm:grid-cols-4"`; each room `<span className="relative block aspect-[4/3] w-full overflow-hidden rounded-surface">` becomes `…rounded-surface fl-curtain-u"` for tiles 1 and 3 — since tiles render from one `map`, alternate via index: change the map to `{ROOMS.map((room, index) => (…))}` and on that span use:
   `className={cn("relative block aspect-[4/3] w-full overflow-hidden rounded-surface", index % 2 === 0 ? "fl-curtain-u" : "fl-curtain-l")}`
   (add `import { cn } from "@/lib/utils";`).
5. O3 blueprint — insert as last child of the `fl-orn-blueprint` container (after the closing tag of the grid):

```tsx
        <svg
          aria-hidden="true"
          viewBox="0 0 420 128"
          className="pointer-events-none absolute bottom-fl-md right-[clamp(1rem,4vw,1.5rem)] hidden w-72 opacity-70 xl:block"
        >
          <path
            className="fl-draw"
            d="M 90 100 L 90 30 L 250 30 L 250 100 M 90 100 L 330 100 M 250 62 A 26 26 0 0 1 276 88 M 140 30 L 140 22 M 180 30 L 180 22 M 220 30 L 220 22"
            fill="none"
            stroke="var(--fl-on-dark)"
            strokeWidth="1"
          />
        </svg>
```

- [ ] **Step 2: Espresso band + blog entrances**

In `ExpertBlogsSection.tsx`:

1. DrenchBand (line 26): `className="fl-rise fl-band-grow relative py-fl-3xl md:py-fl-4xl"`; inner `mx-auto` container (line 27) gets `data-fl-io` and `relative`.
2. Heading `h2` (line 33): wrap in `div.fl-mask-line` (move `mt-fl-xs` to the wrapper).
3. Featured image plate (the `span.relative block aspect-[16/10] … overflow-hidden rounded-surface`): add `fl-curtain-u`. **Remove the inner `fl-photo-parallax` wrapper span** added earlier (curtain and parallax both animate; per spec one idea per plate — keep the hover zoom on the img, drop the parallax wrapper so the img is a direct child of the plate again).
4. Supporting list `ul`: add `fl-stagger` to its className.

- [ ] **Step 3: Checks** — `npm run lint && npm run typecheck && npm test` (design-tokens gate must stay green — no opacity utilities were added to band text; the `opacity-70` is on an `aria-hidden` SVG, but if `tests/design-tokens.test.ts` flags it, swap `opacity-70` for `text-atelier-on-dark` with `stroke="currentColor"` and set the alpha in the stroke via `oklch`-token — check the test output first). Browser: both bands grow from inset rounded blocks to full bleed while entering (Chromium); blueprint draws once.

- [ ] **Step 4: Commit**

```bash
git add src/components/features/home/VisualizerPromoSection.tsx src/components/features/home/ExpertBlogsSection.tsx
git commit -m "feat: band-grow on sage and espresso, mosaic rooms, blog entrances, O3 blueprint"
```

---

### Task 9: TypographicLink underline draw (M9)

**Files:**
- Modify: `src/components/ui/editorial/TypographicLink.tsx:33-40`

- [ ] **Step 1: Swap decoration hover for the draw**

Replace the `cn(...)` class list with:

```tsx
      className={cn(
        "group inline-flex min-h-11 items-center gap-2 whitespace-nowrap text-fl-sm font-medium md:min-h-6",
        "text-atelier-accent",
        "transition-opacity duration-fl-fast ease-fl-out active:opacity-80",
        "[.fl-drench_&]:text-current",
        className,
      )}
```

and wrap the label span:

```tsx
      <span className="fl-underline">{children}</span>
```

(The `.fl-underline` rules from Task 2 handle draw-in from the left on `.group:hover`/`:focus-visible` and exit to the right; reduced-motion users get an instant underline because the transition is media-gated.)

- [ ] **Step 2: Static-state check** — the link must still show an affordance when idle. Add a resting 1px underline for non-hover: in `globals.css` (inside the motion-upgrade block, after `.fl-underline` rules) — **already covered**: at rest `background-size: 0%` means no underline, which regresses affordance. So ALSO add to the block:

```css
/* Idle affordance: hairline under the label at 40% strength; the draw
   animation paints the full-strength line over it. */
.fl-underline {
  box-shadow: inset 0 -1px 0 0 color-mix(in oklab, currentColor 40%, transparent);
}
```

- [ ] **Step 3: Checks** — `npm run lint && npm run typecheck && npm test` (no-inline-style, design-tokens). Browser: hover any "Xem sản phẩm →" link — underline draws left→right, retracts to the right on leave; keyboard focus does the same.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/editorial/TypographicLink.tsx src/app/globals.css
git commit -m "feat: underline-draw hover for typographic links"
```

---

### Task 10: Adapted DotField + O5 (espresso) + O6 (store overview paper)

**Files:**
- Create: `src/components/ui/dot-field.tsx`
- Modify: `src/components/features/home/ExpertBlogsSection.tsx`
- Modify: `src/components/features/home/StoreOverviewSection.tsx`

- [ ] **Step 1: Create the adapted component** — vendored from React Bits (MIT), adapted: no `style` props (classes + CSSOM), `useId`, IO-gated rAF, reduced-motion = one static paint, no glow when `glowRadius` is 0.

```tsx
"use client";

/* Adapted from React Bits <DotField /> (MIT). Changes for this codebase:
   - No JSX style props (production CSP: style-src-attr 'none'; see
     tests/no-inline-style.test.ts). Static layout via Tailwind classes;
     runtime writes (canvas CSS size, glow opacity) go through CSSOM.
   - Math.random() gradient id → useId() (SSR-stable).
   - rAF runs only while the host is on screen and the tab is visible;
     prefers-reduced-motion paints one static frame and never animates.
   - Decorative only: aria-hidden, pointer-events-none. */

import { useEffect, useId, useRef, memo } from "react";
import { cn } from "@/lib/utils";

const TWO_PI = Math.PI * 2;

type Dot = { ax: number; ay: number; sx: number; sy: number; vx: number; vy: number; x: number; y: number };

type DotFieldProps = {
  dotRadius?: number;
  dotSpacing?: number;
  cursorRadius?: number;
  bulgeStrength?: number;
  glowRadius?: number;
  sparkle?: boolean;
  waveAmplitude?: number;
  gradientFrom?: string;
  gradientTo?: string;
  glowColor?: string;
  className?: string;
};

export const DotField = memo(function DotField({
  dotRadius = 1.5,
  dotSpacing = 14,
  cursorRadius = 220,
  bulgeStrength = 44,
  glowRadius = 0,
  sparkle = false,
  waveAmplitude = 0,
  gradientFrom = "rgba(242, 239, 232, 0.16)",
  gradientTo = "rgba(242, 239, 232, 0.07)",
  glowColor = "rgba(28, 22, 19, 0.6)",
  className,
}: DotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glowRef = useRef<SVGCircleElement | null>(null);
  const gradientId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const propsRef = useRef({ dotRadius, dotSpacing, cursorRadius, bulgeStrength, sparkle, waveAmplitude, gradientFrom, gradientTo });
  propsRef.current = { dotRadius, dotSpacing, cursorRadius, bulgeStrength, sparkle, waveAmplitude, gradientFrom, gradientTo };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const glowEl = glowRef.current;

    let dots: Dot[] = [];
    let w = 0;
    let h = 0;
    let offsetX = 0;
    let offsetY = 0;
    let raf = 0;
    let frame = 0;
    let visible = false;
    let running = false;
    let glowOpacity = 0;
    let engagement = 0;
    const mouse = { x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 };
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;

    function buildDots() {
      const p = propsRef.current;
      const step = p.dotRadius + p.dotSpacing;
      const cols = Math.floor(w / step);
      const rows = Math.floor(h / step);
      const padX = (w % step) / 2;
      const padY = (h % step) / 2;
      dots = new Array(rows * cols);
      let i = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ax = padX + c * step + step / 2;
          const ay = padY + r * step + step / 2;
          dots[i++] = { ax, ay, sx: ax, sy: ay, vx: 0, vy: 0, x: ax, y: ay };
        }
      }
    }

    function doResize() {
      const rect = canvas.parentElement!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      offsetX = rect.left + window.scrollX;
      offsetY = rect.top + window.scrollY;
      buildDots();
      if (reduced) paint();
    }

    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(doResize, 120);
    }

    function onMouseMove(e: MouseEvent) {
      mouse.x = e.pageX - offsetX;
      mouse.y = e.pageY - offsetY;
      if (!running && visible && !reduced) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    }

    function paint() {
      const p = propsRef.current;
      ctx.clearRect(0, 0, w, h);
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, p.gradientFrom);
      grad.addColorStop(1, p.gradientTo);
      ctx.fillStyle = grad;
      const rad = p.dotRadius / 2;
      ctx.beginPath();
      const t = frame * 0.02;
      const cr = p.cursorRadius;
      const crSq = cr * cr;
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const dx = mouse.x - d.ax;
        const dy = mouse.y - d.ay;
        const distSq = dx * dx + dy * dy;
        if (distSq < crSq && engagement > 0.01) {
          const dist = Math.sqrt(distSq);
          const fall = 1 - dist / cr;
          const push = fall * fall * p.bulgeStrength * engagement;
          const angle = Math.atan2(dy, dx);
          d.sx += (d.ax - Math.cos(angle) * push - d.sx) * 0.15;
          d.sy += (d.ay - Math.sin(angle) * push - d.sy) * 0.15;
        } else {
          d.sx += (d.ax - d.sx) * 0.1;
          d.sy += (d.ay - d.sy) * 0.1;
        }
        let drawX = d.sx;
        let drawY = d.sy;
        if (p.waveAmplitude > 0) {
          drawY += Math.sin(d.ax * 0.03 + t) * p.waveAmplitude;
          drawX += Math.cos(d.ay * 0.03 + t * 0.7) * p.waveAmplitude * 0.5;
        }
        let r = rad;
        if (p.sparkle) {
          const hash = ((i * 2654435761) ^ (frame >> 3)) >>> 0;
          if (hash % 100 < 3) r = rad * 1.8;
        }
        ctx.moveTo(drawX + r, drawY);
        ctx.arc(drawX, drawY, r, 0, TWO_PI);
      }
      ctx.fill();
    }

    function updateMouseSpeed() {
      const dx = mouse.prevX - mouse.x;
      const dy = mouse.prevY - mouse.y;
      mouse.speed += (Math.sqrt(dx * dx + dy * dy) - mouse.speed) * 0.5;
      if (mouse.speed < 0.001) mouse.speed = 0;
      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
    }
    const speedInterval = reduced ? undefined : setInterval(updateMouseSpeed, 20);

    function tick() {
      frame++;
      const targetEngagement = Math.min(mouse.speed / 5, 1);
      engagement += (targetEngagement - engagement) * 0.06;
      if (engagement < 0.001) engagement = 0;
      glowOpacity += (engagement - glowOpacity) * 0.08;
      if (glowEl) {
        glowEl.setAttribute("cx", String(mouse.x));
        glowEl.setAttribute("cy", String(mouse.y));
        glowEl.style.opacity = String(glowOpacity);
      }
      paint();
      if (!visible || document.hidden) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    }

    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible && !running && !reduced) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    });
    io.observe(canvas.parentElement);

    const onVisibility = () => {
      if (!document.hidden && visible && !running && !reduced) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    doResize();
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    if (!reduced) window.addEventListener("mousemove", onMouseMove, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      if (speedInterval) clearInterval(speedInterval);
      clearTimeout(resizeTimer);
      io.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("mousemove", onMouseMove);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <canvas ref={canvasRef} className="absolute inset-0" />
      {glowRadius > 0 ? (
        <svg className="absolute inset-0 h-full w-full">
          <defs>
            <radialGradient id={gradientId}>
              <stop offset="0%" stopColor={glowColor} />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle ref={glowRef} cx="-9999" cy="-9999" r={glowRadius} fill={`url(#${gradientId})`} className="opacity-0 will-change-[opacity]" />
        </svg>
      ) : null}
    </div>
  );
});
```

- [ ] **Step 2: O5 — espresso band.** In `ExpertBlogsSection.tsx`, add `import { DotField } from "@/components/ui/dot-field";` and insert as the FIRST child of the `DrenchBand` (before the `mx-auto` container — the band already got `relative` in Task 8):

```tsx
      <DotField
        dotRadius={1.5}
        dotSpacing={18}
        cursorRadius={220}
        bulgeStrength={44}
        glowRadius={140}
        gradientFrom="rgba(242, 239, 232, 0.16)"
        gradientTo="rgba(242, 239, 232, 0.07)"
        glowColor="rgba(28, 22, 19, 0.6)"
      />
```

- [ ] **Step 3: O6 — Store Overview paper texture.** In `StoreOverviewSection.tsx`, add the same import; the `EditorialSection` has `frame` so its root is already `relative`. Insert as the first child inside the `EditorialSection` (before the grid):

```tsx
      <DotField
        dotRadius={1}
        dotSpacing={28}
        cursorRadius={160}
        bulgeStrength={18}
        waveAmplitude={2}
        gradientFrom="rgba(46, 42, 36, 0.05)"
        gradientTo="rgba(46, 42, 36, 0.03)"
      />
```

and add `relative` to the grid container so content paints above the canvas:
`<div className="relative grid grid-cols-1 gap-y-fl-lg lg:grid-cols-12 lg:gap-x-fl-lg">`

Note: `DotField` is a client component; the home sections are already `"use client"`, so no boundary changes.

- [ ] **Step 4: Checks** — `npm run lint && npm run typecheck && npm test`. Browser: dots bulge from the cursor over the espresso band; Store Overview texture is barely-there until the pointer crosses it. DevTools performance: no rAF activity while the bands are off screen (scroll to hero, check the Performance monitor).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/dot-field.tsx src/components/features/home/ExpertBlogsSection.tsx src/components/features/home/StoreOverviewSection.tsx
git commit -m "feat: adapted DotField ornaments on espresso band and store overview"
```

---

### Task 11: Full verification + fix pass

**Files:**
- Create: scratchpad script `verify-motion.mjs` (session scratchpad, not committed)

- [ ] **Step 1: All gates**

Run: `npm run lint && npm run typecheck && npm test && npm run build && npm run test:bundle`
Expected: all PASS. If `test:bundle` fails: the only new client JS is fl-reveal + fl-slice + DotField (~4 KB total) — investigate before trimming.

- [ ] **Step 2: Headless verification** — write to the session scratchpad (import playwright-core via `file:///D:/ProjectZ/FLOF/node_modules/playwright-core/index.js`, pattern from `verify2.mjs` in the 2026-07-27 session):

Assert on `http://localhost:3000/vi` at 1440×900:
1. `document.documentElement.classList.contains("fl-js")` is true.
2. After scrolling to bottom step-wise, every `[data-fl-io]` has `.is-in`.
3. `.fl-band-grow` elements: `getAnimations()[0].effect.getComputedTiming().progress` changes across two scroll positions (Chromium).
4. Slice: synthetic wheel scroll (stepwise `window.scrollTo` at 40ms intervals past Store Overview) → read `getPropertyValue("--fl-slice-v")` on `[data-fl-slice]` — non-zero during, exactly `"0"` within 1s after stopping; strip `getBoundingClientRect().top` values differ during scroll and equalise at rest.
5. Letter cascade: hero `h1 .fl-letters > span` count ≥ 20 and the `sr-only` sibling contains the full sentence.
6. `document.documentElement.scrollWidth - clientWidth === 0` at 320 / 768 / 1440 widths.
7. Reduced-motion context (`reducedMotion: "reduce"`): every `[data-fl-io]` already `.is-in` (or from-states absent), all strip transforms `none`/aligned, zero rAF from DotField (its canvas painted once).
8. Zero console errors on the whole run.

Expected: every assertion prints PASS.

- [ ] **Step 3: Screenshots for the owner** — capture `hero`, `majestic mid-curtain` (120ms after it enters), `sage band mid-grow`, `espresso dots with cursor parked on the band` and attach paths in the final report.

- [ ] **Step 4: e2e sanity** — `npm run test:e2e -- --grep "atelier|accessibility"` (Playwright runs with reduced motion, so entrances must not interfere).
Expected: PASS.

- [ ] **Step 5: Final commit if fixes were made, then report**

```bash
git add -A && git commit -m "fix: motion verification adjustments"
```

---

## Self-review notes (already applied)

- Spec coverage: M1→T4, M2/M3→T4/6/7/8, M4→T7, M5→T6/8, M6→T8, M7→T4 (hero only), M8→T8, M9→T9, M10→T5, O1→T4, O2→T6, O3→T8, O5/O6→T10, guardrails→T2 gates + T11 checks. Rejected items appear nowhere.
- The Expert Blogs featured image previously carried `fl-photo-parallax` (added earlier on 2026-07-27); Task 8 step 2.3 explicitly removes it — without that step the curtain and parallax would fight over `transform`.
- Hero letter count: "Màu sơn cho\nngôi nhà Việt" = 11 + 13 letters + 1 `<br>` = 25 children ≤ 28 delay rules; EN variant "Colour for\nVietnamese homes" = 26 ≤ 28.
- `.fl-cascade-skip` must be defined (Task 2) before Task 4 uses it — order holds.
