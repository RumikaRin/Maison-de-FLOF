# FLOF Admin API Integration Coverage Design

**Date:** 2026-07-25

**Status:** Approved

**Scope:** Admin catalog CRUD, review/quote/chat lifecycle, and complete admin API authorization coverage

**Explicit exclusion:** VNPay remains a simulated integration and is not part of this work.

## Problem

FLOF has route-level validation, authorization guards, audit logging, and several
database transactions, but current integration coverage is concentrated on
checkout, order access, the email outbox, and audit sanitization. The remaining
admin and customer-support workflows need repeatable evidence that:

- catalog mutations preserve database invariants and write audit evidence;
- review, quote, and chat records can complete their intended lifecycle;
- every `/api/admin/**` method has an explicit authorization policy;
- CUSTOMER, STAFF, and ADMIN roles cannot cross the intended permission boundary;
- tests cannot connect to Neon or another non-test database by mistake.

## Chosen Approach

Use a hybrid test architecture:

1. Extract small database-backed service functions from route handlers where
   route logic currently cannot be exercised without an Auth.js session.
2. Test those services against the isolated `flof_test` PostgreSQL database.
3. Keep route handlers responsible for authentication, parsing, and HTTP response
   mapping, while services own state transitions and transactional invariants.
4. Maintain a source-controlled admin API policy manifest and verify it against
   the actual route tree.
5. Add a small role-permission test matrix rather than duplicating the same CRUD
   test for every structurally identical route.

This gives stronger evidence than database-only tests and is less brittle than
mocking Auth.js module state in every route test.

## Safety Boundary

- All database integration commands must use `TEST_DATABASE_URL`.
- `assertTestDatabaseUrl` remains the mandatory connection guard.
- The accepted database name is `flof_test` on localhost.
- Cleanup deletes only records carrying the integration-test namespace.
- No Prisma reset, destructive migration, Neon branch mutation, or production
  fixture cleanup is allowed.
- Test output must never print credentials or complete connection strings.

## Sub-project A: Admin Catalog CRUD

### Covered resources

- categories;
- suppliers;
- color collections;
- colors;
- products and their color links;
- representative uniqueness, soft-deactivation, linked-record, and audit rules.

Categories, suppliers, and collections share the same CRUD policy and therefore
use representative service-level coverage plus a policy-matrix assertion.
Products receive dedicated transaction coverage because product creation and
updates span multiple tables. Colors receive dedicated linked-delete coverage.

### Expected behavior

- duplicate slugs/codes are rejected before mutation;
- catalog writes require `CATALOG_MANAGE`;
- list operations remain available to STAFF and ADMIN;
- category, supplier, and collection deletion is a soft deactivation;
- linked colors cannot be deleted;
- product and color-link changes commit atomically;
- every successful catalog mutation creates a sanitized audit record.

## Sub-project B: Review, Quote, and Chat

### Review lifecycle

- a signed-in customer may submit one review per product;
- a verified purchase is required;
- a repeated submission updates the existing review instead of duplicating it;
- staff may reply to or delete a review;
- staff-facing notifications and audit records are preserved.

### Quote lifecycle

- a visitor or customer may create a quote request;
- staff receives a notification;
- staff may assign a valid status and internal note;
- invalid transitions or unknown identifiers fail without partial writes;
- status changes create audit evidence.

### Conversation lifecycle

- an authenticated customer's conversation is identified by `Conversation.userId`;
- a customer message creates or reopens that user's conversation;
- staff receives notifications;
- staff may list, read, reply, and mark messages as read;
- a customer may not read another user's conversation;
- customer and staff message writes remain attached to the same conversation.

The legacy single-message chat endpoint remains documented and covered by the
admin policy matrix, while lifecycle integration focuses on the newer
conversation/message model.

## Sub-project C: Complete Admin API Policy Coverage

Create one explicit manifest entry per exported method in `src/app/api/admin`.
Each entry records:

- route path and HTTP method;
- minimum role or named permission;
- whether the operation mutates state;
- expected audit behavior;
- test strategy: database integration, unit policy test, provider contract, or
  manual live verification.

An automated test scans the route tree and fails when:

- a route method exists without a manifest entry;
- a manifest entry points to a nonexistent route method;
- an admin route has no recognizable authorization guard;
- a state mutation lacks an explicit audit decision;
- a provider-dependent route is incorrectly presented as locally integrated.

The role matrix verifies current permission semantics:

- CUSTOMER has no admin capability;
- STAFF can read operational data, update orders, confirm payments, import
  inventory, and manage support;
- ADMIN has every declared permission;
- catalog, coupon, promotion, media deletion, user management, and audit-log
  access remain restricted according to their current guards.

## External Provider Boundary

The following require real credentials or provider state and will not be treated
as live local integration evidence:

- Cloudinary upload/delete;
- Google OAuth;
- Resend delivery;
- Upstash rate limiting;
- Neon backup/PITR/restore;
- VNPay simulation.

Their routes must still appear in the API catalog and policy manifest with an
honest verification classification.

## Documentation Updates

After implementation:

- update `codex_project_audit_pack/REQUIREMENTS_TRACEABILITY.md`;
- update `codex_project_audit_pack/API_CATALOG.md`;
- update `AUDIT_REPORT.md` with new evidence and remaining limitations;
- keep `DATA_DICTIONARY.md` unchanged unless implementation changes persisted
  fields or constraints.

## Acceptance Criteria

- every admin route method is represented in the policy manifest;
- catalog integration tests cover a representative shared CRUD resource plus
  product transactions and linked-color deletion;
- review, quote, and conversation lifecycles run against `flof_test`;
- tests demonstrate denied and allowed role/permission cases;
- lint, typecheck, unit tests, integration tests, OpenAPI coverage, E2E, and build
  complete successfully where the local environment supports them;
- CI and the Vercel preview for the pushed commit are inspected before completion
  is reported.
