# FLOF P1 Cross-Layer Correctness Implementation Plan

> **Execution rule:** Work task-by-task with test-driven development. Run every
> red test before its implementation change, keep the PostgreSQL test database
> isolated at `127.0.0.1:55432/flof_test`, and never reset or seed Neon.

**Goal:** Prove the storefront, customer ownership, admin operations, commerce
concurrency, browser accessibility, coverage, and bounded-load behavior required
by P1.

**Architecture:** Keep the Next.js modular monolith. Exercise route handlers
through a real production-mode Next.js server and verify their database effects
through Prisma. Exercise race-sensitive business logic against isolated
PostgreSQL transactions. Keep Chromium as the complete E2E project and use
targeted smoke/accessibility journeys for Firefox, WebKit, and mobile Chromium.

**Stack:** Next.js 15, TypeScript, Prisma/PostgreSQL, Node test runner,
Playwright 1.61, axe-core.

**Out of scope:** VNPay, Neon mutations, production provider credentials, P2
error-envelope/rate-limit redesign, and P3 product features.

---

## Task 1: Namespaced P1 fixtures

**Files:**

- Modify: `scripts/test-db-fixtures.ts`
- Modify: `tests/integration/helpers/test-database.ts`
- Create: `tests/p1-fixtures.test.ts`

**Step 1: Write the failing fixture contract test**

Assert that the fixture module exports stable P1 identifiers for a second
customer, a bank-transfer order, an address, saved color/product data, admin
catalog records, and a bounded-load account. Assert every mutable identifier
starts with `integration-p1-` or uses an `@example.com` test email.

**Step 2: Run the red test**

Run:

```powershell
node --experimental-strip-types --test tests/p1-fixtures.test.ts
```

Expected: FAIL because the P1 fixture contract does not exist.

**Step 3: Implement the fixture contract and safe reset helpers**

Add a typed `P1_FIXTURES` export. Extend the fixture script with deterministic
upserts needed by the HTTP and concurrency tests. Add reset helpers that delete
only records selected by the P1 IDs, slugs, SKUs, order numbers, idempotency
keys, and test emails. Do not add an unqualified `deleteMany`.

**Step 4: Verify**

Run:

```powershell
npm test
npm run test:db:fixtures
```

Expected: all unit tests pass and fixtures complete without touching data
outside the test database.

**Step 5: Commit**

```powershell
git add scripts/test-db-fixtures.ts tests/integration/helpers/test-database.ts tests/p1-fixtures.test.ts
git commit -m "test: add namespaced P1 fixtures"
```

## Task 2: Public catalog HTTP/database coverage

**Files:**

- Create: `e2e/public-catalog-api-http.spec.ts`
- Modify: `tests/integration/helpers/test-database.ts`

**Step 1: Write failing HTTP assertions**

Use Playwright `request` to verify:

- `GET /api/products` returns the fixture product and pagination metadata;
- `GET /api/products/{slug}` returns the same product and a 404 for an unknown
  slug;
- `GET /api/suppliers`, `/api/colors`, `/api/color-collections`,
  `/api/dealers`, and `/api/blog` return stable arrays;
- `GET /api/blog/{slug}` returns a published article and hides an unknown or
  unpublished article;
- query filters for products, colors, dealers, and blog constrain results.

Read the corresponding rows with Prisma and compare IDs/slugs/codes, not only
HTTP status codes.

**Step 2: Run the red test**

Run:

```powershell
npx playwright test e2e/public-catalog-api-http.spec.ts --project=chromium
```

Expected: at least one assertion fails until the deterministic records and
response-shape expectations are aligned.

**Step 3: Make the smallest correction**

Prefer correcting fixture setup or assertions. Change a route only when the
test demonstrates a contract or filtering defect.

**Step 4: Verify and commit**

```powershell
npx playwright test e2e/public-catalog-api-http.spec.ts --project=chromium
git add e2e/public-catalog-api-http.spec.ts tests/integration/helpers/test-database.ts src/app/api
git commit -m "test: cover public catalog APIs"
```

## Task 3: Customer profile and ownership HTTP coverage

**Files:**

- Create: `e2e/profile-api-http.spec.ts`
- Modify: `e2e/helpers/auth.ts`
- Modify: `tests/integration/helpers/test-database.ts`
- Modify only if a red test requires it:
  `src/app/api/profile/route.ts`,
  `src/app/api/profile/password/route.ts`,
  `src/app/api/profile/addresses/route.ts`,
  `src/app/api/profile/favorites/route.ts`,
  `src/app/api/profile/favorite-products/route.ts`

**Step 1: Write failing ownership tests**

Authenticate two customers. Verify unauthenticated requests are rejected.
Verify customer A can:

- read and update only their profile;
- change the password only with the correct current password, then log in with
  the new password and restore the fixture password;
