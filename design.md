<!-- Hallmark · genre: editorial · theme: studied-DNA (source: url+image) · designed-as-app
     studied: yes · DNA-source: https://www.farrow-ball.com/ (public reference for own brand)
     paper oklch(97.6% 0.006 85) · accent oklch(45% 0.090 210)
     display: Playfair Display (roman only) · body: Noto Sans -->

# Design — FLOF

Locked design system for the customer-facing app. Every page redesign reads this
file **first**; the per-build references in `.agents/skills/hallmark/references/`
defer to it. Where this file and a reference conflict, this file wins.

Do not regenerate per page. Amend intentionally — the file is the rule.

**Scope:** all public routes. `/admin/**` is explicitly **out of scope** and keeps
its current `.admin-shell` styling untouched.

## Genre

`editorial`

Content-led, colour-and-material-led premium retail. Not modern-minimal (this is
not a SaaS dashboard), not atmospheric (paint must be seen in daylight, not in a
dark room).

## Provenance

- **Source mode** · url + image. Six premium paint sites rendered in a real
  Chromium at 1440×1100, four folds each, plus computed styles read from the live
  DOM. Primary reference: `https://www.farrow-ball.com/` (2026-07-26). Secondary
  axes only: backdrophome.com (grid rules, radius-0 slabs), benjaminmoore.com
  (warm-grey paper), coatpaints.com (photographic fold), jotun.com/vn-vi
  (brand-adjacent baseline).
- **Second study (2026-07-27)** · `https://architecture-studio.aura.build/` and
  `https://luxury-furniture.aura.build/`, rendered the same way (Chromium
  1440×1100, 8 folds each, computed styles from the live DOM inside the
  template iframe). Moves absorbed, at the product owner's request: the
  drafting-grid vertical frame, the plate-line metadata strip under the hero
  fold, the painted band-edge wave, the 100rem full-size container, the hero
  copy cascade, the photo settle, the editorial image zoom, and the marquee —
  re-grounded as a swatch marquee of real catalogue colours. Their moves NOT
  carried over: italic display (banned here), numbered section labels (banned
  here), rounded card mattes (square-surface system), ghost/outline marquee
  type, invented testimonials.
- **Attestation** · (b) public reference for the user's own brand. The user
  instructed Hallmark to select and sample public references for FLOF.
- **Confidence** · Colour and font values are exact (read from live CSS). Rhythm
  is from a vision pass on real captures, not inferred — no URL-mode blind spot.
- **Never copied** · no pixels, no photography, no copy, no proprietary
  typeface. The DNA taken is structural: macrostructure, archetypes, colour
  anchor, type roles.

## Extracted DNA — what the system is built on

1. **The page is painted, not describing paint.** Whole sections take a real
   paint colour as their full-bleed background. This is the single strongest move
   in the reference and the primary identity of this system.
2. **Photographic folds.** Room photography is full-bleed and load-bearing; text
   sits *on* it, left-biased, never centred.
3. **Hairline rules separate sections — cards do not.** Section boundaries are
   1px rules and colour changes, never nested rounded containers.
4. **Ink is warm dark grey-brown, paper is warm off-white.** Neither is pure.
5. **One accent, small footprint.** Teal carries actions and focus only.
6. **Anti-patterns explicitly NOT carried over** (see `## Notes`).

## Macrostructure families

Pages within a family share the family's shape. They vary only in component
archetypes, and only where this file allows.

- **Marketing** · `08 Photographic` — full-bleed photographic fold, then
  alternating colour-drenched bands. Routes: `/`, `/colors`,
  `/color-visualizer`, `/find-dealer`, `/quote-request`.
- **Catalogue** · `11 Catalogue` — a visual index of inventory; the grid is the
  design. Routes: `/products`, `/blog`.
- **Content** · `02 Long Document` — continuous prose, inline section heads,
  asymmetric measure. Routes: `/products/[slug]`, `/blog/[slug]`.
- **App** · `05 Workbench` — function carries the page. Routes: `/cart`,
  `/checkout`, `/checkout/success`, `/profile`, `/login`, `/register`,
  `/forgot-password`, `/reset-password`, `/verify-email`.

