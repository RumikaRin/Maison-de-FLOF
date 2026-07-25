# FLOF Release Quality Gates Design

**Date:** 2026-07-24
**Status:** Approved for planning
**Repository:** `D:\ProjectZ\FLOF`
**Branch:** `feature/homepage-targeted-polish`
**Deployment flow:** Local implementation and verification → GitHub push → automatic Vercel Preview
**Database policy:** Tests use isolated local PostgreSQL; Neon production is not a test database
**Scope exclusion:** VNPay remains a simulation and is not modified or certified by this work

## 1. Goal

Close the five highest-priority residual findings from the audit:

1. add real database integration tests for authentication, authorization,
   ownership, checkout, audit, and email outbox;
2. add browser E2E coverage for the non-VNPay customer and admin order journey;
3. prevent fallback catalog data from entering a commerce flow;
4. add reproducible operational gates for cron, email, rate limiting, database,
   backup readiness, monitoring, and alerting;
5. reduce script CSP risk, standardize critical API errors, publish a verified
   OpenAPI contract, and add accessibility and performance gates.

The target is stronger release evidence without splitting the modular monolith
or introducing a second hosted application/database project.

## 2. Chosen approach

Use balanced, staged hardening in the existing Next.js application:

- PostgreSQL runs locally in Docker for integration and E2E tests.
- Prisma migrations create the test schema.
- Small deterministic fixtures create only the users, roles, catalog, coupon,
  and order data required by each suite.
- Node integration tests exercise real Prisma operations and domain services.
- Playwright exercises the application through HTTP and a real browser.
- GitHub Actions runs the same isolated database and quality gates.
- Vercel remains the post-push Preview verifier, not the primary test runner.
- Neon production is used only for approved migrations and read-only
  post-deployment checks.

An exhaustive rewrite of all 52 route handlers is rejected because it would
create an oversized, difficult-to-review change. Documentation-only gates are
also rejected because they would not close the runtime findings.

## 3. Test database architecture

Add `docker-compose.test.yml` with a PostgreSQL service bound only to localhost
and a dedicated database name that includes `test`. The test URL is explicit
and separate from `.env`.

Test database scripts must:

- refuse to run destructive cleanup unless the database name includes `test`;
- deploy the committed Prisma migrations;
- load deterministic fixtures without calling the production seed;
- clean only known test tables;
- disconnect Prisma clients after each suite;
- never read or print production connection strings.

GitHub Actions uses a PostgreSQL service container with the same database name
and runs the same migration and fixture commands.

## 4. Integration test boundaries

Integration tests cover behavior that unit tests cannot prove:

- unauthenticated requests receive 401;
- authenticated users without permission receive 403;
- customers cannot read or mutate another customer's resources;
- checkout creates an order and payment atomically;
- checkout decrements stock once and writes inventory history;
- reused idempotency keys return the original order and reject changed payloads;
- insufficient stock rolls back order, payment, and stock mutations;
- admin mutations create sanitized audit records;
- COD checkout creates an email outbox record;
- outbox delivery failures remain retryable and are never marked `SENT`.

The service layer should accept explicit dependencies where necessary so the
tests can use a dedicated Prisma client without replacing production behavior.
No test-only backdoor is added to application routes.

## 5. E2E browser journeys

Playwright runs against a locally started production build connected to the
test database. Tests use fixture accounts and must not call external providers.

Required journeys:

1. register or log in with a fixture customer;
2. browse a database-backed product;
3. add the product to the cart;
4. complete checkout using COD;
5. verify the order appears in the customer profile;
6. log in as an admin;
7. update the order status and verify the visible result.

VNPay, real email delivery, Google OAuth, Cloudinary uploads, and destructive
admin actions are excluded. Tests clean their own orders and user data.

## 6. Catalog fallback commerce safety

Catalog loaders return both data and provenance:

```ts
type CatalogSource = "database" | "fallback";

type CatalogResult<T> = {
  data: T;
  source: CatalogSource;
  commerceAvailable: boolean;
};
```

Database results set `commerceAvailable: true`. Static fallback results set it
to `false`.

The source state flows from server loaders into homepage and product catalog
components. When fallback is active:

