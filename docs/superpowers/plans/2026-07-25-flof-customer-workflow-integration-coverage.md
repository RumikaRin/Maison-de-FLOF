# FLOF Customer Workflow Integration Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add safe database integration tests for review, quote, and conversation lifecycles.

**Architecture:** Extract HTTP-independent workflow services that receive Prisma and the authenticated identity/session identifier. Route handlers retain Auth.js, Zod, and response mapping. State transitions, notifications, and audit writes are tested against `flof_test`.

**Tech Stack:** Next.js 15, TypeScript, Prisma 6, PostgreSQL, Zod, Node test runner through `tsx`.

---

### Task 1: Workflow fixture cleanup

**Files:**
- Modify: `tests/integration/helpers/test-database.ts`
- Create: `tests/integration/customer-workflows.integration.test.ts`

- [ ] **Step 1: Write a failing cleanup test**

Insert records with identifiers beginning `integration-workflow-`, call
`resetCustomerWorkflowFixtures`, and assert only those records and their
dependent messages/notifications/audits are removed.

- [ ] **Step 2: Verify RED**

```powershell
npm run test:integration -- --test-name-pattern "workflow cleanup"
```

Expected: FAIL because the cleanup function is not exported.

- [ ] **Step 3: Implement scoped cleanup**

Delete dependent workflow rows using the integration namespace. Never run an
unfiltered delete against customer, review, quote, conversation, or message
tables.

- [ ] **Step 4: Verify GREEN and commit**

```powershell
npm run test:integration -- --test-name-pattern "workflow cleanup"
git add tests/integration/helpers/test-database.ts tests/integration/customer-workflows.integration.test.ts
git commit -m "test: add safe customer workflow cleanup"
```

### Task 2: Review lifecycle service

**Files:**
- Create: `src/lib/customer-workflow-service.ts`
- Modify: `src/app/api/reviews/route.ts`
- Modify: `src/app/api/admin/reviews/route.ts`
- Test: `tests/integration/customer-workflows.integration.test.ts`

- [ ] **Step 1: Write failing review tests**

Using the seeded customer and purchased product, assert:

- a verified buyer can create a pending review;
- the same buyer/product pair updates through upsert instead of duplicating;
- a user without a completed purchase receives `ApiError(403, ...)`;
- staff notifications are created;
- staff publishing/replying changes the review and writes an audit record;
- deleting removes the review and writes an audit record.

- [ ] **Step 2: Verify RED**

```powershell
npm run test:integration -- --test-name-pattern "review lifecycle"
```

Expected: FAIL because workflow service exports do not exist.

- [ ] **Step 3: Implement minimal review services**

Export:

```ts
submitVerifiedReview(database, userId, input)
moderateReview(database, actor, input)
deleteReview(database, actor, reviewId)
```

Move existing purchase lookup, upsert, notification, moderation, deletion, and
audit behavior into these services. Mutation plus notification/audit must be
atomic where the current schema permits it.

- [ ] **Step 4: Delegate both review routes**

Preserve guards, Zod schemas, status codes, and response bodies. Route handlers
must pass only validated values to the services.

- [ ] **Step 5: Verify and commit**

```powershell
npm run test:integration -- --test-name-pattern "review lifecycle"
npm test
npm run typecheck
git add src/lib/customer-workflow-service.ts src/app/api/reviews/route.ts src/app/api/admin/reviews/route.ts tests/integration/customer-workflows.integration.test.ts
git commit -m "test: cover verified review lifecycle"
```

### Task 3: Quote lifecycle service

**Files:**
- Modify: `src/lib/customer-workflow-service.ts`
- Modify: `src/app/api/quote-request/route.ts`
- Modify: `src/app/api/admin/quotes/route.ts`
- Test: `tests/integration/customer-workflows.integration.test.ts`

- [ ] **Step 1: Write failing quote tests**

Assert an anonymous request persists contact/project data and creates staff
notifications. Assert a signed-in customer's request links to that customer.
Update the status and internal note as STAFF, then assert the new state and
audit record. Unknown identifiers must throw without changing another quote.

- [ ] **Step 2: Verify RED**

```powershell
npm run test:integration -- --test-name-pattern "quote lifecycle"
```

Expected: FAIL because quote service exports do not exist.

- [ ] **Step 3: Implement minimal quote services**

Export:

```ts
createQuoteRequest(database, customerId, input)
updateQuoteRequest(database, actor, input)
```

Keep creation plus notifications in one transaction. Keep update plus audit in
one transaction. Preserve the route's existing status enum and JSON shape.

- [ ] **Step 4: Delegate routes, verify, and commit**

```powershell
npm run test:integration -- --test-name-pattern "quote lifecycle"
npm run lint
npm run typecheck
git add src/lib/customer-workflow-service.ts src/app/api/quote-request/route.ts src/app/api/admin/quotes/route.ts tests/integration/customer-workflows.integration.test.ts
git commit -m "test: cover quote request lifecycle"
```

### Task 4: Conversation lifecycle service

**Files:**
- Modify: `src/lib/customer-workflow-service.ts`
- Modify: `src/app/api/chat/conversation/route.ts`
- Modify: `src/app/api/admin/chat/conversations/route.ts`
- Modify: `src/app/api/admin/chat/conversations/[id]/route.ts`
- Test: `tests/integration/customer-workflows.integration.test.ts`

- [ ] **Step 1: Write failing conversation tests**

Assert:

- first customer message creates a conversation and message;
- a later message with the same session reuses/reopens it;
- staff notifications are generated;
- a different session cannot fetch the conversation;
- staff reply attaches to the same conversation;
- staff read marks customer messages read;
- staff actions write audit evidence where required by the route contract.

- [ ] **Step 2: Verify RED**

```powershell
npm run test:integration -- --test-name-pattern "conversation lifecycle"
```

Expected: FAIL because conversation service exports do not exist.

- [ ] **Step 3: Implement conversation services**

Export:

```ts
getConversationForSession(database, sessionId)
appendCustomerMessage(database, sessionId, input)
listStaffConversations(database, query)
appendStaffMessage(database, actor, conversationId, content)
readConversationAsStaff(database, actor, conversationId)
```

Use transactions for conversation/message/notification state changes. Session
lookup must always include the caller's session identifier.

- [ ] **Step 4: Delegate routes**

Keep request validation and `requireStaff`/session extraction at the HTTP layer.
Preserve response status and payload names.

- [ ] **Step 5: Verify and commit**

```powershell
npm run test:integration -- --test-name-pattern "conversation lifecycle"
npm run lint
npm run typecheck
git add src/lib/customer-workflow-service.ts src/app/api/chat/conversation/route.ts src/app/api/admin/chat/conversations/route.ts \"src/app/api/admin/chat/conversations/[id]/route.ts\" tests/integration/customer-workflows.integration.test.ts
git commit -m "test: cover support conversation lifecycle"
```
