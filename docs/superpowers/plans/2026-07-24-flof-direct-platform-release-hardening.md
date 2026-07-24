# FLOF Direct Platform Release Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the remaining non-VNPay platform hardening locally, publish it through GitHub, and verify the resulting Vercel Preview before requesting approval for the Neon production migration.

**Architecture:** Keep the existing Next.js modular monolith and the existing Vercel/Neon projects. Add repository-owned deployment configuration, first-party Vercel telemetry, sanitized cron logs, and additive PostgreSQL CHECK constraints. Database migration execution remains a separate release step.

**Tech Stack:** Next.js 15.5, React 19, TypeScript, Node test runner, Prisma 6, PostgreSQL 18 on Neon, Vercel Git Integration, Vercel Analytics, Vercel Speed Insights, Playwright CLI.

---

## Task 1: Add Vercel deployment config and first-party telemetry

**Files:**
- Create: `vercel.json`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/app/layout.tsx`
- Create: `tests/deployment-config.test.ts`

- [ ] Write a failing test that parses `vercel.json`, asserts one cron entry,
  asserts its path is `/api/cron/process-outbox`, asserts five-field daily cron
  syntax, and asserts no path contains `vnpay` or `expire-unpaid-orders`.
- [ ] Run `node --experimental-strip-types --test tests/deployment-config.test.ts`
  and confirm RED because `vercel.json` is absent.
- [ ] Add `vercel.json` with the daily outbox schedule.
- [ ] Install `@vercel/analytics` and `@vercel/speed-insights`.
- [ ] Render `<Analytics />` and `<SpeedInsights />` once in the root layout.
- [ ] Run the targeted test and typecheck; confirm GREEN.

## Task 2: Add sanitized structured cron logging

**Files:**
- Create: `src/lib/operational-log.ts`
- Create: `tests/operational-log.test.ts`
- Modify: `src/app/api/cron/process-outbox/route.ts`
- Modify: `src/app/api/cron/expire-unpaid-orders/route.ts`

- [ ] Write failing tests proving operational log records preserve safe count,
  route, duration, and error-code fields while removing keys matching password,
  token, secret, authorization, credential, email, payload, and raw error.
- [ ] Run the targeted test and confirm RED because the module is absent.
- [ ] Implement a pure record builder plus console writer that serializes one
  JSON object per event.
- [ ] Replace raw cron error logging with stable event names and sanitized
  fields. Include `x-vercel-id` when supplied by the request.
- [ ] Run targeted tests, lint, and typecheck.

## Task 3: Add database CHECK constraints as a Prisma migration

**Files:**
- Create: `prisma/migrations/20260724150000_add_data_invariant_checks/migration.sql`
- Create: `tests/database-invariants.test.ts`
- Modify: `codex_project_audit_pack/DATA_DICTIONARY.md`
- Modify: `AUDIT_REPORT.md`

- [ ] Write a failing test that reads the migration and asserts stable
  constraint names for Paint, Order, OrderItem, Payment, Coupon, Review, and
  InventoryTransaction, with both `NOT VALID` and `VALIDATE CONSTRAINT`.
- [ ] Run the targeted test and confirm RED because the migration is absent.
- [ ] Write additive CHECK constraints using quoted Prisma table/column names.
- [ ] Update the data dictionary and audit report to distinguish “migration
  prepared” from “migration applied”.
- [ ] Run the targeted test and `npx prisma validate`.
- [ ] Run `npm run db:status`; expect the new migration to be reported pending,
  and do not apply it yet.

## Task 4: Run the complete local release gate and browser smoke

**Files:**
- No production file changes expected.
- Browser artifacts, if any: `output/playwright/`

- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm test`.
- [ ] Run `npx prisma validate`.
- [ ] Run `npm run db:status`.
- [ ] Run `npm audit --omit=dev --audit-level=high`.
- [ ] Run `git diff --check`.
- [ ] Start the production server locally.
- [ ] Use Playwright CLI to verify public pages and pagination API responses
  without submitting any mutating form.
- [ ] Stop the local server and record exact results in `AUDIT_REPORT.md`.

## Task 5: Publish the scoped branch and verify Vercel Preview

**Files:**
- Stage only the source, tests, migration, audit documents, spec, and plan from
  the two hardening passes.

- [ ] Confirm `gh --version` and `gh auth status`.
- [ ] Inspect `git status`, branch diff, and remote.
- [ ] Explicitly exclude `.ai-understand/` and every VNPay path.
- [ ] Commit the scoped changes on `feature/homepage-targeted-polish`.
- [ ] Push with upstream tracking to GitHub.
- [ ] Wait for the Vercel deployment associated with the pushed commit.
- [ ] Inspect Vercel build state/logs and fetch the Preview root, products,
  colors, dealers, and login paths.
- [ ] Query immediate Preview runtime errors.
- [ ] Open a draft PR from `feature/homepage-targeted-polish` to `main`.
- [ ] Do not merge the PR or promote production.

## Task 6: Neon production migration approval gate

**Files:**
- No further source changes unless Preview or migration review finds a defect.

- [ ] Re-run the read-only Neon invariant query.
- [ ] Present the migration impact: additive CHECK constraints, current invalid
  row counts, database size, expected lock type, and rollback command.
- [ ] Ask for explicit approval to run `npm run db:migrate` against the existing
  Neon `FLOF` production branch.
- [ ] Stop before any production schema write until approval is received.
