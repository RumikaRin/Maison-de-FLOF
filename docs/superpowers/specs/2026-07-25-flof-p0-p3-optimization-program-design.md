# FLOF P0-P3 Optimization Program Design

**Date:** 25/07/2026
**Repository:** `D:\ProjectZ\FLOF`
**Target:** Vercel + Neon demo/test environment
**Architecture:** Next.js modular monolith
**Excluded:** VNPay implementation and production verification

## 1. Purpose

This program closes the remaining P0 through P3 gaps recorded in
`AUDIT_REPORT.md` and
`codex_project_audit_pack/REQUIREMENTS_TRACEABILITY.md`. It retains the
existing Next.js modular monolith and strengthens release operations,
cross-layer testing, API/auth/security boundaries, and unfinished frontend
features.

The work is split into four sequential programs. Each program has its own
implementation plan, focused commits, verification evidence, and release
gate. A later program does not begin until the current program's required
local checks and remote checks are green.

## 2. Constraints

- Do not reset, truncate, or destructively migrate any database.
- Create and verify a restorable Neon backup/branch before applying a pending
  migration to the shared demo/test database.
- Do not run production/demo seed routines against the shared database.
- Do not print or commit secrets, tokens, connection strings, authorization
  headers, passwords, or provider credentials.
- Use additive, backward-compatible migrations. Prefer a forward corrective
  migration over editing migration history manually.
- Keep `.ai-understand/` and unrelated user changes untouched.
- VNPay remains outside the implementation, test, documentation, and release
  acceptance scope of this program.
- Push changes through GitHub. Vercel remains the deployment mechanism tied to
  the repository.

## 3. Delivery Strategy

The selected strategy is sequential and risk-first:

1. P0 establishes a trustworthy release and platform baseline.
2. P1 expands cross-layer correctness evidence.
3. P2 strengthens shared API, authentication, security, audit, and data
   boundaries.
4. P3 completes the user-facing features and performance work that depend on
   the preceding foundations.

Each phase uses a dedicated branch or a narrowly scoped continuation branch.
Every phase ends with local verification, GitHub CI verification, Vercel
verification when deployable behavior changed, and an update to the audit
evidence.

## 4. P0 - Release and Platform Baseline

### 4.1 Git and deployment

- Review and merge GitHub PR #2 only while the required GitHub CI and Vercel
  checks are successful and the branch remains mergeable.
- Confirm that the merge commit reaches `main` and triggers the expected
  Vercel deployment.
- Confirm branch protection or an equivalent required-check policy prevents
  merging a failing release.
- Run post-deploy smoke checks for public routes, security headers,
  unauthenticated admin behavior, catalog API behavior, cron authorization,
  and sanitized runtime logs.

### 4.2 Neon

- Inspect the current migration state without printing the connection string.
- Create a restorable Neon branch or backup point and prove the restored
  database is readable.
- Review the pending reconciliation migration for destructive SQL.
- Apply it with `prisma migrate deploy` only after the restore evidence is
  available.
- Verify migration status and target schema objects after deployment.

### 4.3 External services

- Verify the configured outbox cron through an authorized invocation and
  sanitized logs.
- Send a non-sensitive test email through Resend and record provider
  acceptance plus mailbox receipt.
- Verify a low-volume protected auth request succeeds through Upstash without
  falling back to unsafe instance-local behavior.
- Verify Cloudinary list/upload/delete with a disposable non-sensitive asset.
- Verify DNS/TLS/custom-domain behavior if a custom domain is configured.

### 4.4 Operations

- Establish monitoring for API 5xx, latency, protected-auth 503, cron misses,
  outbox retries, database saturation, inventory conflicts, migration
  mismatch, CI failures, and deployment failures.
- Verify at least one alert reaches the configured owner.
- Execute an application rollback drill and document the database recovery
  path.
- Retain release evidence: commit SHA, deployment ID, Node/npm versions,
  quality-gate results, migration status, restore point, smoke result, and
  rollback result.

### 4.5 P0 acceptance

P0 is complete only when PR #2 is merged, the current `main` deployment is
healthy, Neon restore and migration evidence are present, provider checks have
direct evidence, alert delivery is proven, and rollback instructions have
been exercised.

## 5. P1 - Cross-Layer Correctness

### 5.1 HTTP and ownership coverage

Add direct HTTP/database coverage for:

- product list and product detail;
- suppliers, colors, color collections, dealers, and blog;
- saved colors and saved products ownership;
- profile update, password change, and address ownership;
- admin supplier, product, promotion, color, collection, inventory, payment,
  refund, user/role, notification, dashboard, and media workflows;
- bank-transfer checkout and a valid verified-purchase review.

### 5.2 Concurrency and abuse coverage

Add deterministic tests for:

- stock contention and oversell prevention;
- coupon usage contention;
- inventory update conflicts;
- order-state transition races;
- duplicate refund prevention;
- checkout idempotency under concurrent requests;
- quote/chat spam limits.

### 5.3 Browser and quality matrix

- Add Firefox and WebKit projects.
- Add representative mobile viewports.
- Keep Chromium coverage.
- Add code-coverage reporting with enforceable thresholds and stronger
  thresholds for auth, checkout, inventory, order, and permission logic.
- Perform documented screen-reader checks for primary user journeys.
- Add controlled load tests for catalog, authentication, checkout, and admin
  dashboard paths.

### 5.4 P1 acceptance

P1 is complete only when the new HTTP, ownership, concurrency, browser,
coverage, accessibility, and load gates pass in a clean isolated test
environment without weakening existing assertions.

## 6. P2 - API, Authentication, Security, Audit, and Data

### 6.1 API boundary

