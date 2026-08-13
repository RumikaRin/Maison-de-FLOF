# FLOF P0 Release and Platform Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge the audited baseline, prove safe Neon recovery and migration state, verify the Vercel deployment and configured providers, and retain repeatable sanitized release evidence.

**Architecture:** Keep the existing Next.js modular monolith and Git-triggered Vercel deployment. Add small, dependency-injected readiness utilities for repeatable smoke/provider checks, then run them through Vercel environment injection so secrets are never written to the repository or printed. Use a temporary Neon branch as the restore proof before applying the additive reconciliation migration.

**Tech Stack:** Next.js 15, TypeScript, Node.js 24 test runner, Prisma 6, PostgreSQL 18/Neon, Vercel CLI, Neon CLI, GitHub CLI, Resend, Upstash Redis REST, Cloudinary.

---

## File Structure

### Create

- `scripts/check-deployment-smoke.ts` — reusable HTTP smoke verifier that reports only route/status/header evidence.
- `scripts/verify-provider-readiness.ts` — dependency-injected Resend, Upstash, and Cloudinary readiness checks with sanitized output.
- `tests/deployment-smoke.test.ts` — unit tests for route and security-header evaluation.
- `tests/provider-readiness.test.ts` — unit tests for provider success/failure behavior without real network calls.
- `docs/operations/release-evidence/2026-07-25-p0.md` — dated P0 evidence without secrets.

### Modify

- `scripts/check-release-environment.ts` — include all P0-critical Vercel variable names.
- `tests/release-environment.test.ts` — lock the expanded variable-name contract.
- `package.json` — add repeatable smoke and provider-readiness commands.
- `docs/deployment-runbook.md` — record the exact Vercel/Neon commands and evidence rules.
- `AUDIT_REPORT.md` — update only after direct P0 evidence exists.

## Task 1: Record the P0 Preflight

**Files:**
- Create: `docs/operations/release-evidence/2026-07-25-p0.md`

- [ ] **Step 1: Re-read current local and remote state**

Run:

```powershell
git status --short
git log -2 --oneline
gh pr view 2 --json state,isDraft,mergeable,mergeStateStatus,headRefOid,statusCheckRollup,url
npx --yes vercel@latest whoami
npx --yes neonctl@latest me
```

Expected:

- only `.ai-understand/` is unrelated and untracked;
- PR #2 is open and mergeable;
- Vercel and Neon authentication commands exit `0`;
- no credential values appear.

- [ ] **Step 2: Create the evidence document**

Create the file with this initial content:

```markdown
# FLOF P0 Release Evidence — 25/07/2026

## Scope

- Environment: Vercel + Neon demo/test
- VNPay: excluded
- Database reset/seed/destructive migration: prohibited

## Evidence

| Gate | Status | Evidence |
|---|---|---|
| Local preflight | PASS | Branch, worktree, CLI authentication checked without secret output |
| PR #2 merged | NOT VERIFIED | Pending |
| GitHub CI on main | NOT VERIFIED | Pending |
| Vercel production deployment | NOT VERIFIED | Pending |
| Neon restore branch | NOT VERIFIED | Pending |
| Prisma migration status | NOT VERIFIED | Pending |
| Cron authorization/execution | NOT VERIFIED | Pending |
| Upstash readiness | NOT VERIFIED | Pending |
| Resend acceptance | NOT VERIFIED | Pending |
| Cloudinary disposable lifecycle | NOT VERIFIED | Pending |
| Alert delivery | NOT VERIFIED | Pending |
| Application rollback drill | NOT VERIFIED | Pending |

## Safety Notes

- No secret values, connection strings, tokens, passwords, or authorization headers are retained here.
- Every status remains `NOT VERIFIED` until direct command or runtime evidence exists.
```

- [ ] **Step 3: Validate the evidence document**

Run:

```powershell
rg -n "PASS|NOT VERIFIED|VNPay|secret" docs/operations/release-evidence/2026-07-25-p0.md
git diff --check
```

Expected: the preflight row is `PASS`, all external rows are `NOT VERIFIED`, and `git diff --check` exits `0`.

- [ ] **Step 4: Commit**

```powershell
git add docs/operations/release-evidence/2026-07-25-p0.md
git commit -m "docs: start P0 release evidence"
```

