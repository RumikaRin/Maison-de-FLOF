# FLOF Admin API Policy Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every admin API method traceable to an authorization rule, mutation/audit decision, and verification strategy.

**Architecture:** A typed manifest is the source-controlled policy inventory. A test scans actual admin route files and compares exported methods and recognizable guards with the manifest. Permission semantics are verified separately without Auth.js session mocking.

**Tech Stack:** TypeScript, Node test runner, filesystem route scan, existing `src/lib/permissions.ts`.

---

### Task 1: Admin API manifest and route inventory

**Files:**
- Create: `src/lib/admin/admin-api-policy.ts`
- Create: `tests/admin-api-policy.test.ts`

- [ ] **Step 1: Write the failing inventory test**

The test recursively finds `src/app/api/admin/**/route.ts`, extracts exported
`GET`, `POST`, `PATCH`, and `DELETE` functions, converts file paths to API paths,
and compares the resulting `route + method` keys with `ADMIN_API_POLICIES`.

- [ ] **Step 2: Verify RED**

```powershell
node --experimental-strip-types --test tests/admin-api-policy.test.ts
```

Expected: FAIL because `ADMIN_API_POLICIES` does not exist.

- [ ] **Step 3: Add the complete typed manifest**

Define:

```ts
export type AdminApiPolicy = {
  route: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  access:
    | { kind: "role"; minimum: "STAFF" | "ADMIN" }
    | { kind: "permission"; permission: Permission };
  mutation: boolean;
  audit: "required" | "not-required" | "provider-managed" | "gap";
  verification: "unit-policy" | "db-integration" | "e2e" | "provider-contract";
};
```

Add one entry for every method currently exported below `/api/admin`.
Provider-dependent media mutations use `provider-contract`; no route may omit
an audit decision.

- [ ] **Step 4: Verify GREEN and commit**

```powershell
node --experimental-strip-types --test tests/admin-api-policy.test.ts
git add src/lib/admin/admin-api-policy.ts tests/admin-api-policy.test.ts
git commit -m "test: inventory every admin API policy"
```

### Task 2: Guard-source consistency

**Files:**
- Modify: `tests/admin-api-policy.test.ts`

- [ ] **Step 1: Write failing guard consistency assertions**

For each manifest entry, inspect its route module source and require the
corresponding token:

- `requireAdmin()` for ADMIN role;
- `requireStaff()` for STAFF role;
- `requirePermission("NAME")` for named permissions;
- approved user-scoped notification/conversation helpers where ownership checks
  replace a role guard.

The assertion failure must print only the route/method and expected guard.

- [ ] **Step 2: Run and verify RED**

```powershell
node --experimental-strip-types --test tests/admin-api-policy.test.ts
```

Expected: FAIL for any incorrectly classified current route. Correct the
manifest when the route behavior is intentional; correct production code only
when the source lacks a necessary authorization check.

- [ ] **Step 3: Make the smallest policy or guard correction**

Do not broaden STAFF permissions. Preserve user-scoped ownership checks for
notifications and conversations. Any production guard correction must have its
own focused failing test before the edit.

- [ ] **Step 4: Verify and commit**

```powershell
node --experimental-strip-types --test tests/admin-api-policy.test.ts
npm run typecheck
git add src/lib/admin/admin-api-policy.ts tests/admin-api-policy.test.ts src/app/api/admin
git commit -m "test: enforce admin route guard consistency"
```

### Task 3: Permission role matrix

**Files:**
- Modify: `tests/admin-api-policy.test.ts`
- Modify only if a test exposes a defect: `src/lib/permissions.ts`

- [ ] **Step 1: Add permission matrix tests**

Assert CUSTOMER has no permissions, STAFF has exactly:

```ts
[
  "ORDER_READ",
  "ORDER_UPDATE",
  "PAYMENT_CONFIRM",
  "INVENTORY_IMPORT",
  "SUPPORT_MANAGE",
]
```

Assert ADMIN has every declared permission. Assert all manifest permission
entries refer to a declared permission and that catalog/coupon/promotion/media
deletion are denied to STAFF.

- [ ] **Step 2: Run RED or demonstrate existing behavior**

```powershell
node --experimental-strip-types --test tests/admin-api-policy.test.ts
```

If the test passes immediately because current semantics are already correct,
record it as characterization coverage; no production change is required. If it
fails, verify the intended matrix from the approved design before changing code.

- [ ] **Step 3: Run full unit verification and commit**

```powershell
npm test
npm run lint
npm run typecheck
git add tests/admin-api-policy.test.ts src/lib/permissions.ts
git commit -m "test: enforce admin permission matrix"
```

### Task 4: Documentation traceability and release verification

**Files:**
- Modify: `codex_project_audit_pack/API_CATALOG.md`
- Modify: `codex_project_audit_pack/REQUIREMENTS_TRACEABILITY.md`
- Modify: `AUDIT_REPORT.md`

- [ ] **Step 1: Update evidence mappings**

For every admin route, record its guard, mutation/audit decision, and test
classification. Map catalog CRUD and customer workflows to their new
integration test files. Keep Cloudinary, Google OAuth, Resend, Upstash, Neon,
and VNPay limitations explicit.

- [ ] **Step 2: Validate documentation claims**

```powershell
npm run test:openapi
rg -n \"admin-catalog|customer-workflows|admin-api-policy\" AUDIT_REPORT.md codex_project_audit_pack
```

Expected: OpenAPI validation exits zero and each new evidence file is referenced.

- [ ] **Step 3: Run complete local gates**

```powershell
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run test:openapi
npm run test:e2e
npm run build
npm audit --omit=dev
```

Expected: every command exits zero. If a provider credential or local browser
environment blocks a gate, report the exact gate as unverified rather than
claiming success.

- [ ] **Step 4: Commit and push**

```powershell
git add AUDIT_REPORT.md codex_project_audit_pack/API_CATALOG.md codex_project_audit_pack/REQUIREMENTS_TRACEABILITY.md
git commit -m "docs: trace admin workflow test evidence"
git push origin feature/homepage-targeted-polish
```

- [ ] **Step 5: Inspect remote delivery**

Inspect the GitHub Actions run for the pushed SHA, then inspect the matching
Vercel deployment state and runtime logs. Do not manually redeploy when the
GitHub integration has already created the deployment.
