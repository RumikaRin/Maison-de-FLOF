# FLOF P2-P3 Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the remaining non-VNPay P2/P3 requirements: consistent API errors, verified credential accounts, revocable sessions and admin MFA, privacy/audit/data boundaries, persisted visualizer designs, locale-aware routes, reliable notifications, and enforceable frontend performance gates.

**Architecture:** Keep the Next.js modular monolith. Route handlers authenticate/validate and delegate to focused services; Prisma owns additive persistence; Auth.js JWTs carry a database-backed session identifier; provider calls remain outside transactions. Locale prefixes are implemented by middleware rewrite so existing route modules remain the single implementation.

**Tech Stack:** Next.js 15 App Router, React 19, Auth.js v5, Prisma 6/PostgreSQL, Zod, Node test runner, Playwright, axe-core, Lighthouse CI, Vercel, Neon.

---

## Safety and scope

- VNPay code and verification remain excluded.
- Use only additive Prisma migrations; never reset, seed, truncate, or `db push`.
- Apply migrations first to `flof_test`; Neon production is changed only through reviewed `prisma migrate deploy` after restore evidence.
- Never print or commit secrets. `.ai-understand/` remains untouched.
- External Upstash/Resend/Cloudinary/Google checks remain `NOT VERIFIED` unless the connected provider returns direct evidence.

## File structure

- `src/lib/api-error-contract.ts`, `src/lib/api-auth.ts`: stable error construction/parsing.
- `src/lib/auth/email-verification.ts`: verification token lifecycle.
- `src/lib/auth/session-registry.ts`: database-backed JWT session issuance/revocation.
- `src/lib/auth/totp.ts`, `src/lib/auth/mfa-crypto.ts`: RFC 6238 verification and encrypted MFA secret storage.
- `src/services/privacy.service.ts`: export/anonymize/retention operations.
- `src/services/visualizer.service.ts`: room/design ownership and mutations.
- `src/lib/locale.ts`, middleware, language store: locale prefix/cookie/header contract.
- `src/lib/notifications/polling.ts`: visibility-aware bounded polling policy.
- `scripts/check-bundle-budgets.ts`: route/shared JavaScript budgets from build output.
- New API route modules stay under `src/app/api`; UI pages remain under `src/app`.

### Task 1: API error contract for every operation

**Files:**
- Modify: `src/lib/api-error-contract.ts`
- Modify: `src/lib/api-auth.ts`
- Create: `tests/api-error-route-coverage.test.ts`
- Create: `docs/api-versioning.md`
- Modify: every legacy route reported by the new inventory test
- Modify: `docs/openapi.yaml`

- [ ] **Step 1: Write the failing route inventory test**

Add a test that inventories all exported methods from `src/app/api/**/route.ts`, permits redirects/stream responses, and otherwise requires failures to call `apiErrorResponse`, `jsonApiError`, or return the stable envelope directly. Assert that legacy `{ error: string }` literals are absent.

```ts
test("all JSON API failures use the stable error envelope", async () => {
  const violations = await findLegacyApiErrorResponses(projectRoot);
  assert.deepEqual(violations, []);
});
```

- [ ] **Step 2: Run red**

Run: `node --experimental-strip-types --test tests/api-error-route-coverage.test.ts`  
Expected: FAIL listing the current blog, dealer, product, favorite and cron legacy responses.

- [ ] **Step 3: Add the shared response helper**

Expose:

```ts
export function jsonApiError(
  request: Request,
  status: number,
  code: string,
  message: string,
  details?: unknown,
): Response;
```

It must return `{ error: { code, message, details? }, requestId }`, sanitize details, and preserve `x-request-id`.

- [ ] **Step 4: Migrate every reported route**

Replace legacy errors with stable codes such as `NOT_FOUND`, `RATE_LIMITED`, `VALIDATION_ERROR`, `OUTBOX_PROCESSING_FAILED`, and `INTERNAL_ERROR`. Preserve status codes and success payloads.

- [ ] **Step 5: Verify contract**

Document the current unversioned compatibility policy, criteria for introducing `/api/v1`, deprecation headers/windows, and the rule that a generated client is not published before versioned schemas are stable.

