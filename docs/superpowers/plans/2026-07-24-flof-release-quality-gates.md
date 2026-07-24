# FLOF Release Quality Gates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add isolated database integration tests, COD browser E2E, safe catalog fallback behavior, reproducible operational checks, nonce-based script CSP, a critical-route OpenAPI/error contract, and accessibility/performance gates.

**Architecture:** Keep the current Next.js modular monolith. Run PostgreSQL in Docker for tests, deploy committed Prisma migrations, inject a dedicated Prisma client into checkout tests, propagate catalog provenance into commerce UI, and run browser/contract gates against a local production build before GitHub push and automatic Vercel Preview verification.

**Tech Stack:** Next.js 15, TypeScript, Prisma 6, PostgreSQL 18 Docker, Node test runner, Playwright, axe-core, Redocly CLI, Lighthouse CI, GitHub Actions, Vercel.

---

## File map

- `docker-compose.test.yml`: isolated PostgreSQL service named `flof_test`.
- `scripts/assert-test-database.ts`: refuses cleanup unless database name contains `test`.
- `scripts/test-db-fixtures.ts`: deterministic roles, users, catalog, and coupon.
- `tests/integration/helpers/test-database.ts`: Prisma lifecycle and per-test cleanup.
- `tests/integration/checkout.integration.test.ts`: transaction, stock, idempotency, outbox.
- `tests/integration/authorization.integration.test.ts`: role and ownership query behavior.
- `playwright.config.ts`: production server, Chromium, single CI worker.
- `e2e/*.spec.ts`: COD journey and axe scans.
- `src/lib/catalog-result.ts`: catalog provenance contract.
- `src/lib/api-error-contract.ts`: stable error envelope and client parser.
- `docs/openapi.yaml`: OpenAPI 3.1 contract for critical routes.
- `scripts/validate-openapi-coverage.ts`: route/status coverage assertions.
- `lighthouserc.json`: local production performance thresholds.
- `.github/workflows/ci.yml`: PostgreSQL service and all automated gates.

## Task 1: Isolated PostgreSQL test foundation

**Files:**
- Create: `docker-compose.test.yml`
- Create: `scripts/assert-test-database.ts`
- Create: `scripts/test-db-fixtures.ts`
- Create: `tests/test-database-guard.test.ts`
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Write the failing database-name guard test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { assertTestDatabaseUrl } from "../scripts/assert-test-database.ts";

test("accepts the isolated flof_test database", () => {
  assert.doesNotThrow(() =>
    assertTestDatabaseUrl("postgresql://postgres:postgres@127.0.0.1:55432/flof_test"),
  );
});

test("rejects production-like database names", () => {
  assert.throws(
    () => assertTestDatabaseUrl("postgresql://owner:secret@host/neondb"),
    /must contain test/i,
  );
});
```

- [ ] **Step 2: Run the guard test and confirm RED**

Run:

```powershell
node --experimental-strip-types --test tests/test-database-guard.test.ts
```

Expected: failure because `scripts/assert-test-database.ts` does not exist.

- [ ] **Step 3: Implement the guard**

```ts
export function assertTestDatabaseUrl(value: string | undefined) {
  if (!value) throw new Error("TEST_DATABASE_URL is required");
  const databaseName = new URL(value).pathname.replace(/^\//, "").toLowerCase();
  if (!databaseName.includes("test")) {
    throw new Error("Test database name must contain test");
  }
  return value;
}
```

- [ ] **Step 4: Add the Docker service**

```yaml
services:
  postgres-test:
    image: postgres:18-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: flof_test
    ports:
      - "127.0.0.1:55432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d flof_test"]
      interval: 2s
      timeout: 3s
      retries: 30
    tmpfs:
      - /var/lib/postgresql/data
