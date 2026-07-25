# Maison de FLOF Deployment Runbook

Last verified against source: 24/07/2026

## Supported runtime

- Node.js: `>=24 <25`
- Package manager: npm using the committed `package-lock.json`
- Application: Next.js modular monolith
- Database: PostgreSQL/Neon through Prisma
- Target described by the repository: Vercel

CI and production must use the same Node major version.

## Required environment variable names

Store values in the deployment platform secret manager. Never commit or print
values.

### Core

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_APP_NAME`

### Authentication

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `AUTH_ALLOW_DANGEROUS_EMAIL_LINKING`

### Email

- `RESEND_API_KEY`
- `EMAIL_FROM`

### Media

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Request protection and scheduled jobs

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `CRON_SECRET`
- `PAYMENT_UNPAID_TIMEOUT_MINUTES`

### Optional public content

- `NEXT_PUBLIC_HERO_IMAGE`
- `NEXT_PUBLIC_MESSENGER_URL`

VNPay variables are intentionally outside the verified production scope of
this runbook.

## Pre-deploy gate

Run from a clean checkout:

```powershell
npm ci
npm run db:generate
npm run lint
npm run build
npm run typecheck
npm test
npm run test:env
npm run test:integration
npm run test:e2e
npm run test:openapi
npm run test:lighthouse
npx prisma validate
npm audit --omit=dev --audit-level=high
npm run db:status
```

Stop the release if any command exits non-zero. Do not suppress the dependency
audit and do not use `npm audit fix --force` in a release job.

`npm run check:release-env` reports missing variable names only. Set
`REQUIRE_PRODUCTION_ENV=1` in the controlled release environment when a missing
name must fail the job. Passing this name-only check proves configuration
presence, not provider availability or credential validity.

## Manual external evidence gates

The following remain manual release evidence and must not be marked passing
from environment-name validation, unit tests, or a successful build alone:

1. Restore a backup/PITR point into a separate Neon branch or database and
   record that the restored application data is readable.
2. Invoke the production outbox cron through its configured scheduler and
   confirm an authorized execution is visible in sanitized runtime logs.
3. Deliver a non-sensitive test email through Resend and confirm both provider
   acceptance and mailbox receipt.
4. Exercise one low-volume protected auth request and confirm Upstash is
   healthy, with no fail-closed HTTP 503 response.
5. Confirm production monitoring receives application/runtime signals and that
   the configured alert route reaches an on-call owner.

If any item lacks dated evidence, record it as `NOT VERIFIED` and stop
production promotion when that dependency is release-critical.

## Database release order

1. Confirm the target database hostname and database name without printing the
   connection string.
2. Confirm Neon backup/PITR is enabled and record the latest restorable point.
3. Run `npm run db:status`.
4. Review every pending SQL migration for destructive statements.
5. If pending migrations are additive/backward-compatible, run
   `npm run db:migrate` once from a controlled release job.
6. Run `npm run db:status` again.
7. Deploy the application.
8. Run post-deploy smoke checks before promoting traffic.

Never run `prisma db push`, `prisma migrate reset`, or seed demo users in
production.

## Scheduled jobs

The repository-owned `vercel.json` schedules:

- `GET /api/cron/process-outbox` at `00:05 UTC` daily.

The call requires:

```text
Authorization: Bearer <CRON_SECRET>
```

The daily cadence is compatible with Vercel Hobby limits and acceptable only
for this demo. For a production email SLA, move the outbox schedule to a plan
that supports every 1–5 minutes.

The unpaid-order expiry route is not scheduled because VNPay remains outside
the verified scope. Alert when the configured cron returns 401, 503, or
repeated 5xx responses.

## Rate-limit health

Production auth endpoints fail closed when the distributed rate-limit backend
is missing or unavailable. Before traffic promotion:

1. confirm both Upstash variable names are configured;
2. make one valid low-volume auth request and confirm it is not HTTP 503;
3. inspect sanitized logs for `Distributed rate limiting backend unavailable`;
4. alert on repeated 503 responses from auth/register/reset-password routes.

Do not log the Upstash token or Authorization headers.

## Post-deploy smoke checks

Verify without creating destructive data:

1. `/`, `/products`, `/colors`, `/blog`, and `/find-dealer` return 200.
2. `/robots.txt` and `/sitemap.xml` return valid content.
3. An unauthenticated `/admin` request is redirected to login.
4. Invalid pagination such as `/api/products?limit=101` returns 400.
5. A normal public catalog request returns data without 5xx.
6. `GET /api/cron/process-outbox` without a bearer token returns 401.
7. Security headers include HSTS, nosniff, frame protection, and a production
   CSP without `unsafe-eval`.
8. Error logs contain no secret values.

## Rollback

### Application-only failure

1. Stop traffic promotion.
2. Redeploy the last known-good application version.
3. Re-run smoke checks.
4. Keep the database at the current version if migrations were
   backward-compatible.

### Migration failure

1. Stop application promotion and all writers if data integrity is uncertain.
2. Do not manually edit Prisma migration history.
3. Capture the failed migration name and sanitized database error.
4. Prefer a forward corrective migration for additive changes.
5. If recovery requires restore, use the verified Neon restore point into a
   new database, validate it, then switch the application connection through
   the secret manager.
6. Run `prisma migrate status` and smoke tests before reopening traffic.

### External provider failure

- Resend unavailable: outbox records remain `FAILED` and retry; do not mark
  them `SENT`.
- Upstash unavailable: sensitive auth endpoints return 503; restore the
  backend before accepting auth traffic.
- Cloudinary unavailable: media mutations fail; existing catalog reads remain
  available.

## Monitoring and alert conditions

The root layout includes Vercel Web Analytics and Speed Insights only when
`VERCEL=1`. Local production-server checks intentionally omit their platform
scripts so local browser consoles remain clean.

At minimum alert on:

- HTTP 5xx rate and latency for `/api`;
- HTTP 503 on protected auth endpoints;
- outbox records with `retryCount >= 3`;
- cron failures or missed schedules;
- database connection saturation and slow queries;
- inventory update conflicts;
- dependency audit failure in CI;
- failed deployment or migration status mismatch.

## Evidence to retain per release

- commit SHA and deployment ID;
- Node/npm versions;
- quality-gate command outputs;
- dependency audit result;
- Prisma migration status before/after;
- backup/PITR verification time;
- smoke-check result;
- rollback decision and operator if used.