## Shared chrome

- **Nav · N11 Mega-menu.** Top bar whose "Bảng màu" and "Sản phẩm" triggers open
  a full-width panel — colour families as real swatch cells, product ranges as a
  short index. Page dims behind a scrim. Knobs: `columns=3`,
  `feature cell=promo card`, `scrim=dim only`. Locale toggle, search, wishlist
  and cart stay in the bar. **No nav item may be removed or renamed.**
  The bar carries a **paint-chart strip**: a 3px run of the five band shades
  (sage · clay · slate · ochre · espresso) across its very top — the one piece
  of chrome that says "paint house" before a word is read. Static, token-only,
  added at the product owner's request; it is the bar's sole decoration.
- **Footer · Ft7 Newsletter-first.** The signup form is the primary element;
  wordmark, links and copyright sit beneath in muted 12px. Knobs:
  `layout=split (form left · meta right)`, `submit=arrow link`,
  `privacy line=yes`. Ft3 (4-column index + social row) is banned — it is the
  most recognisable AI fingerprint.
- Both are shared across every family, including App pages.

## Theme

Colour-drenched editorial on warm mineral paper. Teal is the only accent.

```css
/* Surfaces */
--fl-paper:          oklch(97.6% 0.006  85);  /* warm off-white, never #fff   */
--fl-paper-2:        oklch(94.8% 0.010  82);  /* recessed panel               */
--fl-paper-3:        oklch(91.5% 0.012  82);  /* input / hover well           */
--fl-espresso:       oklch(24.0% 0.016  50);  /* dark editorial field         */

/* Ink */
--fl-ink:            oklch(31.0% 0.014  55);  /* body + display, never black  */
--fl-ink-2:          oklch(52.0% 0.012  60);  /* supporting copy              */
--fl-ink-3:          oklch(63.0% 0.010  60);  /* metadata, disabled — AA 3:1  */
--fl-on-dark:        oklch(96.5% 0.008  85);  /* ink on espresso / drench     */

/* Photographic-fold scrim. Overlaid text is legible because of the scrim,
   never because the photograph happened to be dark in the right place. */
--fl-scrim-1:        oklch(24% 0.016 50 / 0.94);
--fl-scrim-2:        oklch(24% 0.016 50 / 0.62);
--fl-scrim-3:        oklch(24% 0.016 50 / 0.18);

/* Rules — hairlines carry every section boundary */
--fl-rule:           oklch(88.0% 0.008  82);
--fl-rule-strong:    oklch(78.0% 0.010  80);
--fl-rule-on-dark:   oklch(100%  0     0 / 0.22);

/* Action */
--fl-accent:         oklch(45.0% 0.090 210);  /* Jotun teal, darkened for AA  */
--fl-accent-hover:   oklch(39.0% 0.086 210);
--fl-accent-ink:     oklch(98.5% 0.004 210);
--fl-focus:          oklch(52.0% 0.110 210);

/* Feedback */
--fl-danger:         oklch(48.0% 0.150  27);
--fl-success:        oklch(46.0% 0.075 150);

/* Colour-drench bands — real paint values. Section backgrounds, full-bleed. */
--fl-drench-sage:    oklch(51.1% 0.027 149);  /* = Moss Green #8002 (#5C6B5E), a real catalogue shade */
--fl-drench-clay:    oklch(42.0% 0.072  38);
--fl-drench-slate:   oklch(40.0% 0.034 238);
--fl-drench-ochre:   oklch(74.0% 0.095  80);

/* Band-scoped, set by .fl-drench-<name>. Descendants inherit correct contrast
   from these two without any per-element override. Never set by hand. */
--fl-band:           <the band's drench value>;
--fl-band-ink:       <--fl-on-dark, or --fl-espresso on ochre>;
```

Rules that hold:

- **Accent footprint ≤ 5% of any viewport.** One solid teal action per viewport.
- **Drench footprint: 2–3 bands per marketing page.** Never two adjacent bands
  of the same drench, never a drench on an App page.
- Inside a drench band, links use `--fl-on-dark` + a 1px underline. Teal is
  invisible on a drench and must not be used there.