```

- [ ] **Step 5: Add deterministic fixture creation**

The fixture script must call `assertTestDatabaseUrl(process.env.TEST_DATABASE_URL)`,
construct `new PrismaClient({ datasourceUrl })`, hash the fixed password
`Flof-Test-2026!`, and upsert:

```ts
const fixtures = {
  customerEmail: "customer.integration@flof.test",
  adminEmail: "admin.integration@flof.test",
  password: "Flof-Test-2026!",
  productSku: "FLOF-INTEGRATION-5L",
  productSlug: "flof-integration-paint-5l",
  couponCode: "INTEGRATION10",
};
```

The product has price `500000`, stock `20`, minStock `5`, volume `5`, active
category/supplier, and no VNPay data.

- [ ] **Step 6: Add scripts and ignore generated reports**

```json
{
  "test:db:up": "docker compose -f docker-compose.test.yml up -d --wait",
  "test:db:down": "docker compose -f docker-compose.test.yml down",
  "test:db:migrate": "cross-env DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55432/flof_test prisma migrate deploy",
  "test:db:fixtures": "cross-env TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55432/flof_test tsx scripts/test-db-fixtures.ts"
}
```

Install `cross-env` as a dev dependency so the commands are cross-platform.
Ignore `playwright-report/`, `test-results/`, and `.lighthouseci/`.

- [ ] **Step 7: Run GREEN verification**

Run:

```powershell
npm install --save-dev cross-env
npm run test:db:up
npm run test:db:migrate
npm run test:db:fixtures
node --experimental-strip-types --test tests/test-database-guard.test.ts
```

Expected: migrations apply to `flof_test`, fixtures complete, tests pass.

## Task 2: Checkout and authorization database integration tests

**Files:**
- Create: `tests/integration/helpers/test-database.ts`
- Create: `tests/integration/checkout.integration.test.ts`
- Create: `tests/integration/authorization.integration.test.ts`
- Create: `tests/integration/audit-outbox.integration.test.ts`
- Modify: `src/services/checkout.service.ts`
- Modify: `src/lib/api-auth.ts`
- Modify: `src/lib/audit.ts`
- Modify: `src/lib/email-outbox.ts`
- Modify: `package.json`

- [ ] **Step 1: Write a failing real-database checkout test**

The test imports a dedicated Prisma client and calls:

```ts
const result = await processCheckout(
  validCodInput,
  { id: customer.id, email: customer.email },
  "integration-checkout-00000001",
  "127.0.0.1",
  "",
  { database: testDb },
);

assert.ok(result.newOrderId);
assert.equal(await testDb.order.count({ where: { id: result.newOrderId } }), 1);
assert.equal(
  (await testDb.paint.findUniqueOrThrow({ where: { id: paint.id } })).stock,
  18,
);
assert.equal(
  await testDb.emailOutbox.count({
    where: { type: "ORDER_CONFIRMATION", status: "PENDING" },
  }),
  1,
);
```

Add separate tests proving identical idempotency returns the original order,
changed payload returns 409, and insufficient stock leaves order/payment counts
and stock unchanged.

- [ ] **Step 2: Run integration test and confirm RED**

Run:

```powershell
$env:TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:55432/flof_test'
node --experimental-strip-types --test tests/integration/checkout.integration.test.ts
```

Expected: TypeScript/runtime failure because `processCheckout` does not accept
the dependency object.

- [ ] **Step 3: Inject the database dependency**

Add:

```ts
type CheckoutDependencies = {
  database?: typeof db;
};

