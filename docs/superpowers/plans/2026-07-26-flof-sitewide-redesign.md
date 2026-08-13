# FLOF Sitewide Customer Redesign — Implementation Plan

**Design:** [`2026-07-26-flof-sitewide-redesign-design.md`](../specs/2026-07-26-flof-sitewide-redesign-design.md)
**System:** [`design.md`](../../../design.md)
**Date:** 26/07/2026

Six phases. Each phase ends with a report and a stop for review before the next
one starts. No phase touches `/admin/**`.

Rules that hold in every phase:

- `design.md` is read before writing any code.
- `src/app/globals.css` is **append-only** — the `@tailwind` directives, the
  existing `:root` HSL block, the `.dark` block and the `.admin-shell` /
  `.admin-content` blocks stay exactly where they are.
- No API route, Prisma model, migration, auth rule, authorization rule, cart
  logic, wishlist logic, or payment logic is modified.
- No file is deleted. Utilities that are retired are removed from *usage* on
  public pages; the CSS class stays declared until Phase 6 confirms nothing else
  references it.
- Every changed page stamps
  `/* Hallmark · genre: editorial · macrostructure: <name> · design-system: design.md · designed-as-app */`.
- Existing tests must stay green at the end of every phase.

---

## Phase 0 — Baseline evidence

Before changing anything, capture what "before" looks like so drift is provable.

0. Add `/output/`, `/.hallmark/`, `/.agents/`, `/.claude/`, `/.ai-understand/`
   to `.gitignore` — none of them are currently ignored, and Phase 0 writes
   hundreds of JPEGs into `output/`.
1. Start the dev server on a fixed port.
2. `scripts/capture-ui-baseline.ts` (new, dev-only): Playwright walk of all 18
   public routes × `vi | en` × `375 / 768 / 1440`, writing JPEGs to
   `output/ui-baseline/`.
3. Run `hallmark audit` over the public component tree and record the ranked
   punch list in `output/ui-baseline/audit.md`. **Audit does not edit.**
4. Record the current Lighthouse and bundle numbers as the regression floor.

**Done when:** baseline captures exist for every route/locale/width, the audit
punch list is written, and the perf floor is recorded.

---

## Phase 1 — Token foundation and primitives

**Files**

- `src/app/globals.css` — append a `:root` block declaring every `--fl-*` token
  from `design.md`; add a `.fl-public` scope that forces the light token set;
  add the editorial utilities (`.fl-rule`, `.fl-drench-*`, `.fl-measure`,
  `focus-visible` ring). Remove `.eyebrow-pill`, `.bezel-*`, `.btn-island`,
  the body grain overlay and the `float` / `aurora` keyframe usage **from the
  public scope only**.
- `tailwind.config.ts` — extend `colors.fl.*`, `spacing.fl-*`, `fontSize.fl-*`,
  `borderRadius.fl-*`, `transitionTimingFunction`. Existing `jotun.*`, `warm.*`
  and the shadcn HSL mappings are left untouched.
- `src/app/layout.tsx` — apply the public light scope; keep `ThemeProvider`
  mounted for `/admin`.
- `src/components/ui/button.tsx` · `input.tsx` · `label.tsx` · `textarea.tsx` ·
  `switch.tsx` · `custom-select.tsx` — retune CVA variants to the new tokens and
  ship all eight states. Variant names and props stay identical so no call site
  breaks.
- `src/components/ui/editorial/` (new) — `Rule`, `DrenchBand`,
  `EditorialHeading`, `TypographicLink`, `SwatchChip`, `SpecLedger`, plus one
  `.preview` route under `output/` for eyeballing the eight states.
- `scripts/check-contrast-tokens.ts` (new) — assert every `--fl-*` ink/surface
  pairing in `design.md`, including all four drench bands, against ≥ 4.5:1 body
  and ≥ 3:1 large/focus. Wire into `npm run check`.
- `tests/design-tokens.test.ts` (new) — assert the token block parses, that no
  public component file contains an inline `oklch(` / `#hex` / `rgb(`, and that
  no public file imports the retired utilities.

**Verification:** `npm run lint` · `npm run typecheck` · `npm test` ·
`node --experimental-strip-types scripts/check-contrast-tokens.ts` ·
`npm run build`. Existing pages must still render — they will look
transitional, which is expected.

**Done when:** tokens exist, primitives ship eight states, the contrast script
passes, and nothing regressed.

---

## Phase 2 — Shared chrome

**Files**

- `src/components/layout/Header.tsx` → `N11 Mega-menu`. Two panel triggers
  (`Sản phẩm`, `Bảng màu`), 3-column panels, one promo card each, scrim dim
  without blur. `NAV_LINKS`, the SSR-safe `keyVi` / `keyEn` labels, the locale
  toggle, `useLocaleNavigation()`, the cart badge and the account dropdown all
  keep their current behaviour and targets.
- `src/components/layout/Footer.tsx` → `Ft7 Newsletter-first`. Split layout,
  newsletter form primary, meta beneath a hairline rule, privacy line, social
  icons become text links.
- `src/components/layout/MainLayoutWrapper.tsx` — drop the global scroll-reveal
  listener for public pages; motion is now the two primitives only.
- `src/components/layout/GlobalNavigationLoader.tsx` ·
  `SiteLoadingScreen.tsx` — restyle to the token set; keep timing behaviour.
- `src/lib/dictionary.ts` — add only the keys the new panels genuinely need.

**Verification:** Playwright keyboard walk of the mega-menu (open, arrow, escape,
focus return), 44px targets at 375px, both locales, reduced-motion, plus the
existing header/footer assertions.

**Done when:** nav and footer match the archetypes, no nav item was renamed or
removed, and keyboard + mobile behaviour is verified.

