# FLOF Admin Catalog Integration Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add safe, database-backed integration coverage for representative admin catalog CRUD invariants.

**Architecture:** Route handlers keep Auth.js and HTTP responsibilities. Focused catalog service functions receive a Prisma transaction client and actor, own database invariants, and write audit records in the same transaction. Tests use the guarded `flof_test` database.

**Tech Stack:** Next.js 15 route handlers, TypeScript, Prisma 6, PostgreSQL, Node test runner through `tsx`.

---

### Task 1: Catalog fixture cleanup

**Files:**
- Modify: `tests/integration/helpers/test-database.ts`
- Test: `tests/integration/admin-catalog.integration.test.ts`

- [ ] **Step 1: Write a failing cleanup test**

Create a test record whose slug starts with `integration-admin-`, call
`resetAdminCatalogFixtures(database)`, and assert that the record is removed
without deleting the seeded category.

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
npm run test:integration -- --test-name-pattern "admin catalog cleanup"
```

Expected: FAIL because `resetAdminCatalogFixtures` is not exported.

- [ ] **Step 3: Add namespace-scoped cleanup**

Implement `resetAdminCatalogFixtures(database)` using explicit `deleteMany`
filters for `integration-admin-` slugs, SKUs, and codes. Delete dependent
`paintColorLink`, `paint`, and `auditLog` rows before parent records. Do not use
an unfiltered delete for catalog tables.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run the Step 2 command. Expected: one matching test passes.

- [ ] **Step 5: Commit**

```powershell
git add tests/integration/helpers/test-database.ts tests/integration/admin-catalog.integration.test.ts
git commit -m "test: add safe admin catalog fixture cleanup"
```

### Task 2: Category mutation service

**Files:**
- Create: `src/lib/admin/catalog-service.ts`
- Modify: `src/app/api/admin/categories/route.ts`
- Test: `tests/integration/admin-catalog.integration.test.ts`

- [ ] **Step 1: Write failing category service tests**

Cover:

```ts
await createCategory(database, actor, {
  name: "Integration Interior",
  slug: "integration-admin-interior",
  description: "Integration fixture",
  sortOrder: 90,
  isActive: true,
});
```

Assert persisted values and one `CREATE` audit record. Then call the function
again with the same slug and assert an `ApiError` with status `409`. Add update
and soft-deactivate assertions.

- [ ] **Step 2: Run and verify RED**

Run:

```powershell
npm run test:integration -- --test-name-pattern "admin category"
```

Expected: FAIL because `catalog-service.ts` and its exports do not exist.

- [ ] **Step 3: Implement minimal category services**

Export:

```ts
export type AuditActor = { id: string; email: string };
export async function createCategory(
  database: Prisma.TransactionClient | PrismaClient,
  actor: AuditActor,
  input: CategoryCreateInput,
): Promise<Category>;
export async function updateCategory(
  database: Prisma.TransactionClient | PrismaClient,
  actor: AuditActor,
  input: CategoryUpdateInput,
): Promise<Category>;
export async function deactivateCategory(
  database: Prisma.TransactionClient | PrismaClient,
  actor: AuditActor,
  id: string,
): Promise<void>;
```

Each operation must perform its data mutation and `createAuditLog` call inside
one `$transaction` when the supplied client is a `PrismaClient`. Duplicate
slugs return `ApiError(409, ...)`.

- [ ] **Step 4: Delegate category route mutations**

Keep the existing Zod schemas and `requirePermission("CATALOG_MANAGE")` calls,
then pass parsed input and actor to the service. Preserve existing response
status and JSON shape.

- [ ] **Step 5: Run focused and unit verification**

```powershell
npm run test:integration -- --test-name-pattern "admin category"
npm test
npm run typecheck
```

Expected: all commands exit zero.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/admin/catalog-service.ts src/app/api/admin/categories/route.ts tests/integration/admin-catalog.integration.test.ts
git commit -m "test: cover admin category lifecycle"
```

### Task 3: Product transaction service

**Files:**
- Modify: `src/lib/admin/catalog-service.ts`
- Modify: `src/app/api/admin/products/route.ts`
- Test: `tests/integration/admin-catalog.integration.test.ts`

- [ ] **Step 1: Write failing product transaction tests**

Create an `integration-admin-product` with two color IDs. Assert the paint and
both `PaintColorLink` records exist and one audit record was created. Attempt a
duplicate SKU and assert no extra paint or color-link record is persisted.
Update the color set and assert old links are replaced atomically. Delete the
product and assert the current route's intended soft-delete behavior and audit
record.

- [ ] **Step 2: Run and verify RED**

```powershell
npm run test:integration -- --test-name-pattern "admin product"
```

Expected: FAIL because product service exports do not exist.

- [ ] **Step 3: Implement minimal product services**

Move the existing transactional create, update, and delete bodies into:

```ts
createProduct(database, actor, input)
updateProduct(database, actor, input)
deleteProduct(database, actor, id)
```

Preserve all existing input fields, relation selection, conflict behavior, and
HTTP-independent errors. Keep product mutation, color links, and audit write in
the same Prisma transaction.

- [ ] **Step 4: Delegate product route mutations**

Keep route parsing and authorization unchanged. Replace only the duplicated
database mutation blocks with service calls.

- [ ] **Step 5: Run verification**

```powershell
npm run test:integration -- --test-name-pattern "admin product"
npm run lint
npm run typecheck
```

Expected: all commands exit zero.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/admin/catalog-service.ts src/app/api/admin/products/route.ts tests/integration/admin-catalog.integration.test.ts
git commit -m "test: cover admin product transactions"
```

### Task 4: Linked-color deletion and shared CRUD policy evidence

**Files:**
- Modify: `src/lib/admin/catalog-service.ts`
- Modify: `src/app/api/admin/colors/route.ts`
- Test: `tests/integration/admin-catalog.integration.test.ts`
- Modify: `codex_project_audit_pack/REQUIREMENTS_TRACEABILITY.md`

- [ ] **Step 1: Write failing linked-color tests**

Create one unlinked integration color and one color linked to the integration
product. Assert `deleteColor` removes the unlinked color and audit-logs the
action, while linked deletion throws `ApiError(409, ...)` and preserves data.

- [ ] **Step 2: Run and verify RED**

```powershell
npm run test:integration -- --test-name-pattern "admin color"
```

Expected: FAIL because `deleteColor` does not exist.

- [ ] **Step 3: Implement and delegate deletion**

Export `deleteColor(database, actor, id)`. Count links and reject linked records;
otherwise delete the color and write its audit record within one transaction.
Update the route to call the service after its existing guard and parsing.

- [ ] **Step 4: Record shared-resource coverage**

Document that category is the representative soft-deactivate CRUD flow and
color is the representative linked hard-delete flow. Map suppliers and
collections to the same guard/invariant class without claiming direct
integration execution for them.

- [ ] **Step 5: Run catalog suite**

```powershell
npm run test:integration
npm run lint
npm run typecheck
```

Expected: all integration tests pass and static checks exit zero.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/admin/catalog-service.ts src/app/api/admin/colors/route.ts tests/integration/admin-catalog.integration.test.ts codex_project_audit_pack/REQUIREMENTS_TRACEABILITY.md
git commit -m "test: cover catalog linked-record safeguards"
```
