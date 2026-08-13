# Homepage Band Color Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved teal consultation band and light-mineral expert journal while preserving the existing homepage layout, content, and motion.

**Architecture:** Add explicit `teal` and `mineral` band classes to the shared
stylesheet so each section continues to own its background, ink, rule, and
focus colors. Apply them through the existing band primitives without changing
the untracked primitive source files.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Node test runner, Playwright.

---

### Task 1: Lock the approved color contract

**Files:**
- Modify: `tests/home-motion-integration.test.ts`

- [x] **Step 1: Write the failing test**

Add a test that reads `HomeClient.tsx` and `ExpertBlogsSection.tsx`, then asserts:

```ts
assert.ok(home.includes('className="bg-atelier-paper-2 text-atelier-accent"'));
assert.ok(home.includes('className="fl-drench-teal py-fl-2xl md:py-fl-3xl"'));
assert.ok(blogs.includes('className="fl-drench-mineral fl-rise fl-band-grow'));
assert.ok(blogs.includes('border-atelier-rule'));
assert.ok(!blogs.includes('border-atelier-rule-on-dark'));
```

- [x] **Step 2: Run the focused test and verify RED**

Run:

```powershell
node --test --import tsx tests/home-motion-integration.test.ts
```

Expected: the new color-contract test fails because the source still uses
`clay`, `espresso`, and dark-field rules.

### Task 2: Implement shared band variants and update the homepage

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/features/home/HomeClient.tsx`
- Modify: `src/components/features/home/ExpertBlogsSection.tsx`

- [x] **Step 1: Add shared color variants**

Add `teal` and `mineral` band classes using:

```css
--fl-drench-teal: var(--fl-accent);
--fl-drench-mineral: var(--fl-paper-2);
```

The teal band uses `--fl-on-dark`; the mineral band uses `--fl-ink`, normal
rules, and the existing focus token.

- [x] **Step 2: Apply the approved colors**

Change the consultation `BandEdge` and `DrenchBand` to `teal`. Keep its light
button, but use teal text. Change the journal to `mineral`, replace dark-field
rules with `border-atelier-rule`, and change DotField colors to subtle warm
espresso-neutral values suitable for a light field.

- [x] **Step 3: Verify GREEN**

Run:

```powershell
node --test --import tsx tests/home-motion-integration.test.ts
npm run lint
npm run typecheck
npm run build
```

Expected: all commands exit `0`.

- [x] **Step 4: Browser verification**

Inspect the homepage at desktop and 320px widths. Confirm both bands are
readable, the painted edge matches the teal band, the journal hairlines and dot
field remain visible, there is no horizontal overflow, and the console has no
errors.

- [x] **Step 5: Commit**

Stage only the files listed in this plan and commit:

```powershell
git commit -m "feat: improve homepage band contrast"
```
