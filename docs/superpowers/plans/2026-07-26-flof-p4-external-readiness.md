# FLOF P4 External Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining source-controlled external-readiness gaps while preserving explicit manual/provider evidence boundaries.

**Architecture:** Add small environment-policy helpers for Redis and Google OAuth, then consume them from the existing Auth.js, rate-limit, provider-verifier, and UI boundaries. Build the administrator Security panel on the existing MFA APIs, and add a standalone bounded GET-only production load runner. Update evidence only after local and live verification.

**Tech Stack:** Next.js 15, React 19, TypeScript, Auth.js v5, Prisma/PostgreSQL, Upstash REST, Node test runner, Playwright, Vercel.

---

### Task 1: Support Vercel Marketplace Redis variables

**Files:**
- Create: `src/lib/redis-environment.ts`
- Modify: `src/lib/rate-limiter.ts`
- Modify: `scripts/verify-provider-readiness.ts`
- Modify: `scripts/check-release-environment.ts`
- Test: `tests/redis-environment.test.ts`
- Test: `tests/provider-readiness.test.ts`
- Test: `tests/release-environment.test.ts`

- [ ] **Step 1: Write failing environment-pair tests**

```ts
assert.deepEqual(resolveRedisEnvironment({
  KV_REST_API_URL: "https://redis.example",
  KV_REST_API_TOKEN: "token",
}), { url: "https://redis.example", token: "token" });
assert.equal(resolveRedisEnvironment({
  KV_REST_API_URL: "https://redis.example",
}), null);
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```powershell
node --experimental-strip-types --test tests/redis-environment.test.ts tests/provider-readiness.test.ts tests/release-environment.test.ts
```

Expected: FAIL because `resolveRedisEnvironment` does not exist and the release contract does not understand alternative variable pairs.

- [ ] **Step 3: Implement pair resolution**

```ts
export function resolveRedisEnvironment(environment: Environment) {
  const candidates = [
    ["KV_REST_API_URL", "KV_REST_API_TOKEN"],
    ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
  ] as const;
  for (const [urlName, tokenName] of candidates) {
    const url = environment[urlName]?.trim();
    const token = environment[tokenName]?.trim();
    if (url && token) return { url, token, urlName, tokenName };
  }
  return null;
}
```

Use this helper in `UnifiedRateLimiter` and the provider probe. Change the release check from two mandatory legacy names to a Redis pair requirement that reports only accepted variable names.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/redis-environment.ts src/lib/rate-limiter.ts scripts/verify-provider-readiness.ts scripts/check-release-environment.ts tests/redis-environment.test.ts tests/provider-readiness.test.ts tests/release-environment.test.ts
git commit -m "fix: support Vercel Upstash environment contract"
```

### Task 2: Hide unavailable Google OAuth

**Files:**
- Create: `src/lib/auth/google-provider-policy.ts`
- Create: `src/hooks/use-google-provider.ts`
- Modify: `src/auth.ts`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/register/page.tsx`
- Test: `tests/google-provider-policy.test.ts`
- Test: `e2e/auth-flows.spec.ts`

- [ ] **Step 1: Write failing provider-policy tests**

```ts
assert.equal(isGoogleProviderConfigured({}), false);
assert.equal(isGoogleProviderConfigured({
  GOOGLE_CLIENT_ID: "id",
  GOOGLE_CLIENT_SECRET: "secret",
}), true);
assert.equal(isGoogleProviderConfigured({
  GOOGLE_CLIENT_ID: "id",
  GOOGLE_CLIENT_SECRET: " ",
}), false);
```

- [ ] **Step 2: Run the unit test and verify RED**

Run:

```powershell
node --experimental-strip-types --test tests/google-provider-policy.test.ts
```

Expected: FAIL because the policy module does not exist.

- [ ] **Step 3: Implement conditional registration and rendering**

```ts
export function isGoogleProviderConfigured(environment: Environment) {
  return Boolean(
    environment.GOOGLE_CLIENT_ID?.trim() &&
    environment.GOOGLE_CLIENT_SECRET?.trim(),
  );
}
```

Spread the Google provider into `src/auth.ts` only when configured. Add a hook that fetches `/api/auth/providers` and returns true only when the response contains `google`. Render the separator and Google button on login/register only when the hook is true.

- [ ] **Step 4: Add an E2E assertion**

```ts
await page.goto("/login");
await expect(page.getByRole("button", { name: "Google" })).toHaveCount(0);
await page.goto("/register");
await expect(page.getByRole("button", { name: "Google" })).toHaveCount(0);
```

- [ ] **Step 5: Run unit and focused browser tests**

Run:

```powershell
node --experimental-strip-types --test tests/google-provider-policy.test.ts
npx playwright test e2e/auth-flows.spec.ts --project=chromium
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/auth/google-provider-policy.ts src/hooks/use-google-provider.ts src/auth.ts src/app/login/page.tsx src/app/register/page.tsx tests/google-provider-policy.test.ts e2e/auth-flows.spec.ts
git commit -m "fix: hide unconfigured Google OAuth"
```

### Task 3: Add the administrator MFA Security panel

**Files:**
- Create: `src/components/features/profile/tabs/SecurityTab.tsx`
- Modify: `src/components/features/profile/types.ts`
- Modify: `src/components/features/profile/ProfileSidebar.tsx`
- Modify: `src/components/features/profile/ProfileClient.tsx`
- Modify: `src/app/api/profile/route.ts`
- Modify: `e2e/admin-mfa.spec.ts`
- Test: `tests/profile-security-contract.test.ts`

- [ ] **Step 1: Write failing source-contract tests**

Assert that the profile response exposes `mfaEnabled`, the sidebar supports the
`security` tab only for administrators, and `SecurityTab` contains setup,
recovery-code, copy/download, and disable actions.

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
node --experimental-strip-types --test tests/profile-security-contract.test.ts
```