Run:

```powershell
node --experimental-strip-types --test tests/api-error-contract.test.ts tests/api-error-route-coverage.test.ts
npm run test:openapi
```

Expected: both tests and 99-operation OpenAPI coverage pass.

- [ ] **Step 6: Commit**

Commit: `refactor: standardize API error responses`

### Task 2: Credential email verification

**Files:**
- Create: `src/lib/auth/email-verification.ts`
- Create: `src/app/api/auth/verify-email/route.ts`
- Create: `src/app/api/auth/resend-verification/route.ts`
- Create: `src/app/verify-email/page.tsx`
- Modify: `src/app/api/auth/register/route.ts`
- Modify: `src/auth.ts`
- Modify: `src/lib/email.ts`
- Modify: `docs/openapi.yaml`
- Test: `tests/email-verification.test.ts`
- Test: `e2e/auth-lifecycle.spec.ts`

- [ ] **Step 1: Write failing token lifecycle tests**

Assert tokens are random, stored only as SHA-256 hashes under `verify:<email>`, expire, are single-use, and set `User.emailVerified`.

- [ ] **Step 2: Run red**

Run: `node --experimental-strip-types --test tests/email-verification.test.ts`  
Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Implement token service and email**

Expose:

```ts
createEmailVerificationToken(database, email, now?): Promise<{ token: string; expires: Date }>
consumeEmailVerificationToken(database, email, token, now?): Promise<void>
```

Registration creates the user and hashed verification token transactionally, then sends a verification URL. Email failure keeps the account unverified and permits safe resend.

- [ ] **Step 4: Enforce verification at credentials login**

Credentials `authorize` returns null when `emailVerified` is null. OAuth-created users keep provider-supplied verification behavior.

- [ ] **Step 5: Add API/UI and E2E**

`POST /api/auth/verify-email` consumes `{ email, token }`; resend always returns a generic success response to avoid account enumeration. Update registration UX and verify that an unverified user is denied, token consumption succeeds once, and verified credentials can sign in.

- [ ] **Step 6: Verify and commit**

Run focused unit, auth E2E and OpenAPI tests.  
Commit: `feat: verify credential email ownership`

### Task 3: Revocable sessions and immediate role demotion

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260726xxxxxx_auth_session_registry/migration.sql`
- Create: `src/lib/auth/session-registry.ts`
- Modify: `src/auth.ts`
- Modify: `src/lib/api-auth.ts`
- Create: `src/app/api/profile/sessions/route.ts`
- Create: `src/components/features/profile/tabs/SessionsTab.tsx`
- Modify: profile tab composition/types
- Test: `tests/session-registry.test.ts`
- Test: `e2e/session-revocation.spec.ts`

- [ ] **Step 1: Write failing registry tests**

Specify `AuthSession(id,userId,createdAt,lastSeenAt,expiresAt,revokedAt,userAgentHash,ipHash)` and `User.sessionVersion Int @default(0)`. Tests require revoked/expired/version-mismatched sessions to fail.

- [ ] **Step 2: Run red**

Run focused test; expect missing registry implementation.

- [ ] **Step 3: Add reviewed additive migration**

Create the table/index/FK and `sessionVersion` column using additive SQL only. Run `prisma validate`, `test:db:migrate`, and regenerate client.

- [ ] **Step 4: Integrate Auth.js JWT**

On first JWT issuance, create a registry row and store `sessionId` plus `sessionVersion`. On subsequent JWT evaluation, validate the row and current role/version. Remove the five-minute role cache: admin role mutation increments `sessionVersion`, immediately invalidating old sessions.

- [ ] **Step 5: Add session management**

`GET /api/profile/sessions` lists sanitized session metadata. `DELETE` accepts a session ID owned by the current user; `allOthers: true` revokes every other session. UI exposes revoke controls without displaying token/IP/user-agent raw values.

- [ ] **Step 6: Verify and commit**

Run migration parity, unit/integration/E2E ownership tests.  
Commit: `feat: add revocable authenticated sessions`

### Task 4: Administrator TOTP MFA

**Files:**
- Modify: `prisma/schema.prisma`
- Add: migration `admin_mfa`
- Create: `src/lib/auth/totp.ts`
- Create: `src/lib/auth/mfa-crypto.ts`
- Create: `src/services/mfa.service.ts`
- Create: `src/app/api/profile/mfa/setup/route.ts`
- Create: `src/app/api/profile/mfa/verify/route.ts`
- Create: `src/app/api/profile/mfa/disable/route.ts`
- Modify: `src/auth.ts`
- Modify: `src/app/login/page.tsx`
- Modify: `.env.example`
- Test: `tests/totp.test.ts`, `tests/mfa-crypto.test.ts`
- Test: `e2e/admin-mfa.spec.ts`

- [ ] **Step 1: Write RFC 6238 failing tests**

Use published SHA-1 30-second TOTP vectors, ±1 window behavior, malformed-code rejection, encrypted-secret round trip, and wrong-key failure.

- [ ] **Step 2: Implement crypto/TOTP**

Use Node `crypto` only. Encrypt secrets with AES-256-GCM under `AUTH_MFA_ENCRYPTION_KEY`; production must fail closed if the key is missing/invalid.

- [ ] **Step 3: Add additive credential model**

`MfaCredential(userId unique, secretCiphertext, enabledAt, recoveryCodeHashes Json, createdAt, updatedAt)`. Never store plaintext secret or recovery codes.

- [ ] **Step 4: Add setup/verify/disable APIs**

Setup is ADMIN-only and returns a one-time secret plus `otpauth://` URI. Verify enables MFA and returns recovery codes once. Disable requires password plus valid TOTP/recovery code and audits the action.