- create, update, set default, and delete their own address;
- save and remove a color and a product.

Verify customer B cannot update or delete customer A's address or saved items.
After every mutation, query Prisma and assert owner IDs and row counts.

**Step 2: Run red**

```powershell
npx playwright test e2e/profile-api-http.spec.ts --project=chromium
```

Expected: FAIL on the first missing fixture, response contract, or ownership
guard.

**Step 3: Implement the minimum ownership correction**

All update/delete selectors must combine resource identity with the
authenticated user identity, normally through `updateMany`/`deleteMany` plus a
count check or a prior owner-scoped lookup.

**Step 4: Verify and commit**

```powershell
npx playwright test e2e/profile-api-http.spec.ts --project=chromium
git add e2e/profile-api-http.spec.ts e2e/helpers/auth.ts tests/integration/helpers/test-database.ts src/app/api/profile
git commit -m "test: enforce customer resource ownership"
```

## Task 4: Admin catalog HTTP/database coverage

**Files:**

- Create: `e2e/admin-catalog-api-http.spec.ts`
- Modify: `tests/integration/helpers/test-database.ts`
- Modify only on demonstrated defects:
  `src/app/api/admin/suppliers/route.ts`,
  `src/app/api/admin/products/route.ts`,
  `src/app/api/admin/products/promotions/route.ts`,
  `src/app/api/admin/colors/route.ts`,
  `src/app/api/admin/collections/route.ts`

**Step 1: Write failing lifecycle tests**

For each endpoint, verify unauthenticated rejection, customer denial, admin
success, validation rejection, create/update/list/delete behavior, and exact
Prisma persistence. For product promotion, verify price, date window, and
promotion removal. Verify deletes with dependent data return a controlled
conflict rather than corrupting relations.

**Step 2: Run red**

```powershell
npx playwright test e2e/admin-catalog-api-http.spec.ts --project=chromium
```

**Step 3: Apply the smallest correction and verify**

```powershell
npx playwright test e2e/admin-catalog-api-http.spec.ts --project=chromium
git add e2e/admin-catalog-api-http.spec.ts tests/integration/helpers/test-database.ts src/app/api/admin
git commit -m "test: cover admin catalog lifecycles"
```

## Task 5: Admin operations HTTP/database coverage

**Files:**

- Create: `e2e/admin-operations-api-http.spec.ts`
- Modify: `tests/integration/helpers/test-database.ts`
- Modify only on demonstrated defects:
  `src/app/api/admin/inventory/route.ts`,
  `src/app/api/admin/payments/route.ts`,
  `src/app/api/admin/users/route.ts`,
  `src/app/api/admin/notifications/route.ts`,
  `src/app/api/admin/notifications/[id]/read/route.ts`,
  `src/app/api/admin/notifications/mark-all-read/route.ts`,
  `src/app/api/admin/dashboard/route.ts`,
  `src/app/api/admin/media/route.ts`

**Step 1: Write failing operations tests**

Verify:

- inventory import increments stock and creates one inventory transaction;
- transfer payment confirmation changes payment/order state once;
- refund changes payment state once and rejects a duplicate refund;
- admin can create a user and change a non-self role, while self-demotion and
  protected deletion are rejected;
- notification list/read/read-all are scoped to the authenticated admin;
- dashboard aggregates match direct Prisma counts;
- media list is authorized and invalid upload/delete inputs are rejected
  without calling Cloudinary.

**Step 2: Run red**

```powershell
npx playwright test e2e/admin-operations-api-http.spec.ts --project=chromium
```

**Step 3: Correct only proven defects, then verify and commit**

```powershell
npx playwright test e2e/admin-operations-api-http.spec.ts --project=chromium
git add e2e/admin-operations-api-http.spec.ts tests/integration/helpers/test-database.ts src/app/api/admin
git commit -m "test: cover admin operational APIs"
```

## Task 6: Bank transfer and verified-purchase review

**Files:**

- Create: `e2e/bank-transfer-review.spec.ts`
- Modify: `tests/integration/helpers/test-database.ts`
- Modify only on demonstrated defects:
  `src/app/api/orders/route.ts`,
  `src/app/api/reviews/route.ts`,
  `src/services/checkout.service.ts`

**Step 1: Write failing end-to-end tests**

Create a `TRANSFER` checkout with a unique `Idempotency-Key`. Assert the order,
payment, items, stock decrement, and idempotency row in Prisma. Confirm the
transfer as admin. Assert an unrelated customer cannot review it, the purchaser
can create exactly one review after fulfillment, and the review references the
order item/product/user.

**Step 2: Run red**

```powershell
npx playwright test e2e/bank-transfer-review.spec.ts --project=chromium
```

**Step 3: Apply the smallest correction, verify, and commit**