- Existing `jotun.*`, `warm.*` and shadcn HSL tokens stay declared so `/admin`
  and any un-migrated surface keep working. **They must not be redefined.**
- Every colour in every page must reference a token by name. No inline
  `oklch()` / hex / `rgb()` in component code.

## Typography

- **Display** · Playfair Display, weight 400–500, `font-style: normal`.
  **Italic headings are banned outright** — carry emphasis with weight, the
  accent colour, or a drawn underline. Tracking `-0.015em` at display sizes.
  Balanced line breaks (`text-wrap: balance`), leading `0.98–1.05`.
- **Body** · Noto Sans, weight 400/500/600. Measure 60–75ch on Content pages,
  45–60ch inside bands. **Minimum 14px on any customer-facing screen.**
- **Label** · Noto Sans 500 uppercase, `letter-spacing: 0.14em`, ≤ 11px.
  Reserved for short technical metadata (colour code, NCS, finish, order id).
  **Never for section headings.**
- **Bromise** is retired from public pages. It stays loaded only if `/admin`
  still uses it.
- Vietnamese diacritics: both faces ship `subsets: ["vietnamese"]` already —
  verify no display size clips `ẫ`, `ộ`, `ỹ` ascenders/descenders.

```css
--fl-text-2xs: 0.6875rem;                     /* 11px, labels only            */
--fl-text-xs:  0.8125rem;                     /* 13px, metadata               */
--fl-text-sm:  0.875rem;                      /* 14px, floor for body         */
--fl-text-md:  1rem;
--fl-text-lg:  1.125rem;
--fl-text-xl:  1.375rem;
--fl-text-2xl: 1.75rem;
--fl-text-3xl: clamp(2rem,   3.4vw, 2.75rem);
--fl-display-s: clamp(2.5rem, 5vw,  3.75rem);
--fl-display:   clamp(3rem,   7vw,  5.5rem);
```

Hero headline sizing is length-bracketed: ≤ 50 chars use `--fl-display`;
51–90 chars cap at `--fl-display-s`; > 90 chars rewrite shorter.

## Spacing

4-point scale, named. Pages use named tokens, never raw values.

```css
--fl-space-3xs: 0.25rem;  --fl-space-2xs: 0.5rem;   --fl-space-xs: 0.75rem;
--fl-space-sm:  1rem;     --fl-space-md:  1.5rem;   --fl-space-lg: 2rem;
--fl-space-xl:  3rem;     --fl-space-2xl: 4.5rem;   --fl-space-3xl: 7rem;
--fl-space-4xl: 10rem;
```

- Minimum `--fl-space-3xl` between major sections on Marketing pages.
- Section padding is **deliberately unequal** across a page. Equal padding on
  every section is the templated tell.
- **Container cap: `100rem` (1600px)** — raised from 86rem at the product
  owner's request after the luxury-furniture study: the page runs nearly
  full-bleed on common desktops, with only the clamped gutter left at the
  sides. Every shared surface (header, sections, plate line, footer) uses the
  same cap so the drafting frame stays continuous.
- Page container padding-inline: `clamp(1rem, 4vw, 1.5rem)` — content never
  kisses the screen edge.
- Editorial grid: 12 columns desktop; image/text splits at 7/5 or 8/4.

## Shape and depth

```css
--fl-radius-surface: 2px;   /* content surfaces are effectively square       */
--fl-radius-control: 3px;   /* buttons, inputs                              */
--fl-radius-swatch:  0px;   /* colour chips are hard-edged, like real chips  */
--fl-radius-pill:    999px; /* ONLY for filter chips and cart count badge    */
```

- Depth comes from **overlapping planes** — image, swatch rail, rule, text — not
  from shadow.
- **Drafting frame** (studied from architecture-studio.aura.build): consecutive
  paper sections on a Marketing page may carry two vertical hairlines at the
  container edges, running through the sections' full height — the page reads
  as a drawing plate. Two forms, `lg+` only: `EditorialSection frame` (overlay,
  survives section padding) and plain `border-x border-atelier-rule` on a
  page's content containers (`/colors`, `/find-dealer`, `/quote-request`). The
  frame breaks at drench bands and photo folds on purpose: where the page is
  painted, the paint wins.