## Task 2: Expand the Production Environment Contract

**Files:**
- Modify: `scripts/check-release-environment.ts`
- Modify: `tests/release-environment.test.ts`

- [ ] **Step 1: Write the failing test**

Add this test:

```ts
test("requires all P0 provider and public URL variable names", () => {
  assert.deepEqual(REQUIRED_PRODUCTION_VARIABLES, [
    "DATABASE_URL",
    "AUTH_SECRET",
    "AUTH_URL",
    "NEXT_PUBLIC_APP_URL",
    "CRON_SECRET",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "RESEND_API_KEY",
    "EMAIL_FROM",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ]);
});
```

Update the existing missing-variable expectation to include the newly required names in declaration order.

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
node --experimental-strip-types --test tests/release-environment.test.ts
```

Expected: FAIL because the current contract omits `AUTH_URL`, `NEXT_PUBLIC_APP_URL`, and the three Cloudinary variable names.

- [ ] **Step 3: Implement the expanded contract**

Set the constant to:

```ts
export const REQUIRED_PRODUCTION_VARIABLES = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "AUTH_URL",
  "NEXT_PUBLIC_APP_URL",
  "CRON_SECRET",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;
```

- [ ] **Step 4: Run the focused and aggregate tests**

Run:

```powershell
node --experimental-strip-types --test tests/release-environment.test.ts
npm test
```

Expected: both commands pass.

- [ ] **Step 5: Commit**

```powershell
git add scripts/check-release-environment.ts tests/release-environment.test.ts
git commit -m "test: enforce complete P0 environment contract"
```

## Task 3: Add a Repeatable Deployment Smoke Verifier

**Files:**
- Create: `scripts/check-deployment-smoke.ts`
- Create: `tests/deployment-smoke.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing test**

Create `tests/deployment-smoke.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateSecurityHeaders,
  expectedSmokeRoutes,
} from "../scripts/check-deployment-smoke.ts";

test("covers public, metadata, API, admin, and cron paths", () => {
  assert.deepEqual(expectedSmokeRoutes, [
    "/",
    "/products",
    "/colors",
    "/blog",
    "/find-dealer",
    "/robots.txt",
    "/sitemap.xml",
    "/api/products?limit=1",
    "/admin",
    "/api/cron/process-outbox",
  ]);
});

test("accepts the required production security headers", () => {
  const headers = new Headers({
    "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
    "x-content-type-options": "nosniff",
    "x-frame-options": "SAMEORIGIN",
    "content-security-policy":
      "default-src 'self'; script-src 'self' 'nonce-value'; object-src 'none'",
  });

  assert.deepEqual(evaluateSecurityHeaders(headers), []);
});

test("rejects missing headers and unsafe production script policy", () => {
  const headers = new Headers({
    "content-security-policy":
      "default-src 'self'; script-src 'self' 'unsafe-eval'",
  });

  assert.deepEqual(evaluateSecurityHeaders(headers), [
    "strict-transport-security",
    "x-content-type-options",
    "x-frame-options",
    "content-security-policy:unsafe-eval",
  ]);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
node --experimental-strip-types --test tests/deployment-smoke.test.ts
```

Expected: FAIL with module-not-found for `scripts/check-deployment-smoke.ts`.

- [ ] **Step 3: Implement the smoke verifier**

Create `scripts/check-deployment-smoke.ts`:

```ts
import { isMainModule } from "./is-main-module.ts";

export const expectedSmokeRoutes = [
  "/",
  "/products",
  "/colors",
  "/blog",
  "/find-dealer",
  "/robots.txt",
  "/sitemap.xml",
  "/api/products?limit=1",
  "/admin",
  "/api/cron/process-outbox",
] as const;

export function evaluateSecurityHeaders(headers: Headers) {
  const failures: string[] = [];
  for (const name of [
    "strict-transport-security",
    "x-content-type-options",
    "x-frame-options",
  ]) {
    if (!headers.get(name)) failures.push(name);
  }
  const csp = headers.get("content-security-policy") ?? "";
  if (!csp) failures.push("content-security-policy");
  if (csp.includes("'unsafe-eval'")) {
    failures.push("content-security-policy:unsafe-eval");
  }
  return failures;
}

type SmokeResult = {
  route: string;
  status: number;
  passed: boolean;
  failures: string[];
};

function expectedStatus(route: string, status: number, location: string | null) {
  if (route === "/admin") {
    return status === 307 || status === 302 || Boolean(location?.includes("/login"));
  }
  if (route === "/api/cron/process-outbox") return status === 401;
  return status >= 200 && status < 400;
}

export async function runDeploymentSmoke(baseUrl: string) {
  const origin = new URL(baseUrl).origin;
  const results: SmokeResult[] = [];
  for (const route of expectedSmokeRoutes) {
    const response = await fetch(new URL(route, origin), {
      redirect: route === "/admin" ? "manual" : "follow",
      signal: AbortSignal.timeout(15_000),
    });
    const failures: string[] = [];
    if (!expectedStatus(route, response.status, response.headers.get("location"))) {
      failures.push(`status:${response.status}`);
    }
    if (route === "/") failures.push(...evaluateSecurityHeaders(response.headers));
    results.push({
      route,
      status: response.status,
      passed: failures.length === 0,
      failures,
    });
  }
  return results;
}

if (isMainModule(import.meta.url, process.argv[1])) {
  const baseUrl = process.env.DEPLOYMENT_BASE_URL?.trim();
  if (!baseUrl) {
    console.error("Missing variable name: DEPLOYMENT_BASE_URL");
    process.exitCode = 1;
  } else {
    const results = await runDeploymentSmoke(baseUrl);
    console.table(results);
    if (results.some((result) => !result.passed)) process.exitCode = 1;
  }
}
```

- [ ] **Step 4: Add the package command**

Add:

```json
"check:deployment-smoke": "node --experimental-strip-types scripts/check-deployment-smoke.ts"
```

- [ ] **Step 5: Run focused verification**

Run:

```powershell
node --experimental-strip-types --test tests/deployment-smoke.test.ts
npm test
npm run typecheck
```

Expected: all commands pass.

- [ ] **Step 6: Commit**

```powershell
git add scripts/check-deployment-smoke.ts tests/deployment-smoke.test.ts package.json
git commit -m "test: add repeatable deployment smoke gate"
```

## Task 4: Add Sanitized Provider Readiness Checks

**Files:**
- Create: `scripts/verify-provider-readiness.ts`
- Create: `tests/provider-readiness.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing tests**

Create `tests/provider-readiness.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  parseMailbox,
  verifyCloudinaryLifecycle,
  verifyResendAcceptance,
  verifyUpstashPing,
} from "../scripts/verify-provider-readiness.ts";

test("extracts a mailbox without exposing display-name syntax", () => {
  assert.equal(parseMailbox("FLOF <demo@example.com>"), "demo@example.com");
  assert.equal(parseMailbox("demo@example.com"), "demo@example.com");
});

test("verifies Upstash with a PONG response", async () => {
  const result = await verifyUpstashPing(async () =>
    new Response(JSON.stringify([{ result: "PONG" }]), { status: 200 }),
  );
  assert.deepEqual(result, { provider: "upstash", status: "PASS" });
});

test("verifies Resend acceptance without retaining an address", async () => {
  const result = await verifyResendAcceptance(
    async () => ({ data: { id: "email-id" }, error: null }),
    "sender@example.com",
    "receiver@example.com",
  );
  assert.deepEqual(result, { provider: "resend", status: "PASS" });
});