```powershell
npx playwright test e2e/bank-transfer-review.spec.ts --project=chromium
git add e2e/bank-transfer-review.spec.ts tests/integration/helpers/test-database.ts src/app/api/orders src/app/api/reviews src/services/checkout.service.ts
git commit -m "test: verify transfer checkout and purchase reviews"
```

## Task 7: Deterministic commerce concurrency

**Files:**

- Create: `tests/integration/commerce-concurrency.integration.test.ts`
- Modify only on demonstrated defects:
  `src/services/checkout.service.ts`,
  `src/services/order-lifecycle.service.ts`,
  `src/app/api/admin/inventory/route.ts`,
  `src/app/api/admin/payments/route.ts`

**Step 1: Write failing barrier-based tests**

Use independent Prisma clients and a shared start barrier to run simultaneous
operations. Assert:

- stock never becomes negative and only available units are sold;
- coupon `usageCount` never exceeds `usageLimit`;
- concurrent imports preserve both stock increments and transaction rows;
- conflicting order transitions produce one legal transition;
- simultaneous refund requests produce one refund;
- identical concurrent checkout keys produce one order and identical replay
  semantics.

Each assertion must inspect final database state and accepted/rejected result
counts.

**Step 2: Run red**

```powershell
npm run test:integration -- --test-name-pattern="P1 concurrency"
```

Expected: FAIL wherever a read-before-write race remains.

**Step 3: Correct with conditional writes/transactions**

Use conditional `updateMany`, unique idempotency rows, atomic increments, and
serializable transactions with bounded retry only for PostgreSQL write
conflicts. Never hold an external network request inside the transaction.

**Step 4: Verify and commit**

```powershell
npm run test:integration
git add tests/integration/commerce-concurrency.integration.test.ts src/services src/app/api/admin
git commit -m "fix: make commerce races deterministic"
```

## Task 8: Quote and chat abuse regression coverage

**Files:**

- Create: `tests/public-write-rate-limit.test.ts`
- Create: `e2e/public-write-abuse.spec.ts`
- Modify: `src/lib/security/rate-limit-policy.ts`
- Modify: `src/app/api/quote-request/route.ts`
- Modify: `src/app/api/chat/route.ts`

**Step 1: Write failing policy and HTTP tests**

Assert quote and guest-chat writes have named bounded policies. Send requests
from a stable synthetic client key up to the limit, verify accepted requests,
then verify HTTP 429 and `Retry-After`. Use unique P1 content and delete only
those rows.

**Step 2: Run red**

```powershell
node --experimental-strip-types --test tests/public-write-rate-limit.test.ts
npx playwright test e2e/public-write-abuse.spec.ts --project=chromium
```

Expected: FAIL because these routes currently do not invoke a policy.

**Step 3: Add the route policy**

Add quote/chat policies through the existing rate-limiter abstraction. Keep
the P2 work item that proves the shared distributed Upstash path and its
production failure mode; P1 proves deterministic route enforcement.

**Step 4: Verify and commit**

```powershell
npm test
npx playwright test e2e/public-write-abuse.spec.ts --project=chromium
git add tests/public-write-rate-limit.test.ts e2e/public-write-abuse.spec.ts src/lib/security/rate-limit-policy.ts src/app/api/quote-request/route.ts src/app/api/chat/route.ts
git commit -m "fix: bound quote and guest chat writes"
```

## Task 9: Browser, mobile, and accessibility-tree matrix

**Files:**

- Modify: `playwright.config.ts`
- Modify: `.github/workflows/ci.yml`
- Create: `e2e/cross-browser-smoke.spec.ts`
- Create: `e2e/accessibility-tree.spec.ts`
- Create: `docs/testing/screen-reader-checklist.md`

**Step 1: Write the cross-browser and accessibility checks**

Add a primary storefront/auth/profile/admin smoke file that is safe to run on
all engines. Add Chromium CDP accessibility-tree assertions for document
landmarks, heading order, labeled navigation, form controls, validation
messages, cart/checkout, and admin navigation. Document the exact NVDA keyboard
journey and distinguish automated accessibility-tree evidence from manual NVDA
evidence.

**Step 2: Add projects**

Configure:

- `chromium` for the full suite;
- `firefox` and `webkit` for `cross-browser-smoke.spec.ts`;
- `mobile-chromium` using Pixel 7 for cross-browser smoke plus accessibility;
- `mobile-webkit` using iPhone 15 for cross-browser smoke.

Change CI installation to:

```powershell
npx playwright install --with-deps chromium firefox webkit
```

**Step 3: Run and correct actual compatibility defects**

```powershell
npx playwright install chromium firefox webkit
npm run test:e2e
```

Expected: every configured project passes; no project is marked skipped.

**Step 4: Commit**

```powershell
git add playwright.config.ts .github/workflows/ci.yml e2e/cross-browser-smoke.spec.ts e2e/accessibility-tree.spec.ts docs/testing/screen-reader-checklist.md
git commit -m "test: add browser and accessibility matrix"
```

