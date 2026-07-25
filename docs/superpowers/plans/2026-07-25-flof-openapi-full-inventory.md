# FLOF Full OpenAPI Inventory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `docs/openapi.yaml` cover all 52 API route files and all 99 exported operations, with source-driven stale/missing detection.

**Architecture:** A reusable scanner discovers Next.js route handlers and normalizes dynamic segments. A sync script adds deterministic minimal contracts for uncovered operations while preserving existing detailed contracts. The validator compares source and OpenAPI in both directions and checks operation metadata, security, and shared schemas.

**Tech Stack:** TypeScript, Node.js 24 test runner, YAML, OpenAPI 3.1, Redocly.

---

### Task 1: Source route inventory

**Files:**
- Create: `scripts/api-route-inventory.ts`
- Modify: `tests/openapi-contract.test.ts`

- [ ] **Step 1: Write the failing inventory test**

Add assertions:

```ts
const inventory = await discoverApiOperations();
assert.equal(new Set(inventory.map(({ file }) => file)).size, 52);
assert.equal(inventory.length, 99);
assert.ok(
  inventory.some(
    ({ path, method }) =>
      path === "/api/orders/{orderNumber}" && method === "patch",
  ),
);
```

- [ ] **Step 2: Run RED**

```powershell
node --experimental-strip-types --test tests/openapi-contract.test.ts
```

Expected: FAIL because `discoverApiOperations` does not exist.

- [ ] **Step 3: Implement the scanner**

Export:

```ts
export type ApiOperation = {
  path: string;
  method: "get" | "post" | "patch" | "delete";
  file: string;
};

export async function discoverApiOperations(
  root = "src/app/api",
): Promise<ApiOperation[]>;
```

Recursively read only `route.ts`, detect `export async function GET|POST|PATCH|DELETE`,
convert `[id]` and `[...nextauth]` to `{id}` and `{nextauth}`, normalize path
separators, and sort by path then method.

- [ ] **Step 4: Run GREEN**

Run the Step 2 command. Expected: inventory assertions pass.

- [ ] **Step 5: Commit**

```powershell
git add scripts/api-route-inventory.ts tests/openapi-contract.test.ts
git commit -m "test: inventory every API operation"
```

### Task 2: Bidirectional OpenAPI validator

**Files:**
- Modify: `scripts/validate-openapi-coverage.ts`
- Modify: `tests/openapi-contract.test.ts`

- [ ] **Step 1: Write failing full-coverage assertions**

Replace the nine-path assertion with:

```ts
const { document, sourceOperations, documentedOperations } =
  await validateOpenApiCoverage();
assert.equal(sourceOperations.length, 99);
assert.equal(documentedOperations.length, 99);
assert.equal(document.openapi, "3.1.0");
```

Add a temporary YAML fixture containing one missing and one stale operation and
assert the validator rejects it with only method/path identifiers.

- [ ] **Step 2: Run RED**

```powershell
node --experimental-strip-types --test tests/openapi-contract.test.ts
```

Expected: FAIL because the current validator covers only 9 paths.

- [ ] **Step 3: Implement bidirectional validation**

Use `discoverApiOperations()` and parsed `document.paths` to compare keys in the
form `METHOD /api/path`. Require every operation to contain:

```ts
{
  operationId: string;
  summary: string;
  responses: Record<string, unknown>;
}
```

Reject duplicate `operationId` values. Require `sessionCookie` for:

- every `/api/admin/**` operation;
- every `/api/profile/**` operation;
- GET/POST `/api/orders`;
- GET/PATCH `/api/orders/{orderNumber}`;
- POST `/api/reviews`;
- GET/POST `/api/chat/conversation`.

Continue requiring `ApiError`, `Pagination`, `Product`, and `Order`, then add
`Category`, `Review`, `QuoteRequest`, `Conversation`, `Message`,
`Notification`, and `AuditLog`.

- [ ] **Step 4: Run the focused test**

Run the Step 2 command. Expected: it now fails only because OpenAPI is missing
source operations and schemas.

- [ ] **Step 5: Commit validator RED state with the later sync task**

Do not commit a deliberately failing branch. Continue directly to Task 3.

### Task 3: Deterministic OpenAPI inventory sync

**Files:**
- Create: `scripts/sync-openapi-inventory.ts`
- Modify: `docs/openapi.yaml`
- Modify: `package.json`

- [ ] **Step 1: Implement the sync utility**

The utility must:

```ts
const document = parse(await readFile(openApiPath, "utf8"));
const sourceOperations = await discoverApiOperations();
```

For each uncovered operation, add a deterministic contract with:

- unique camel-cased `operationId` derived from method and path;
- summary containing the HTTP method and route;
- `x-contract-tier` equal to `stable-minimal`, `provider`, or `simulated`;
- `sessionCookie` where required;
- path parameters for every `{parameter}`;
- success response `200`, or `201` for POST;
- shared 400/401/403/404/500 responses appropriate to its access class.

Preserve every existing detailed operation. Sort paths and methods before
serializing with `yaml.stringify`.

Add:

```json
"openapi:sync": "node --experimental-strip-types scripts/sync-openapi-inventory.ts"
```

- [ ] **Step 2: Generate the full document**

```powershell
npm run openapi:sync
```

Expected: `docs/openapi.yaml` contains 99 operations without deleting the
existing detailed nine-path contracts.

- [ ] **Step 3: Add shared schemas**

Define accurate stable fields for Category, Review, QuoteRequest, Conversation,
Message, Notification, and AuditLog. Add `GenericObject`, `GenericArray`, and
`Success` only where source does not promise a stable detailed response.

- [ ] **Step 4: Run GREEN**

```powershell
npm run test:openapi
node --experimental-strip-types --test tests/openapi-contract.test.ts
```

Expected: Redocly passes and source/document counts are both 99.

- [ ] **Step 5: Commit**

```powershell
git add scripts/api-route-inventory.ts scripts/validate-openapi-coverage.ts scripts/sync-openapi-inventory.ts tests/openapi-contract.test.ts docs/openapi.yaml package.json
git commit -m "docs: cover every API operation in OpenAPI"
```

### Task 4: Risk-tier contract review

**Files:**
- Modify: `docs/openapi.yaml`
- Modify: `codex_project_audit_pack/API_CATALOG.md`

- [ ] **Step 1: Review Tier 1 operations**

Confirm request bodies, parameters, security, and error responses for auth,
products/colors/coupons, orders/profile, review/quote/conversation, admin
mutations, and cron. Mark Cloudinary as provider-dependent and VNPay as
simulated/out-of-scope.

- [ ] **Step 2: Validate**

```powershell
npm run test:openapi
rg -n "provider|simulated|x-contract-tier" docs/openapi.yaml
```

Expected: validation exits zero and provider/simulation labels are present.

- [ ] **Step 3: Commit**

```powershell
git add docs/openapi.yaml codex_project_audit_pack/API_CATALOG.md
git commit -m "docs: classify API contract verification tiers"
```
