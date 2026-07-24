# FLOF Direct Platform Release Hardening Design

**Date:** 2026-07-24
**Status:** Approved
**Deployment model:** Local verification → GitHub branch push → Vercel Preview → PR to `main`
**Database model:** Existing Neon project `FLOF`; no replacement project and no application test branch
**Scope exclusion:** VNPay source, tests, and production certification remain excluded.

## 1. Goal

Close the remaining deployment, observability, browser-verification, and
database-integrity gaps while using the existing GitHub, Vercel, and Neon
projects directly.

## 2. Verified platform baseline

- Vercel team: `Rumika`
- Vercel project: `maison-de-flof`
- Vercel Node runtime: 24.x
- Neon project: `FLOF`
- Neon primary branch: `production`
- PostgreSQL: 18.4
- Current database size: about 10.7 MB
- Existing invalid rows for the proposed invariants: zero
- Existing public CHECK constraints: zero
- Current Git branch: `feature/homepage-targeted-polish`

The current branch is not linked to an upstream. Pushing it creates a Vercel
Preview. Production changes only after merging or pushing to `main`.

## 3. Deployment configuration

Add `vercel.json` with a production cron for the email outbox. The schedule
must be valid on the lowest Vercel tier, so it runs daily. This is sufficient
for the demo but is not a production email-delivery SLA; a paid Vercel plan or
another scheduler is required for minute-level retry.

The VNPay unpaid-order expiry cron is not added because VNPay is outside this
hardening scope.

`CRON_SECRET` remains an environment variable managed in Vercel. Its value is
never committed or printed. Existing route authorization continues to require
`Authorization: Bearer CRON_SECRET`.

## 4. Observability

Add first-party Vercel Web Analytics and Speed Insights to the root layout.
They collect page-level usage and Core Web Vitals without introducing a new
external monitoring vendor.

Cron routes emit structured, sanitized operational logs containing:

- event name;
- route;
- request/deployment correlation ID when available;
- duration;
- processed/succeeded/failed counts;
- stable error code.

Logs never include authorization headers, email payloads, provider responses,
tokens, or raw error messages.

## 5. Database integrity

Add a new Prisma SQL migration containing additive CHECK constraints for:

- non-negative paint stock, prices, cost, minimum stock, and sold count;
- paint discount percentage from 0 through 100;
- positive paint volume and coat count;
- non-negative order monetary values;
- positive order-item quantity and non-negative item amounts;
- non-negative payment amount;
- valid coupon value, spend range, usage range, and date range;
- review rating from 1 through 5;
- non-zero inventory transaction quantity.

Each constraint is added `NOT VALID` and then validated. The production data
has already been checked with read-only SQL and contains zero violations for
the core rules.

The migration is committed and deployed separately from the Vercel build.
`prisma migrate deploy` is never placed in `postinstall` or the Vercel build
command. Applying it to Neon production requires a final explicit approval.

## 6. Local verification

Before pushing:

1. Run unit tests for deployment config, structured logging, and migration
   coverage.
2. Run lint, build, typecheck, all tests, Prisma validate, migration status,
   dependency audit, and `git diff --check`.
3. Start the production build locally.
4. Use Playwright CLI for read-only browser smoke checks of `/`, `/products`,
   `/colors`, `/find-dealer`, `/login`, valid products API pagination, and
   invalid pagination returning 400.

No browser test registers users, creates orders, changes inventory, or writes
to Neon.

## 7. GitHub and Vercel release flow

- Stage only files belonging to the audit hardening and this release pass.
- Exclude `.ai-understand/`.
- Keep VNPay files unchanged.
- Commit on `feature/homepage-targeted-polish`.
- Push the branch and let Vercel Git Integration create the Preview.
- Inspect deployment state, build logs, public smoke responses, and runtime
  errors through the Vercel plugin.
- Open a draft PR to `main` after Preview verification.
- Do not merge or promote production automatically.

## 8. Acceptance criteria

- `vercel.json` is valid and contains only the non-VNPay outbox cron.
- Analytics and Speed Insights compile in the root layout.
- Cron logs are structured and contain no raw secret/provider detail.
- The migration contains all agreed invariant constraints.
- Full local release gates pass.
- Read-only browser smoke checks pass locally.
- No VNPay or `.ai-understand/` file is staged.
- GitHub push succeeds and Vercel Preview reaches READY.
- Preview has no build failure or immediate runtime-error cluster.
- Neon production remains unchanged until final migration approval.