## Task 10: Enforced coverage gates

**Files:**

- Modify: `package.json`
- Create: `scripts/run-coverage-gates.ts`
- Create: `tests/coverage-gates.test.ts`
- Modify: `.github/workflows/ci.yml`
- Add focused unit tests under `tests/*.test.ts` only where the measured
  critical aggregate is below its threshold.

**Step 1: Write failing parser/threshold tests**

Test a coverage-summary parser with below/equal/above boundary fixtures. It
must exit non-zero when global lines/functions/branches are below 70/70/65 or
when the critical auth/permission/checkout/order/inventory aggregate is below
85/80/75.

**Step 2: Run red**

```powershell
node --experimental-strip-types --test tests/coverage-gates.test.ts
```

**Step 3: Implement the coverage runner**

Use Node 24 test coverage with explicit include globs and parse its machine
readable output. Add:

```json
"test:coverage": "node --experimental-strip-types scripts/run-coverage-gates.ts"
```

The runner executes the existing unit tests once, prints sanitized percentage
summaries, and enforces both threshold sets. Add it to CI after `npm test`.

**Step 4: Run the gate and add missing critical tests**

```powershell
npm run test:coverage
```

Expected: PASS at the documented thresholds without excluding a failing
critical module.

**Step 5: Commit**

```powershell
git add package.json package-lock.json scripts/run-coverage-gates.ts tests .github/workflows/ci.yml
git commit -m "test: enforce code coverage budgets"
```

## Task 11: Controlled load gates

**Files:**

- Create: `e2e/load-gate.spec.ts`
- Create: `tests/load-gate.test.ts`
- Create: `src/lib/testing/load-gate.ts`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`

**Step 1: Write failing budget tests**

Define a bounded runner that records status, duration, and p95. Unit-test its
percentile and budget evaluation. The gate fails on any 5xx, more than 1%
unexpected responses, or p95 above:

- catalog: 1,500 ms at 8 concurrent / 40 requests;
- auth rejection: 1,500 ms at 4 concurrent / 20 requests;
- checkout validation: 2,000 ms at 4 concurrent / 20 requests;
- admin dashboard rejection: 1,500 ms at 4 concurrent / 20 requests.

Use non-mutating catalog calls and intentionally invalid/unauthenticated
requests for the other paths so the gate creates no business rows.

**Step 2: Run red**

```powershell
node --experimental-strip-types --test tests/load-gate.test.ts
```

**Step 3: Implement and expose the gate**

Add:

```json
"test:load": "playwright test e2e/load-gate.spec.ts --project=chromium"
```

Run the scenarios sequentially to keep the demo CI load bounded.

**Step 4: Verify and commit**

```powershell
npm run test:load
git add e2e/load-gate.spec.ts tests/load-gate.test.ts src/lib/testing/load-gate.ts package.json .github/workflows/ci.yml
git commit -m "test: add bounded application load gates"
```

## Task 12: Full P1 release gate and evidence

**Files:**

- Modify: `AUDIT_REPORT.md`
- Modify: `codex_project_audit_pack/REQUIREMENTS_TRACEABILITY.md`
- Modify: `codex_project_audit_pack/API_CATALOG.md` if route behavior changed
- Modify: `docs/openapi.yaml` if an HTTP contract changed
- Create: `docs/operations/release-evidence/2026-07-25-p1.md`

**Step 1: Run the clean local gate**

```powershell
npm run test:db:up
npm run test:db:migrate
npm run test:db:fixtures
npm run lint
npm test
npm run test:coverage
npm run test:integration
npm run build
npm run typecheck
npm run test:e2e
npm run test:load
npm run test:openapi
npm audit --omit=dev --audit-level=high
```

Expected: every command exits 0. Record exact counts and explicitly record the
manual NVDA state as verified or not verified; never infer it from axe/CDP.

**Step 2: Review the requirement matrix**

Map every P1 bullet in the approved design to a test file and current passing
command. Any missing mapping keeps P1 open.

**Step 3: Update evidence and audit**

Record branch SHA, tool versions, isolated database target (without
credentials), test counts, browser projects, coverage percentages, load p95,
and unresolved external/manual evidence. Do not close the P0 provider blockers.

**Step 4: Commit, push, PR, and remote verification**

```powershell
git add AUDIT_REPORT.md codex_project_audit_pack docs
git commit -m "docs: record P1 correctness evidence"
git push -u origin codex/p1-cross-layer-quality
gh pr create --base main --head codex/p1-cross-layer-quality --title "P1: cross-layer correctness gates" --body-file .github/pull_request_template.md
```

Wait for required GitHub `quality` and Vercel checks. Merge only when required
checks pass, then verify the resulting `main` deployment with
`npm run check:deployment-smoke` from a clean environment.

