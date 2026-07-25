# FLOF Post-Audit Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix every actionable non-VNPay audit finding through test-first reliability, security, governance, API, and deployment changes.

**Architecture:** Keep the Next.js modular monolith. Extract small pure policy modules for email delivery, outbox dispatch, pagination, rate-limit failure behavior, audit sanitization, and CSP generation so each change can be regression-tested without a live database or provider. Route handlers remain responsible for authentication and HTTP translation; Prisma transactions remain responsible for atomic domain mutation plus audit records.

**Tech Stack:** Next.js 15, React 19, TypeScript, Node test runner, Prisma 6/PostgreSQL, Auth.js v5, Resend, Upstash REST, GitHub Actions.

---

## File structure

- Create `src/lib/email-delivery.ts`: provider-independent delivery contract and typed error.
- Modify `src/lib/email.ts`: wire Resend to the delivery contract.
- Create `src/lib/email-outbox.ts`: pure outbox record dispatcher.
- Modify `src/app/api/cron/process-outbox/route.ts`: persist `SENT` only after confirmed delivery.
- Modify `src/app/api/auth/register/route.ts` and `forgot-password/route.ts`: keep public responses safe when email delivery fails.
- Modify `src/lib/rate-limiter.ts`: explicit memory/deny backend-failure policy.
- Modify `src/middleware.ts`: fail closed for sensitive production auth routes.
- Create `src/lib/pagination.ts`: shared bounded parser.
- Modify public list routes and admin notifications to use the parser.
- Modify `src/lib/audit.ts`: recursively sanitize audit payloads.
- Modify missing admin mutation routes to write audit records.
- Create `src/lib/security/headers.ts`: environment-aware CSP builder.
- Modify `next.config.ts`: use the CSP builder.
- Modify `package.json`, `package-lock.json`, `.github/workflows/ci.yml`: patched dependencies and one Node runtime.
- Create `docs/deployment-runbook.md` and `docs/erd.md`.
- Update `AUDIT_REPORT.md` and files under `codex_project_audit_pack/`.
- Add regression tests under `tests/`.

## Task 1: Patch production dependencies and runtime declaration

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Capture the failing dependency gate**

Run:

```powershell
npm audit --omit=dev --audit-level=high
```

Expected: exit 1 with the currently installed Auth.js/Next.js production advisories.

- [ ] **Step 2: Inspect compatible versions**

Run:

```powershell
npm view next version
npm view next-auth versions --json
npm view @auth/prisma-adapter version
npm audit fix --omit=dev --dry-run
```

Expected: registry metadata identifying patched compatible releases. Do not use `--force`.

- [ ] **Step 3: Install only compatible patched packages**

Install the compatible patched releases verified from the registry on
24/07/2026:

```powershell
npm install next@15.5.21 next-auth@5.0.0-beta.32 @auth/prisma-adapter@2.11.3
```

Do not change React major version. If no compatible Auth.js patch exists, leave Auth.js pinned and record the exact residual advisory in the audit report.

- [ ] **Step 4: Align Node runtime**

Add this exact package contract:

```json
"engines": {
  "node": ">=24 <25"
}
```

Keep GitHub Actions on `node-version: 24`.

- [ ] **Step 5: Verify dependency graph**

Run:

```powershell
npm ls next next-auth @auth/core @auth/prisma-adapter postcss sharp --depth=2
npm audit --omit=dev --audit-level=high
```

Expected: no Critical/High advisory, or a documented unpatchable Auth.js residual without forced upgrade.

## Task 2: Make email delivery and outbox state truthful

**Files:**
- Create: `src/lib/email-delivery.ts`
- Create: `src/lib/email-outbox.ts`
- Modify: `src/lib/email.ts`
- Modify: `src/app/api/cron/process-outbox/route.ts`
- Modify: `src/app/api/auth/register/route.ts`
- Modify: `src/app/api/auth/forgot-password/route.ts`
- Create: `tests/email-delivery.test.ts`
- Create: `tests/email-outbox.test.ts`

- [ ] **Step 1: Write failing delivery tests**

Test the wished-for API:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  createEmailSender,
  EmailDeliveryError,
} from "../src/lib/email-delivery.ts";

test("email sender fails when provider configuration is missing", async () => {
  const send = createEmailSender(null, undefined);
  await assert.rejects(
    () => send({ to: "user@example.com", subject: "Subject", html: "<p>Body</p>" }),
    (error) =>
      error instanceof EmailDeliveryError &&
      error.code === "NOT_CONFIGURED",
  );
});

test("email sender propagates a sanitized provider failure", async () => {
  const send = createEmailSender(
    { send: async () => { throw new Error("provider-secret-detail"); } },
    "FLOF <noreply@example.com>",
  );
  await assert.rejects(
    () => send({ to: "user@example.com", subject: "Subject", html: "<p>Body</p>" }),
    (error) =>
      error instanceof EmailDeliveryError &&
      error.code === "PROVIDER_ERROR" &&
      !error.message.includes("provider-secret-detail"),
  );
});
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
node --experimental-strip-types --test tests/email-delivery.test.ts
```

Expected: fail because `email-delivery.ts` does not exist.

- [ ] **Step 3: Implement the delivery contract**

Create:

```ts
export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
};

