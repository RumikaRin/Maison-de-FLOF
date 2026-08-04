# FLOF sitewide mobile optimization — verification evidence

Date: 2026-08-04

## Scope delivered

- Route-aware fixed-surface policy for browse, product, cart, checkout, account,
  legal, and admin routes.
- Accessible shared mobile sheet, mobile catalogue/color controls, product and
  cart contextual actions, and a compact checkout order-summary disclosure.
- Safe-area spacing, focus handling, reduced-motion support, and a checkout
  address-placeholder contrast correction.
- Regression coverage for responsive routes, mobile surfaces, accessibility,
  browser matrix, checkout/COD flow, and isolated commerce fixtures.

## Verification results

All commands below completed with exit code 0 against the isolated local
Postgres test database (`flof_test`).

| Gate | Result |
| --- | --- |
| Focused mobile policy and sheet contracts | 2 Node tests passed |
| Mobile-surface Playwright suite | 4/4 Chromium passed |
| Responsive journeys | 13/13 Chromium passed |
| Accessibility suite | 22/22 Chromium passed |
| Atelier responsive-route suite | 47/47 Chromium passed |
| Visualizer suite | 2/2 Chromium passed |
| COD order journey | 1/1 Chromium passed |
| Browser matrix smoke | 5/5 (Chromium, Firefox, WebKit, mobile Chromium, mobile WebKit) passed |
| Full E2E | 133/133 passed in 188 seconds |
| Static gates | `npm run lint`, `npm run typecheck`, `npm test` (200 tests), and `npm run build` passed |
| Performance release gate | Lighthouse passed: 3 samples each for `/`, `/products`, `/blog`, and `/login` |
| Bundle release gate | Passed; shared 100.4 KiB; `/` 140.7 KiB; `/products` 134.6 KiB; `/colors` 134.1 KiB; `/blog` 128.4 KiB |

The expected test-mode logs for rejected credential attempts and unavailable
email delivery providers were observed without making their tests fail.

## Test harness corrections discovered during verification

- Commerce fixture reset now clears persisted `CartItem` rows before restoring
  stock. Without this, prior browser runs could leave the fixture customer with
  an accumulated cart and correctly trigger an out-of-stock API response.
- Browser CSP smoke ignores runtime sizing attributes on MapLibre `canvas`
  elements while retaining the prohibition on inline styles in application
  markup.
- Mobile filter focus assertion now identifies the exact trigger rather than
  also matching the sheet's “close filters” control.
- Public-route settling waits for rendered `main`; MapLibre and chat polling
  intentionally keep network activity active, while the overflow assertion
  itself retains its short retry.

## Contract and release boundary

No backend/API schema, Prisma migration, authentication decision, payment
request, cart price calculation, or admin business workflow was changed by the
mobile implementation. The test database remains a local Docker service.

These results are local release-gate evidence only. They do not establish
production CDN cache HIT rates, production Lighthouse field percentiles, or
real email-provider delivery.

## Related implementation commits

`09f67e1`, `a5fd8e5`, `8fb1e43`, `acfa804`, `6e524f5`, and `66e4dd6` follow
the accepted specification in `69bd49e`.
