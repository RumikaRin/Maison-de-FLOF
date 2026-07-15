# FLOF Performance And Security Optimization Design

Date: 2026-06-22

## Goal

Optimize Maison de FLOF so the storefront and admin feel faster under production conditions while preserving the current security model: Auth.js authentication, RBAC, checkout idempotency, payment verification, audit logging, CSP/HSTS headers, and rate limiting.

## Current Findings

- `npm run lint` passes with warnings for two raw `<img>` tags in admin chat and one missing React hook dependency in `AdminNotificationDropdown`.
- `npm run typecheck`, `npm test`, and `npm run build` pass.
- `npm audit` reports a moderate PostCSS advisory through Next's internal dependency.
- The homepage is `force-dynamic` and loads all active paints, colors, and blogs before sending them to a client component.
- Products and Colors pages also load full catalogs into client components.
- Global layout uses client-side mount gating and full-screen navigation loading, which can hide server-rendered content and make transitions feel slower.
- Global chat and animation-heavy components contribute to shared client JavaScript.
- Public PNG assets are large, commonly around 600-950 KB.
- `/api/auth/register` is under `/api/auth`, so it currently bypasses the general API middleware rate limiter.
- VNPay configuration has placeholder fallbacks and sandbox mode hard-coded, which can mask missing production secrets.
- Google OAuth uses `allowDangerousEmailAccountLinking: true`; this should not be enabled by default unless explicitly intended.

## Approach

Use a staged optimization pass focused on high-impact, low-regression changes first, then heavier asset and chunk improvements.

### Performance

1. Remove unnecessary first-render blocking in the layout so server-rendered page content can appear immediately.
2. Lazy-load non-critical global UI, especially chat support, so it does not inflate every route's initial JavaScript.
3. Lazy-load heavy admin chart code and keep admin dashboard data fetching scoped.
4. Replace raw avatar `<img>` tags in admin chat with `next/image`.
5. Add bounded SSR data limits for homepage content:
   - Featured/new/promotional paints should be capped to the amount shown by the UI.
   - Homepage color explorer should receive only the color set needed for first render.
   - Homepage blogs should be capped to the visible article list.
6. Keep full catalog browsing functional by preserving existing Products and Colors behavior, then introduce pagination or incremental loading only where the UI can support it safely.
7. Convert large local PNG assets to WebP/AVIF variants and update image references only where the rendered subject stays identical.
8. Preserve visual behavior where possible; performance changes should not remove core shopping, color, checkout, dealer, profile, admin, or chat features.

### Security

1. Add explicit rate limiting for `/api/auth/register`.
2. Apply public-form rate limiting for quote request and guest chat submissions if middleware coverage is not enough.
3. Make VNPay fail fast when required payment env vars are missing in production.
4. Make VNPay sandbox/production mode configurable through environment variables.
5. Disable dangerous Google email account linking by default, with an env-controlled opt-in if the project owner intentionally needs it.
6. Keep current RBAC helpers and middleware intact.
7. Keep checkout idempotency and stock/coupon transaction protections intact.

### Testing

Add focused tests for behavior that changes:

- Register/auth rate limit route matching or limiter behavior.
- VNPay production env guard.
- Existing security-commerce tests must keep passing.

Run the full verification sequence after implementation:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm audit --json`

## Expected Outcome

- Fewer lint warnings.
- Lower initial client JavaScript on routes that do not need chat/chart/map code immediately.
- Faster perceived first render because layout no longer blocks SSR output behind a mount-only loading screen.
- Smaller image transfer sizes for updated local assets.
- Public account registration is protected from high-volume abuse.
- VNPay cannot silently run with placeholder credentials in production.
- Google OAuth linking is safer by default.

## Out Of Scope

- Rewriting the design system.
- Replacing Auth.js, Prisma, or VNPay libraries.
- Upgrading to Next 16 or Prisma 7 in this pass.
- Removing existing business features.
- Changing database schema unless a security fix proves it is required.