- the page shows a clear, non-alarming availability notice;
- add-to-cart and buy-now controls are disabled;
- cart and checkout navigation cannot be initiated from fallback products;
- no fallback product is persisted into the cart store;
- the order API continues to re-read products, prices, colors, and stock from
  PostgreSQL and remains the authoritative final gate.

Color browsing and editorial content remain viewable during a database outage.

## 7. Operational release gates

Add executable checks instead of claiming external systems are configured:

- validate `vercel.json` cron paths and schedules;
- validate required environment variable names without reading values;
- verify production rate limiting cannot silently use memory-local counters;
- verify email delivery is stubbed in tests and outbox retry state is correct;
- verify Prisma migration status against the isolated database;
- document Neon backup/PITR and restore-drill evidence as an explicit manual
  release gate;
- query Vercel Preview build/runtime errors after each pushed release commit;
- keep production cron execution, Resend delivery, Upstash health, backup/PITR,
  monitoring, and alert routing marked unverified until direct evidence exists.

The project must not fabricate passing results for external services that are
not connected to the test environment.

## 8. CSP and API contract

### CSP

Generate a per-request nonce in middleware and attach it to the request and
response policy. Remove `unsafe-inline` from `script-src` while keeping the
minimum style compatibility needed by React and Framer Motion. Development may
retain `unsafe-eval`; production may not.

Regression tests verify:

- production `script-src` contains a nonce;
- production `script-src` excludes `unsafe-inline` and `unsafe-eval`;
- `object-src 'none'`, `base-uri 'self'`, and `frame-ancestors 'none'` remain;
- pages render successfully in the production build.

### API errors and OpenAPI

Critical APIs use a stable error envelope:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Forbidden",
    "requestId": "vercel-or-generated-request-id"
  }
}
```

The first contract covers authentication, products, colors, orders, profile,
coupon validation, quote request, and admin order operations. Existing clients
are updated in the same change. Raw database/provider errors are never returned.

Create an OpenAPI 3.1 document for these critical routes. CI validates the
document and checks representative route/status/schema mappings. Remaining
routes keep their current behavior until migrated in later focused work.

## 9. Accessibility and performance gates

Playwright plus axe scans the homepage, products, colors, login, cart, checkout,
profile, quote request, and an admin order page. The gate fails on critical and
serious violations.

The implementation fixes issues found in touched flows, beginning with:

- programmatic labels for quote and checkout fields;
- accessible names for icon-only actions;
- visible focus states;
- heading hierarchy and landmark checks;
- status/error announcements.

Lighthouse CI runs against the local production build. Initial thresholds are
deliberately realistic:

- accessibility: at least 90;
- best practices: at least 85;
- SEO: at least 85;
- performance: warn below 70 rather than fail the release.

Thresholds may only be raised after fresh measurements; they are not lowered to
hide regressions.

## 10. Verification and release flow

The local release gate is:

1. start isolated PostgreSQL;
2. deploy migrations and fixtures;
3. run lint and typecheck;
4. run unit and database integration tests;
5. build and start the production server;
6. run Playwright E2E and axe scans;
7. validate OpenAPI;
8. run Lighthouse CI;
9. run dependency audit and `git diff --check`;
10. stop containers and local servers.

After the local gate passes, commit and push the scoped changes. Vercel Git
Integration creates the Preview. Verify Preview page/API health and runtime
errors, then update Draft PR #2. Do not merge or promote production without a
separate user decision.

## 11. Safety constraints

- Do not modify VNPay source or tests.
- Do not seed, reset, truncate, or mutate Neon production for testing.
- Do not print secrets or connection strings.
- Do not merge Draft PR #2 automatically.
- Do not create another Vercel application or Neon project.
- Preserve unrelated `.ai-understand/` files as untracked user data.

## 12. Acceptance criteria

This work is complete when:

- all listed local gates run from documented commands;
- integration tests prove the database transaction and authorization behavior;
- E2E proves the COD customer/admin order journey;
- fallback catalog products cannot enter cart or checkout;
- production script CSP no longer contains `unsafe-inline` or `unsafe-eval`;
- critical API errors and OpenAPI schemas agree;
- axe has no critical/serious violations on scoped pages;
- Lighthouse meets the defined thresholds;
- the final GitHub commit has a READY Vercel Preview with no observed runtime
  errors;
- the audit report records evidence and remaining external verification gaps.
