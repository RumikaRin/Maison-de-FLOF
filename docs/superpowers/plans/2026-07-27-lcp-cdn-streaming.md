# LCP, CDN, and Early Streaming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce production p75 LCP below 2.5 seconds by making public HTML cacheable, streaming the homepage hero before database work, removing first-paint opacity gates, and shrinking blog-card payloads.

**Architecture:** Locale preference remains URL-authoritative on the server and client-persisted when changed; middleware no longer attaches `Set-Cookie` to locale-prefixed HTML. The homepage hero renders in the initial server shell while an async server child resolves catalogue data. Blog list routes use a dedicated card projection that cannot include article bodies.

**Tech Stack:** Next.js 15 App Router, React 19 Suspense streaming, Prisma 6, TypeScript, Node test runner, Lighthouse CI, Playwright.

---

### Task 1: Make locale-prefixed public responses CDN-cacheable

**Files:**
- Create: `src/lib/locale-response-policy.ts`
- Modify: `src/middleware.ts`
- Test: `tests/locale-routing.test.ts`

- [ ] **Step 1: Write the failing locale-cookie policy test**

Add tests importing `shouldPersistLocaleCookie` and asserting:

```ts
assert.equal(
  shouldPersistLocaleCookie({
    requestHadLocalePrefix: true,
    currentCookie: null,
    resolvedLocale: "vi",
  }),
  false,
);
assert.equal(
  shouldPersistLocaleCookie({
    requestHadLocalePrefix: false,
    currentCookie: null,
    resolvedLocale: "vi",
  }),
  true,
);
assert.equal(
  shouldPersistLocaleCookie({
    requestHadLocalePrefix: false,
    currentCookie: "en",
    resolvedLocale: "en",
  }),
  false,
);
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --experimental-strip-types --test tests/locale-routing.test.ts`

Expected: FAIL because `src/lib/locale-response-policy.ts` does not exist.

- [ ] **Step 3: Implement the pure policy and use it in middleware**

Create:

```ts
import type { Locale } from "./locale.ts";

export function shouldPersistLocaleCookie(input: {
  requestHadLocalePrefix: boolean;
  currentCookie: string | null | undefined;
  resolvedLocale: Locale;
}) {
  return (
    !input.requestHadLocalePrefix &&
    input.currentCookie !== input.resolvedLocale
  );
}
```

In middleware, remove `withLocaleCookie` from `rewriteWithNonce`. Apply the
cookie only to unprefixed/unsupported redirect responses when the pure policy
returns true. Preserve security and CDN cache headers.

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run: `node --experimental-strip-types --test tests/locale-routing.test.ts`

Expected: all locale-routing tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/locale-response-policy.ts src/middleware.ts tests/locale-routing.test.ts
git commit -m "perf: allow locale pages to use vercel cdn cache"
```

### Task 2: Stream the homepage hero in the initial shell

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/features/home/HomeClient.tsx`
- Modify: `src/components/features/home/HeroSection.tsx`
- Modify: `src/components/layout/MainLayoutWrapper.tsx`
- Test: `tests/home-performance-contract.test.ts`

- [ ] **Step 1: Write failing source-contract tests**

Create assertions that require:

```ts
assert.ok(pageSource.includes("<HeroSection />"));
assert.ok(pageSource.includes("<Suspense"));
assert.ok(pageSource.indexOf("<HeroSection />") < pageSource.indexOf("<Suspense"));
assert.ok(!homeClientSource.includes("<HeroSection />"));
assert.ok(!heroSource.includes("initial={reduceMotion ? false : { opacity: 0 }}"));
assert.ok(!layoutSource.includes("<safeMotion.main"));
```

Also require `quality={82}` on the hero image.

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --experimental-strip-types --test tests/home-performance-contract.test.ts`

Expected: FAIL because the hero still lives inside `HomeClient` and both
first-paint opacity gates remain.

- [ ] **Step 3: Implement the server streaming boundary**

In `src/app/page.tsx`, make the page synchronous, render `<HeroSection />`
first, and place an async `HomePageSections` server component inside Suspense:

```tsx
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <Suspense fallback={<div className="min-h-[24rem] bg-atelier-paper" />}>
        <HomePageSections />
      </Suspense>
    </>
  );
}

async function HomePageSections() {
  const {
    mappedProducts,
    colors,
    mappedBlogs,
    source,
    commerceAvailable,
  } = await getHomePageData(db);
  return (
    <HomeClient
      initialPaints={mappedProducts}
      initialColors={colors}
      initialBlogs={mappedBlogs}
      catalogAvailability={{ source, commerceAvailable }}
    />
  );
}
```

Remove the hero import/render from `HomeClient`. Render homepage children in a
plain `<main>` in `MainLayoutWrapper`; remove `AnimatePresence` and
`safeMotion.main`. Replace the hero media `safeMotion.div` with a plain
absolutely positioned `div`, remove the first-paint opacity transition, and
set image quality to 82.

- [ ] **Step 4: Run focused tests and confirm GREEN**

Run: `node --experimental-strip-types --test tests/home-performance-contract.test.ts tests/home-page-data.test.ts`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/components/features/home/HomeClient.tsx src/components/features/home/HeroSection.tsx src/components/layout/MainLayoutWrapper.tsx tests/home-performance-contract.test.ts
git commit -m "perf: stream homepage hero before catalogue data"
```

