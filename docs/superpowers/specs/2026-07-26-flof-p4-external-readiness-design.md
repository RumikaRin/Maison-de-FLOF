# FLOF P4 External Readiness Design

**Date:** 26/07/2026  
**Status:** Approved for implementation

## Goal

Close the remaining source-controlled production-readiness gaps without
pretending that human, legal, or third-party account evidence has passed.
VNPay remains outside this scope because it is intentionally simulated.

## Scope

### 1. Vercel Upstash compatibility

The Vercel Marketplace resource injects `KV_REST_API_URL` and
`KV_REST_API_TOKEN`. The application and sanitized readiness verifier must
accept those names as the preferred Vercel contract while retaining
`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for direct Upstash
deployments. Sensitive authentication routes remain fail-closed when neither
complete pair is available or Redis is unavailable.

### 2. Google OAuth availability

Google must only be registered and rendered when both
`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` exist. A deployment without
Google credentials must keep credential login working and must not present a
Google button that redirects to an Auth.js configuration error. Dangerous
email linking remains disabled unless explicitly enabled.

### 3. Administrator MFA user journey

Only administrators see a profile Security tab. The tab uses the existing MFA
setup, verify, and disable APIs:

1. begin setup and show the TOTP secret plus `otpauth` URI;
2. verify a six-digit TOTP;
3. show ten recovery codes once, with copy and text-download actions;
4. explain that each recovery code is single-use;
5. disable MFA only after the existing password and second-factor checks.

No new database table or plaintext recovery-code persistence is introduced.

### 4. Repeatable production-safe load profile

Add a committed runner that targets an explicit HTTPS base URL, performs only
bounded GET requests, stays below the public 60-request/minute policy, and
fails on unexpected status, any 5xx, or p95 above the configured budget. It
must never create users, orders, uploads, messages, or other business rows.

### 5. Evidence and manual boundaries

Update the deployment runbook and release evidence with:

- Upstash Free resource and sanitized PING evidence;
- Web Analytics and Speed Insights enabled state;
- production-safe load results;
- live Resend/Cloudinary/Google status;
- the exact remaining human gates: mailbox receipt, screen-reader session,
  alert receipt, and legal retention approval.

Automated checks must never convert those manual gates to PASS.

## Error handling and security

- Provider probes emit provider/status/stable error codes and variable names
  only.
- Secret values, Redis URLs, tokens, OAuth credentials, email recipients, and
  Cloudinary identifiers are never printed or committed.
- Upstash auth protection stays fail-closed; public read APIs may retain their
  bounded in-memory fallback.
- Recovery codes are returned once and only hashes remain in PostgreSQL.

## Verification

- Unit tests cover environment-pair resolution, Google provider visibility,
  MFA UI contracts, and load-profile budgets.
- Playwright exercises the administrator MFA journey through visible UI.
- Full lint, typecheck, unit, coverage, PostgreSQL integration, build, E2E,
  load, OpenAPI, bundle, Lighthouse, dependency audit, deployment smoke, and
  provider probes run before completion.
- Production evidence is recorded only from the exact merged deployment SHA.