Expected: FAIL because the Security tab is absent.

- [ ] **Step 3: Implement the minimal Security panel**

The panel maintains these states:

```ts
type Setup = { secret: string; otpauthUri: string };
const [setup, setSetup] = useState<Setup | null>(null);
const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
const [verificationCode, setVerificationCode] = useState("");
const [disablePassword, setDisablePassword] = useState("");
const [disableCode, setDisableCode] = useState("");
```

Call existing endpoints with JSON and the shared API error parser. Copy recovery
codes with `navigator.clipboard.writeText`, and download a generated
`text/plain` Blob without sending codes to another service. Clear setup and
recovery-code state when leaving the panel or after disable.

- [ ] **Step 4: Convert MFA E2E to visible UI**

Log in as the fixture administrator, navigate to `/profile`, open Security,
start setup, read the visible secret, enter a generated TOTP, assert ten
one-time recovery codes are rendered, then prove password-only login fails and
TOTP login succeeds. Preserve database cleanup in `finally`.

- [ ] **Step 5: Run focused unit and E2E tests**

```powershell
node --experimental-strip-types --test tests/profile-security-contract.test.ts
npx playwright test e2e/admin-mfa.spec.ts --project=chromium
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/components/features/profile/tabs/SecurityTab.tsx src/components/features/profile/types.ts src/components/features/profile/ProfileSidebar.tsx src/components/features/profile/ProfileClient.tsx src/app/api/profile/route.ts tests/profile-security-contract.test.ts e2e/admin-mfa.spec.ts
git commit -m "feat: add administrator MFA security panel"
```

### Task 4: Commit a production-safe load runner

**Files:**
- Create: `scripts/run-production-load-profile.ts`
- Modify: `package.json`
- Modify: `tests/load-gate.test.ts`
- Modify: `docs/deployment-runbook.md`

- [ ] **Step 1: Write failing profile-contract tests**

Test an exported scenario builder and assert every request is `GET`, total
requests are at most 40, concurrency is at most 2, and no path targets a
mutation route.

- [ ] **Step 2: Run the test and verify RED**

```powershell
node --experimental-strip-types --test tests/load-gate.test.ts
```

Expected: FAIL because the production profile module does not exist.

- [ ] **Step 3: Implement the bounded runner**

Export four 10-request scenarios for products, colors, blog, and unauthenticated
profile rejection. Require an explicit HTTPS `DEPLOYMENT_BASE_URL`, use
`runBoundedLoadScenario`, print only scenario/count/p95/status aggregates, and
set a non-zero exit code on any failed budget.

- [ ] **Step 4: Run unit and live profile**

```powershell
node --experimental-strip-types --test tests/load-gate.test.ts
$env:DEPLOYMENT_BASE_URL = "https://maison-de-flof.vercel.app"
npm run check:production-load
Remove-Item Env:DEPLOYMENT_BASE_URL
```

Expected: four PASS records, no 5xx, no unexpected responses.

- [ ] **Step 5: Commit**

```powershell
git add scripts/run-production-load-profile.ts package.json tests/load-gate.test.ts docs/deployment-runbook.md
git commit -m "test: add bounded production load profile"
```

### Task 5: Full verification and release evidence

**Files:**
- Modify: `AUDIT_REPORT.md`
- Modify: `docs/operations/release-evidence/2026-07-26-p2-p3.md`
- Modify: `codex_project_audit_pack/REQUIREMENTS_TRACEABILITY.md`
- Modify: `codex_project_audit_pack/API_CATALOG.md`

- [ ] **Step 1: Run the complete local release gate**

Run lint, unit, coverage, PostgreSQL integration, build, typecheck, E2E,
bounded load, OpenAPI, bundle, Lighthouse, Prisma validation, and production
dependency audit. Every configured command must exit zero.

- [ ] **Step 2: Run sanitized live checks**

Verify Upstash PING through a clean Vercel production environment, confirm
Redis fail-closed protection through the deployed app, run deployment smoke,
and inspect runtime errors. Do not print or persist secrets.

- [ ] **Step 3: Update evidence honestly**

Mark Upstash resource/PING, RUM enablement, exact production load, MFA UI, and
Google unavailable-state handling with dated evidence. Keep Resend mailbox,
Cloudinary credential lifecycle, Google live consent, alert receipt, NVDA, and
legal sign-off as NOT VERIFIED until their independent evidence exists.

- [ ] **Step 4: Push, open PR, and wait for required checks**

Push `codex/p4-external-readiness`, create a PR, wait for `quality` and Vercel,
resolve any failures, and merge without bypassing branch protection.

- [ ] **Step 5: Verify exact merged deployment**

Match the READY production deployment to the merged SHA, run smoke and
production-safe load against the canonical alias, confirm Analytics/Speed
Insights scripts, and scan for new 5xx/runtime errors.