test("uploads and deletes a disposable Cloudinary asset", async () => {
  const actions: string[] = [];
  const result = await verifyCloudinaryLifecycle({
    upload: async () => {
      actions.push("upload");
      return { public_id: "flof/readiness/p0" };
    },
    destroy: async () => {
      actions.push("destroy");
      return { result: "ok" };
    },
  });
  assert.deepEqual(actions, ["upload", "destroy"]);
  assert.deepEqual(result, { provider: "cloudinary", status: "PASS" });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```powershell
node --experimental-strip-types --test tests/provider-readiness.test.ts
```

Expected: FAIL with module-not-found for `scripts/verify-provider-readiness.ts`.

- [ ] **Step 3: Implement dependency-injected verifiers**

Create `scripts/verify-provider-readiness.ts`:

```ts
import { v2 as cloudinary } from "cloudinary";
import { Resend } from "resend";
import { isMainModule } from "./is-main-module.ts";

type ProviderResult = {
  provider: "upstash" | "resend" | "cloudinary";
  status: "PASS";
};

export function parseMailbox(value: string) {
  const match = value.match(/<([^>]+)>/);
  return (match?.[1] ?? value).trim();
}

export async function verifyUpstashPing(
  request: () => Promise<Response>,
): Promise<ProviderResult> {
  const response = await request();
  if (!response.ok) throw new Error("Upstash readiness request failed");
  const data = (await response.json()) as Array<{ result?: unknown }>;
  if (data[0]?.result !== "PONG") throw new Error("Upstash returned an invalid readiness response");
  return { provider: "upstash", status: "PASS" };
}

export async function verifyResendAcceptance(
  send: () => Promise<{ data: { id?: string } | null; error: unknown }>,
  from: string,
  to: string,
): Promise<ProviderResult> {
  if (!parseMailbox(from) || !parseMailbox(to)) {
    throw new Error("Resend mailbox configuration is invalid");
  }
  const result = await send();
  if (result.error || !result.data?.id) {
    throw new Error("Resend did not accept the readiness message");
  }
  return { provider: "resend", status: "PASS" };
}

export async function verifyCloudinaryLifecycle(client: {
  upload: () => Promise<{ public_id: string }>;
  destroy: (publicId: string) => Promise<{ result?: string }>;
}): Promise<ProviderResult> {
  const uploaded = await client.upload();
  let validIdentifier = false;
  try {
    validIdentifier = uploaded.public_id.startsWith("flof/");
  } finally {
    const destroyed = await client.destroy(uploaded.public_id);
    if (destroyed.result !== "ok") {
      throw new Error("Cloudinary did not delete the disposable asset");
    }
  }
  if (!validIdentifier) {
    throw new Error("Cloudinary returned an unexpected public identifier");
  }
  return { provider: "cloudinary", status: "PASS" };
}

function requiredVariable(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing variable name: ${name}`);
  return value;
}

