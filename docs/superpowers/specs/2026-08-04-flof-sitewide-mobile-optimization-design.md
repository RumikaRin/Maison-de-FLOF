<!-- Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V4 -->

# FLOF Sitewide Mobile Optimization Design

**Date:** 2026-08-04
**Status:** Approved for specification review
**Scope:** Every public customer route; `/admin/**` remains out of scope.

## Goal

Make FLOF feel intentionally designed for touch without turning it into a generic
native-app shell. The mobile experience must balance colour discovery, catalogue
browsing, product purchase, checkout, account, and long-form reading while
preserving the locked Atelier Editorial design system in [`design.md`](../../../design.md).

## Non-goals

- No API, Prisma, migration, authentication, authorization, cart, wishlist,
  payment, locale-routing, or server-data-boundary changes.
- No change to the public light-only colour mode, the Playfair Display + Noto
  Sans pairing, or the Atelier token set.
- No redesign of `/admin/**`.
- No new analytics, third-party service, font, image pipeline, or route tree.

## Existing-state constraints

The workspace has uncommitted mobile work in `MobileBottomBar`, catalogue
filtering, product purchase behavior, global CSS, and layout wiring. Its useful
intent is retained, but none of it is presumed correct until it passes this
design's policy and verification gates.

The current global bottom bar, product sticky purchase bar, and cart sticky
checkout bar can coexist on narrow screens. The redesign replaces that accidental
stacking with a route-aware surface policy. The current mobile bar also needs to
use Atelier tokens only, remain light-only on public routes, and never render on
admin routes.

## Responsive contract

| Range | Role | Layout rule |
|---|---|---|
| 320–767px | Touch-first mobile | One primary task column; 44×44px targets; no hover-only behavior; safe-area aware fixed surfaces. |
| 768–1279px | Compact/tablet | Content can regain multi-column layouts where the content has room; no mobile bottom navigation. |
| 1280px and above | Desktop | Existing mega-menu and desktop layout remain the regression baseline. |

Every public route is verified at 320, 375, 414, 768, and 1440 CSS pixels in
Vietnamese and English. Breakpoints respond to content failure, not device names.
`html` and `body` retain `overflow-x: clip`; interactive labels remain one line;
image grids use `minmax(0, 1fr)` tracks.

## Mobile surface policy

One route-derived policy decides which persistent or overlay surfaces may appear.
It is the only source of truth for `Header`, `MobileBottomBar`, sticky actions,
page bottom padding, and `ChatBubble` placement.