---

## Phase 3 — Marketing family (`08 Photographic`)

Order: `/` first — it is the reference implementation the other four copy.

**Files**

- `src/components/features/home/HeroSection.tsx` — `H6` photographic fold,
  left-biased, not full viewport height.
- `PromotionSection.tsx` — image-dominant 7/5 asymmetric split with a swatch rail
  crossing the boundary and one `SpecLedger`. No literal 50/50.
- `ColorExplorerSection.tsx` — families as a continuous colour field, not rounded
  tabs in a rounded card. Selection, wishlist and related-product behaviour
  unchanged.
- `VisualizerPromoSection.tsx` — one large room stage, restrained controls,
  benefits as a text ledger instead of three icon cards.
- `StoreOverviewSection.tsx` — continuous editorial list, one lead image, strong
  rules; keeps `/products`, `/find-dealer`, `/quote-request`.
- `FeaturedProductsSection.tsx` — leading product carries more weight, supporting
  products denser. Variant selection, pricing, promotions, cart actions and
  loading/empty states unchanged.
- `ExpertBlogsSection.tsx` — one featured article plus a compact list; hierarchy
  from crop, scale and spacing, not boxes.
- `HomeClient.tsx` — composition and drench-band placement only. Wishlist state,
  favorites sync, local-storage fallback and offline messaging untouched.
- Then `src/components/features/colors/ColorsClient.tsx`,
  `src/components/features/visualizer/VisualizerClient.tsx`,
  `src/app/find-dealer/page.tsx` (+ `src/components/maps/dealer-map.tsx` chrome
  only), `src/app/quote-request/page.tsx`.

Each page picks 2–3 drench bands, no two adjacent the same, and states its
archetype knobs in the stamp.

**Verification:** the design-spec Playwright matrix for these five routes, both
locales, all five widths; wishlist signed-in and signed-out; MapLibre still
initialises and filters by province/district/brand.

---

## Phase 4 — Catalogue and Content families

**Files**

- `src/components/features/product/ProductsClient.tsx` — `11 Catalogue` +
  `F6` grid (`4/3`, `4-up`, `Add`), `C1` rectangular filter chips. Search and
  category/finish filtering behaviour unchanged.
- `src/components/features/blog/BlogClient.tsx` — catalogue for the index,
  `02 Long Document` for the article.
- `src/components/features/product/ProductClient.tsx` — long document, one
  `SpecLedger`, gallery as overlapping planes. Variant, price, promotion and
  add-to-cart logic unchanged.
- `src/components/ui/color-swatch.tsx` · `color-detail-drawer.tsx` ·
  `csp-image.tsx` · `AsyncState.tsx` · `scroll-to-top.tsx` — restyle to tokens,
  contracts unchanged.

**Verification:** product and blog routes across the matrix; add-to-cart and
variant selection assertions; colour drawer keyboard trap and escape.

---

## Phase 5 — App family (`05 Workbench`)

**Files**

- `src/components/features/checkout/CheckoutClient.tsx` · `CheckoutForm.tsx` ·
  `CheckoutOrderSummary.tsx` · `CheckoutSuccess.tsx`
- `src/app/cart/page.tsx` and its client tree
- `src/components/features/profile/ProfileClient.tsx` · `ProfileSidebar.tsx` and
  all eight tabs
- `src/app/login|register|forgot-password|reset-password|verify-email/page.tsx`
  and their client trees

Rules: no drench, no enrichment, no hero, display capped at `--fl-text-2xl`.
`react-hook-form` + Zod schemas, submit handlers, VNPay redirect, session
management, GDPR export and 2FA behaviour are **not** touched — only the
presentation layer and the eight input states.

**Verification:** existing integration and e2e suites for cart, checkout, auth
and profile must pass unchanged; then the responsive/locale matrix; then a
keyboard-only pass through checkout.

---

## Phase 6 — Slop test, cleanup, release evidence

1. Run the 58-gate slop test per page. Fix, then re-run — do not ship a failing
   gate.
2. Pre-emit self-critique per page on the six axes; anything below 3 gets a
   revision pass.
3. Confirm no public file references the retired utilities, then remove the dead
   CSS blocks. `aurora-background.tsx`, `animated-hero-section-1.tsx`,
   `about-us-section.tsx`, `footer-section.tsx`, `demo.tsx` and `loader-2.tsx`
   are **candidates for deletion** — list them for explicit approval; do not
   delete unilaterally.
4. Full gate chain: `npm run check` · `npm run test:e2e` ·
   `npm run test:lighthouse` · `npm run test:bundle` ·
   `npm run test:coverage` · `check-contrast-tokens`.
5. Side-by-side screenshots against `output/ui-baseline/` for every route,
   locale and width.
6. Append one `.hallmark/log.json` entry with `"scope": "app"`.
7. Write release evidence to `docs/superpowers/plans/` per repo convention.

---

## Risks

| Risk | Mitigation |
|---|---|
| Drench bands fail AA in one locale's smaller type | `check-contrast-tokens` runs in the check chain; body floor is 14px |
| Retuning `button.tsx` breaks an admin call site | Variant names and props are unchanged; admin is smoke-tested in Phase 1 |
| Mega-menu regresses SSR hydration | Keep the existing inline `keyVi`/`keyEn` pattern; no new client-only label lookup in the bar |
| Removing global scroll-reveal changes LCP | Lighthouse gate compared against the Phase 0 floor |
| Vietnamese diacritics clip at display sizes | Explicit assertion in the Playwright matrix on `ẫ ộ ỹ` at `--fl-display` |
| Scope creep into `/admin` | Every phase's file list is fixed; `.admin-shell` CSS is untouched |