async function runProviderReadiness() {
  const provider = requiredVariable("PROVIDER_CHECK");

  if (provider === "upstash") {
    const url = requiredVariable("UPSTASH_REDIS_REST_URL").replace(/\/$/, "");
    const token = requiredVariable("UPSTASH_REDIS_REST_TOKEN");
    return verifyUpstashPing(() =>
      fetch(`${url}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([["PING"]]),
        signal: AbortSignal.timeout(5_000),
      }),
    );
  }

  if (provider === "resend") {
    const apiKey = requiredVariable("RESEND_API_KEY");
    const from = requiredVariable("EMAIL_FROM");
    const to = parseMailbox(process.env.PROVIDER_TEST_EMAIL?.trim() || from);
    const resend = new Resend(apiKey);
    return verifyResendAcceptance(
      () =>
        resend.emails.send({
          from,
          to,
          subject: "FLOF provider readiness",
          html: "<p>Non-sensitive demo readiness check.</p>",
        }),
      from,
      to,
    );
  }

  if (provider === "cloudinary") {
    cloudinary.config({
      cloud_name: requiredVariable("CLOUDINARY_CLOUD_NAME"),
      api_key: requiredVariable("CLOUDINARY_API_KEY"),
      api_secret: requiredVariable("CLOUDINARY_API_SECRET"),
    });
    return verifyCloudinaryLifecycle({
      upload: async () => {
        const result = await cloudinary.uploader.upload(
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          {
            folder: "flof/readiness",
            public_id: `p0-${Date.now().toString(36)}`,
            resource_type: "image",
          },
        );
        return { public_id: result.public_id };
      },
      destroy: async (publicId) =>
        cloudinary.uploader.destroy(publicId, { resource_type: "image" }),
    });
  }

  throw new Error("Unsupported PROVIDER_CHECK value");
}

if (isMainModule(import.meta.url, process.argv[1])) {
  try {
    console.log(JSON.stringify(await runProviderReadiness()));
  } catch {
    console.error(
      JSON.stringify({
        provider: process.env.PROVIDER_CHECK ?? "unknown",
        status: "FAIL",
        code: "PROVIDER_READINESS_FAILED",
      }),
    );
    process.exitCode = 1;
  }
}
```

- [ ] **Step 4: Add package commands**

Add:

```json
"check:provider:upstash": "cross-env PROVIDER_CHECK=upstash tsx scripts/verify-provider-readiness.ts",
"check:provider:resend": "cross-env PROVIDER_CHECK=resend tsx scripts/verify-provider-readiness.ts",
"check:provider:cloudinary": "cross-env PROVIDER_CHECK=cloudinary tsx scripts/verify-provider-readiness.ts"
```

- [ ] **Step 5: Verify locally with mocks only**

Run:

```powershell
node --experimental-strip-types --test tests/provider-readiness.test.ts
npm test
npm run typecheck
```

Expected: all commands pass and no real provider is called.

- [ ] **Step 6: Commit**

```powershell
git add scripts/verify-provider-readiness.ts tests/provider-readiness.test.ts package.json
git commit -m "test: add sanitized provider readiness checks"
```

## Task 5: Run the Complete Local Release Gate

**Files:**
- No source changes expected.

- [ ] **Step 1: Start and migrate the isolated test database**

Run:

```powershell
npm run test:db:up
npm run test:db:migrate
npm run test:db:fixtures
```

Expected: PostgreSQL is healthy, all eight repository migrations apply, and fixtures complete.

- [ ] **Step 2: Run static and unit gates**

Run:

```powershell
npm run lint
npm test
npm run test:env
npm run build
npm run typecheck
npm run test:openapi
npm audit --omit=dev --audit-level=high
```

Expected: every command exits `0`; dependency audit has no High or Critical finding.

- [ ] **Step 3: Run database and browser gates**

Run:

```powershell
npm run test:integration
npm run test:e2e
npm run test:lighthouse
```

Expected: integration, Playwright, axe, layout stability, OpenAPI, and Lighthouse assertions pass.

- [ ] **Step 4: Stop the isolated database**

Run:

```powershell
npm run test:db:down
```

Expected: only the local test container is stopped; no Neon resource is changed.

## Task 6: Push the Exact PR Head and Merge PR #2

**Files:**
- Existing committed changes only.

- [ ] **Step 1: Push the branch**

Run:

```powershell
git push origin feature/homepage-targeted-polish
$headSha = git rev-parse HEAD
gh pr view 2 --json headRefOid --jq .headRefOid
```

Expected: the local SHA and PR head SHA match.

- [ ] **Step 2: Wait for required checks**

Run:

```powershell
gh pr checks 2 --watch --interval 20
```

Expected: GitHub CI, Vercel, and Vercel Preview Comments succeed.

- [ ] **Step 3: Verify or configure main branch protection**

Run:

```powershell
gh api 'repos/{owner}/{repo}/branches/main/protection'
```

If protection is missing, apply this repository ruleset through `gh api
--method PUT 'repos/{owner}/{repo}/branches/main/protection' --input -`:

```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["quality", "Vercel"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": true
}
```

Expected: `main` requires the `quality` and `Vercel` checks, rejects force
push/deletion, and requires resolved conversations.

- [ ] **Step 4: Mark ready and merge with head protection**

Run:

```powershell
$headSha = git rev-parse HEAD
gh pr ready 2
gh pr merge 2 --squash --match-head-commit $headSha
```

Expected: PR #2 becomes merged without `--admin`.

- [ ] **Step 5: Synchronize the local branch with main**

Run:

```powershell
git fetch origin
git switch main
git pull --ff-only origin main
git status --short
```

Expected: `main` matches `origin/main`; only `.ai-understand/` remains untracked.

- [ ] **Step 6: Create the post-merge P0 evidence branch**

Run:

```powershell
git switch -c codex/p0-platform-evidence
```

Expected: subsequent operational evidence and runbook commits are isolated from `main`.

## Task 7: Verify Vercel Production and Environment Names

**Files:**
- Modify: `docs/operations/release-evidence/2026-07-25-p0.md`

- [ ] **Step 1: Wait for the production deployment**

Run:

```powershell
$targetSha = git rev-parse origin/main
$deploymentList = npx --yes vercel@latest ls --environment production --format json --limit 20 --cwd . --non-interactive | ConvertFrom-Json
$deployment = $deploymentList.deployments |
  Where-Object { $_.meta.githubCommitSha -eq $targetSha -and $_.state -eq "READY" } |
  Select-Object -First 1
if (-not $deployment) { throw "No READY production deployment matches origin/main" }
$productionUrl = "https://$($deployment.url)"
npx --yes vercel@latest inspect $productionUrl --wait --timeout 5m --format=json
```

Expected: deployment state is ready and Git SHA matches `origin/main`.

- [ ] **Step 2: Check environment names without values**

Run:

```powershell
npx --yes vercel@latest env list production --cwd . --non-interactive
npx --yes vercel@latest env run -e production -- cross-env REQUIRE_PRODUCTION_ENV=1 npm run check:release-env
```

Expected before configuration: the command fails only for missing variable names `CRON_SECRET`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN`.

- [ ] **Step 3: Run production smoke**

Run:

```powershell
$env:DEPLOYMENT_BASE_URL = $productionUrl
npx --yes vercel@latest env run -e production -- npm run check:deployment-smoke
Remove-Item Env:DEPLOYMENT_BASE_URL
```

Expected: every route passes; `/admin` redirects; unauthenticated cron returns `401`; production CSP does not contain `unsafe-eval`.

- [ ] **Step 4: Verify domain and TLS state**

Run:

```powershell
$domains = npx --yes vercel@latest domains ls --format json --cwd . --non-interactive | ConvertFrom-Json
$domains.domains | Select-Object name,verified,redirect | Format-Table -AutoSize
```

For every domain attached to `maison-de-flof`, request `https://<domain>/`
with `Invoke-WebRequest` and inspect the TLS-backed `200` response without
printing cookies or authorization headers.

Expected: all attached production domains are verified and serve HTTPS.

- [ ] **Step 5: Inspect recent runtime errors**

Run:

```powershell
npx --yes vercel@latest logs --environment production --level error --since 1h --limit 100 --json
```

Expected: no fatal/unhandled release regression and no secret-shaped content.

## Task 8: Prove Neon Restore and Reconcile Migration History

**Files:**
- Modify: `docs/operations/release-evidence/2026-07-25-p0.md`

- [ ] **Step 1: Inspect the source branch**

Run:

```powershell
npx --yes neonctl@latest branches list --project-id icy-forest-83002363 -o json --no-color
```

Expected: primary branch `production` is ready.

- [ ] **Step 2: Create a temporary restore branch**

Run:

```powershell
$expires = (Get-Date).ToUniversalTime().AddDays(2).ToString("yyyy-MM-ddTHH:mm:ssZ")
npx --yes neonctl@latest branches create --project-id icy-forest-83002363 --parent production --name p0-restore-20260725 --expires-at $expires -o json --no-color
```

Expected: branch state becomes ready and has its own read-write compute.

- [ ] **Step 3: Verify restored data without printing the connection string**

Run:

```powershell
$restoreUrl = npx --yes neonctl@latest connection-string p0-restore-20260725 --project-id icy-forest-83002363 --prisma --no-color
$env:DATABASE_URL = $restoreUrl.Trim()
npx prisma migrate status
node --input-type=module -e 'import { PrismaClient } from "@prisma/client"; const db = new PrismaClient(); try { const counts = await Promise.all([db.user.count(), db.paint.count(), db.order.count()]); console.log(JSON.stringify({ readable: counts.every(Number.isInteger), aggregateTables: counts.length })); } finally { await db.$disconnect(); }'
Remove-Item Env:DATABASE_URL
```

Expected: Prisma can read the restored schema and the aggregate query completes. Do not retain or print row-level data.

- [ ] **Step 4: Review and apply the pending migration to the source database**

Run:

```powershell
Get-Content -Raw prisma/migrations/20260724170000_reconcile_missing_schema_objects/migration.sql
npx --yes vercel@latest env run -e production -- npm run db:status
npx --yes vercel@latest env run -e production -- npm run db:migrate
npx --yes vercel@latest env run -e production -- npm run db:status
```

Expected:

- SQL contains no drop/truncate/reset operation;
- migration deploy exits `0`;
- final migration status is up to date.

- [ ] **Step 5: Verify target schema objects**

Run a metadata-only Prisma/SQL check through `vercel env run` for:

- enum value `REVIEW`;
- tables `EmailOutbox`, `Conversation`, and `Message`;
- the migration record for `20260724170000_reconcile_missing_schema_objects`.

Expected: all objects and migration record exist.

## Task 9: Configure and Verify Cron and Upstash

**Files:**
- Modify: `docs/operations/release-evidence/2026-07-25-p0.md`

- [ ] **Step 1: Add a generated cron secret without printing it**

Run a PowerShell pipeline that:

1. generates 48 random bytes with `RandomNumberGenerator`;
2. converts them to Base64;
3. pipes the value to `vercel env add CRON_SECRET production`;
4. pipes the same value to `vercel env add CRON_SECRET preview`;
5. clears the process variable.

Expected: `vercel env list production` reports `CRON_SECRET` as encrypted.

- [ ] **Step 2: Provision or select the FLOF Upstash Redis database**

In the authenticated Vercel project dashboard, open **Storage → Create
Database → Upstash Redis**, create database `flof-rate-limit` on the free plan
in the nearest available Singapore/Asia-Pacific region, and connect it to the
`maison-de-flof` project for both Production and Preview. Confirm the
integration creates these encrypted variable names:

- `UPSTASH_REDIS_REST_URL`;
- `UPSTASH_REDIS_REST_TOKEN`;

for Vercel Production and Preview. Never copy the values into repository files or evidence.

- [ ] **Step 3: Redeploy the current main commit**

Run:

```powershell
$redeployUrl = npx --yes vercel@latest redeploy $productionUrl --target production
$redeployUrl = ($redeployUrl | Select-Object -Last 1).Trim()
npx --yes vercel@latest inspect $redeployUrl --wait --timeout 5m
$productionUrl = $redeployUrl
```

Expected: the new production deployment is ready with the new environment revision.

- [ ] **Step 4: Verify the expanded environment contract**

Run:

```powershell
npx --yes vercel@latest env run -e production -- cross-env REQUIRE_PRODUCTION_ENV=1 npm run check:release-env
```

Expected: `Production environment contract is complete.`

- [ ] **Step 5: Verify Upstash and cron**

Run:

```powershell
npx --yes vercel@latest env run -e production -- npm run check:provider:upstash
```

Invoke the production cron without echoing the bearer value:

```powershell
$env:DEPLOYMENT_BASE_URL = $productionUrl
npx --yes vercel@latest env run -e production -- node --input-type=module -e 'const response = await fetch(new URL("/api/cron/process-outbox", process.env.DEPLOYMENT_BASE_URL), { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } }); console.log(JSON.stringify({ status: response.status, ok: response.ok })); if (!response.ok) process.exitCode = 1;'
Remove-Item Env:DEPLOYMENT_BASE_URL
```

Expected:

- Upstash verifier prints only `{ provider: "upstash", status: "PASS" }`;
- authorized cron returns `200`;
- unauthenticated cron returns `401`;
- Vercel logs contain a sanitized `cron.outbox.completed` record.

## Task 10: Verify Resend and Cloudinary

**Files:**
- Modify: `docs/operations/release-evidence/2026-07-25-p0.md`

- [ ] **Step 1: Run Resend acceptance**

Run:

```powershell
npx --yes vercel@latest env run -e production -- npm run check:provider:resend
```

Expected: the provider accepts one non-sensitive readiness message and output contains only provider/status. If the configured sender cannot receive, set a process-scoped `PROVIDER_TEST_EMAIL` to the verified Resend account mailbox without committing it.

- [ ] **Step 2: Confirm Resend delivery state**

Use the Resend dashboard or API to confirm the readiness message reached a terminal accepted/delivered state. Record only timestamp and terminal state.

- [ ] **Step 3: Run Cloudinary disposable lifecycle**

Run:

```powershell
npx --yes vercel@latest env run -e production -- npm run check:provider:cloudinary
```

Expected: a one-pixel asset is uploaded under `flof/readiness`, deleted in the same run, and output contains only provider/status.

## Task 11: Monitoring, Alert Delivery, and Rollback Drill

**Files:**
- Modify: `docs/deployment-runbook.md`
- Modify: `docs/operations/release-evidence/2026-07-25-p0.md`

- [ ] **Step 1: Configure platform alerts**

Configure available Vercel/Neon alerts for:

- production deployment failure;
- function 5xx and protected-auth 503;
- cron failure or missed execution;
- database compute/storage/connection pressure.

Route alerts to the account owner's configured notification channel.

- [ ] **Step 2: Prove alert delivery**

Trigger a non-destructive test notification using the provider's test-alert function. Do not intentionally break the deployment or database.

Expected: the configured owner receives the test alert; record timestamp and channel type only.

- [ ] **Step 3: Execute application rollback drill**

Select the last known-good production deployment before the current one and verify it remains available for rollback. Temporarily promote it only if Vercel supports immediate re-promotion without rebuilding, run the smoke verifier, then promote the current verified deployment again.

Expected: both promotion operations reach ready state and the final production alias points to the current `main` deployment.

- [ ] **Step 4: Update the runbook**

Add exact CLI commands used for:

- inspecting production deployment;
- running sanitized smoke/provider checks;
- creating the Neon restore branch;
- applying migration deploy;
- finding recent production errors;
- selecting and restoring the known-good Vercel deployment.

Do not add project secrets or connection strings.

- [ ] **Step 5: Commit the runbook changes**

```powershell
git add docs/deployment-runbook.md
git commit -m "docs: make P0 release recovery repeatable"
```

## Task 12: Close P0 Evidence and Audit

**Files:**
- Modify: `docs/operations/release-evidence/2026-07-25-p0.md`
- Modify: `AUDIT_REPORT.md`

- [ ] **Step 1: Replace each verified evidence row**

For every gate, record:

- `PASS` only when direct evidence exists;
- the commit SHA/deployment ID/branch name/timestamp or sanitized command result;
- `NOT VERIFIED` if direct evidence is absent.

- [ ] **Step 2: Update the audit**

Update deployment/operations scores and residual findings only to the extent proven by the evidence document. Keep any unverified external item explicit.

- [ ] **Step 3: Run documentation consistency checks**

Run:

```powershell
git diff --check
rg -n "NOT VERIFIED|PASS" docs/operations/release-evidence/2026-07-25-p0.md
rg -n "backup|restore|cron|Upstash|Resend|Cloudinary|rollback|alert" AUDIT_REPORT.md docs/deployment-runbook.md
```

Expected: no whitespace error or unsupported completion claim.

- [ ] **Step 4: Run final P0 code gates**

Run:

```powershell
npm run lint
npm test
npm run build
npm run typecheck
npm run test:openapi
npm audit --omit=dev --audit-level=high
```

Expected: all commands exit `0`.

- [ ] **Step 5: Commit and push P0 evidence**

```powershell
git add docs/operations/release-evidence/2026-07-25-p0.md AUDIT_REPORT.md
git commit -m "docs: record verified P0 release evidence"
git push -u origin codex/p0-platform-evidence
```

- [ ] **Step 6: Open, verify, and merge the P0 evidence PR**

Run:

```powershell
$body = @"
## Summary
- record direct Neon/Vercel/provider P0 evidence
- document repeatable recovery and rollback commands
- update audit only from verified runtime results

## Verification
- local P0 gates pass
- no secret values retained
"@
$url = gh pr create --base main --head codex/p0-platform-evidence --title "docs: record P0 platform evidence" --body $body
gh pr checks $url --watch --interval 20
$headSha = git rev-parse HEAD
gh pr merge $url --squash --match-head-commit $headSha
```

Expected: the evidence PR merges without bypassing checks.

- [ ] **Step 7: Verify remote completion**

Run:

```powershell
git fetch origin
git switch main
git pull --ff-only origin main
gh run list --branch main --limit 3 --json databaseId,headSha,status,conclusion,url
npx --yes vercel@latest inspect $productionUrl --format=json
npx --yes vercel@latest logs --environment production --level error --since 1h --limit 100 --json
```

Expected: GitHub CI and Vercel are successful for the final P0 SHA, and the recent error scan shows no release regression.

## P0 Completion Audit

Before beginning P1, map every P0 design requirement to:

- a committed source/document file;
- a local command result;
- a GitHub/Vercel/Neon/provider runtime result;
- or an explicit `NOT VERIFIED`.

P0 passes only when every required row is `PASS`. A missing provider credential,
missing alert route, or unavailable rollback proof keeps P0 active rather than
being inferred from a green build.
