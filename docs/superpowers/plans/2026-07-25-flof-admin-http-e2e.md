# FLOF Admin HTTP E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove representative admin, review, quote, and chat workflows through real HTTP sessions.

**Architecture:** Playwright uses the existing login form and `page.request`, which shares Auth.js cookies with the page context. Tests verify route guards and response behavior while Prisma is used only for namespaced fixture cleanup and persistence assertions in the isolated `flof_test` database.

**Tech Stack:** Playwright Chromium, Auth.js, Next.js route handlers, Prisma 6, PostgreSQL 18.

---

### Task 1: Namespaced HTTP fixture cleanup

**Files:**
- Modify: `tests/integration/helpers/test-database.ts`
- Create: `e2e/admin-api-http.spec.ts`

- [ ] **Step 1: Write the failing cleanup assertion**

Create an `integration-http-cleanup` category, invoke
`resetHttpApiFixtures(database)`, assert it is removed, and assert
`integration-paints` remains.

- [ ] **Step 2: Run RED**

```powershell
npm run test:e2e -- e2e/admin-api-http.spec.ts
```

Expected: FAIL because `resetHttpApiFixtures` is not exported.

- [ ] **Step 3: Implement scoped cleanup**

Collect IDs only for:

- category slugs starting `integration-http-`;
- quote emails starting `integration-http-`;
- review comments starting `integration-http-`;
- messages starting `integration-http-`.

Delete dependent audit/message/conversation rows by collected IDs before their
parents. Notification cleanup is limited to fixture users and the REVIEW,
QUOTE, and SYSTEM types. Keep `assertTestDatabaseUrl` as the connection gate.

- [ ] **Step 4: Run GREEN and commit**

```powershell
npm run test:e2e -- e2e/admin-api-http.spec.ts
git add tests/integration/helpers/test-database.ts e2e/admin-api-http.spec.ts
git commit -m "test: add safe HTTP API fixture cleanup"
```

### Task 2: Admin category HTTP lifecycle and role denial

**Files:**
- Modify: `e2e/admin-api-http.spec.ts`

- [ ] **Step 1: Add the ADMIN lifecycle test**

After `loginAsAdmin(page)`, use `page.request` to:

```ts
POST /api/admin/categories
PATCH /api/admin/categories
DELETE /api/admin/categories?id=<id>
```

Use slug `integration-http-category-${Date.now()}`. Assert 201/200/200, duplicate
POST returns 409, the database row is inactive after DELETE, and three audit
actions exist.

- [ ] **Step 2: Add the CUSTOMER denial test**

After `loginAsCustomer(page)`, POST the same valid schema and assert status 403
with no category persisted.

- [ ] **Step 3: Verify**

```powershell
npm run test:e2e -- e2e/admin-api-http.spec.ts
```

Expected: both tests pass through Auth.js and route guards.

- [ ] **Step 4: Commit**

```powershell
git add e2e/admin-api-http.spec.ts
git commit -m "test: cover admin catalog HTTP authorization"
```

### Task 3: Review and quote HTTP wiring

**Files:**
- Modify: `e2e/admin-api-http.spec.ts`

- [ ] **Step 1: Add review denial**

Use `login(page, TEST_FIXTURES.resetEmail, /\/profile$/)` and POST
`/api/reviews` for the seeded paint with an `integration-http-review` comment.
Assert 403 because this user has no completed purchase.

- [ ] **Step 2: Add quote create/update**

POST `/api/quote-request` publicly with email
`integration-http-quote-${Date.now()}@flof.test`, capture `data.id`, then log in
as ADMIN and PATCH `/api/admin/quotes` to `CONTACTED`. Assert the persisted
status and one `QUOTE_STATUS_CHANGED` audit record.

- [ ] **Step 3: Verify and commit**

```powershell
npm run test:e2e -- e2e/admin-api-http.spec.ts
git add e2e/admin-api-http.spec.ts
git commit -m "test: cover review and quote HTTP workflows"
```

### Task 4: Authenticated conversation HTTP wiring

**Files:**
- Modify: `e2e/admin-api-http.spec.ts`

- [ ] **Step 1: Add customer conversation assertions**

Log in as CUSTOMER, POST `/api/chat/conversation` with
`integration-http-chat customer`, then GET the same route. Assert 201/200, one
customer message, and no conversation belonging to the reset user.

- [ ] **Step 2: Add ADMIN reply/read assertions**

Clear cookies, log in as ADMIN, POST `/api/admin/chat/conversations` with the
conversation ID, then GET `/api/admin/chat/conversations/{id}`. Assert the reply
is admin-authored and customer messages are marked read.

- [ ] **Step 3: Verify the full E2E suite**

```powershell
npm run test:e2e
```

Expected: existing 13 tests plus the new HTTP tests all pass.

- [ ] **Step 4: Commit**

```powershell
git add e2e/admin-api-http.spec.ts
git commit -m "test: cover support chat HTTP workflow"
```