- [ ] **Step 5: Enforce login challenge**

Credentials accepts optional `mfaCode`; enabled admins cannot sign in without a valid TOTP/recovery code. Login UI reveals the MFA field after the generic first rejection without disclosing whether an arbitrary account has MFA.

- [ ] **Step 6: Verify and commit**

Run unit, API E2E, auth lifecycle and audit sanitizer tests.  
Commit: `feat: require TOTP MFA for enabled administrators`

### Task 5: Distributed public-write protection and provider readiness

**Files:**
- Modify: `src/lib/security/rate-limit-policy.ts`
- Modify: `src/middleware.ts`
- Modify: `.env.example`
- Modify: `scripts/check-provider-readiness.ts`
- Test: `tests/public-write-rate-limit.test.ts`
- Test: `e2e/public-write-abuse.spec.ts`

- [ ] **Step 1: Expand failing policy tests**

Cover quote, guest chat, review, registration, forgot/reset-password and verification resend with separate keys/budgets. Production protected writes must use distributed `deny` failure mode.

- [ ] **Step 2: Implement policy and middleware**

Keep memory mode only for local/test. Return the stable `RATE_LIMITED` envelope with non-negative `Retry-After`.

- [ ] **Step 3: Add sanitized provider readiness**

Readiness reports only provider names/status and missing variable names. It must never echo URLs with credentials, keys, mailbox addresses or response bodies.

- [ ] **Step 4: Verify and commit**

Run rate-limit unit/E2E and provider contract tests.  
Commit: `security: protect every public write path`

### Task 6: Production style CSP migration

**Files:**
- Modify: `src/lib/security/headers.ts`
- Modify: `src/middleware.ts`
- Modify: all TSX files reported by `rg "style=\\{\\{|<motion\\." src -g "*.tsx"`
- Create: `src/styles/dynamic-visuals.css`
- Test: `tests/security-headers.test.ts`
- Test: `tests/no-inline-style.test.ts`
- Test: `e2e/cross-browser-smoke.spec.ts`

- [ ] **Step 1: Write failing source/CSP tests**

Production policy must omit `unsafe-inline` from `style-src` and set `style-src-attr 'none'`. Source inventory fails for React `style={{...}}`; permitted dynamic color rendering uses SVG presentation attributes or bounded data/class tokens.

- [ ] **Step 2: Replace inline static styles**

Move transition curves, line height, backdrop and static transforms to Tailwind/CSS classes.

- [ ] **Step 3: Replace dynamic styles**

