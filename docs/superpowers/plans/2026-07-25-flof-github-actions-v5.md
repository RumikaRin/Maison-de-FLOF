# FLOF GitHub Actions v5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the deprecated Node 20 action-runtime warning while preserving the complete Node 24 quality gate.

**Architecture:** A source test characterizes required action versions and the existing release steps. The workflow then upgrades only checkout/setup-node major versions, without changing secrets, permissions, database, or gate ordering.

**Tech Stack:** GitHub Actions, Node.js 24, Node test runner, PostgreSQL 18.

---

### Task 1: CI workflow contract

**Files:**
- Create: `tests/ci-workflow.test.ts`
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Write the failing workflow test**

Read `.github/workflows/ci.yml` and assert:

```ts
assert.match(source, /actions\/checkout@v5/);
assert.match(source, /actions\/setup-node@v5/);
assert.doesNotMatch(source, /actions\/(checkout|setup-node)@v4/);
assert.match(source, /node-version:\s*24/);
assert.match(source, /image:\s*postgres:18/);
```

Also assert the release commands occur in their current relative order:
migrate, fixtures, lint, unit, env, integration, build, typecheck, E2E, OpenAPI,
Lighthouse, audit.

- [ ] **Step 2: Run RED**

```powershell
node --experimental-strip-types --test tests/ci-workflow.test.ts
```

Expected: FAIL because both actions are still v4.

- [ ] **Step 3: Upgrade only action majors**

Change:

```yaml
- uses: actions/checkout@v5
- uses: actions/setup-node@v5
```

Do not change `permissions`, secrets, Node version, PostgreSQL version, or quality
commands.

- [ ] **Step 4: Run GREEN**

```powershell
node --experimental-strip-types --test tests/ci-workflow.test.ts
npm test
```

Expected: workflow contract and all unit tests pass.

- [ ] **Step 5: Commit**

```powershell
git add .github/workflows/ci.yml tests/ci-workflow.test.ts
git commit -m "ci: upgrade official actions to Node 24 runtime"
```

### Task 2: Release verification and delivery

**Files:**
- Modify: `AUDIT_REPORT.md`
- Modify: `codex_project_audit_pack/REQUIREMENTS_TRACEABILITY.md`

- [ ] **Step 1: Update evidence**

Record 52 route files, 99 OpenAPI operations, the new HTTP test count, action v5,
and remaining provider/Neon limitations. Do not change `DATA_DICTIONARY.md`
unless a persisted field changed.

- [ ] **Step 2: Run local release gates**

```powershell
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run test:openapi
npm run test:e2e
npm run build
npm run test:lighthouse
npm audit --omit=dev --audit-level=high
```

Expected: all commands exit zero.

- [ ] **Step 3: Push**

```powershell
git push origin feature/homepage-targeted-polish
```

- [ ] **Step 4: Inspect remote gates**

Wait for the GitHub Actions run for the pushed SHA. Confirm the workflow no
longer emits the Node 20 action-runtime warning. Inspect the Git-triggered Vercel
deployment, smoke `/`, `/products`, and `/api/categories`, then query
error/fatal runtime logs. Do not trigger a manual deployment.
