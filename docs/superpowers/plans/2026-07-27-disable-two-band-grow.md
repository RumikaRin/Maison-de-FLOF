# Disable Two Homepage Band-Grow Effects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the visualizer and expert-journal backgrounds static while preserving their inner entrance animations.

**Architecture:** Change the two component class contracts only. Keep the global utility and every descendant animation untouched.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Node test runner.

---

### Task 1: Remove band-grow from the two approved sections

**Files:**
- Modify: `tests/home-motion-integration.test.ts`
- Modify: `src/components/features/home/VisualizerPromoSection.tsx`
- Modify: `src/components/features/home/ExpertBlogsSection.tsx`

- [x] **Step 1: Write the failing test**

Change the two existing integration assertions to:

```ts
assert.ok(source.includes("fl-rise relative"));
assert.ok(!source.includes("fl-band-grow"));
```

Update the journal color-contract assertion so it expects
`fl-drench-mineral fl-rise relative`.

- [x] **Step 2: Verify RED**

Run:

```powershell
node --test --import tsx tests/home-motion-integration.test.ts
```

Expected: failures show both components still contain `fl-band-grow`.

- [x] **Step 3: Implement**

Remove only `fl-band-grow` from the root class strings in the visualizer and
expert-journal components.

- [x] **Step 4: Verify GREEN**

Run the focused test, lint, build, typecheck, and full test suite. All commands
must exit `0`.

- [x] **Step 5: Browser QA**

Verify the production homepage at desktop and 320px. The two section roots must
have no `fl-band-grow` class and no `clip-path`; the retained opacity-only
`fl-rise` and inner motion nodes must remain present. Confirm no horizontal
overflow.

- [x] **Step 6: Commit**

Stage only the plan, two components, and integration test, then commit:

```powershell
git commit -m "fix: keep homepage section backgrounds static"
```
