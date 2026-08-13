# FLOF API Contract and HTTP Quality Gates Design

**Date:** 2026-07-25

**Status:** Approved design, awaiting written-spec review

**Scope:** Direct HTTP integration coverage, complete OpenAPI operation
inventory, and GitHub Actions runtime modernization

**Explicit exclusions:** No production database mutation, no Neon reset or
restore drill, no live provider write, and no VNPay remediation.

## Context

The current repository has:

- 52 `src/app/api/**/route.ts` files exporting 99 HTTP operations:
  42 GET, 27 POST, 18 PATCH, and 12 DELETE; Auth.js exports GET/POST through
  handler destructuring rather than async function declarations;
- OpenAPI 3.1 coverage for 9 critical paths;
- service-level PostgreSQL integration coverage for catalog, checkout, order
  ownership, audit, outbox, review, quote, and authenticated chat;
- Playwright session helpers for CUSTOMER and ADMIN;
- GitHub Actions using Node 24, but `actions/checkout@v4` and
  `actions/setup-node@v4` still target the deprecated Node 20 action runtime.

The next quality step is to verify representative workflows through the HTTP
boundary and make contract coverage fail closed whenever a route method changes.

## Chosen Architecture

Use a source-driven, risk-tiered contract model:

1. Discover route files and exported methods from source.
2. Normalize Next.js dynamic segments such as `[orderNumber]` to OpenAPI
   parameters such as `{orderNumber}`.
3. Require one OpenAPI operation for every discovered source operation.
4. Give high-risk operations detailed request, response, security, and error
   contracts.
5. Give stable read-only or provider-dependent operations a valid minimal
   contract without inventing fields not guaranteed by source.
6. Add real HTTP tests for representative role and transaction boundaries.

This is preferred over a fully hand-authored exhaustive schema because it keeps
coverage synchronized with source while still concentrating detail where
contract precision has the highest value.

## Gate A: Direct HTTP Integration

### Authentication model

Playwright creates CUSTOMER and ADMIN sessions through the real login form.
Requests sent through `page.request` share the authenticated browser context and
therefore exercise Auth.js cookies, middleware, route guards, validation, Prisma,
and response mapping together.

### Admin catalog lifecycle

The test creates a category with an `integration-http-` slug, updates it, and
deactivates it through `/api/admin/categories`. It verifies:

- ADMIN receives 201/200 responses;
- data is persisted in `flof_test`;
- DELETE performs soft deactivation;
- a duplicate slug returns 409;
- a CUSTOMER mutation receives 403;
- successful mutations create the expected audit records.

### Review, quote, and chat HTTP evidence

Add representative HTTP assertions without duplicating every service-level test:

- quote: public POST creates a request, then ADMIN PATCH changes status;
- review: authenticated CUSTOMER without a completed purchase receives 403;
- chat: authenticated CUSTOMER creates/reads only their conversation, and ADMIN
  can reply/read it.

The existing service-level tests remain the source of exhaustive database
invariant evidence. HTTP tests prove wiring, session, guard, validation, and
response behavior.

### Cleanup safety

- Tests connect only through the guarded `TEST_DATABASE_URL`.
- Fixture identifiers use `integration-http-` or `INTEGRATION-HTTP-`.
- Cleanup filters by those identifiers and known test-user ownership.
- No unfiltered catalog, user, order, review, quote, conversation, or audit
  deletion is allowed.
- The tests never use Neon or production connection strings.

## Gate B: Complete OpenAPI Coverage

### Source inventory

Replace the current fixed nine-path validator with a reusable route scanner. The
scanner returns normalized `{ path, method, file }` records for all 99 operations.

Validation fails when:

- source exports an operation absent from OpenAPI;
- OpenAPI declares an operation with no matching source export;
- an operation lacks `operationId`, `summary`, and responses;
- authenticated/admin operations omit `sessionCookie`;
- operation IDs are duplicated;
- required shared error and domain schemas disappear.

### Contract detail tiers

**Tier 1 — detailed**

- registration and password reset;
- products, colors, coupons;
- orders and profile;
- review, quote, and authenticated conversation;
- all state-mutating admin operations;
- cron authentication and response behavior.

Tier 1 includes request body constraints, path/query/header parameters, success
responses, authentication, and relevant 400/401/403/404/409/429/500 responses.

**Tier 2 — stable minimal**

- public read-only catalogs and blog;
- admin dashboards and list endpoints;
- low-risk profile reads and favorites.

Tier 2 still has unique operation IDs, summary, security, parameters, and response
status, but it may reference generic object/array schemas when source does not
promise a stable field-level contract.

**Tier 3 — provider or simulated**

- Cloudinary media;
- Auth.js protocol route;
- VNPay IPN/return.

These operations remain documented but carry a provider/simulation description.
The contract must not claim local provider verification.

### Shared components

Keep and extend reusable definitions for:

- session cookie security;
- pagination and common parameters;
- structured and legacy error payloads;
- Product, Color, Order, Category, Review, QuoteRequest, Conversation, Message,
  Notification, and AuditLog;
- generic success, object, and array responses where a detailed schema would be
  inaccurate.

## Gate C: GitHub Actions Runtime

Update:

- `actions/checkout@v4` to `actions/checkout@v5`;
- `actions/setup-node@v4` to `actions/setup-node@v5`.

Keep:

- Node 24;
- PostgreSQL 18;
- existing migration, fixture, lint, unit, environment, integration, build,
  typecheck, E2E, OpenAPI, Lighthouse, and dependency-audit ordering.

No additional GitHub permissions or secrets are introduced.

## Error Handling

- HTTP tests assert status and safe error semantics, never complete secret-bearing
  response bodies.
- OpenAPI reflects the current mixed structured/legacy error transition instead
  of falsely claiming every route uses one envelope.
- Provider-dependent routes are marked as such instead of being treated as
  locally integrated.
- Any source/OpenAPI mismatch is a deterministic test failure listing only the
  method and route.

## Testing Strategy

Follow RED-GREEN-REFACTOR:

1. Add a route-inventory test that fails because OpenAPI covers only a subset.
2. Implement the scanner and expand OpenAPI until all 97 operations match.
3. Add failing HTTP tests for ADMIN allow and CUSTOMER deny behavior.
4. Add only the fixture cleanup or route correction needed for GREEN.
5. Update action versions and validate workflow source.
6. Run lint, typecheck, unit, integration, OpenAPI, E2E, build, Lighthouse, and
   production dependency audit.
7. Push once local gates are green, then inspect GitHub Actions and the matching
   Vercel deployment without manually redeploying.

## Documentation

Update:

- `AUDIT_REPORT.md`;
- `codex_project_audit_pack/API_CATALOG.md`;
- `codex_project_audit_pack/REQUIREMENTS_TRACEABILITY.md`.

`DATA_DICTIONARY.md` changes only if persisted fields or constraints change.

## Acceptance Criteria

- all 52 route files and all 99 exported operations have OpenAPI entries;
- the validator rejects both missing and stale operations;
- every operation has a unique operation ID, summary, response, and correct
  authentication classification;
- HTTP tests prove ADMIN catalog mutation and CUSTOMER denial through real
  sessions;
- HTTP tests exercise representative review, quote, and authenticated-chat
  wiring;
- cleanup remains isolated to `flof_test` namespaced fixtures;
- GitHub Actions no longer reports the Node 20 action-runtime warning;
- local release gates, GitHub CI, and Vercel Preview pass for the pushed SHA;
- Neon and external providers remain untouched by implementation tests.