| Route mode | Routes | Header | Bottom navigation | Context action | Chat |
|---|---|---|---|---|---|
| `browse` | `/`, `/products`, `/colors`, `/color-visualizer`, `/find-dealer`, `/blog` | Fixed compact header | Visible below 768px | None | Above the bottom navigation |
| `product` | `/products/[slug]` | Fixed compact header | Hidden | Sticky purchase action after its in-flow purchase control has passed | Hidden while the purchase action is visible |
| `transaction` | `/cart`, `/checkout`, `/checkout/success`, `/quote-request` | Fixed compact header | Hidden | Cart owns a sticky checkout action only when non-empty; checkout owns its submit action in flow | Hidden |
| `account` | `/profile`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` | Fixed compact header | Hidden | No global sticky action | Hidden |
| `reading` | `/blog/[slug]`, privacy, cookie, and terms routes | Fixed compact header | Hidden | None | Optional only when it does not cover copy or controls |

The five destinations in bottom navigation are Home, Products, Colors,
Visualizer, and Cart. It is a discovery shortcut, not the entire sitemap; the
header menu remains the complete route, locale, and account entry point. Routes
not represented by a tab simply have no active tab.

### Layer and safe-area contract

Only one contextual fixed action may exist on a page. The stack is semantic and
shared across components:

1. Scroll content and footer.
2. Optional chat bubble, positioned above the active bottom inset.
3. Contextual action (`product` purchase or `transaction` checkout).
4. Browse-only bottom navigation.
5. Fixed header.
6. Modal/sheet/drawer and its scrim.
7. Toasts only when they are actionable and must remain visible above a modal.

The policy exposes a single bottom inset for the active surface. `main`, footer,
chat, and a contextual action consume that inset instead of each maintaining
separate hard-coded `bottom-*` offsets. All fixed surfaces include
`env(safe-area-inset-bottom)`; no page content or footer link can be covered by a
bar.

### Shared mobile sheet

`MobileSheet` is a presentation primitive for the header menu, catalogue filter,
and color detail drawer. Feature components keep their own open state and data;
the primitive owns only the accessibility and visual-shell behavior:

- `role="dialog"`, `aria-modal="true"`, labelled title, and a native close control.
- Focus enters the first meaningful control, remains within the open sheet, and
  returns to the opening trigger after close.
- Escape and scrim close the sheet; the background is scroll-locked while open.
- The scrim dims without blur; panel motion is an opacity/short transform
  transition using existing motion tokens, with an instant reduced-motion path.
- The sheet is above header, bottom navigation, contextual actions, and chat.

## Page-family patterns

### Marketing and discovery

Marketing routes retain their photographic, colour-drenched editorial rhythm.
On mobile, hero copy remains left-biased and actions stack only when their row no
longer fits. Colour explorer, visualizer, and dealer search give their main
interactive region the greatest vertical space; they do not add nested cards or
fixed controls beyond the shared policy. Browse routes retain the bottom
navigation.

### Catalogue

The product catalogue gains one mobile toolbar: filter entry, active-filter
count, item count, and an explicit one- or two-column grid choice. Two columns
are the default; one column is a user-controlled reading mode rather than a
breakpoint accident. Filter controls live in `MobileSheet`, preserve current
filter semantics, and are applied immediately. The primary action ends with a
single-line localized result count.

The blog index keeps its editorial leading item and compact list, but follows
the same spacing, touch-target, overflow, and safe-area rules as catalogue
routes.

### Product detail and long-form content

Product detail prioritizes color/variant choice, price, and adding to cart. Its
sticky purchase action appears only after the in-flow purchase control has
scrolled past, and replaces the bottom navigation rather than sitting above it.
It shows the selected paint and final price in a truncation-safe summary and
reuses the existing add-to-cart state and feedback behavior.

Blog detail and legal documents remain reading surfaces: no bottom navigation,
no conversion bar, a comfortable measure, and no new floating chrome. Links and
in-prose controls retain their existing semantics.

### Cart, checkout, profile, and authentication

Cart has one mobile checkout action when its contents are non-empty. It replaces
the global bottom navigation and uses the shared safe-area inset. Checkout keeps
its current step flow, validation, payment selection, and VNPay path; the order
summary is a compact disclosure before payment rather than a competing sticky
surface. Auth, profile, and legal task flows use a single content column below
768px. Existing profile tabs keep their state; their navigation becomes a
touch-friendly disclosure or horizontally managed tab treatment only when needed
to keep all labels readable and one-line.

## Data, behavior, error, and localization contracts

- Server components remain the data boundary. Existing page queries and
  client-state ownership are unchanged.
- `ProductsClient` owns filters and grid choice; `ProductClient` owns selected
  paint, price, and add-to-cart; cart and checkout retain their current stores,
  handlers, and redirects.
- Responsive presentation never changes API payloads, URL locale handling,
  optimistic wishlist/cart rollback, image fallbacks, or loading/error states.
- Empty, loading, and error states keep their current components and messages;
  their retry and primary controls follow the same 44px, focus, and one-line
  requirements as successful states.
- New labels use dictionary keys in both languages. No new user-visible English
  or Vietnamese string is hard-coded in a component.

## Implementation boundaries

Expected files, subject to the detailed implementation plan:

- Create `src/lib/mobile-surface-policy.ts` to classify public paths and derive
  visible surfaces/insets.
- Create `src/components/ui/mobile-sheet.tsx` for accessible sheet behavior.
- Modify `src/components/layout/Header.tsx`, `MobileBottomBar.tsx`,
  `MainLayoutWrapper.tsx`, `ChatBubble.tsx`, and `src/app/layout.tsx` to consume
  the policy without changing route behavior.
- Append policy utilities and token-based safe-area rules in
  `src/app/globals.css`; do not replace existing global or admin CSS.
- Complete or adjust the in-flight presentation changes in `ProductsClient.tsx`,
  `ProductClient.tsx`, `src/app/cart/page.tsx`, `ColorsClient.tsx`, and any
  profile/checkout presentation component proven necessary by the audit.
- Add focused unit and Playwright tests. Existing responsive and Atelier E2E
  gates remain and are extended rather than replaced.

No production file or directory is deleted. The source changes already in the
working tree are preserved for review and either integrated or adjusted in
place.

## Accessibility and performance floor

- Every rendered mobile control is at least 44×44px, with visible non-animated
  `:focus-visible` at the required contrast.
- Opening a sheet does not leave keyboard focus behind the scrim; closing it
  restores focus. No hover interaction is the only way to complete a task.
- Public pages remain light-only and use Atelier tokens; raw component hex
  colors and public dark-mode classes are removed from the mobile work.
- Reduced motion suppresses spatial motion. No spring/bounce motion is added to
  panels, and no layout property is animated.
- Images retain dimensions, priority rules, lazy loading, and localized alt
  behavior. The mobile work adds no blocking hero asset or duplicate client
  navigation bundle.

## Verification matrix

1. Unit tests for the route policy: every route mode returns the allowed
   surfaces, never renders a public mobile bar on `/admin/**`, and never permits
   a bottom navigation beside product/cart contextual actions.
2. Component-level tests for sheet close paths, focus return, scroll-lock
   cleanup, `prefers-reduced-motion`, and localized labels.
3. Playwright at 320, 375, 414, 768, and 1440px in Vietnamese and English across
   every public route: no horizontal overflow, no wrapped primary controls, no
   clipped Vietnamese diacritics, correct safe-area spacing, and 44px targets.
4. Journey tests for mobile menu, filter sheet, one/two-column selection,
   product variant/add-to-cart, cart checkout, checkout validation, and profile
   navigation. Each sheet must pass keyboard, Escape, scrim, and focus-return
   assertions.
5. Regression gates: `npm run lint`, `npm run typecheck`, `npm test`,
   `npm run build`, `npm run test:e2e`, `npm run test:lighthouse`, and
   `npm run test:bundle`.

## Spec self-review

- **Placeholders:** none; route modes, allowed surfaces, and verification are
  explicit.
- **Consistency:** the policy hides the bottom navigation in every mode with a
  contextual conversion action, matching the approved foundation.
- **Scope:** source changes are presentation-only and isolated from admin and
  business logic.
- **Ambiguity resolved:** "whole site" means every public customer route,
  including account, auth, legal, reading, and conversion flows; `/admin/**`
  remains excluded.