- **Plate line**: the hero fold may hand off to a single hairline strip of
  real technical metadata on paper (`fl-label` cells, justified across the
  container) — an architectural title block. Never numbered, never invented.
- Shadow is allowed on exactly two things: a physical paint sample that sits
  above another surface, and an open mega-menu / drawer panel.
- **Card-in-card is banned.** A card may not contain another bordered or filled
  card.
- `.bezel-outer`, `.bezel-inner`, `.eyebrow-pill`, `.btn-island`,
  `aurora-background`, the body grain overlay, `animate-float` and
  `animate-aurora` are **removed from public pages**.

## Motion

Motion level: restrained. **Eight primitives, total** — grown from four at the
product owner's request after the aura.build studies; each remains CSS-only,
token-eased, and collapses under reduced motion.

```css
--fl-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--fl-ease-in-out: cubic-bezier(0.45, 0, 0.55, 1);
--fl-dur-fast: 160ms;  --fl-dur-base: 240ms;  --fl-dur-slow: 360ms;
```

Motion-upgrade tokens (2026-07-27, owner-approved expansion — full system in
`docs/superpowers/specs/2026-07-27-homepage-motion-upgrade-design.md`; this
section's prose will be reconciled after the homepage acceptance pass):

```css
--fl-dur-reveal: 640ms;   /* curtain/mask reveals at image-plate scale */
--fl-parallax-travel; --fl-parallax-zoom;  /* photograph-drift knobs (primitive 6) */
--fl-strip-amp;           /* slice-drift strip amplitude, per nth-child */
--fl-draw-len;            /* ornament stroke self-draw length, per ornament */
```

1. **Hero media load** — one opacity transition on the fold image. Once.
2. **State crossfade** — colour or product selection changes crossfade, or slide
   ≤ 8px. Opening panels (mega-menu, avatar menu, select dropdowns) ride the
   same primitive via the `.fl-panel-in` utility: one keyframed crossfade with
   a 4px slide, gated behind `prefers-reduced-motion: no-preference`.
3. **Nav scroll-condense** — the header bar tightens past a scroll threshold and
   expands again at the top: bar height steps down one notch, the wordmark
   scales to 0.9 from its left edge, the tagline drops. Added at the product
   owner's explicit request, so it is recorded here rather than left to drift.

   This is the one sanctioned exception to "animate `transform` and `opacity`
   only". The bar's `height` is transitioned because there is no honest
   transform equivalent, and it is safe here specifically: the header is a
   single `position: fixed` element and `main` carries a fixed top padding, so
   nothing below it reflows. The exception does not generalise — anywhere else,
   the rule stands. The threshold has hysteresis (condense at 72px, release at
   24px) so a scroll resting near the boundary cannot flutter, and every
   transition is `motion-safe:` so reduced-motion users get an instant switch.

4. **Section settle** — as a Marketing section first enters the viewport it
   settles once: an opacity crossfade `0 → 1`, no spatial travel. Added at the
   product owner's explicit request (a smoother scroll), so it is recorded here
   rather than left to drift.

   It is a crossfade rather than a rise on purpose: a translate on a full-bleed
   section root establishes a containing block that lets absolutely-positioned
   images escape the `overflow-x: clip` guard and widen the document on narrow
   viewports. The fade carries the settle with zero layout risk.

   Strict bounds keep it from becoming the banned "reveal on every section" slop:
   it is the single `.fl-rise` utility, **CSS scroll-driven only** (`animation-timeline:
   view()`), so it needs no JS and sets no inline style (the nonce CSP forbids
   both). No blur, no travel, no per-card stagger, no re-trigger — it runs once
   as the section arrives and never again. It is gated behind
   `@supports (animation-timeline: view())` and `prefers-reduced-motion: no-preference`,
   so any browser without support, and every reduced-motion user, gets the fully
   settled section immediately. The hero is exempt: its fold image already owns
   primitive 1.

5. **Hero copy cascade** — `.fl-hero-cascade`: the hero copy column settles
   line by line on load (label → headline → subtext → actions), each sliding
   down 14px and fading, 90ms apart. Studied from luxury-furniture.aura.build's
   letter cascade, deliberately carried at *line* level — per-letter splits are
   theatre this system doesn't need. Load-once, hero only.

6. **Photograph drift** — a photograph is never quite static inside its plate.
   Transform-only, on the image (or a bare wrapper) inside an `overflow: hidden`
   plate — never on a section root (see primitive 4's containing-block note).
   CSS scroll-driven, same `@supports` + reduced-motion gates as `.fl-rise`.

   **The plate must carry `.fl-photo-plate`.** Both utilities read a *named*
   view timeline, not the anonymous `view()`. This is not stylistic: `view()`
   binds to the subject's nearest ancestor scrollport, and an `overflow: hidden`
   plate *is* a scroll container — so an image inside one gets a timeline over
   a box that never scrolls and the browser pins its progress at 50% forever.
   The transform applies, nothing moves, nothing warns. Naming the timeline on
   the plate makes the plate the subject, measured against the document
   scroller. A plate missing the class leaves the timeline inactive and the
   image simply holds its first keyframe — still covering the plate, just
   static. Degrades silently, never breaks.

   Two utilities:

   - `.fl-photo-parallax` — the crop drifts vertically for as long as the plate
     is on screen (`animation-range: cover 0% cover 100%`). The layout box never
     moves. Scroll-*linked*, so the drift tracks the wheel exactly and cannot
     fall out of sync the way a JS rAF loop does — that, not a longer duration,
     is what reads as smooth. Timing is `linear` by rule: easing would make the
     image accelerate against a constant scroll and read as lag. The image is
     over-scaled by more headroom than it travels (±4% at 1.14 scale), so no
     edge of the plate is exposed; `.fl-photo-parallax-soft` (±2.5% at 1.09)
     is for sources whose resolution cannot afford a 14% crop. It never shares
     an element with a hover transform — the animation would win and the hover
     would silently die, so the drift goes on a wrapper and the two compose.
     Added at the product owner's request (a smoother scroll on the imagery),
     so it is recorded here rather than left to drift.

     **At most four per page**, on the largest photographs only. Applied to
     every thumbnail it becomes the "reveal on every card" slop this system
     bans.

   - `.fl-photo-rise` — a one-shot arrival instead: 1.045 scale easing to rest
     as the plate enters. Kept for photographs that also carry a state
     crossfade, where a continuous drift would fight the swap.

7. **Swatch marquee** — `SwatchMarquee`: one slim hairline-bounded strip of
   real catalogue colours drifting sideways (48s linear loop, track holds the
   list twice and travels −50%). The honest adaptation of the reference's
   marquee: every cell is a real shade with its name and code. **At most one
   per page.** Pauses on hover; reduced-motion stops it and the first copy
   reads as a static index. Ghost/outline display-type marquees stay banned.

8. **Editorial image zoom** — imagery inside an `overflow-hidden` plate may
   ease to `scale(1.03)` on link hover (`duration-fl-slow`). The *plate* never
   moves and no box is scaled — this is the crop breathing, not a card lift.
   `motion-reduce:transform-none` always rides along.

Everything else is cut. No heavy scroll entrance (blur, travel > 8px, or
staggered per-card choreography) repeated across sections, no `transition: all`,
no scaling of cards or containers themselves, no bounce/overshoot on UI state.
Animate `transform` and `opacity` only.

`prefers-reduced-motion: reduce` collapses all spatial motion to a ≤ 150ms
opacity crossfade.

## Microinteractions stance

- Silent success over celebratory toast. Optimistic update + Undo over a
  confirmation dialog.
- Hover tooltip delay 800ms; focus tooltip delay 0ms.
- `:focus-visible` ring: 2px `--fl-focus`, offset 2px, **never animated** — it
  appears instantly. On drench bands the ring switches to `--fl-on-dark`.
- Every interactive element ships all eight states: default · hover ·
  focus-visible · active · disabled · loading · error · success.

## CTA voice

- **Primary** · solid `--fl-accent`, `--fl-accent-ink` text, `--fl-radius-control`,
  padding `--fl-space-xs --fl-space-lg`, no gradient, no shadow, no pill.
  One per viewport, only where conversion requires it.
- **Secondary** · `C3 Typographic link` — the word, a `→`, and a 1px underline
  that thickens on hover. No box, no fill.
- **Tertiary** · `C1 Outlined chip`, rectangular, hairline border. Filters only.
- Copy is a verb + object in the active voice: *Xem bảng màu*, *Thêm vào giỏ*,
  *Đặt lịch tư vấn*. Never *Learn more* / *Tìm hiểu thêm* as a primary action.

## Colour mode

**Public pages are light-only.** Paint must be judged in daylight, and a dark
theme fights the colour-drench bands outright. The `next-themes` provider and
the `.dark` token block stay in place for `/admin`; public routes force light.

## Per-page allowances

- **Marketing** MAY use enrichment, Tier-A (pure CSS) or Tier-B (hand-built SVG)
  only. 2–3 drench bands. The stock Tier-B primitive is `BandEdge` — a drench
  band arriving as an irregular painted wave with two echo ridge lines, the way
  a loaded brush leaves its edge. At most one per page, always directly above
  the band whose colour it carries.
- **Catalogue** MAY use one drench band as a section divider. No enrichment.
- **Content** typography only. No drench, no enrichment.
- **App** MUST NOT use enrichment, drench bands, or display type above
  `--fl-text-2xl`. Function carries the page.

## What pages MUST share

- The wordmark and the N11 nav; the Ft7 footer.
- `--fl-accent` and its ≤ 5% placement.
- Playfair Display (roman) + Noto Sans.
- The CTA voice — shape, radius, padding rhythm, copy pattern.
- Hairline-rule section boundaries and the square-surface shape language.
- The motion primitives and the reduced-motion fallback.

## What pages MAY differ on

- Macrostructure, within the family declared above.
- Hero archetype, within the family's allowance.
- Which drench colours a Marketing page uses, and how many (2 or 3).
- Enrichment, Marketing only, Tier-A or Tier-B.

## Accessibility floor

- Contrast: body text ≥ 4.5:1, large display ≥ 3:1, focus ring ≥ 3:1 — on paper
  **and on every drench band**. Verified programmatically, not by eye.
- Every interactive element is a native `<button>` or `<a>`.
- Tap targets ≥ 44×44px below 768px.
- Colour is never the sole carrier of information — a swatch always shows its
  name and code.
- Images keep meaningful localised alt text; heading order stays logical.
- No horizontal scroll at 320 / 375 / 414 / 768px. `overflow-x: clip` on `html`
  and `body`, never `hidden`.
- No two-line clickable text on buttons, nav links, footer links or CTAs.
- Image-bearing grid tracks use `minmax(0, 1fr)`, never bare `1fr`.

## Notes — anti-patterns NOT to carry over

Extracted from the references and from FLOF's current code. These are part of
this system's identity; a page that reintroduces one is drifting.

- Three equal cards with a filled panel background (Farrow & Ball's inspiration
  row, COAT's icon triad). Hallmark gates 3 and 4.
- Centred hero headline over a photograph (Jotun VN). Gate 6.
- Italic display headings (COAT). Gate 38a.
- Pill-shaped CTAs used for every action.
- Centred section headings.
- Decorative gradients, floating orbs, aurora fields, grain overlays.
- Fake numbered eyebrows (`01 · BỘ SƯU TẬP`) and repeated all-caps labels.
- Nested rounded containers; bezel/double-frame treatments.
- Heavy scroll-reveal on every section — blur, travel > 8px, or staggered
  per-card choreography. The one sanctioned form is the `.fl-rise` section
  settle in § Motion (opacity crossfade, once, CSS scroll-driven).
- Invented metrics and testimonials. If FLOF has no number for it, the layout
  changes — the number is not fabricated.

## Exports

`src/app/globals.css` is the in-project source of truth; it declares every
token above under `:root` and is **append-only** (the `@tailwind` directives and
existing token blocks stay). Tailwind consumes them via `tailwind.config.ts`
`theme.extend`.

For a portable `tokens.css`, Tailwind v4 `@theme`, DTCG `tokens.json`, or
shadcn/ui variable mapping, ask *"extend design.md with <format> exports"*.
