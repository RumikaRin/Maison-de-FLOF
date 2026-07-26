# FLOF Homepage Motion Upgrade Design

**Date:** 2026-07-27

**Status:** Draft — awaiting product-owner review

**Scope:** Marketing sections of the homepage (`/`) only: Hero, Promotion
(Majestic), Color Explorer, Visualizer Promo, Store Overview, Featured
Products, Swatch Marquee, clay advice band, Expert Blogs.

**Explicit exclusions:** admin surfaces, app-family pages (cart/checkout/
profile), find-dealer and color-visualizer pages (they keep the parallax they
already have), header/footer, and any payment or backend behaviour.

## Problem

The product owner finds the homepage too static: entrances are limited to one
opacity settle per section and the page lacks a distinctive, luxury motion
identity. Three aura.build references define the target feel:

- `luxury-furniture.aura.build`
- `architectu-studio-57.aura.build`
- `aether-architectu-60.aura.build` (earlier reference for smooth scroll feel)

`design.md` § Motion caps the system at eight restrained primitives. The owner
has explicitly waived that constraint for this work ("bỏ qua design và sửa lại
sau"); amending `design.md` is deferred to a follow-up after acceptance.

## Reference findings (measured, not guessed)

Both reference sites were inspected with headless Chromium (stylesheet dump,
scroll-position diffing, hover probing):

| Technique | luxury-furniture | architectu-57 |
|---|---|---|
| Stack | **Pure CSS + IntersectionObserver**, `scroll-behavior: smooth`. No GSAP, no Lenis | GSAP + ScrollTrigger + three.js (WebGL image displacement) |
| Text | Per-letter cascade (17 char spans), word reveal via gradient `mask-image`, `blur-up` entrances | Masked line rise `translate(0,110%) → 0` |
| Images | `grayscale → 0` on hover, inverted zoom (`scale-105 → 100` on hover), marquee edge mask, one full-bleed 80 vh image band | Wrapper parallax `translateY 0 → 20%`, `brightness-75` scrims under text |
| Shared easing | `cubic-bezier(0.16, 1, 0.3, 1)` — identical to FLOF's `--fl-ease-out` | same |

Key conclusion: **neither site hijacks native scroll.** The "smooth" feel comes
from scroll-linked transforms with generous easing. This validates a CSS-first
approach and removes any need for Lenis.

## Decisions

Recorded from the brainstorming session (visual companion demos, 2026-07-27):

1. **Flavor: A + B.** Refined editorial (masked text, curtain reveals,
   self-drawing hairlines) combined with immersive scroll (band-grow,
   multi-layer parallax). The bold/expressive direction (per-letter marquees,
   3D tilt, colour-fill text) was reviewed and rejected.
2. **Scope: homepage first.** Validate on one page, then roll out.
3. **Platform: CSS scroll-driven + a ~40-line IntersectionObserver
   orchestrator.** GSAP (+~37 KB gz, one third of the shared bundle budget)
   and Lenis were reviewed and rejected. Zero new dependencies.
4. **Image motion: effects "curtain", "zoom-out scrub", "mosaic" combined
   per section** (owner: "kết hợp 2,3,4 tùy vào từng phần").
5. **Rejected after demo review:** paint-sweep mask reveal, marquee edge
   mask, grayscale colour-return, inverted hover zoom, two-layer depth pair,
   sticky stacking cards for Store Overview, oversized serif CTA finale, and
   button sheen/shine sweeps (explicitly removed by the owner: "k dùng vệt
   sáng ở nút").

## Motion inventory

New utilities (names final, all CSS-only, tokens reused from `globals.css`):

| # | Utility | Behaviour | Trigger |
|---|---|---|---|
| M1 | `.fl-letters` + `CascadeText` helper | Hero headline arrives per letter: `translateY(0.5em)` + fade, 55 ms/letter, `--fl-ease-out`; `nth-child` delay rules cover up to 28 letters (both hero lines fit; longer text falls back to M2 line rise) | Load, once |
| M2 | `.fl-mask-line` | A line of text rises from an `overflow: hidden` mask, `translateY(110%) → 0`, `--fl-dur-slow` | IO, once |
| M3 | `.fl-stagger` (+ `.fl-rule-draw`) | Children rise 12 px + fade with `nth-child` delays (120 ms steps, capped at 8); hairlines draw `scaleX(0) → 1` from the left | IO, once |
| M4 | `.fl-blurup` | Card entrance: opacity 0 + `blur(8px)` + `translateY(16px)` → rest; 120–170 ms sibling stagger | IO, once |
| M5 | `.fl-curtain-l` / `-u` / `-x` | Image plate opens via `clip-path: inset(...)` from left / bottom / center; inner image settles `scale(1.16) → 1.04` | IO, once |
| M6 | Mosaic = M5 variants alternated | Image clusters open with alternating curtain directions, 120 ms offsets | IO, once |
| M7 | `.fl-photo-zoomout` | Large photo relaxes `scale(1.22) → 1.0` linked to scroll progress; `-soft` variant (`1.12 → 1.0`) for low-resolution sources such as the hero's 1280×720 asset; composes with the existing `.fl-photo-parallax` translate on the same named `--fl-photo-plate` timeline | Scroll-linked |
| M8 | `.fl-band-grow` | Colour-drench band grows from an inset, rounded block to full bleed via `clip-path: inset(0 4% round 16px) → inset(0 round 0)` — clip-path only, zero layout shift | Scroll-linked |
| M9 | `TypographicLink` underline draw | Underline draws from the left on hover, exits to the right | Hover |

Existing motion kept unchanged: `.fl-rise` section settle, `.fl-photo-parallax`
(+ `-soft`), `.fl-hero-cascade` (still used for hero label/subtext/actions;
the headline upgrades to M1), swatch marquee, 1.03 image hover zoom,
`.fl-panel-in`, nav condense.

## Per-section map

| Section | Effects |
|---|---|
| 1 · Hero | M1 headline; label/subtext/actions keep line cascade; photo: M7 zoom-out + existing soft parallax; plate-line metadata: M3 |
| 2 · Promotion (Majestic) | Image: M5 left curtain; headline: M2; SpecLedger: M3 with rule draw; swatch rail: M3 |
| 3 · Color Explorer | Heading: M2; family strip + swatch grid: M3 (stagger capped); room preview keeps existing crossfade; caption rule: `.fl-rule-draw` |
| 4 · Visualizer Promo (sage) | Band: M8; stage image: M5 center curtain; 4-room grid: M6 mosaic; benefits ledger: M3 |
| 5 · Store Overview | Lead image: M7 (composed with existing parallax); buying-path rows: M3 with rule draw; blockquote: M2 |
| 6 · Featured Products | Product cards: M4 blur-up stagger; tab switch keeps existing crossfade |
| 7 · Swatch Marquee | Unchanged |
| 8 · Clay advice band | Keeps BandEdge wave (no grow — one band, one idea); copy: M2; button: plain |
| 9 · Expert Blogs (espresso) | Band: M8; featured image: M5 bottom curtain; side rows: M3; headline: M2 |

## Architecture

### CSS (`src/app/globals.css`, appended block)

- All from-states are **double-gated**: `html.fl-js` (set by the orchestrator
  on mount) **and** `@media (prefers-reduced-motion: no-preference)`. If JS
  never runs, or the user prefers reduced motion, no from-state ever applies —
  the page renders fully settled. No content can be lost to a missing trigger.
- Scroll-linked utilities (M7, M8) additionally sit behind
  `@supports (animation-timeline: view())` and use **named view timelines**
  (`--fl-photo-plate` pattern already in the codebase; M8 declares its own
  `view-timeline-name` on the band). Anonymous `view()` is forbidden — an
  `overflow: hidden` plate is itself a scroll container and silently pins
  progress at 50 % (bug found and fixed 2026-07-27).
- Only `transform`, `opacity`, `clip-path`, and an entrance-only
  `filter: blur(≤8px)` are animated. Nothing that affects layout.
- Stagger delays are `nth-child`-based (capped at 8 steps), never inline
  `style` attributes — the production CSP (`style-src-attr 'none'`) and the
  `no-inline-style` test both stay intact.

### JS (`src/lib/fl-reveal.ts` + one mount point)

Single module, ~40 lines, no dependencies:

1. On mount: `document.documentElement.classList.add("fl-js")`.
2. If `prefers-reduced-motion: reduce` or `IntersectionObserver` is missing:
   immediately add `is-in` to every `[data-fl-io]` element and stop.
3. Otherwise observe `[data-fl-io]` (threshold 0.2, rootMargin "0px 0px -10%"),
   add `is-in` on first intersection, unobserve. Cleanup disconnects.

Mounted once from the homepage client tree (a `useEffect` in `HomeClient`).
It toggles classes only — no inline styles, CSP-safe, passes existing gates.

### Markup

- New server helper `CascadeText` renders the hero headline as
  `aria-hidden` per-letter spans plus an `sr-only` copy of the full text —
  screen readers and SEO read the sentence, not letters.
- Sections receive `data-fl-io` and utility classes. **No section changes its
  DOM structure or layout** — className and small wrapper additions only.

## Guardrails

- **Run-once:** every IO entrance fires once and never re-triggers on
  scroll-back. Scroll-linked effects (M7/M8) are continuous by design.
- **Reduced motion:** from-states never apply; the existing global collapse
  (≤150 ms fade) continues to govern. Playwright e2e runs with
  `reducedMotion: reduce` and is unaffected.
- **No-JS:** without `fl-js`, the page is fully visible and static.
- **CLS = 0 by construction** (no layout-affecting properties). Lighthouse
  CLS ≤ 0.1 gate stays.
- **LCP:** the hero image is untouched by IO gating; M1 animates text only.
- **Bundle:** `fl-reveal.ts` ≈ 1 KB gz; budgets (115/210 KiB) unaffected.
- **Compatibility:** IO entrances run on all evergreen browsers. M7/M8
  render as fully-settled static state where `animation-timeline` is
  unsupported (Safari/Firefox today) — graceful, never broken.

## Verification plan

1. `npm run lint`, `typecheck`, `npm test` (includes `no-inline-style`,
   `design-tokens`), `npm run test:bundle` stay green.
2. Headless Chromium script (pattern from the 2026-07-27 parallax fix):
   assert `is-in` applied after scroll, M7/M8 timeline progress actually
   tracks scroll, zero horizontal overflow at 320/768/1440 px, all-static
   under `reducedMotion: reduce`, zero console errors.
3. Screenshots at rest and mid-entrance for owner review.
4. Existing e2e suite (`atelier-redesign.spec.ts` among others) passes.

## Follow-ups (out of scope here)

- Amend `design.md` § Motion to describe the expanded system (owner deferred).
- Roll proven utilities out to find-dealer, color-visualizer, products, blog.
- Consider automated per-page quota checks (marquee/parallax/band counts).
