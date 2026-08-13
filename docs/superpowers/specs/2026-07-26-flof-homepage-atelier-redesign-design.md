# FLOF Homepage Atelier Redesign

**Date:** 26/07/2026  
**Status:** Visual direction approved; written specification awaiting review

## Goal

Redesign the customer homepage for homeowners and architects who want to
explore colour, buy paint, or request advice. The result must feel like a
premium paint atelier rather than a generic ecommerce template.

The redesign is limited to the homepage experience. Existing routes, API
contracts, database queries, cart behavior, wishlist behavior, authentication,
localization, and fallback states remain intact.

## Success criteria

- The page reads as one composed editorial journey, not a stack of unrelated
  rounded cards.
- Colour, material, finish, and room imagery carry the visual identity.
- The three primary journeys are immediately clear: explore colour, shop paint,
  and request advice.
- Vietnamese and English content remain supported without clipped controls or
  broken layout.
- Homepage data still comes from `getHomePageData(db)`.
- Product, colour, wishlist, cart, blog, visualizer, dealer, and quote links
  retain their current behavior.
- Desktop and mobile layouts pass keyboard, reduced-motion, and responsive
  checks.

## Approved direction

The approved direction is **Atelier Editorial**.

It combines:

- warm mineral surfaces instead of pure-white SaaS backgrounds;
- an espresso text field, restrained teal accents, and real colour swatches;
- Playfair Display for large editorial statements and the existing sans-serif
  family for functional copy;
- asymmetric image-to-copy proportions;
- hairline rules, baseline alignment, and typographic links;
- flat information structures instead of pill labels, nested cards, or icon
  grids.

The page must not use decorative gradients, floating orbs, fake numbered
eyebrows, repeated all-caps labels, excessive rounded containers, three equal
feature cards, or animation on every element.

## Page narrative

The homepage follows this order:

1. **Hero — colour as architecture**
   - Establish the brand with one cinematic room image and one decisive
     headline.
   - Primary path: explore the colour collection.
   - Secondary path: open the colour visualizer.
   - Avoid a full-viewport height that pushes all useful content below the
     fold.

2. **Product editorial — the right shade for every surface**
   - Replace the literal 50/50 split with an image-dominant asymmetric layout.
   - Let a narrow physical swatch rail cross the image/text boundary.
   - Use a large serif headline, a short practical description, two
     typographic links, and one flat specification ledger.
   - The ledger contains surface, space, and feature information already
     supported by the product story; it is not a new source of product data.

3. **Colour explorer — browse by atmosphere**
   - Preserve the existing family selection, swatch selection, wishlist, and
     related-product behavior.
   - Present colour families as a continuous colour field or editorial index,
     not as rounded tabs inside rounded cards.
   - Keep the selected room, selected swatch, code, name, and actions visible
     as one coordinated workspace.

4. **Visualizer — test colour in a real room**
   - Preserve links to `/color-visualizer` and `/colors`.
   - Use one large room stage with restrained controls and a clear before/after
     or selected-colour relationship.
   - Supporting benefits become a compact text ledger, not three equal icon
     cards.

5. **Store overview — choose the right buying path**
   - Present product catalogue, colour guidance, online purchase, and dealer
     access as a continuous editorial list.
   - Keep links to `/products`, `/find-dealer`, and `/quote-request`.
   - Use one lead image and strong rules instead of a repeated card grid.

6. **Featured products — merchandise with hierarchy**
   - Preserve product detail links, variant selection, pricing, promotions,
     cart actions, and loading/empty behavior.
   - Give the leading product greater visual weight; supporting products use a
     denser catalogue rhythm.
   - Product controls remain obvious and keyboard accessible without turning
     every piece of metadata into a badge.

7. **Expert journal — advice with editorial authority**
   - Preserve blog data and links.
   - Keep one featured article and a compact supporting list.
   - Use crop, title scale, and spacing for hierarchy rather than boxed cards.

## Component architecture

`src/app/page.tsx` remains the server data boundary. It fetches homepage data
and renders `HomeClient`.

`HomeClient` remains responsible for:

- composing homepage sections;
- maintaining colour wishlist state;
- synchronizing authenticated favorites through
  `/api/profile/favorites`;
- retaining local-storage fallback for signed-out visitors;
- preserving offline and data-fallback messaging.

Each section remains independently understandable and accepts its existing
props. Large visual changes stay inside the corresponding homepage component.
Small shared presentation primitives may be added under
`src/components/features/home/` when at least two homepage sections need the
same rule, link, or editorial heading treatment.

No API route, Prisma model, migration, authentication rule, or authorization
rule is changed by this redesign.

## Design system

### Colour