- Standardize all API failures on an envelope containing `code`, `message`,
  `requestId`, and safe optional `details`.
- Preserve intentional success response shapes unless the OpenAPI contract
  explicitly changes.
- Remove legacy ad hoc error shapes.
- Keep the OpenAPI source inventory at complete route/method coverage.
- Define an API versioning policy before generating a shared TypeScript client.

### 6.2 Authentication and session security

- Add email verification for credential registrations.
- Add MFA for administrators.
- Add a session-management surface and session revocation.
- Define and enforce role-demotion revocation behavior rather than relying on
  an undocumented five-minute UI/middleware cache window.
- Verify Google OAuth against the configured demo/test provider.

### 6.3 Request and browser protection

- Apply distributed rate limits to quote, guest chat, review, and other
  public-write operations.
- Keep protected auth endpoints fail-closed if Upstash is unavailable.
- Remove production `style-src 'unsafe-inline'` after replacing incompatible
  inline styles with nonce, class, stylesheet, or CSS-variable mechanisms.

### 6.4 Audit, logging, and privacy

- Define audit retention, immutability expectations, and administrative access.
- Add an admin audit-log user interface.
- Replace scattered unstructured error logging in touched paths with sanitized
  structured operational logs and correlation IDs.
- Define PII consent, retention, export, deletion, and non-production masking.
- Document intentional weak references and add a discriminator for polymorphic
  inventory references.
- Consolidate the guest and authenticated chat data models or formally define
  their separate lifecycle, reporting, and retention behavior.

### 6.5 P2 acceptance

P2 is complete only when every API operation follows the documented error
contract, auth/session changes have direct tests, public-write rate limits are
distributed and verified, production CSP no longer permits inline styles,
audit/privacy policies are implemented, and OpenAPI remains synchronized.

## 7. P3 - Product Completion and Performance

### 7.1 Product features

- Replace `MOCK_ROOMS` with persisted visualizer room/project data exposed
  through authenticated-safe APIs.
- Allow a user to save, reopen, and delete a visualizer design.
- Return real related posts on blog detail.
- Add locale routing and server-aware Vietnamese/English behavior while
  preserving existing localized database fields.
- Implement controlled notification polling or realtime delivery with
  duplicate and spam protection.
- Keep cart state device-local for this demo program and document that
  multi-device synchronization is not supported. Server-side cart
  synchronization requires a separate product decision and data model.

### 7.2 Frontend reliability

- Add explicit retry/error states for touched client data flows.
- Verify responsive behavior for storefront, auth, checkout, profile,
  visualizer, map, and admin journeys.
- Preserve accessible names, keyboard behavior, reduced motion, color
  contrast, and layout stability.

### 7.3 Performance and maintainability

- Turn the Lighthouse performance requirement into an enforceable gate and
  collect multiple runs to reduce flakiness.
- Add route bundle reporting and budgets.
- Move read-only rendering to Server Components where it reduces client work.
- Lazy-load map, chart, modal, visualizer, and heavy admin functionality.
- Optimize LCP images and responsive image sizing.
- Split oversized components along data, mutation, and presentation
  boundaries.
- Replace explicit `any` types in touched domain paths with Prisma payload
  types, Zod inference, and shared DTOs.
- Move business rules out of touched route handlers and into focused services.

### 7.4 P3 acceptance

P3 is complete only when the visualizer and blog gaps are implemented, locale
and notification behavior are verified, responsive/accessibility regressions
are absent, Lighthouse performance meets the enforced threshold, and bundle
budgets pass.

## 8. Data Flow and Error Handling

Browser and server components call typed route handlers. Route handlers
authenticate, authorize, validate, and delegate to focused services. Services
perform business operations and Prisma transactions. Provider adapters isolate
Resend, Upstash, Cloudinary, and other external behavior.

Every request receives or creates a correlation identifier. Expected failures
are mapped to stable API error codes. Unexpected failures are logged in
sanitized structured form and return a generic public message. Provider
operations use explicit timeouts, retry policies where safe, and persisted
failure states where the operation must survive a request boundary.

Database mutations that span multiple records remain transactional. External
network calls do not run inside long-lived database transactions. Outbox-style
delivery is used when a committed business event must eventually reach an
external provider.

## 9. Verification Matrix

Every phase selects the applicable checks from:

- `npm run lint`
- `npm run build`
- `npm run typecheck`
- `npm test`
- `npm run test:env`
- isolated PostgreSQL migration and fixtures
- `npm run test:integration`
- `npm run test:e2e`
- `npm run test:openapi`
- `npm run test:lighthouse`
- `npx prisma validate`
- `npm audit --omit=dev --audit-level=high`
- GitHub CI status
- Vercel deployment status and smoke checks
- direct Neon/provider evidence for P0

A narrow test cannot prove a broad phase complete. The completion review maps
every phase requirement to a current file, command output, remote check, or
runtime observation.

## 10. Documentation and Evidence

Update the following when their source of truth changes:

- `AUDIT_REPORT.md`
- `codex_project_audit_pack/REQUIREMENTS_TRACEABILITY.md`
- `codex_project_audit_pack/API_CATALOG.md`
- `codex_project_audit_pack/DATA_DICTIONARY.md`
- `docs/openapi.yaml`
- `docs/erd.md`
- `docs/deployment-runbook.md`

The historical `public/erd_diagram.png` must be regenerated or explicitly
replaced before it is presented as current. Release evidence must record
failures as not verified instead of inferring success from configuration
presence.

## 11. Program Completion

The program is complete only after all P0, P1, P2, and P3 acceptance criteria
are proven against the current repository and applicable remote environments.
Passing the pre-existing test suite alone is not sufficient.