Use `<progress>` for widths, SVG `fill` for arbitrary color swatches, and CSS keyframes/Web Animations for motion. Remove Framer Motion from components that emit runtime style attributes; preserve reduced-motion behavior.

- [ ] **Step 4: Tighten CSP**

Use nonce-bearing style elements only where Next.js requires them; production denies style attributes. Verify rendered production pages do not report CSP violations.

- [ ] **Step 5: Verify and commit**

Run source gate, header unit, build and browser matrix.  
Commit: `security: remove production inline style execution`

### Task 7: Audit UI, retention and structured logging

**Files:**
- Create: `src/app/admin/audit/page.tsx`
- Create: `src/components/admin/AuditLogTable.tsx`
- Modify: `src/app/api/admin/audit-logs/route.ts`
- Create: `src/lib/operations/log.ts`
- Create: `docs/security/audit-retention.md`
- Test: `tests/operational-log.test.ts`
- Test: `e2e/admin-audit.spec.ts`

- [ ] **Step 1: Write failing log and access tests**

Logs must include event, severity, correlationId and safe metadata while recursively excluding secrets/PII/raw errors. Audit list is ADMIN-only, paginated and filterable.

- [ ] **Step 2: Implement structured logger and migrate touched paths**

Replace touched `console.error` calls with sanitized JSON events. Keep provider error codes, never provider payloads.

- [ ] **Step 3: Add audit UI/policy**

Render actor/action/entity/date and sanitized before/after diff. Document seven-year audit retention for the demo policy, append-only expectations, administrative access and legal-review requirement before production.

- [ ] **Step 4: Verify and commit**

Run unit, admin HTTP/E2E, axe and policy inventory.  
Commit: `feat: expose governed audit history`

### Task 8: Privacy export, deletion and data lifecycle

**Files:**
- Modify: `prisma/schema.prisma`
- Add: migration `privacy_and_inventory_reference`
- Create: `src/services/privacy.service.ts`
- Create: `src/app/api/profile/data-export/route.ts`
- Create: `src/app/api/profile/delete-account/route.ts`
- Create: `src/app/api/cron/apply-retention/route.ts`
- Modify: `vercel.json`
- Create: `docs/security/privacy-retention.md`
- Create: `docs/security/chat-lifecycle.md`
- Test: `tests/integration/privacy.integration.test.ts`
- Test: `e2e/privacy-api-http.spec.ts`

- [ ] **Step 1: Write failing lifecycle tests**

Export must be owner-scoped and omit password/token/provider secrets. Deletion anonymizes identity/contact/address/chat while retaining legally necessary order/audit totals. Retention cron requires `CRON_SECRET` and is idempotent.

- [ ] **Step 2: Add data fields**

Add `User.privacyConsentAt`, `User.deletionRequestedAt`; add enum `InventoryReferenceType` and `InventoryTransaction.referenceType`; backfill known ORDER/IMPORT records additively.

- [ ] **Step 3: Implement transactional service/API**

Export returns a JSON attachment. Deletion revokes sessions, anonymizes PII using deterministic non-reversible labels, deletes wishlists/addresses where allowed, and records an audit event.

- [ ] **Step 4: Add retention cron and masking policy**

Delete expired verification/session rows and stale guest chat/notifications under documented windows. Document non-production masking and keep fixtures synthetic.

Formally separate `ChatMessage` as the consented guest/contact-request lifecycle from authenticated `Conversation/Message`: define reporting fields, access, retention, deletion and the rule forbidding automatic identity linkage by matching email/phone.

- [ ] **Step 5: Verify and commit**

Run migration, integration, HTTP, cron auth and data dictionary checks.  
Commit: `feat: implement customer privacy lifecycle`

### Task 9: Persisted visualizer rooms and designs

**Files:**
- Modify: `prisma/schema.prisma`
- Add: migration `visualizer_projects`
- Create: `src/services/visualizer.service.ts`
- Create: `src/app/api/visualizer/rooms/route.ts`
- Create: `src/app/api/visualizer/designs/route.ts`
- Create: `src/app/api/visualizer/designs/[id]/route.ts`
- Split/modify: `src/app/color-visualizer/page.tsx`
- Create: `src/components/features/visualizer/VisualizerClient.tsx`
- Test: `tests/integration/visualizer.integration.test.ts`
- Test: `e2e/visualizer.spec.ts`