### Task 3: Remove blog render delay and article-body payload

**Files:**
- Modify: `src/services/blog.service.ts`
- Modify: `src/app/blog/page.tsx`
- Modify: `src/lib/home-page-data.ts`
- Modify: `src/components/features/blog/BlogListingClient.tsx`
- Test: `tests/blog-service.test.ts`
- Test: `tests/home-page-data.test.ts`
- Test: `tests/home-performance-contract.test.ts`

- [ ] **Step 1: Write failing projection and first-paint tests**

Add a service test requiring `serializePublicBlogCard` to omit both `content`
and `contentEn`. Capture the homepage database query and assert:

```ts
assert.equal(blogQuery.select.content, undefined);
assert.equal(blogQuery.select.contentEn, undefined);
assert.deepEqual(blogQuery.select.author, { select: { name: true } });
```

Add a source-contract assertion that `BlogListingClient` does not contain
`initial={reduceMotion ? false : { opacity: 0 }}`.

- [ ] **Step 2: Run focused tests and confirm RED**

Run:
`node --experimental-strip-types --test tests/blog-service.test.ts tests/home-page-data.test.ts tests/home-performance-contract.test.ts`

Expected: FAIL because card serialization/projection does not exist and the
initial opacity gate remains.

- [ ] **Step 3: Implement the blog-card boundary**

In `blog.service.ts`, add `PUBLIC_BLOG_CARD_SELECT`, `PublicBlogCard`, and
`serializePublicBlogCard`. The serializer returns only card metadata.

Use the select and serializer on `/blog`. In `home-page-data.ts`, query the same
card fields and stop mapping `content`/`contentEn`. Keep the full serializer on
the article-detail route.

In `BlogListingClient`, replace the initial `safeMotion.div` results wrapper
with a plain `div`. Keep search/category state behavior and all visual classes.

- [ ] **Step 4: Run focused tests and confirm GREEN**

Run:
`node --experimental-strip-types --test tests/blog-service.test.ts tests/home-page-data.test.ts tests/home-performance-contract.test.ts`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/services/blog.service.ts src/app/blog/page.tsx src/lib/home-page-data.ts src/components/features/blog/BlogListingClient.tsx tests/blog-service.test.ts tests/home-page-data.test.ts tests/home-performance-contract.test.ts
git commit -m "perf: trim blog cards and remove lcp render delay"
```

### Task 4: Strengthen the Lighthouse release gate

**Files:**
- Modify: `scripts/run-lighthouse-gate.ts`
- Modify: `lighthouserc.json`
- Modify: `tests/lighthouse-gate.test.ts`

- [ ] **Step 1: Write the failing gate test**

Require the URL list to include `http://127.0.0.1:3100/blog` and require:

```ts
assert.deepEqual(config.ci.assert.assertions["largest-contentful-paint"], [
  "error",
  { maxNumericValue: 2500, aggregationMethod: "median-run" },
]);
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --experimental-strip-types --test tests/lighthouse-gate.test.ts`

Expected: FAIL because `/blog` and the LCP assertion are absent.

- [ ] **Step 3: Update the gate**

Add `/blog` to both Lighthouse URL lists and add the median LCP limit of 2500
milliseconds. Keep three runs and existing score/CLS assertions.

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run: `node --experimental-strip-types --test tests/lighthouse-gate.test.ts`

Expected: all Lighthouse configuration tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/run-lighthouse-gate.ts lighthouserc.json tests/lighthouse-gate.test.ts
git commit -m "test: enforce blog lcp release budget"
```

### Task 5: Production verification

**Files:**
- Modify: `docs/superpowers/plans/2026-07-27-lcp-cdn-streaming.md`

- [ ] **Step 1: Run static and unit gates**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run test:bundle
```

Expected: zero failures.

- [ ] **Step 2: Build before browser/type generation checks**

Run: `npm run build`

Expected: optimized production build completes.

- [ ] **Step 3: Verify response headers and payload**

Start production on port 3100. For `/vi` and `/vi/blog`, record cold/warm TTFB,
download size, and headers. Expected: locale-prefixed HTML has CDN cache
directives and no `Set-Cookie`.

- [ ] **Step 4: Run browser and E2E checks**

Run:

```bash
npm run test:e2e -- e2e/atelier-redesign.spec.ts
npm run test:lighthouse
```

Expected: Atelier suite passes; Lighthouse median LCP is at most 2.5 seconds on
all configured routes.

- [ ] **Step 5: Compare before/after evidence and commit the completed plan**

Record homepage/blog LCP, phase breakdown, TTFB, HTML bytes, transfer bytes, and
any remaining production-only uncertainty. Mark all completed checkboxes and
commit only the plan/evidence update.