export type EmailTransport = {
  send(message: EmailMessage & { from: string }): Promise<unknown>;
};

export class EmailDeliveryError extends Error {
  constructor(
    public readonly code: "NOT_CONFIGURED" | "PROVIDER_ERROR",
    message: string,
  ) {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

export function createEmailSender(
  transport: EmailTransport | null,
  from: string | undefined,
) {
  return async (message: EmailMessage) => {
    if (!transport || !from?.trim()) {
      throw new EmailDeliveryError(
        "NOT_CONFIGURED",
        "Email delivery is not configured",
      );
    }
    try {
      await transport.send({ from, ...message });
    } catch {
      throw new EmailDeliveryError(
        "PROVIDER_ERROR",
        "Email provider rejected the delivery",
      );
    }
  };
}
```

- [ ] **Step 4: Verify delivery GREEN**

Run the targeted test. Expected: 2 pass, 0 fail.

- [ ] **Step 5: Write failing outbox dispatch tests**

Create tests proving `ORDER_CONFIRMATION` calls the sender and an unknown type rejects with `UNSUPPORTED_TYPE`.

- [ ] **Step 6: Verify outbox RED**

Run the new outbox test. Expected: fail because `dispatchOutboxRecord` is missing.

- [ ] **Step 7: Implement pure outbox dispatch**

Create `dispatchOutboxRecord(record, sendOrderConfirmation)` that validates the JSON payload, calls the sender for `ORDER_CONFIRMATION`, and throws an `OutboxDispatchError("UNSUPPORTED_TYPE")` for every other type.

- [ ] **Step 8: Wire routes**

Use `createEmailSender` in `email.ts`. In the cron route, call `dispatchOutboxRecord` before writing `SENT`; any thrown error follows the existing `FAILED` retry branch. Catch welcome/reset delivery failures locally, log only the error code, and preserve the public success response.

- [ ] **Step 9: Verify email/outbox GREEN**

Run both targeted tests and then `npm test`. Expected: all pass.

## Task 3: Fail closed for sensitive production rate limiting

**Files:**
- Modify: `src/lib/rate-limiter.ts`
- Modify: `src/middleware.ts`
- Modify: `tests/rate-limiter.test.ts`

- [ ] **Step 1: Write failing policy tests**

Add tests constructing:

```ts
new UnifiedRateLimiter(60_000, 10, {
  failureMode: "deny",
  redisUrl: undefined,
  redisToken: undefined,
})
```

Assert `success === false` and `reason === "BACKEND_UNAVAILABLE"`. Add another test proving `failureMode: "memory"` still allows local development.

- [ ] **Step 2: Verify RED**

Run the rate-limiter test. Expected: TypeScript/runtime failure because constructor options and reason do not exist.

- [ ] **Step 3: Implement explicit failure policy**

Add:

```ts
type RateLimiterOptions = {
  failureMode?: "memory" | "deny";
  redisUrl?: string;
  redisToken?: string;
};
```

When Redis is unavailable or throws and `failureMode === "deny"`, return a zero-remaining result with `reason: "BACKEND_UNAVAILABLE"` instead of using memory.

- [ ] **Step 4: Wire middleware**

Configure the auth limiter with `failureMode: process.env.NODE_ENV === "production" ? "deny" : "memory"`. Return HTTP 503 for `BACKEND_UNAVAILABLE`; keep HTTP 429 for exhausted quotas. General API limiting remains availability-oriented.

- [ ] **Step 5: Verify GREEN**

Run the targeted test and full tests. Expected: all pass.

## Task 4: Bound pagination and correct authorization semantics

**Files:**
- Create: `src/lib/pagination.ts`
- Create: `tests/pagination.test.ts`
- Modify: `src/app/api/products/route.ts`
- Modify: `src/app/api/blog/route.ts`
- Modify: `src/app/api/colors/route.ts`
- Modify: `src/app/api/dealers/route.ts`
- Modify: `src/app/api/admin/notifications/route.ts`
- Modify: manual admin session guards under `src/app/api/admin/chat/**` and `notifications/**`

- [ ] **Step 1: Write failing pagination tests**

Test defaults, valid values, page zero, non-integer values, negative limit, and limit 101 using:

```ts
parsePagination(new URLSearchParams("page=2&limit=50"))
```

The invalid cases must throw `PaginationError`.

- [ ] **Step 2: Verify RED**

Run the pagination test. Expected: missing module failure.

- [ ] **Step 3: Implement the parser**

Implement `PaginationError` and `parsePagination(searchParams, { defaultLimit: 20, maxLimit: 100 })`. Return `{ page, limit, requested }`.

- [ ] **Step 4: Apply parser to routes**

Replace direct `parseInt` calls. Catch `PaginationError` and return HTTP 400. Clamp no values silently.

- [ ] **Step 5: Fix 401/403 distinction**

For manual session guards:

```ts
if (!session?.user?.id) throw new ApiError(401, "Unauthorized");
if (role !== "ADMIN" && role !== "STAFF") {
  throw new ApiError(403, "Forbidden");
}
```

- [ ] **Step 6: Verify GREEN**

Run pagination tests, lint, and typecheck. Expected: all pass.

## Task 5: Sanitize and expand administrator audit logging

**Files:**
- Modify: `src/lib/audit.ts`
- Create: `tests/audit-sanitization.test.ts`
- Modify: missing mutating admin route files listed by the audit report

- [ ] **Step 1: Write failing sanitizer tests**

Test nested removal of keys matching `password`, `token`, `secret`, `authorization`, `access_token`, `refresh_token`, and `id_token`, while preserving safe business fields.

- [ ] **Step 2: Verify RED**

Run the sanitizer test. Expected: fail because `sanitizeAuditData` is missing.

- [ ] **Step 3: Implement sanitizer**

Export `sanitizeAuditData(value)` from `audit.ts`. It recursively handles arrays/plain objects, removes sensitive keys case-insensitively, converts unsupported values to safe strings/null, and returns a Prisma-compatible JSON value.

- [ ] **Step 4: Enforce sanitizer centrally**

`createAuditLog` must call `sanitizeAuditData` for `beforeData` and `afterData` so no caller can bypass the policy.

- [ ] **Step 5: Add missing audit events**

For each successful admin mutation, write an action with stable names such as `USER_CREATED`, `ARTICLE_UPDATED`, `CATEGORY_DELETED`, `QUOTE_STATUS_CHANGED`, and `NOTIFICATION_MARKED_READ`. Use a Prisma transaction when the domain mutation is a Prisma write. External media actions are logged only after success.

- [ ] **Step 6: Verify GREEN and coverage**

Run the sanitizer test and:

```powershell
rg -l "export\\s+async\\s+function\\s+(POST|PATCH|PUT|DELETE)" src/app/api/admin -g route.ts
rg -l "createAuditLog\\(" src/app/api/admin -g route.ts
```

Review every difference and document any endpoint intentionally excluded because it only changes the requesting user's notification read state.

## Task 6: Tighten CSP and align deployment/runtime documentation

**Files:**
- Create: `src/lib/security/headers.ts`
- Create: `tests/security-headers.test.ts`
- Modify: `next.config.ts`
- Create: `docs/deployment-runbook.md`
- Create: `docs/erd.md`

- [ ] **Step 1: Write failing CSP tests**

Assert production CSP excludes `'unsafe-eval'`, development includes it, and both include `object-src 'none'`, `base-uri 'self'`, and `frame-ancestors 'none'`.

- [ ] **Step 2: Verify RED**

Run the CSP test. Expected: missing exported builder.

- [ ] **Step 3: Implement CSP builder and wire Next config**

Create `buildContentSecurityPolicy(environment)` and use it from `next.config.ts`. Keep current required origins. Production removes only `unsafe-eval` in this pass; `unsafe-inline` remains documented residual risk until nonce migration.

- [ ] **Step 4: Write deployment runbook**

Include environment variable names only, CI gates, safe migration order, cron setup, rate-limit health, rollback, Neon backup/PITR checklist, and post-deploy smoke checks.

- [ ] **Step 5: Write current Mermaid ERD**

Document all 32 models grouped into identity, catalog, commerce, engagement, and operations. Mark `public/erd_diagram.png` as historical/stale.

- [ ] **Step 6: Verify GREEN**

Run CSP tests and production build. Expected: build exit 0 and production CSP test pass.

## Task 7: Update audit evidence and run the full release gate

**Files:**
- Modify: `AUDIT_REPORT.md`
- Modify: `codex_project_audit_pack/REQUIREMENTS_TRACEABILITY.md`
- Modify: `codex_project_audit_pack/DATA_DICTIONARY.md`
- Modify: `codex_project_audit_pack/API_CATALOG.md`

- [ ] **Step 1: Update verified findings**

Mark only findings proven fixed by fresh commands. Keep VNPay excluded and unresolved by user decision. Record exact residual dependency advisories if any.

- [ ] **Step 2: Run full verification**

```powershell
npm run lint
npm run build
npm run typecheck
npm test
npx prisma validate
npm run db:status
npm audit --omit=dev --audit-level=high
```

Expected: all source gates pass. Dependency audit must be reported exactly as returned.

- [ ] **Step 3: Verify scope**

```powershell
git status --short
git diff --name-only
git diff --check
```

Expected: no VNPay source/test file changed, no secret file tracked, no unrelated `.ai-understand/` content modified.

- [ ] **Step 4: Final self-review**

Re-read this plan and the design spec. Confirm each acceptance criterion has a file change and a verification result, and report any remaining gap without claiming it complete.