export async function processCheckout(
  input: z.infer<typeof checkoutSchema>,
  sessionUser: { id: string; email: string },
  idempotencyKey: string | null,
  ipAddr = "127.0.0.1",
  returnUrl = "",
  dependencies: CheckoutDependencies = {},
) {
  const database = dependencies.database ?? db;
```

Replace every `db.*` access in the function with `database.*`. Keep
`paymentService` untouched because integration inputs use COD only.

- [ ] **Step 4: Add authorization/ownership helpers and tests**

Extract a pure `getOrderAccessWhere(user, requestedEmail?)` helper from
`src/app/api/orders/route.ts` and test it with rows in the test database:

```ts
assert.deepEqual(
  getOrderAccessWhere({ role: "CUSTOMER", email: customer.email }),
  { customer: { user: { email: customer.email } } },
);
assert.deepEqual(getOrderAccessWhere({ role: "ADMIN", email: admin.email }), {});
```

Use the database to prove the customer filter returns only their order and the
admin filter returns both fixture customers' orders.

- [ ] **Step 5: Add audit and outbox integration coverage**

Allow `createAuditLog` and the outbox batch processor to accept an optional
database dependency, defaulting to the production singleton. Use the real test
database to prove:

```ts
await createAuditLog(
  {
    actorId: admin.id,
    actorEmail: admin.email,
    action: "UPDATE",
    entityType: "Paint",
    entityId: paint.id,
    before: { token: "hidden", stock: 20 },
    after: { stock: 19 },
  },
  testDb,
);
const audit = await testDb.auditLog.findFirstOrThrow();
assert.equal((audit.before as Record<string, unknown>).token, undefined);
assert.equal((audit.before as Record<string, unknown>).stock, 20);
```

Inject a delivery function that throws into the outbox processor and assert the
record is `PENDING` with an incremented retry count or `FAILED` at the retry
limit, never `SENT`.

- [ ] **Step 6: Add the integration script and run GREEN**

```json
{
  "test:integration": "cross-env TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55432/flof_test node --experimental-strip-types --test tests/integration/*.test.ts"
}
```

Run:

```powershell
npm run test:db:fixtures
npm run test:integration
npm test
```

Expected: all integration and unit tests pass.

## Task 3: Catalog provenance and commerce lock

**Files:**
- Create: `src/lib/catalog-result.ts`
- Create: `tests/catalog-commerce-safety.test.ts`
- Modify: `src/lib/catalog-page-data.ts`
- Modify: `src/lib/home-page-data.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/app/products/page.tsx`
- Modify: `src/components/features/home/HomeClient.tsx`
- Modify: `src/components/features/home/FeaturedProductsSection.tsx`

- [ ] **Step 1: Replace fallback tests with failing provenance assertions**

```ts
const result = await getProductsPageData(failingCatalogDatabase);
assert.equal(result.source, "fallback");
assert.equal(result.commerceAvailable, false);
assert.ok(result.mappedProducts.length > 0);
```

Add matching database-success assertions and a unit test for:

```ts
assert.equal(canAddCatalogItemToCart({ commerceAvailable: false }), false);
```

- [ ] **Step 2: Run the focused tests and confirm RED**

```powershell
node --experimental-strip-types --test tests/catalog-page-data.test.ts tests/home-page-data.test.ts tests/catalog-commerce-safety.test.ts
```

Expected: provenance fields and helper are absent.

- [ ] **Step 3: Implement the contract**

```ts
export type CatalogSource = "database" | "fallback";

export type CatalogAvailability = {
  source: CatalogSource;
  commerceAvailable: boolean;
};

export function canAddCatalogItemToCart(value: CatalogAvailability) {
  return value.source === "database" && value.commerceAvailable;
}
```

Return `source: "database", commerceAvailable: true` after successful queries
and `source: "fallback", commerceAvailable: false` in catch branches.

- [ ] **Step 4: Propagate availability into UI**

Server pages pass the availability fields to client components. When fallback
is active, render:

```tsx
<div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
  Dữ liệu sản phẩm trực tiếp đang tạm gián đoạn. Bạn vẫn có thể tham khảo danh mục,
  nhưng chức năng mua hàng đang tạm khóa.
</div>
```

Disable add-to-cart buttons, set `aria-disabled="true"`, and make handlers
return before calling the cart store.

- [ ] **Step 5: Run GREEN checks**

```powershell
node --experimental-strip-types --test tests/catalog-page-data.test.ts tests/home-page-data.test.ts tests/catalog-commerce-safety.test.ts
npm run typecheck
```

Expected: focused tests and typecheck pass.

## Task 4: Nonce-based production script CSP

**Files:**
- Modify: `src/lib/security/headers.ts`
- Modify: `src/middleware.ts`
- Modify: `next.config.ts`
- Modify: `tests/security-headers.test.ts`

- [ ] **Step 1: Write failing nonce policy tests**

```ts
const policy = buildContentSecurityPolicy("production", "nonce-test-value");
const scriptDirective = policy.split("; ").find((part) => part.startsWith("script-src"));
assert.match(scriptDirective!, /'nonce-nonce-test-value'/);
assert.doesNotMatch(scriptDirective!, /'unsafe-inline'/);
assert.doesNotMatch(scriptDirective!, /'unsafe-eval'/);
```

- [ ] **Step 2: Run RED**

```powershell
node --experimental-strip-types --test tests/security-headers.test.ts
```

Expected: the builder does not accept/use a nonce.

- [ ] **Step 3: Implement nonce CSP**

Change the builder signature to:

```ts
export function buildContentSecurityPolicy(
  environment: RuntimeEnvironment,
  nonce?: string,
) {
  const scriptSources = ["'self'"];
  if (nonce) scriptSources.push(`'nonce-${nonce}'`, "'strict-dynamic'");
  if (environment !== "production") scriptSources.push("'unsafe-inline'", "'unsafe-eval'");
```

In middleware generate:

```ts
const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
const requestHeaders = new Headers(request.headers);
requestHeaders.set("x-nonce", nonce);
const response = NextResponse.next({ request: { headers: requestHeaders } });
response.headers.set(
  "Content-Security-Policy",
  buildContentSecurityPolicy(process.env.NODE_ENV === "production" ? "production" : "development", nonce),
);
```

Integrate this into the existing auth/rate-limit middleware rather than
replacing its control flow. A `withSecurityHeaders(response, nonce)` helper
must decorate normal, redirect, 401/403, and 429 responses. Keep static non-CSP
security headers in `next.config.ts`; middleware owns CSP.

- [ ] **Step 4: Run GREEN and production render smoke**

```powershell
node --experimental-strip-types --test tests/security-headers.test.ts
npm run build
```

Start the production server and verify the root header has a nonce and no
production script `unsafe-inline`/`unsafe-eval`.

## Task 5: Stable critical API error contract and OpenAPI

**Files:**
- Create: `src/lib/api-error-contract.ts`
- Create: `tests/api-error-contract.test.ts`
- Create: `docs/openapi.yaml`
- Create: `scripts/validate-openapi-coverage.ts`
- Create: `tests/openapi-contract.test.ts`
- Modify: `src/lib/api-auth.ts`
- Modify: critical route/client files listed in the approved spec
- Modify: `package.json`

- [ ] **Step 1: Write failing envelope/parser tests**

```ts
const response = createApiErrorResponse(
  { status: 403, code: "FORBIDDEN", message: "Forbidden" },
  "request-123",
);
assert.equal(response.status, 403);
assert.deepEqual(await response.json(), {
  error: { code: "FORBIDDEN", message: "Forbidden", requestId: "request-123" },
});
assert.equal(getApiErrorMessage({ error: { message: "Forbidden" } }), "Forbidden");
assert.equal(getApiErrorMessage({ error: "Legacy error" }), "Legacy error");
```

- [ ] **Step 2: Run RED**

```powershell
node --experimental-strip-types --test tests/api-error-contract.test.ts
```

- [ ] **Step 3: Implement the contract**

```ts
export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export function getApiErrorMessage(payload: unknown, fallback = "Request failed") {
  if (!payload || typeof payload !== "object") return fallback;
  const error = (payload as { error?: unknown }).error;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  return fallback;
}
```

`apiErrorResponse` maps known exceptions to stable codes, uses `x-vercel-id`
when present, otherwise `crypto.randomUUID()`, and never returns raw exceptions.

- [ ] **Step 4: Add and validate OpenAPI 3.1**

Document `/api/auth/register`, `/api/auth/forgot-password`, `/api/products`,
`/api/colors`, `/api/coupons/validate`, `/api/orders`,
`/api/orders/{orderNumber}`, `/api/profile`, and `/api/quote-request`.
Define reusable `ApiError`, `Pagination`, `Product`, and `Order` schemas.

Install Redocly and add:

```json
{
  "test:openapi": "redocly lint docs/openapi.yaml && tsx scripts/validate-openapi-coverage.ts"
}
```

- [ ] **Step 5: Update critical clients and run GREEN**

Replace `data.error || fallback` with `getApiErrorMessage(data, fallback)` in
login/register/forgot-password/products/orders/profile/quote flows.

Run:

```powershell
npm install --save-dev @redocly/cli
npm run test:openapi
node --experimental-strip-types --test tests/api-error-contract.test.ts tests/openapi-contract.test.ts
npm run typecheck
```

## Task 6: Playwright COD E2E and axe accessibility

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/helpers/auth.ts`
- Create: `e2e/cod-order.spec.ts`
- Create: `e2e/accessibility.spec.ts`
- Modify: `src/app/quote-request/page.tsx`
- Modify: checkout form components identified by axe
- Modify: `package.json`

- [ ] **Step 1: Install browser test dependencies and config**

```powershell
npm install --save-dev @playwright/test @axe-core/playwright
npx playwright install chromium
```

Config:

```ts
export default defineConfig({
  testDir: "./e2e",
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: "http://127.0.0.1:3100", trace: "retain-on-failure" },
  webServer: {
    command: "cross-env PORT=3100 DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55432/flof_test AUTH_SECRET=flof-e2e-secret npm run start",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

Add:

```json
{
  "test:e2e": "playwright test"
}
```

- [ ] **Step 2: Write the COD journey**

Log in using fixture credentials, open the fixture product, add it to cart,
complete COD checkout, assert the order appears in profile, log out, log in as
admin, open `/admin/orders`, and update that order to `CONFIRMED`.

Use roles/labels rather than CSS selectors:

```ts
await page.getByLabel("Email").fill("customer.integration@flof.test");
await page.getByLabel(/Mật khẩu|Password/).fill("Flof-Test-2026!");
await page.getByRole("button", { name: /Đăng nhập|Login/ }).click();
```

- [ ] **Step 3: Write axe scans and confirm failures**

```ts
const results = await new AxeBuilder({ page })
  .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
  .analyze();
const blocking = results.violations.filter((item) =>
  item.impact === "critical" || item.impact === "serious",
);
expect(blocking).toEqual([]);
```

Scan `/`, `/products`, `/colors`, `/login`, `/cart`, and `/quote-request`
without authentication, then `/profile` and `/admin/orders` with fixtures.

- [ ] **Step 4: Fix scoped accessibility findings**

Every quote/checkout input receives an explicit `label` with matching `htmlFor`
and `id`; icon-only buttons receive `aria-label`; error/status containers use
`role="alert"` or `role="status"` as appropriate.

- [ ] **Step 5: Run browser GREEN**

```powershell
npm run build
npx playwright test e2e/cod-order.spec.ts e2e/accessibility.spec.ts
```

Expected: COD journey passes and no scoped critical/serious axe violations.

## Task 7: Lighthouse and CI operational gates

**Files:**
- Create: `lighthouserc.json`
- Create: `scripts/check-release-environment.ts`
- Create: `tests/release-environment.test.ts`
- Modify: `.github/workflows/ci.yml`
- Modify: `package.json`
- Modify: `docs/deployment-runbook.md`

- [ ] **Step 1: Write failing environment contract tests**

Test that production requires names for `DATABASE_URL`, `AUTH_SECRET`,
`CRON_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`,
`RESEND_API_KEY`, and `EMAIL_FROM`, but the checker returns only missing names
and never values.

- [ ] **Step 2: Implement the environment checker**

```ts
export function getMissingProductionVariables(environment: NodeJS.ProcessEnv) {
  const required = [
    "DATABASE_URL",
    "AUTH_SECRET",
    "CRON_SECRET",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "RESEND_API_KEY",
    "EMAIL_FROM",
  ];
  return required.filter((name) => !environment[name]?.trim());
}
```

The executable exits non-zero only when `REQUIRE_PRODUCTION_ENV=1`; local/CI
contract tests use synthetic values.

- [ ] **Step 3: Configure Lighthouse CI**

```json
{
  "ci": {
    "collect": {
      "url": [
        "http://127.0.0.1:3100/",
        "http://127.0.0.1:3100/products",
        "http://127.0.0.1:3100/login"
      ],
      "startServerCommand": "cross-env PORT=3100 DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55432/flof_test AUTH_SECRET=flof-lhci-secret npm run start",
      "startServerReadyPattern": "Ready|ready",
      "startServerReadyTimeout": 120000,
      "numberOfRuns": 1
    },
    "assert": {
      "assertions": {
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["error", { "minScore": 0.85 }],
        "categories:seo": ["error", { "minScore": 0.85 }],
        "categories:performance": ["warn", { "minScore": 0.7 }]
      }
    },
    "upload": { "target": "filesystem", "outputDir": ".lighthouseci/reports" }
  }
}
```

Add:

```json
{
  "test:lighthouse": "lhci autorun"
}
```

- [ ] **Step 4: Add CI PostgreSQL and gates**

Add PostgreSQL 18 as a service with health checks. Run:

```yaml
- run: npx playwright install --with-deps chromium
- run: npm run test:db:migrate
- run: npm run test:db:fixtures
- run: npm run lint
- run: npm run typecheck
- run: npm test
- run: npm run test:integration
- run: npm run build
- run: npm run test:e2e
- run: npm run test:openapi
- run: npm run test:lighthouse
- run: npm audit --omit=dev --audit-level=high
```

- [ ] **Step 5: Update runbook with manual evidence gates**

Record that backup/PITR restore drill, production cron execution, Resend
delivery, Upstash health, monitoring, and alert routing remain manual release
evidence. Never mark them passing from environment-name validation alone.

- [ ] **Step 6: Run local GREEN**

```powershell
npm install --save-dev @lhci/cli
node --experimental-strip-types --test tests/release-environment.test.ts
npm run test:lighthouse
```

## Task 8: Full release verification, audit update, and publication

**Files:**
- Modify: `AUDIT_REPORT.md`
- Modify: `codex_project_audit_pack/REQUIREMENTS_TRACEABILITY.md`
- Modify: `codex_project_audit_pack/API_CATALOG.md`
- Modify: `codex_project_audit_pack/DATA_DICTIONARY.md`
- Modify: this plan to mark completed checkboxes

- [ ] **Step 1: Run the complete local release gate**

```powershell
npm run test:db:up
npm run test:db:migrate
npm run test:db:fixtures
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
npm run test:e2e
npm run test:openapi
npm run test:lighthouse
npm audit --omit=dev --audit-level=high
git diff --check
npm run test:db:down
```

- [ ] **Step 2: Record exact evidence**

Update audit documents with test counts, E2E journeys, axe results, Lighthouse
scores, OpenAPI scope, CSP result, and explicit remaining external gaps.

- [ ] **Step 3: Verify scoped Git state**

Confirm no `.ai-understand/` or VNPay path is staged:

```powershell
$files = git diff --cached --name-only
if ($files -match 'vnpay|\.ai-understand') { throw 'Unexpected staged path' }
```

- [ ] **Step 4: Commit and push**

Commit implementation in focused commits, push
`feature/homepage-targeted-polish`, and let Vercel Git Integration create the
Preview. Do not invoke a direct Vercel deployment.

- [ ] **Step 5: Verify Preview and update Draft PR #2**

Require READY state for the final commit, fetch root/products/colors/login and
valid/invalid product pagination, inspect runtime errors, and update the PR body
with exact evidence. Do not merge or promote production.