Use named OKLCH tokens for the homepage layer:

- `atelier-paper`: warm mineral background;
- `atelier-paper-soft`: light canvas;
- `atelier-ink`: near-black brown;
- `atelier-espresso`: dark editorial field;
- `atelier-muted`: supporting copy;
- `atelier-teal`: actions and focus;
- `atelier-rule`: low-contrast separators.

Existing Jotun tokens remain available to other pages. Homepage tokens must
not silently change the meaning of shared global tokens.

### Type

- Display: Playfair Display, already loaded by the application.
- Functional text: the existing sans-serif font from the root layout.
- Large headings use balanced line breaks and compact leading.
- Body copy remains at least 14px on customer-facing production screens.
- Uppercase is reserved for short technical metadata, not section headings.

### Shape and depth

- Main content surfaces are square or only minimally rounded.
- Depth comes from overlapping image, swatch, rule, and text planes.
- Shadows are limited to physical samples or controls that visibly sit above
  another surface.
- CTA hierarchy uses one solid action only where conversion requires it;
  supporting actions use text and hairline rules.

### Motion

- Motion level is restrained.
- Hero media may use one subtle load transition.
- Colour or product state changes may crossfade or slide a short distance.
- Scroll-triggered entrance animation is not repeated across every section.
- `prefers-reduced-motion` disables non-essential movement.

## Responsive behavior

### Desktop, 1200px and above

- Use a twelve-column editorial grid.
- Image/text sections may use approximately 7/5 or 8/4 proportions.
- Swatch rails may cross column boundaries without obscuring product details.

### Tablet, 768px to 1199px

- Preserve asymmetry where space allows.
- Collapse dense ledgers from four columns to two.
- Keep primary actions and selected colour information visible without
  horizontal scrolling.

### Mobile, below 768px

- Stack image before copy when the image explains the section.
- Convert crossing elements into in-flow rows.
- Keep tap targets at least 44px.
- Avoid oversized headings that produce single-word lines.
- Product and colour controls remain usable without hover.

## Accessibility

- Preserve semantic section headings and logical heading order.
- All interactive elements use native buttons or links.
- Visible `:focus-visible` treatment uses the teal action token with adequate
  contrast.
- Product, room, and blog images retain meaningful localized alt text.
- Colour information is never communicated by swatch alone; name and code
  remain visible.
- Selection, wishlist, cart, loading, error, and empty states remain announced
  through the existing accessible patterns.

## Error and fallback behavior

- A failed homepage query continues to use the existing fallback content and
  notice in `HomeClient`.
- Missing images use the current product-image and image-component fallback
  behavior.
- Wishlist API failure restores the previous optimistic state and preserves
  the current user-facing notification.
- Empty products, colours, or blogs produce intentional editorial empty states
  without breaking the section grid.

## Expected source changes

- `src/components/features/home/HeroSection.tsx`
- `src/components/features/home/PromotionSection.tsx`
- `src/components/features/home/ColorExplorerSection.tsx`
- `src/components/features/home/VisualizerPromoSection.tsx`
- `src/components/features/home/StoreOverviewSection.tsx`
- `src/components/features/home/FeaturedProductsSection.tsx`
- `src/components/features/home/ExpertBlogsSection.tsx`
- `src/components/features/home/HomeClient.tsx` only if composition or shared
  homepage state wiring needs a non-functional layout adjustment
- `src/app/globals.css` for scoped homepage tokens and shared editorial
  utilities
- focused homepage tests and browser checks

Shared navigation and footer structure, route inventory, database behavior,
and backend contracts are outside the redesign. Minor spacing integration at
the homepage boundaries is allowed, but no global navigation item may be
removed or renamed.

## Verification

1. Run focused unit tests for homepage data, wishlist, and cart behavior.
2. Run lint and TypeScript checks for changed files, then the configured full
   checks when safe.
3. Run the production build.
4. Use Playwright at desktop, tablet, and mobile widths to verify:
   - Vietnamese and English rendering;
   - primary and secondary homepage navigation;
   - colour-family and swatch selection;
   - wishlist behavior for signed-out and signed-in states where available;
   - product variant and add-to-cart behavior;
   - quote, dealer, blog, product, colour, and visualizer links;
   - keyboard focus order and reduced motion;
   - no horizontal overflow or clipped content.
5. Compare final screenshots against the approved Atelier Editorial direction,
   paying particular attention to the product feature block.

## Out of scope

- New products, colours, blog posts, or marketing claims
- API or database changes
- Checkout, payment, VNPay, authentication, admin, or profile redesign
- A full shared-header or shared-footer rebuild
- New analytics, third-party services, or image-generation pipeline

