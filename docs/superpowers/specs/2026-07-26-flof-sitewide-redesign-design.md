# FLOF Sitewide Customer Redesign

**Date:** 26/07/2026
**Status:** Design system locked in `design.md`; this specification awaiting review
**Supersedes:** `2026-07-26-flof-homepage-atelier-redesign-design.md` — the homepage
narrative in that document is carried forward, but its type and shape rules are
replaced by `design.md`.

## Goal

Redesign every customer-facing surface of FLOF so the site reads as a premium
paint atelier rather than a generic ecommerce template, using one locked design
system across all pages instead of per-page styling.

`/admin/**` is out of scope and must be left visually untouched.

## Source of truth

[`design.md`](../../../design.md) at the project root. It carries the genre, the
four macrostructure families, the OKLCH token set, typography, spacing, shape,
motion, CTA voice, per-page allowances, the accessibility floor, and the
anti-pattern list. Where this specification and `design.md` disagree,
`design.md` wins.

The system was produced by `hallmark study` against six premium paint sites
rendered in a real browser, with `https://www.farrow-ball.com/` as the primary
reference. Provenance and attestation are recorded in `design.md § Provenance`.

## Success criteria

- Every public page shares one visual system: same paper, same ink, same accent,
  same type pairing, same CTA voice, same section-boundary language.
- Colour is the identity. Marketing pages carry 2–3 full-bleed colour-drench
  bands built from real paint values.
- No page reintroduces an entry from `design.md § Notes`.
- Vietnamese and English render without clipped diacritics, wrapped buttons, or
  broken layout at 320 / 375 / 414 / 768 / 1440px.
- Public pages are light-only; `/admin` keeps `next-themes` and its `.dark`
  tokens.
- Contrast passes AA on paper **and** on every drench band, verified by script.
- No API route, Prisma model, migration, authentication rule, authorization
  rule, cart behaviour, wishlist behaviour, payment flow, or data-fetching
  boundary changes.
- `npm run check`, the Playwright suite, the Lighthouse gate, and the bundle
  budget gate all stay green.

## Scope — 18 public routes

**Marketing family** (`08 Photographic`)
`/` · `/colors` · `/color-visualizer` · `/find-dealer` · `/quote-request`

**Catalogue family** (`11 Catalogue`)
`/products` · `/blog`

**Content family** (`02 Long Document`)
`/products/[slug]` · `/blog/[slug]`

**App family** (`05 Workbench`)
`/cart` · `/checkout` · `/checkout/success` · `/profile` · `/login` ·
`/register` · `/forgot-password` · `/reset-password` · `/verify-email`

**Shared chrome** — `Header` becomes `N11 Mega-menu`, `Footer` becomes
`Ft7 Newsletter-first`. Both apply to all four families.

**Out of scope** — all 18 `/admin/**` routes, `AdminNotificationDropdown`,
`AdminRevenueChart`, `AuditLogTable`, `InvoiceModal`, `AdminPaintsClient`,
`PaintsFormModal`, `PaintsPromoModal`, and the `.admin-shell` /
`.admin-content` CSS blocks.

## Architecture rules

- Server components stay the data boundary. `page.tsx` files keep their current
  data fetching; `getHomePageData(db)` and every other query is unchanged.
- Client components keep their current state ownership: `HomeClient` still owns
  the colour wishlist and `/api/profile/favorites` sync with local-storage
  fallback; `ColorsClient`, `ProductsClient`, `VisualizerClient`,
  `CheckoutClient`, `ProfileClient` keep theirs.
- Redesign is **in-place edits plus additive shared primitives**. No route file,
  component directory, or page tree is deleted. Any deletion requires explicit
  approval with the file named.
- New shared presentation primitives live in `src/components/ui/editorial/` and
  are added only when at least two pages need the same treatment:
  - `Rule` — hairline / strong section rule
  - `DrenchBand` — full-bleed colour section with automatic ink inversion
  - `EditorialHeading` — display heading with balanced wrap and optional label
  - `TypographicLink` — the `C3` secondary action
  - `SwatchChip` — hard-edged colour chip with name + code always present
  - `SpecLedger` — flat key/value ledger replacing badge clusters
- `src/lib/dictionary.ts` gains keys only for genuinely new copy. No English or
  Vietnamese string is hardcoded in a component.
- No fabricated content. If FLOF has no metric, testimonial, or review count for
  a slot, the layout changes — the number is not invented.

## Per-family shape

### Marketing — `08 Photographic`

Full-bleed photographic fold (`H6`, image area 16/7, caption lower-left, text
left-biased, **not** centred, **not** full viewport height). Below the fold the
page alternates: paper section → drench band → paper section with a 7/5 or 8/4
image/text split → drench band. Section padding is deliberately unequal.
Boundaries are hairline rules or the colour change itself.

