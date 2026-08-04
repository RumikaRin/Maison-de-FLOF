# FLOF Sitewide Mobile Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a balanced, touch-first mobile experience across every public FLOF route without changing business logic, APIs, or the locked Atelier Editorial system.

**Architecture:** Add one pure route-to-surface policy and let the public layout, fixed actions, chat, and overlay components consume it. Keep feature state where it already lives; introduce one accessible `MobileSheet` shell for mobile overlays, then normalize the in-flight catalogue/product/cart changes around that shell and policy.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 3, Framer Motion safe wrapper, Zustand, Node test runner, Playwright, axe-core.

**Design:** [`2026-08-04-flof-sitewide-mobile-optimization-design.md`](../specs/2026-08-04-flof-sitewide-mobile-optimization-design.md)  
**System:** [`design.md`](../../../design.md)

---

## File structure

| File | Responsibility |
|---|---|
| `src/lib/mobile-surface-policy.ts` | Pure locale-aware public-route classification and allowed fixed surfaces. |
| `src/components/ui/mobile-sheet.tsx` | Focus-managed, scroll-locking presentation shell for mobile overlays. |
| `src/components/layout/MobileBottomBar.tsx` | Token-only browse navigation that follows the policy. |
| `src/components/layout/Header.tsx` | Uses `MobileSheet` for the menu; preserves navigation, locale, session, and cart behavior. |
| `src/components/layout/MainLayoutWrapper.tsx` and `Footer.tsx` | Apply route-safe content/footer spacing below 768px. |
| `src/components/layout/ChatBubble.tsx` | Hides or offsets chat according to the policy. |
| `src/components/features/product/ProductsClient.tsx` | Keeps filters/grid state; renders the policy-compliant filter sheet. |
| `src/components/features/colors/ColorsClient.tsx` and `src/components/ui/color-detail-drawer.tsx` | Move the colour drawer onto the same overlay contract. |
| `src/components/features/product/ProductClient.tsx` and `src/app/cart/page.tsx` | Own their contextual action bars and never compete with bottom navigation. |
| `src/components/features/checkout/CheckoutOrderSummary.tsx` | Compact mobile order-summary disclosure; desktop sticky aside unchanged. |
| `tests/mobile-surface-policy.test.ts`, `tests/mobile-sheet-contract.test.ts` | Pure policy and source-contract regression tests. |
| `e2e/mobile-surfaces.spec.ts` | Route policy, fixed-surface exclusion, sheet keyboard behavior, and mobile journeys. |

Do not stage unrelated existing source changes with any task. `/admin/**`, API routes, Prisma, checkout request logic, auth logic, and locale routing remain unchanged.

### Task 1: Establish the route-to-surface policy with unit tests

**Files:**

- Create: `tests/mobile-surface-policy.test.ts`
- Create: `src/lib/mobile-surface-policy.ts`

- [ ] **Step 1: Write the failing route matrix test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { getMobileSurfacePolicy } from "../src/lib/mobile-surface-policy.ts";

test("mobile surface policy strips locales and excludes conflicting fixed UI", () => {
  assert.deepEqual(getMobileSurfacePolicy("/vi/products"), {
    mode: "browse", bottomNavigation: true, contextualAction: "none", chat: true,
  });
  assert.deepEqual(getMobileSurfacePolicy("/en/products/majestic"), {
    mode: "product", bottomNavigation: false, contextualAction: "product-purchase", chat: false,
  });
  assert.deepEqual(getMobileSurfacePolicy("/vi/cart"), {
    mode: "transaction", bottomNavigation: false, contextualAction: "cart-checkout", chat: false,
  });
  assert.deepEqual(getMobileSurfacePolicy("/vi/checkout"), {
    mode: "transaction", bottomNavigation: false, contextualAction: "none", chat: false,
  });
  assert.deepEqual(getMobileSurfacePolicy("/vi/admin/orders"), {
    mode: "admin", bottomNavigation: false, contextualAction: "none", chat: false,
  });
});
```

- [ ] **Step 2: Run the test to verify it fails because the policy does not exist**

Run: `node --experimental-strip-types --test tests/mobile-surface-policy.test.ts`  
Expected: FAIL with module-not-found for `mobile-surface-policy`.

- [ ] **Step 3: Implement the pure policy**

```ts
import { stripLocalePrefix } from "./locale";

