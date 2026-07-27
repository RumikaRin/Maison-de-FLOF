# LCP, CDN, and Early Streaming Design

## Goal

Raise the production Real Experience Score above 90 by addressing the measured
LCP path on `/vi` and `/vi/blog` without changing the approved Atelier
Editorial appearance or any commerce, authentication, locale, or content
contract.

The production field baseline supplied by the user is RES 84, LCP 4.17 seconds,
FCP 1.49 seconds, TTFB 0.94 seconds, INP 16 milliseconds, and CLS 0. The target
is p75 LCP below 2.5 seconds while preserving INP and CLS.

## Evidence and root causes

Fresh production-mode Lighthouse runs identify:

- Homepage lab LCP is the hero image. Its request starts at about 505 ms because
  the preload is emitted only after the streamed database-dependent page
  payload. Load delay and load time account for about 87 percent of LCP.
- Blog-index lab LCP is the featured image. It finishes loading near 210 ms but
  is held from paint for about 490 ms by the above-fold opacity animation.
- Every locale-prefixed public response currently carries `Set-Cookie:
  flof-locale=...` together with `s-maxage`. Vercel does not cache responses
  containing `Set-Cookie`, so the intended edge-cache policy cannot take
  effect.
- The homepage response is about 155 KB uncompressed and the blog response is
  about 48 KB. Blog listing payloads include full article bodies even though
  the listing and homepage journal use only card metadata.

## Approved approach

### 1. Make public HTML cacheable

Locale-prefixed rewrites will no longer set the locale cookie on their HTML
response. The URL remains the server-rendering authority for locale.

Language preference remains persistent because the existing language store
writes `flof-locale` when the user changes language. Middleware will continue
to read that cookie when redirecting an unprefixed URL and may set it on
redirect responses. Authentication, profile, cart, checkout, API, and admin
cache exclusions remain unchanged.

Public HTML keeps `s-maxage=300, stale-while-revalidate=600`. A regression test
must prove that a direct `/vi` or `/en` page response path does not attach
`Set-Cookie`.

### 2. Stream the homepage hero before database data

The homepage server component will start the data request without blocking the
initial shell. `HeroSection` renders before a Suspense boundary; the remaining
homepage sections render inside an async data component after
`getHomePageData` resolves.

`HomeClient` will stop owning the hero and will continue to own all interactive
catalogue state below it. The offline state applies to the data-dependent
sections; the editorial hero remains visible.

The homepage-level opacity transition in `MainLayoutWrapper` will be removed.
The hero image itself will render at full opacity on first paint. Existing
below-fold state transitions remain untouched.

### 3. Remove blog LCP render delay and excess payload

The blog listing's above-fold results wrapper will be server-visible and will
not start at opacity zero. Search and category updates may keep a state
crossfade after the first interaction, but the initial featured image cannot
be gated on hydration or animation.

A dedicated blog-card projection will query and serialize only listing fields:
identifier, localized titles and summaries, slug, image, category, author,
read time, and publication date. Article `content` and `contentEn` remain
available only on the detail route.

The homepage journal query will use the same card projection. Paint and colour
contracts remain unchanged in this pass.

### 4. Keep image quality restrained

The hero remains the same photograph and crop. Its Next image quality changes
from 92 to 82 to reduce transfer cost without changing dimensions or layout.
The featured blog image remains `priority`; no new placeholder, filter, or
visual treatment is introduced.

## Tests and measurement

- Unit/source-contract tests cover cacheable locale rewrites, early hero
  placement, no initial opacity gate on the homepage/blog LCP, and blog-card
  query projection.
- Lighthouse gate adds `/blog` and asserts median LCP at or below 2.5 seconds
  in addition to the existing performance, accessibility, best-practices, SEO,
  and CLS gates.
- Fresh production-mode measurements record HTML sizes, TTFB, LCP element,
  LCP phase breakdown, and total transferred bytes for `/vi` and `/vi/blog`.
- Run lint, typecheck, full tests, production build, bundle budgets, targeted
  Atelier E2E, and the Lighthouse gate.

## Non-goals

- No visual redesign.
- No database schema or migration changes.
- No Cloudinary migration or replacement of user-authored blog media.
- No caching of authenticated or commerce-sensitive responses.
- No change to locale-prefixed routes or localized link behavior.