Homepage keeps the seven-section narrative from the superseded homepage spec —
hero, product editorial, colour explorer, visualizer, store overview, featured
products, expert journal — and keeps every existing link target and data source.

### Catalogue — `11 Catalogue`

The grid is the design. `F6 Product card grid` with knobs
`ratio=4/3 landscape`, `density=4-up`, `micro-action=Add`. Cards are square-edged
with a hairline top rule, not filled panels. Filters are `C1` outlined
rectangular chips. One drench band may divide the page. The leading item may take
greater visual weight; supporting items use a denser rhythm.

### Content — `02 Long Document`

Continuous prose, `S4 Inline no break` section heads, measure 60–75ch,
asymmetric 8/4 layout with metadata in the narrow column. Product detail uses one
`SpecLedger` for surface / space / finish instead of a badge cluster. Typography
only — no drench, no enrichment.

### App — `05 Workbench`

Function carries the page. Display type capped at `--fl-text-2xl`. No drench, no
enrichment, no hero. Forms keep `react-hook-form` + Zod wiring exactly as-is and
gain the eight-state input treatment. Checkout keeps its step structure, order
summary, payment-method selection and VNPay path unchanged.

## Shared chrome detail

### Header — `N11 Mega-menu`

- Bar: wordmark left; triggers `Sản phẩm`, `Bảng màu`, plus the remaining
  `NAV_LINKS` as plain links; search, locale toggle, wishlist, cart, account
  dropdown right.
- `Bảng màu` panel: 3 columns of colour families rendered as real `SwatchChip`
  cells plus one promo card. `Sản phẩm` panel: short index of ranges plus one
  promo card. Scrim dims the page, no blur.
- Existing SSR-safe `keyVi` / `keyEn` inline labels and
  `useLocaleNavigation()` behaviour are preserved. No nav item is removed or
  renamed.
- Below 768px the panels collapse into the existing disclosure pattern; every
  target ≥ 44px.

### Footer — `Ft7 Newsletter-first`

Split layout — the existing newsletter form left, wordmark and meta right, links
and copyright in 12px muted type beneath a hairline rule. Privacy line present.
Social icons become text links. The current 4-column index arrangement is
replaced.

## Colour-drench contract

- Four drench tokens: `sage`, `clay`, `slate`, `ochre`. Each has a paired
  `--fl-on-*` ink token.
- A drench band sets its own ink, rule and focus-ring colour. Teal is never used
  inside a drench — links there are `--fl-on-dark` plus a 1px underline.
- Marketing pages use 2–3 bands, never two adjacent bands of the same drench.
- Catalogue pages may use one. Content and App pages use none.
- Every drench/ink pairing is verified ≥ 4.5:1 for body and ≥ 3:1 for large
  display by `scripts/check-contrast-tokens.ts` (new), run in the check chain.

## Error, empty and fallback behaviour

Unchanged in behaviour, restyled in appearance:

- Failed homepage query keeps the existing fallback content and notice in
  `HomeClient`.
- Missing images keep the current `csp-image` / product-image fallback.
- Wishlist API failure still restores the previous optimistic state and keeps its
  notification.
- Empty products / colours / blogs produce intentional editorial empty states —
  a rule, a line of Playfair, and one typographic link — without breaking the
  grid.
- `AsyncState` keeps its loading / error / success contract.

## Verification

1. `scripts/check-contrast-tokens.ts` — every token pair in `design.md` against
   the AA floor, including all four drench bands.
2. `npm run lint` · `npm run typecheck` · `npm test`.
3. `npm run build`.
4. Playwright across `320 / 375 / 414 / 768 / 1440` × `vi / en` for every public
   route: no horizontal overflow, no two-line clickable text, no clipped
   diacritic, keyboard focus order, `prefers-reduced-motion`, and the existing
   functional assertions (colour-family and swatch selection, wishlist signed-in
   and signed-out, product variant and add-to-cart, checkout step progression,
   auth form validation).
5. `npm run test:lighthouse` and `npm run test:bundle` — no regression against
   the current budgets. Removing `aurora-background`, the grain overlay and
   `animated-hero-section-1` from public pages should improve both.
6. Hallmark's 58-gate slop test per page, plus the pre-emit self-critique
   (Philosophy / Hierarchy / Execution / Specificity / Restraint / Variety, each
   ≥ 3).
7. `design.md` drift check — every restyled page stamps
   `/* Hallmark · genre: editorial · macrostructure: <name> · design-system: design.md · designed-as-app */`
   and no page contradicts the locked system.

## Out of scope

- Any `/admin` route or admin-only component
- API, Prisma, migration, auth, or authorization changes
- New products, colours, blog posts, dealers, or marketing claims
- VNPay / payment logic, order state machine, invoice generation
- New analytics, third-party services, or an image-generation pipeline
- New fonts (Playfair Display + Noto Sans are already loaded)
- Dark mode for public pages