export type MobileRouteMode = "browse" | "product" | "transaction" | "account" | "reading" | "admin";
export type ContextualAction = "none" | "product-purchase" | "cart-checkout";
export type MobileSurfacePolicy = {
  mode: MobileRouteMode;
  bottomNavigation: boolean;
  contextualAction: ContextualAction;
  chat: boolean;
};

const browsePaths = new Set(["/", "/products", "/colors", "/color-visualizer", "/find-dealer", "/blog"]);
const accountPaths = new Set(["/profile", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email"]);
const readingPaths = new Set(["/privacy-policy", "/cookie-policy", "/terms-of-service"]);

export function getMobileSurfacePolicy(pathname: string): MobileSurfacePolicy {
  const path = stripLocalePrefix(pathname).pathname;
  if (path.startsWith("/admin")) return { mode: "admin", bottomNavigation: false, contextualAction: "none", chat: false };
  if (path.startsWith("/products/")) return { mode: "product", bottomNavigation: false, contextualAction: "product-purchase", chat: false };
  if (path === "/cart") return { mode: "transaction", bottomNavigation: false, contextualAction: "cart-checkout", chat: false };
  if (path === "/checkout" || path === "/checkout/success" || path === "/quote-request") return { mode: "transaction", bottomNavigation: false, contextualAction: "none", chat: false };
  if (accountPaths.has(path)) return { mode: "account", bottomNavigation: false, contextualAction: "none", chat: false };
  if (path.startsWith("/blog/") || readingPaths.has(path)) return { mode: "reading", bottomNavigation: false, contextualAction: "none", chat: path.startsWith("/blog/") };
  return { mode: "browse", bottomNavigation: browsePaths.has(path), contextualAction: "none", chat: true };
}
```

- [ ] **Step 4: Expand the test for every public route mode and run it**

Add exact assertions for `/blog/[slug]`, `/checkout/success`, `/quote-request`, all account routes, and all three legal routes.  
Run: `node --experimental-strip-types --test tests/mobile-surface-policy.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit the isolated policy**

```bash
git add tests/mobile-surface-policy.test.ts src/lib/mobile-surface-policy.ts
git commit -m "feat: add mobile surface policy"
```

### Task 2: Build the accessible shared `MobileSheet`

**Files:**

- Create: `tests/mobile-sheet-contract.test.ts`
- Create: `src/components/ui/mobile-sheet.tsx`

- [ ] **Step 1: Write the failing source-contract test**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const file = path.join(import.meta.dirname, "..", "src", "components", "ui", "mobile-sheet.tsx");

test("MobileSheet owns dialog semantics, focus return, scroll lock, and reduced-motion-safe animation", () => {
  const source = readFileSync(file, "utf8");
  for (const requirement of ["aria-modal=\"true\"", "role=\"dialog\"", "document.body.style.overflow", "previousFocus", "event.key === \"Escape\"", "prefers-reduced-motion"]) {
    assert.match(source, new RegExp(requirement.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --experimental-strip-types --test tests/mobile-sheet-contract.test.ts`  
Expected: FAIL with `ENOENT` for `mobile-sheet.tsx`.

- [ ] **Step 3: Implement the shell with the following public contract**

```tsx
function trapTabWithin(panel: HTMLElement | null, event: KeyboardEvent) {
  if (!panel) return;
  const focusable = [...panel.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])")];
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

export function MobileSheet({ open, onClose, title, children }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const previousFocus = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFirst = () => panelRef.current?.querySelector<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")?.focus();
    const frame = requestAnimationFrame(focusFirst);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") trapTabWithin(panelRef.current, event);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus.current?.focus({ preventScroll: true });
    };
  }, [open, onClose]);

  return <AnimatePresence>{open ? <div className="fixed inset-0 z-[60] flex items-end md:hidden">
    <safeMotion.button aria-label="Close dialog" onClick={onClose} className="absolute inset-0 bg-atelier-espresso/35" />
    <safeMotion.div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className="relative max-h-[85dvh] w-full overflow-y-auto rounded-t-surface border-t border-atelier-rule-strong bg-atelier-paper px-fl-md pb-[max(var(--fl-space-md),env(safe-area-inset-bottom))] pt-fl-sm">
      <h2 id={titleId} className="fl-display text-fl-xl">{title}</h2>{children}
    </safeMotion.div>
  </div> : null}</AnimatePresence>;
}
```

Implement `trapTabWithin` immediately above the component: collect the same focusable selector, wrap from last to first on forward Tab, and from first to last on Shift+Tab. The real component must use `safeMotion` opacity/`y` transitions only and render no spring/bounce transition.

- [ ] **Step 4: Run the contract test and typecheck**

Run: `node --experimental-strip-types --test tests/mobile-sheet-contract.test.ts && npm run typecheck`  
Expected: both commands PASS.

- [ ] **Step 5: Commit the sheet primitive**

```bash
git add tests/mobile-sheet-contract.test.ts src/components/ui/mobile-sheet.tsx
git commit -m "feat: add accessible mobile sheet"
```

### Task 3: Make shared chrome route-aware and reserve safe area

**Files:**

- Modify: `src/components/layout/MobileBottomBar.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/MainLayoutWrapper.tsx`
- Modify: `src/components/layout/Footer.tsx`
- Modify: `src/components/layout/ChatBubble.tsx`
- Modify: `src/app/globals.css`
- Test: `e2e/mobile-surfaces.spec.ts`

- [ ] **Step 1: Add a failing Playwright policy test**

```ts
import { TEST_FIXTURES } from "../scripts/test-db-fixtures.ts";

test("fixed mobile surfaces are exclusive by route", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const [path, bottomNav, action] of [["/vi/products", true, "none"], ["/vi/cart", false, "cart-checkout"], [`/vi/products/${TEST_FIXTURES.productSlug}`, false, "product-purchase"]] as const) {
    await page.goto(path);
    await expect(page.getByLabel("Mobile navigation")).toHaveCount(bottomNav ? 1 : 0);
    await expect(page.locator(`[data-mobile-action="${action}"]`)).toHaveCount(action === "none" ? 0 : 1);
  }
});
```

The test imports the existing `TEST_FIXTURES.productSlug`, so it stays aligned with
the isolated E2E database.

- [ ] **Step 2: Run the test to record the current overlap failure**

Run: `npx playwright test e2e/mobile-surfaces.spec.ts --project=chromium`  
Expected: FAIL because the bottom bar is global and contextual bars do not expose the policy test hooks.

- [ ] **Step 3: Apply the policy to every shared surface**

Implement these exact rules:

```tsx
// MobileBottomBar.tsx
const policy = getMobileSurfacePolicy(routePath);
if (!policy.bottomNavigation) return null;
const barClassName = "fixed inset-x-0 bottom-0 z-40 border-t border-atelier-rule bg-atelier-paper/95 pb-[env(safe-area-inset-bottom)] md:hidden";

// MainLayoutWrapper.tsx
const policy = getMobileSurfacePolicy(routePath);
<main data-mobile-mode={policy.mode} className={cn("flex-grow pt-24", policy.bottomNavigation ? "pb-mobile-navigation" : policy.contextualAction !== "none" ? "pb-mobile-action" : "pb-fl-2xl md:pb-fl-xl")}>{children}</main>

// ChatBubble.tsx
const policy = getMobileSurfacePolicy(pathname || "/");
if (!policy.chat) return null;
const chatPosition = policy.bottomNavigation ? "bottom-mobile-navigation" : "bottom-5";
```

Replace all raw `#007B8A`, `#26a5b5`, `bg-white`, `dark:*`, and rounded-pill visual tokens inside `MobileBottomBar` with existing `atelier-*` tokens and the locked square/control radii. In `globals.css`, append only these utilities below existing rules:

```css
@layer utilities {
  .pb-mobile-navigation { padding-bottom: calc(4rem + env(safe-area-inset-bottom, 0px)); }
  .pb-mobile-action { padding-bottom: calc(4.5rem + env(safe-area-inset-bottom, 0px)); }
  .bottom-mobile-navigation { bottom: calc(4rem + env(safe-area-inset-bottom, 0px)); }
}
```

Make the footer consume `pb-mobile-navigation` only on browse routes, using the same pure policy; do not add a second fixed offset. Replace the Header overlay with `MobileSheet` while retaining its `mobileOpen`, `NAV_LINKS`, locale switch, account actions, and close-on-navigation behavior.

- [ ] **Step 4: Run policy E2E plus existing layout gates**

Run: `npx playwright test e2e/mobile-surfaces.spec.ts e2e/atelier-redesign.spec.ts --project=chromium`  
Expected: PASS at 320/375/414/768/1440 with no duplicate fixed surface.

- [ ] **Step 5: Commit shared chrome only**

```bash
git add src/components/layout/MobileBottomBar.tsx src/components/layout/Header.tsx src/components/layout/MainLayoutWrapper.tsx src/components/layout/Footer.tsx src/components/layout/ChatBubble.tsx src/app/globals.css e2e/mobile-surfaces.spec.ts
git commit -m "feat: coordinate mobile fixed surfaces"
```

### Task 4: Complete catalogue, color, and mobile overlay behavior

**Files:**

- Modify: `src/components/features/product/ProductsClient.tsx`
- Modify: `src/components/features/colors/ColorsClient.tsx`
- Modify: `src/components/ui/color-detail-drawer.tsx`
- Test: `e2e/mobile-surfaces.spec.ts`
- Test: `e2e/accessibility.spec.ts`

- [ ] **Step 1: Add failing catalogue and sheet interaction tests**

```ts
test("catalogue filter sheet returns focus and preserves the chosen grid density", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/vi/products");
  const trigger = page.getByRole("button", { name: /Bộ lọc|Filters/i });
  await trigger.click();
  await expect(page.getByRole("dialog", { name: /Bộ lọc sản phẩm|Product Filters/i })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await page.getByRole("button", { name: "1 column grid" }).click();
  await expect(page.locator("[data-mobile-grid='1']")).toBeVisible();
});
```

- [ ] **Step 2: Run the test to verify the existing hand-built sheet fails dialog/focus expectations**

Run: `npx playwright test e2e/mobile-surfaces.spec.ts --project=chromium`  
Expected: FAIL because the current filter panel has no dialog semantics or focus restoration.

- [ ] **Step 3: Replace duplicate overlays with `MobileSheet`**

Keep `isMobileFilterOpen`, filter values, `clearAllFilters`, and `mobileGridCols` inside `ProductsClient`. Replace its `AnimatePresence` overlay with:

```tsx
const mobileFilterTitle = language === "vi" ? "Bộ lọc sản phẩm" : "Product Filters";
const mobileResultLabel = language === "vi"
  ? `Xem (${sortedProducts.length} sản phẩm)`
  : `View (${sortedProducts.length} items)`;

<MobileSheet open={isMobileFilterOpen} onClose={() => setIsMobileFilterOpen(false)} title={mobileFilterTitle}>
  <ProductFilterFields searchQuery={searchQuery} setSearchQuery={setSearchQuery} categoryOptions={categoryOptions} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} supplierOptions={supplierOptions} selectedSupplier={selectedSupplier} setSelectedSupplier={setSelectedSupplier} finishOptions={finishOptions} selectedFinish={selectedFinish} setSelectedFinish={setSelectedFinish} sortOptions={sortOptions} sortBy={sortBy} setSortBy={setSortBy} />
  <div className="mt-fl-lg flex items-center gap-fl-sm border-t border-atelier-rule pt-fl-sm">
    {activeFilterCount > 0 ? <button type="button" onClick={clearAllFilters} className="min-h-11 whitespace-nowrap text-fl-sm font-medium text-atelier-accent underline">{t.catalogueClearFilters}</button> : null}
    <button type="button" onClick={() => setIsMobileFilterOpen(false)} className="ml-auto min-h-11 whitespace-nowrap rounded-control bg-atelier-accent px-fl-md text-fl-sm font-medium text-atelier-accent-ink">{mobileResultLabel}</button>
  </div>
</MobileSheet>
```

Create `ProductFilterFields` in the same file immediately above `ProductsClient`; it renders exactly the existing `Input`, category chip buttons, supplier `CustomSelect`, finish `CustomSelect`, and sort `CustomSelect` with the passed state setters. This extracts markup only and does not move filter state.

Set `data-mobile-grid={mobileGridCols}` on the product grid, remove the unused `Check` import, and make the grid `grid-cols-1` or `grid-cols-2` only below `md`. Retain current URLs and filter behavior. Apply the same sheet shell to `ColorDetailDrawer`, keeping its color calculations, favourites API behavior, and selected-color state unchanged.

- [ ] **Step 4: Run accessibility and catalogue regression tests**

Run: `npx playwright test e2e/mobile-surfaces.spec.ts e2e/accessibility.spec.ts e2e/visualizer.spec.ts --project=chromium`  
Expected: PASS with no serious axe violation, filter focus restoration, and no horizontal overflow.

- [ ] **Step 5: Commit discovery interactions**

```bash
git add src/components/features/product/ProductsClient.tsx src/components/features/colors/ColorsClient.tsx src/components/ui/color-detail-drawer.tsx e2e/mobile-surfaces.spec.ts e2e/accessibility.spec.ts
git commit -m "feat: unify mobile catalogue overlays"
```

### Task 5: Normalize contextual purchase and checkout actions

**Files:**

- Modify: `src/components/features/product/ProductClient.tsx`
- Modify: `src/app/cart/page.tsx`
- Test: `e2e/mobile-surfaces.spec.ts`

- [ ] **Step 1: Add failing product/cart fixed-action tests**

```ts
test("product purchase action replaces navigation and cart checkout action remains safe-area aware", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`/vi/products/${TEST_FIXTURES.productSlug}`);
  await page.getByRole("button", { name: /Thêm vào giỏ|Add to cart/i }).first().scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 700);
  await expect(page.locator('[data-mobile-action="product-purchase"]')).toBeVisible();
  await expect(page.getByLabel("Mobile navigation")).toHaveCount(0);

  await page.goto("/vi/cart");
  await expect(page.locator('[data-mobile-action="cart-checkout"]')).toHaveCount(1);
  await expect(page.getByLabel("Mobile navigation")).toHaveCount(0);
});
```

- [ ] **Step 2: Run the test to verify the scroll-threshold and bar overlap fail**

Run: `npx playwright test e2e/mobile-surfaces.spec.ts --project=chromium`  
Expected: FAIL because product visibility is tied to `window.scrollY > 400` and cart uses an independent `z-50` fixed bar.

- [ ] **Step 3: Implement observer-based actions and policy-compatible markup**

Replace `window.scrollY > 400` with an `IntersectionObserver` on a `purchaseControlsRef` wrapping the in-flow quantity/actions block. Show the product action when the observer reports that block is not intersecting. Render:

```tsx
const [purchaseControlsVisible, setPurchaseControlsVisible] = useState(true);
const showStickyBuyBar = policy.contextualAction === "product-purchase" && !purchaseControlsVisible;

<safeMotion.div data-mobile-action="product-purchase" className="fixed inset-x-0 bottom-0 z-30 border-t border-atelier-rule-strong bg-atelier-paper/95 px-fl-sm pt-fl-xs pb-[max(var(--fl-space-xs),env(safe-area-inset-bottom))] md:hidden">
  <span className="min-w-0 truncate text-fl-sm font-medium">{language === "vi" ? paint.name : paint.nameEn || paint.name}</span>
  <button type="button" onClick={handleAddToCart} className="min-h-11 shrink-0 whitespace-nowrap rounded-control bg-atelier-accent px-fl-md text-fl-sm font-medium text-atelier-accent-ink">{t.addToCart}</button>
</safeMotion.div>
```

Keep `handleAddToCart`, selected color validation, price calculation, and toast behavior exactly as they are. Give the cart bar `data-mobile-action="cart-checkout"`, the same bottom/safe-area contract, and only render it when `getMobileSurfacePolicy(routePath).contextualAction === "cart-checkout" && items.length > 0`. Remove its `sm:hidden`/independent `z-50` assumptions and use `md:hidden` consistently with the global mobile breakpoint.

- [ ] **Step 4: Run add-to-cart, cart, and policy tests**

Run: `npx playwright test e2e/mobile-surfaces.spec.ts e2e/atelier-redesign.spec.ts --project=chromium`  
Expected: PASS; at no point do product/cart action, bottom navigation, chat, or sheet overlap.

- [ ] **Step 5: Commit transaction actions**

```bash
git add src/components/features/product/ProductClient.tsx src/app/cart/page.tsx e2e/mobile-surfaces.spec.ts
git commit -m "fix: prevent mobile purchase action overlap"
```

### Task 6: Finish task-flow layout and full responsive coverage

**Files:**

- Modify: `src/components/features/checkout/CheckoutOrderSummary.tsx`
- Modify: `src/components/features/profile/ProfileSidebar.tsx` only if the new responsive test proves a wrapped control or overflow
- Modify: `e2e/atelier-redesign.spec.ts`
- Modify: `e2e/responsive-journeys.spec.ts`
- Modify: `e2e/accessibility.spec.ts`

- [ ] **Step 1: Add failing mobile summary and public-route coverage tests**

```ts
test("checkout exposes one compact order-summary disclosure on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/vi/checkout");
  await expect(page.getByRole("button", { name: /Đơn hàng của bạn|Your order/i })).toBeVisible();
  await page.getByRole("button", { name: /Đơn hàng của bạn|Your order/i }).click();
  await expect(page.getByText(/Tạm tính|Subtotal/i)).toBeVisible();
});
```

Extend `PUBLIC_ROUTES` in `e2e/atelier-redesign.spec.ts` with product detail, checkout, checkout success, profile, reset password, legal routes, and quote request; apply its locale/width loop to the expanded list.

- [ ] **Step 2: Run the coverage tests to verify the checkout summary has no mobile disclosure**

Run: `npx playwright test e2e/atelier-redesign.spec.ts e2e/responsive-journeys.spec.ts --project=chromium`  
Expected: FAIL on the new checkout summary interaction.

- [ ] **Step 3: Implement a semantic mobile summary without duplicating order math**

Extract the current rows into `OrderSummaryBody`. Render it in a `details` element below `lg` and retain the current `aside` at `lg` and above:

```tsx
const summaryProps = { language, items, subtotal, discountParam, shippingFee, total };

<details className="border-y border-atelier-rule py-fl-sm lg:hidden">
  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-fl-sm font-medium">
    <span>{language === "vi" ? "Đơn hàng của bạn" : "Your order"}</span>
    <span className="text-atelier-accent">{language === "vi" ? "Xem" : "View"}</span>
  </summary>
  <OrderSummaryBody {...summaryProps} className="mt-fl-sm" />
</details>
<aside className="hidden lg:sticky lg:top-24 lg:col-span-5 lg:block"><OrderSummaryBody {...summaryProps} /></aside>
```

Do not alter submitted totals, address loading, payment method, or the order request. Leave `ProfileSidebar` untouched unless the expanded test reports a real layout failure; if it does, replace only the mobile vertical tab list with a native `<select aria-label>` that calls the existing `setActiveTab` and preserves all role gating.

- [ ] **Step 4: Run the expanded responsive and accessibility matrix**

Run: `npx playwright test e2e/atelier-redesign.spec.ts e2e/responsive-journeys.spec.ts e2e/accessibility.spec.ts --project=chromium`  
Expected: PASS across vi/en, 320/375/414/768/1440, with existing auth/profile journeys intact.

- [ ] **Step 5: Commit task-flow presentation**

```bash
git add src/components/features/checkout/CheckoutOrderSummary.tsx src/components/features/profile/ProfileSidebar.tsx e2e/atelier-redesign.spec.ts e2e/responsive-journeys.spec.ts e2e/accessibility.spec.ts
git commit -m "feat: refine mobile task flows"
```

### Task 7: Run release gates and record mobile evidence

**Files:**

- Create: `docs/superpowers/plans/2026-08-04-flof-sitewide-mobile-optimization-evidence.md`

- [ ] **Step 1: Run focused tests before the full suite**

Run: `node --experimental-strip-types --test tests/mobile-surface-policy.test.ts tests/mobile-sheet-contract.test.ts && npx playwright test e2e/mobile-surfaces.spec.ts --project=chromium`  
Expected: PASS.

- [ ] **Step 2: Run static and build gates**

Run: `npm run lint && npm run typecheck && npm test && npm run build`  
Expected: PASS.

- [ ] **Step 3: Run browser and performance gates**

Run: `npm run test:e2e && npm run test:lighthouse && npm run test:bundle`  
Expected: PASS. Record the route, locale, browser, and viewport coverage plus any configured fallback-database limitation; do not claim production CDN HIT or field p75 from local results.

- [ ] **Step 4: Write the evidence document**

Include the exact commit range, files changed, each command, pass/fail status, responsive route matrix, focus/sheet checks, and Lighthouse/bundle results. Explicitly state that API, Prisma, auth, wishlist, cart calculation, checkout request, payment routing, and admin code were not changed.

- [ ] **Step 5: Commit release evidence**

```bash
git add docs/superpowers/plans/2026-08-04-flof-sitewide-mobile-optimization-evidence.md
git commit -m "docs: record mobile optimization verification"
```

## Plan self-review

- **Spec coverage:** route policy, one-action rule, safe areas, accessible sheets, every page family, localization, reduced motion, and all release gates map to Tasks 1–7.
- **No placeholders:** exact file paths, test commands, expected outcomes, and implementation contracts are included in every task.
- **Type consistency:** `MobileSurfacePolicy`, `ContextualAction`, and `getMobileSurfacePolicy` are introduced in Task 1 and used under the same names later.
- **Scope safety:** commits are file-scoped; no task stages existing unrelated work or touches `/admin/**` business behavior.