- [ ] **Step 1: Write failing ownership tests**

Rooms are public active templates. Designs require a user, contain roomId/name/palette JSON, and can only be list/read/update/delete by their owner.

- [ ] **Step 2: Add additive models**

Add `VisualizerRoom` and `VisualizerDesign` with cuid keys, active/sort indexes, user/room FKs and timestamps. Migration inserts the current room templates idempotently without production seed.

- [ ] **Step 3: Implement services/APIs**

Validate palette entries as `{ zone, colorCode, hex }`; cap name/palette size; use stable API errors and ownership filters.

- [ ] **Step 4: Replace `MOCK_ROOMS` UI**

Load rooms from the API, show retry/error/empty states, and let authenticated users save, reopen, rename and delete designs. Guests can experiment but receive a login prompt on save.

- [ ] **Step 5: Verify and commit**

Run migration, integration, E2E, responsive and axe checks.  
Commit: `feat: persist color visualizer designs`

### Task 10: Real related blog posts

**Files:**
- Modify: `src/app/api/blog/[slug]/route.ts`
- Modify: `src/app/blog/[slug]/page.tsx`
- Test: `tests/blog-related-posts.test.ts`
- Test: `e2e/public-catalog-api-http.spec.ts`

- [ ] **Step 1: Write failing ranking tests**

Related posts exclude the current slug, require active status, prefer the same category, fall back to recent posts and cap at three.

- [ ] **Step 2: Implement shared query/ranking**

Return localized database fields and render links/cards on the detail page with empty state omitted.

- [ ] **Step 3: Verify and commit**

Run unit, HTTP/Prisma and axe checks.  
Commit: `feat: show related blog articles`

### Task 11: Locale-prefixed routing

**Files:**
- Create: `src/lib/locale.ts`
- Modify: `src/middleware.ts`
- Modify: `src/store/language-store.ts`
- Modify: language toggle component
- Modify: `src/app/layout.tsx`
- Modify: `src/app/sitemap.ts`
- Modify: `README.md`
- Test: `tests/locale-routing.test.ts`
- Test: `e2e/locale-routing.spec.ts`

- [ ] **Step 1: Write failing routing tests**

`/vi/products` and `/en/products` rewrite to the existing route, API/assets/auth callbacks are never prefixed, unsupported locale returns/redirects safely, and the locale cookie/header agree.

- [ ] **Step 2: Implement middleware prefix rewrite**

Expose `SUPPORTED_LOCALES`, `stripLocalePrefix`, `localizedPath`, and locale resolution. Preserve browser URL while rewriting internally; unprefixed public routes redirect to the cookie/default `vi` prefix.

- [ ] **Step 3: Synchronize UI/server**

Language toggle updates cookie/store and navigates to the equivalent localized path. Root layout sets `html lang` from the server-visible locale. Sitemap includes locale alternates.

Document that cart state remains device-local for the demo and that multi-device cart synchronization needs a separate product decision and data model.

- [ ] **Step 4: Verify and commit**

Run unit, browser navigation, auth callback, sitemap and SEO gates.  
Commit: `feat: add Vietnamese and English routes`

### Task 12: Controlled notification delivery

**Files:**
- Create: `src/lib/notifications/polling.ts`
- Modify: `src/components/admin/AdminNotificationDropdown.tsx`
- Modify: notification APIs for ETag/updated cursor
- Test: `tests/notification-polling.test.ts`
- Test: `e2e/admin-operations-api-http.spec.ts`

- [ ] **Step 1: Write failing polling policy tests**

Polling pauses when hidden/offline, uses one in-flight request, backs off 10s→30s→60s on failure, resets on success, sends `If-None-Match`, and treats 304 as no change.

- [ ] **Step 2: Implement ETag and client controller**

Derive ETag from latest notification timestamp/count, add `Cache-Control: private, no-store`, and prevent overlapping timers/listener leaks.

- [ ] **Step 3: Verify and commit**

Run fake-timer unit tests, API scope tests and browser visibility test.  
Commit: `perf: bound notification polling`

### Task 13: Frontend retry, responsive and accessibility completion

**Files:**
- Modify touched storefront/admin clients
- Create: `src/components/ui/AsyncState.tsx`
- Modify: `e2e/accessibility.spec.ts`
- Modify: `e2e/cross-browser-smoke.spec.ts`
- Create: `e2e/responsive-journeys.spec.ts`

- [ ] **Step 1: Add failing browser assertions**

Cover storefront, login/register/verify, checkout, profile sessions/MFA/privacy, visualizer, dealer map, audit and admin notification at phone/tablet/desktop widths. Assert retry controls after intercepted 5xx.

- [ ] **Step 2: Implement shared async states**

Use explicit loading, retryable error and empty states; retry buttons preserve focus and have accessible names. Respect `prefers-reduced-motion`.

- [ ] **Step 3: Verify and commit**

Run Chromium full, Firefox/WebKit/mobile smoke, axe and AX checks.  
Commit: `test: complete responsive accessible journeys`

### Task 14: Lighthouse, bundle and maintainability budgets

**Files:**
- Modify: `lighthouserc.js`
- Create: `scripts/check-bundle-budgets.ts`
- Create: `tests/bundle-budgets.test.ts`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`
- Refactor: touched oversized clients/routes and explicit `any` reported by scoped inventory

- [ ] **Step 1: Write failing budget tests**

Require three Lighthouse runs per URL, performance median ≥0.75, accessibility/best-practices/SEO ≥0.90, CLS ≤0.1, and route/shared JS budgets based on `.next` build manifests.

- [ ] **Step 2: Implement budgets**

Add `test:bundle`; fail on shared JS >115 kB or targeted page initial JS >210 kB. Record budgets in CI after build.

- [ ] **Step 3: Optimize failures**

Lazy-load map/visualizer/modal/heavy admin chunks, use responsive `next/image`, move read-only rendering server-side where practical, split oversized touched components, replace touched `any` with Prisma/Zod/shared DTO types, and move touched route business rules into services.

- [ ] **Step 4: Verify and commit**

Run build, bundle gate, three-run Lighthouse and scoped lint/typecheck.  
Commit: `perf: enforce frontend delivery budgets`

### Task 15: Documentation, migration and release completion

**Files:**
- Modify: `AUDIT_REPORT.md`
- Modify: `codex_project_audit_pack/REQUIREMENTS_TRACEABILITY.md`
- Modify: `codex_project_audit_pack/API_CATALOG.md`
- Modify: `codex_project_audit_pack/DATA_DICTIONARY.md`
- Modify: `docs/erd.md`
- Modify: `docs/openapi.yaml`
- Modify: `docs/deployment-runbook.md`
- Create: `docs/operations/release-evidence/2026-07-26-p2-p3.md`

- [ ] **Step 1: Run isolated migration/release gate**

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
npm run test:bundle
npm run test:lighthouse
npm audit --omit=dev --audit-level=high
```

Every command must exit 0. Record exact counts and manual/external `NOT VERIFIED` items.

- [ ] **Step 2: Update source-of-truth documents**

Regenerate the Mermaid ERD/model counts, route/operation catalog, requirement matrix, security/privacy policies and release evidence. Do not claim manual screen-reader/provider verification without direct evidence.

- [ ] **Step 3: Review and deploy migrations safely**

Inspect SQL for destructive statements. Create/read a temporary Neon restore branch, run `prisma migrate deploy` only after restore proof, and verify migration status/model metadata without displaying the connection string.

- [ ] **Step 4: Push, PR and remote verification**

Push `codex/p2-p3-completion`, open a ready PR, wait for required `quality` and Vercel checks, merge without bypass, verify exact production SHA/deployment, run canonical smoke and scan 5xx.

- [ ] **Step 5: Completion audit**

Map every P2/P3 acceptance bullet to a current file plus passing command/runtime evidence. External legal/credential/manual blockers remain explicit and prevent only the corresponding evidence claim, not silent scope reduction.
