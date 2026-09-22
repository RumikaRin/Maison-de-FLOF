# Project Structure Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize and modularize the FLOF codebase directory structure according to modern Next.js 15 App Router and Feature-Based Architecture standards, eliminating "Junk Drawer" anti-patterns in `src/lib/`, deconstructing monolithic "God Pages" in `src/app/`, purifying atomic UI primitives in `src/components/ui/`, and sanitizing root workspace artifacts without breaking any existing tests or contracts.

**Architecture:** Adopt a Feature-Driven architecture with a lean routing layer (`src/app/`), self-contained business domain modules (`src/components/features/<domain>/`), a structured infrastructure and library layer (`src/lib/<category>/`), and pure atomic UI primitives (`src/components/ui/`). All file migrations maintain zero-downtime backward compatibility via bridge re-exports until fully integrated, with continuous test gates (`npm test`, `npm run typecheck`, `npm run check`).

**Tech Stack:** Next.js 15.5 (App Router), React 19, TypeScript 5.7, Tailwind CSS 3.4, Prisma 6.0, Node.js 24 test runner.

---

### Task 1: Root Workspace Hygiene & Asset Organization

**Files:**
- Modify: `.gitignore`
- Move: `BAO_CAO_DO_AN_DUONG_DINH_MANH.docx` → `docs/reports/BAO_CAO_DO_AN_DUONG_DINH_MANH.docx`
- Move: `BAO_CAO_DO_AN.md` → `docs/reports/BAO_CAO_DO_AN.md`
- Move: `screenshot_danhmuc_116.png` → `docs/reports/assets/screenshot_danhmuc_116.png`
- Move: `test_header_menu.png` → `docs/reports/assets/test_header_menu.png`
- Move: `test_header.png` → `docs/reports/assets/test_header.png`

- [ ] **Step 1: Create reports and assets directory**

Run in PowerShell:
```powershell
if (-not (Test-Path docs\reports\assets)) { New-Item -ItemType Directory -Force docs\reports\assets }
```

- [ ] **Step 2: Move thesis documents and test screenshots**

Run in PowerShell:
```powershell
git mv BAO_CAO_DO_AN_DUONG_DINH_MANH.docx docs/reports/
git mv BAO_CAO_DO_AN.md docs/reports/
git mv screenshot_danhmuc_116.png docs/reports/assets/
git mv test_header_menu.png docs/reports/assets/
git mv test_header.png docs/reports/assets/
```

- [ ] **Step 3: Update `.gitignore` to prevent loose root outputs**

Ensure `.gitignore` contains rules for temporary audit and dump directories:
```gitignore
# Temporary audits, reports, and packs
output/
json/
codex_project_audit_pack/
*.png.tmp
```

- [ ] **Step 4: Verify git status and root directory cleanliness**

Run: `git status --short`
Expected: Files staged as renames/moves, clean untracked list.

- [ ] **Step 5: Commit**

```bash
git add docs/reports/ .gitignore
git commit -m "chore(structure): relocate thesis docs and root screenshots to docs/reports"
```

---

### Task 2: Modularize `src/lib/` - Commerce & Catalog Domain (`src/lib/commerce/`)

**Files:**
- Create: `src/lib/commerce/cart-merge.ts`
- Create: `src/lib/commerce/commerce.ts`
- Create: `src/lib/commerce/order-access.ts`
- Create: `src/lib/commerce/order-validation.ts`
- Create: `src/lib/commerce/payment-policy.ts`
- Create: `src/lib/commerce/catalog-result.ts`
- Create: `src/lib/commerce/catalog-page-data.ts`
- Create: `src/lib/commerce/catalog-fallback-data.ts`
- Create: `src/lib/commerce/home-page-data.ts`
- Create: `src/lib/commerce/index.ts`
- Forwarding Re-exports: `src/lib/cart-merge.ts`, `src/lib/commerce.ts`, `src/lib/order-access.ts`, `src/lib/order-validation.ts`, `src/lib/payment-policy.ts`, `src/lib/catalog-result.ts`, `src/lib/catalog-page-data.ts`, `src/lib/catalog-fallback-data.ts`, `src/lib/home-page-data.ts`

- [ ] **Step 1: Create directory `src/lib/commerce`**

Run in PowerShell:
```powershell
if (-not (Test-Path src\lib\commerce)) { New-Item -ItemType Directory -Force src\lib\commerce }
```

- [ ] **Step 2: Move files into `src/lib/commerce/`**

Run in PowerShell:
```powershell
git mv src/lib/cart-merge.ts src/lib/commerce/cart-merge.ts
git mv src/lib/commerce.ts src/lib/commerce/commerce.ts
git mv src/lib/order-access.ts src/lib/commerce/order-access.ts
git mv src/lib/order-validation.ts src/lib/commerce/order-validation.ts
git mv src/lib/payment-policy.ts src/lib/commerce/payment-policy.ts
git mv src/lib/catalog-result.ts src/lib/commerce/catalog-result.ts
git mv src/lib/catalog-page-data.ts src/lib/commerce/catalog-page-data.ts
git mv src/lib/catalog-fallback-data.ts src/lib/commerce/catalog-fallback-data.ts
git mv src/lib/home-page-data.ts src/lib/commerce/home-page-data.ts
```

- [ ] **Step 3: Create barrel file `src/lib/commerce/index.ts`**

```typescript
export * from "./cart-merge";
export * from "./commerce";
export * from "./order-access";
export * from "./order-validation";
export * from "./payment-policy";
export * from "./catalog-result";
export * from "./catalog-page-data";
export * from "./catalog-fallback-data";
export * from "./home-page-data";
```

- [ ] **Step 4: Create backward-compatible re-export stubs in `src/lib/`**

For example in `src/lib/cart-merge.ts`:
```typescript
export * from "./commerce/cart-merge";
```
(Repeat for each relocated commerce file so no existing import breaks across the application or tests).

- [ ] **Step 5: Run tests to verify zero breakage**

Run: `node --experimental-strip-types --test tests/cart-merge.test.ts tests/commerce.test.ts tests/catalog-page-data.test.ts tests/home-page-data.test.ts tests/payment-policy.test.ts`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/commerce src/lib/cart-merge.ts src/lib/commerce.ts src/lib/order-access.ts src/lib/order-validation.ts src/lib/payment-policy.ts src/lib/catalog-result.ts src/lib/catalog-page-data.ts src/lib/catalog-fallback-data.ts src/lib/home-page-data.ts
git commit -m "refactor(lib): group commerce and catalog modules under src/lib/commerce"
```

---

### Task 3: Modularize `src/lib/` - Email & Messaging Subsystem (`src/lib/email/`)

**Files:**
- Create: `src/lib/email/email.ts`
- Create: `src/lib/email/email-delivery.ts`
- Create: `src/lib/email/email-outbox.ts`
- Create: `src/lib/email/email-templates.ts`
- Create: `src/lib/email/process-email-outbox.ts`
- Create: `src/lib/email/newsletter.ts`
- Create: `src/lib/email/index.ts`
- Forwarding Re-exports: `src/lib/email.ts`, `src/lib/email-delivery.ts`, `src/lib/email-outbox.ts`, `src/lib/email-templates.ts`, `src/lib/process-email-outbox.ts`, `src/lib/newsletter.ts`

- [ ] **Step 1: Create directory `src/lib/email`**

Run in PowerShell:
```powershell
if (-not (Test-Path src\lib\email)) { New-Item -ItemType Directory -Force src\lib\email }
```

- [ ] **Step 2: Move files into `src/lib/email/`**

Run in PowerShell:
```powershell
git mv src/lib/email.ts src/lib/email/email.ts
git mv src/lib/email-delivery.ts src/lib/email/email-delivery.ts
git mv src/lib/email-outbox.ts src/lib/email/email-outbox.ts
git mv src/lib/email-templates.ts src/lib/email/email-templates.ts
git mv src/lib/process-email-outbox.ts src/lib/email/process-email-outbox.ts
git mv src/lib/newsletter.ts src/lib/email/newsletter.ts
```

- [ ] **Step 3: Create barrel file `src/lib/email/index.ts`**

```typescript
export * from "./email";
export * from "./email-delivery";
export * from "./email-outbox";
export * from "./email-templates";
export * from "./process-email-outbox";
export * from "./newsletter";
```

- [ ] **Step 4: Create backward-compatible re-export stubs in `src/lib/`**

For example in `src/lib/email.ts`:
```typescript
export * from "./email/email";
```
(Repeat for `email-delivery.ts`, `email-outbox.ts`, `email-templates.ts`, `process-email-outbox.ts`, `newsletter.ts`).

- [ ] **Step 5: Run tests to verify zero breakage**

Run: `node --experimental-strip-types --test tests/email-delivery.test.ts tests/email-outbox.test.ts tests/email-templates.test.ts tests/newsletter.test.ts`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/email src/lib/email.ts src/lib/email-delivery.ts src/lib/email-outbox.ts src/lib/email-templates.ts src/lib/process-email-outbox.ts src/lib/newsletter.ts
git commit -m "refactor(lib): group email and newsletter modules under src/lib/email"
```

---

### Task 4: Modularize `src/lib/` - Security, Auth & Resilience Subsystem (`src/lib/security/`)

**Files:**
- Move into `src/lib/security/`:
  - `src/lib/api-auth.ts` → `src/lib/security/api-auth.ts`
  - `src/lib/api-error-contract.ts` → `src/lib/security/api-error-contract.ts`
  - `src/lib/cron-auth.ts` → `src/lib/security/cron-auth.ts`
  - `src/lib/permissions.ts` → `src/lib/security/permissions.ts`
  - `src/lib/rate-limit.ts` → `src/lib/security/rate-limit.ts`
  - `src/lib/rate-limiter.ts` → `src/lib/security/rate-limiter.ts`
  - `src/lib/redis-environment.ts` → `src/lib/security/redis-environment.ts`
  - `src/lib/password-policy.ts` → `src/lib/security/password-policy.ts`
  - `src/lib/password-reset.ts` → `src/lib/security/password-reset.ts`
  - `src/lib/password-reset-token.ts` → `src/lib/security/password-reset-token.ts`
  - `src/lib/ip.ts` → `src/lib/security/ip.ts`
  - `src/lib/idempotency.ts` → `src/lib/security/idempotency.ts`
  - `src/lib/audit.ts` → `src/lib/security/audit.ts`
  - `src/lib/operational-log.ts` → `src/lib/security/operational-log.ts`
- Forwarding Re-exports in `src/lib/` for all moved security files

- [ ] **Step 1: Move security-related files into `src/lib/security/`**

Run in PowerShell:
```powershell
git mv src/lib/api-auth.ts src/lib/security/api-auth.ts
git mv src/lib/api-error-contract.ts src/lib/security/api-error-contract.ts
git mv src/lib/cron-auth.ts src/lib/security/cron-auth.ts
git mv src/lib/permissions.ts src/lib/security/permissions.ts
git mv src/lib/rate-limit.ts src/lib/security/rate-limit.ts
git mv src/lib/rate-limiter.ts src/lib/security/rate-limiter.ts
git mv src/lib/redis-environment.ts src/lib/security/redis-environment.ts
git mv src/lib/password-policy.ts src/lib/security/password-policy.ts
git mv src/lib/password-reset.ts src/lib/security/password-reset.ts
git mv src/lib/password-reset-token.ts src/lib/security/password-reset-token.ts
git mv src/lib/ip.ts src/lib/security/ip.ts
git mv src/lib/idempotency.ts src/lib/security/idempotency.ts
git mv src/lib/audit.ts src/lib/security/audit.ts
git mv src/lib/operational-log.ts src/lib/security/operational-log.ts
```

- [ ] **Step 2: Create barrel file `src/lib/security/index.ts`**

```typescript
export * from "./api-auth";
export * from "./api-error-contract";
export * from "./cron-auth";
export * from "./permissions";
export * from "./rate-limit";
export * from "./rate-limiter";
export * from "./redis-environment";
export * from "./password-policy";
export * from "./password-reset";
export * from "./password-reset-token";
export * from "./ip";
export * from "./idempotency";
export * from "./audit";
export * from "./operational-log";
export * from "./headers";
export * from "./rate-limit-policy";
```

- [ ] **Step 3: Create backward-compatible re-export stubs in `src/lib/`**

In `src/lib/api-error-contract.ts`:
```typescript
export * from "./security/api-error-contract";
```
(Repeat for each moved file).

- [ ] **Step 4: Run test suite for security and rate limiting**

Run: `node --experimental-strip-types --test tests/api-error-contract.test.ts tests/rate-limiter.test.ts tests/cron-auth.test.ts tests/password-policy.test.ts tests/operational-log.test.ts`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/security/ src/lib/api-auth.ts src/lib/api-error-contract.ts src/lib/cron-auth.ts src/lib/permissions.ts src/lib/rate-limit.ts src/lib/rate-limiter.ts src/lib/redis-environment.ts src/lib/password-policy.ts src/lib/password-reset.ts src/lib/password-reset-token.ts src/lib/ip.ts src/lib/idempotency.ts src/lib/audit.ts src/lib/operational-log.ts
git commit -m "refactor(lib): consolidate security, auth, and audit modules under src/lib/security"
```

---

### Task 5: Modularize `src/lib/` - UI Helpers, i18n & Mock Data (`src/lib/ui/`, `src/lib/i18n/`, `src/lib/mock/`)

**Files:**
- Move into `src/lib/ui/`:
  - `src/lib/fl-reveal.ts` → `src/lib/ui/fl-reveal.ts`
  - `src/lib/fl-slice.ts` → `src/lib/ui/fl-slice.ts`
  - `src/lib/mobile-surface-policy.ts` → `src/lib/ui/mobile-surface-policy.ts`
  - `src/lib/color-utils.ts` → `src/lib/ui/color-utils.ts`
  - `src/lib/product-image.ts` → `src/lib/ui/product-image.ts`
- Move into `src/lib/i18n/`:
  - `src/lib/locale.ts` → `src/lib/i18n/locale.ts`
  - `src/lib/dictionary.ts` → `src/lib/i18n/dictionary.ts`
  - `src/lib/locale-response-policy.ts` → `src/lib/i18n/locale-response-policy.ts`
- Move into `src/lib/mock/`:
  - `src/lib/mock-data.ts` → `src/lib/mock/mock-data.ts`
- Forwarding Re-exports in `src/lib/` for backward compatibility

- [ ] **Step 1: Create directories `src/lib/ui`, `src/lib/i18n`, `src/lib/mock`**

Run in PowerShell:
```powershell
if (-not (Test-Path src\lib\ui)) { New-Item -ItemType Directory -Force src\lib\ui }
if (-not (Test-Path src\lib\i18n)) { New-Item -ItemType Directory -Force src\lib\i18n }
if (-not (Test-Path src\lib\mock)) { New-Item -ItemType Directory -Force src\lib\mock }
```

- [ ] **Step 2: Move files into their respective submodules**

Run in PowerShell:
```powershell
git mv src/lib/fl-reveal.ts src/lib/ui/fl-reveal.ts
git mv src/lib/fl-slice.ts src/lib/ui/fl-slice.ts
git mv src/lib/mobile-surface-policy.ts src/lib/ui/mobile-surface-policy.ts
git mv src/lib/color-utils.ts src/lib/ui/color-utils.ts
git mv src/lib/product-image.ts src/lib/ui/product-image.ts

git mv src/lib/locale.ts src/lib/i18n/locale.ts
git mv src/lib/dictionary.ts src/lib/i18n/dictionary.ts
git mv src/lib/locale-response-policy.ts src/lib/i18n/locale-response-policy.ts

git mv src/lib/mock-data.ts src/lib/mock/mock-data.ts
```

- [ ] **Step 3: Create forwarding re-exports in `src/lib/`**

Re-export all moved files from their original locations in `src/lib/`.

- [ ] **Step 4: Run motion, color, and i18n tests**

Run: `node --experimental-strip-types --test tests/fl-slice-math.test.ts tests/color-utils.test.ts tests/locale-routing.test.ts`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ui src/lib/i18n src/lib/mock src/lib/fl-reveal.ts src/lib/fl-slice.ts src/lib/mobile-surface-policy.ts src/lib/color-utils.ts src/lib/product-image.ts src/lib/locale.ts src/lib/dictionary.ts src/lib/locale-response-policy.ts src/lib/mock-data.ts
git commit -m "refactor(lib): isolate ui helpers, i18n, and mock data into dedicated directories"
```

---

### Task 6: Purify `src/components/ui/` by Relocating Domain Components

**Files:**
- Move: `src/components/ui/color-detail-drawer.tsx` → `src/components/features/colors/color-detail-drawer.tsx`
- Move: `src/components/ui/color-swatch.tsx` → `src/components/features/colors/color-swatch.tsx`
- Move: `src/components/ui/address-select.tsx` → `src/components/features/checkout/address-select.tsx`
- Move: `src/components/ui/delete-confirm-modal.tsx` → `src/components/ui/delete-confirm-modal.tsx` (remains or moved to `modals/`)
- Re-export bridges: `src/components/ui/color-detail-drawer.tsx`, `src/components/ui/color-swatch.tsx`, `src/components/ui/address-select.tsx`

- [ ] **Step 1: Move domain components to their respective features**

Run in PowerShell:
```powershell
git mv src/components/ui/color-detail-drawer.tsx src/components/features/colors/color-detail-drawer.tsx
git mv src/components/ui/color-swatch.tsx src/components/features/colors/color-swatch.tsx
git mv src/components/ui/address-select.tsx src/components/features/checkout/address-select.tsx
```

- [ ] **Step 2: Create backward-compatible re-exports in `src/components/ui/`**

`src/components/ui/color-detail-drawer.tsx`:
```typescript
export * from "../features/colors/color-detail-drawer";
export { default } from "../features/colors/color-detail-drawer";
```

`src/components/ui/color-swatch.tsx`:
```typescript
export * from "../features/colors/color-swatch";
export { default } from "../features/colors/color-swatch";
```

`src/components/ui/address-select.tsx`:
```typescript
export * from "../features/checkout/address-select";
export { default } from "../features/checkout/address-select";
```

- [ ] **Step 3: Run design token and contrast checks**

Run: `npm run check:contrast`
Expected: All pairings pass AA floor.

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/features/colors/ src/components/features/checkout/ src/components/ui/
git commit -m "refactor(components): move domain components out of atomic ui to features"
```

---

### Task 7: Unify Admin Components & Deconstruct Admin God Pages

**Files:**
- Consolidate `src/components/admin/` into `src/components/features/admin/shared/`
- Extract: `src/components/features/admin/dealers/AdminDealersClient.tsx` from `src/app/admin/dealers/page.tsx`
- Slim down: `src/app/admin/dealers/page.tsx` (< 50 lines)
- Extract: `src/components/features/admin/colors/AdminColorsClient.tsx` from `src/app/admin/colors/page.tsx`
- Slim down: `src/app/admin/colors/page.tsx` (< 50 lines)

- [ ] **Step 1: Create directories for admin feature components**

Run in PowerShell:
```powershell
if (-not (Test-Path src\components\features\admin\dealers)) { New-Item -ItemType Directory -Force src\components\features\admin\dealers }
if (-not (Test-Path src\components\features\admin\colors)) { New-Item -ItemType Directory -Force src\components\features\admin\colors }
if (-not (Test-Path src\components\features\admin\shared)) { New-Item -ItemType Directory -Force src\components\features\admin\shared }
```

- [ ] **Step 2: Move `src/components/admin/*` to `src/components/features/admin/shared/`**

Run in PowerShell:
```powershell
git mv src/components/admin/AdminNotificationBell.tsx src/components/features/admin/shared/AdminNotificationBell.tsx
git mv src/components/admin/AdminRevenueChart.tsx src/components/features/admin/shared/AdminRevenueChart.tsx
git mv src/components/admin/AuditLogTable.tsx src/components/features/admin/shared/AuditLogTable.tsx
git mv src/components/admin/InvoiceModal.tsx src/components/features/admin/shared/InvoiceModal.tsx
```
Create re-export bridges in `src/components/admin/` so no imports break.

- [ ] **Step 3: Extract client component for Admin Dealers**

Move the `'use client'` interactive component logic from `src/app/admin/dealers/page.tsx` into `src/components/features/admin/dealers/AdminDealersClient.tsx`.
Transform `src/app/admin/dealers/page.tsx` into:
```typescript
import { Metadata } from "next";
import { AdminDealersClient } from "@/components/features/admin/dealers/AdminDealersClient";

export const metadata: Metadata = {
  title: "Quản lý Đại lý | FLOF Atelier Admin",
  description: "Danh sách và quản lý mạng lưới đại lý ủy quyền",
};

export default function AdminDealersPage() {
  return <AdminDealersClient />;
}
```

- [ ] **Step 4: Extract client component for Admin Colors**

Move the `'use client'` interactive component logic from `src/app/admin/colors/page.tsx` into `src/components/features/admin/colors/AdminColorsClient.tsx`.
Transform `src/app/admin/colors/page.tsx` into:
```typescript
import { Metadata } from "next";
import { AdminColorsClient } from "@/components/features/admin/colors/AdminColorsClient";

export const metadata: Metadata = {
  title: "Quản lý Màu sắc | FLOF Atelier Admin",
  description: "Quản lý bộ sưu tập và mã màu sơn atelier",
};

export default function AdminColorsPage() {
  return <AdminColorsClient />;
}
```

- [ ] **Step 5: Run admin tests and typecheck**

Run: `node --experimental-strip-types --test tests/admin-api-policy.test.ts tests/admin-dashboard.test.ts`
Run: `npm run typecheck`
Expected: All tests pass, zero type errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/features/admin/ src/components/admin/ src/app/admin/dealers/ src/app/admin/colors/
git commit -m "refactor(admin): extract AdminDealersClient and AdminColorsClient, consolidating admin components"
```

---

### Task 8: Deconstruct Public Cart & Dealer God Pages

**Files:**
- Extract: `src/components/features/cart/CartClient.tsx` from `src/app/cart/page.tsx`
- Slim down: `src/app/cart/page.tsx` (< 50 lines)
- Extract: `src/components/features/dealers/FindDealerClient.tsx` from `src/app/find-dealer/page.tsx`
- Slim down: `src/app/find-dealer/page.tsx` (< 50 lines)

- [ ] **Step 1: Create directories for cart and dealers features**

Run in PowerShell:
```powershell
if (-not (Test-Path src\components\features\cart)) { New-Item -ItemType Directory -Force src\components\features\cart }
if (-not (Test-Path src\components\features\dealers)) { New-Item -ItemType Directory -Force src\components\features\dealers }
```

- [ ] **Step 2: Extract CartClient component**

Move the `'use client'` interactive component logic from `src/app/cart/page.tsx` into `src/components/features/cart/CartClient.tsx`.
Transform `src/app/cart/page.tsx` into:
```typescript
import { Metadata } from "next";
import { CartClient } from "@/components/features/cart/CartClient";

export const metadata: Metadata = {
  title: "Giỏ hàng | Maison de FLOF",
  description: "Chi tiết giỏ hàng và danh sách sản phẩm sơn đã chọn",
};

export default function CartPage() {
  return <CartClient />;
}
```

- [ ] **Step 3: Extract FindDealerClient component**

Move the `'use client'` interactive component logic from `src/app/find-dealer/page.tsx` into `src/components/features/dealers/FindDealerClient.tsx`.
Transform `src/app/find-dealer/page.tsx` into:
```typescript
import { Metadata } from "next";
import { FindDealerClient } from "@/components/features/dealers/FindDealerClient";

export const metadata: Metadata = {
  title: "Tìm đại lý | Maison de FLOF",
  description: "Định vị và tìm kiếm đại lý phân phối sơn FLOF gần bạn nhất",
};

export default function FindDealerPage() {
  return <FindDealerClient />;
}
```

- [ ] **Step 4: Run cart and dealer map tests**

Run: `node --experimental-strip-types --test tests/cart-merge.test.ts tests/dealer-map-fallback.test.ts tests/scroll-isolation-and-runtime-protection.test.ts`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/features/cart/ src/components/features/dealers/ src/app/cart/ src/app/find-dealer/
git commit -m "refactor(storefront): extract CartClient and FindDealerClient into feature modules"
```

---

### Task 9: Full Verification Gate & Build Validation

**Files:**
- All modified and restructured files across `src/` and `docs/`

- [ ] **Step 1: Run linter**

Run: `npm run lint`
Expected: 0 errors, 0 warnings.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: 0 TypeScript errors.

- [ ] **Step 3: Run design token contrast check**

Run: `npm run check:contrast`
Expected: All 23 token pairings meet AA floor.

- [ ] **Step 4: Run full test suite**

Run: `npm test`
Expected: All 252 tests pass.

- [ ] **Step 5: Run production build**

Run: `npm run build`
Expected: Next.js production build completes successfully with static pages and routes generated.

- [ ] **Step 6: Commit all remaining cleanups**

```bash
git status
git commit -m "chore(release): complete project directory restructuring with all quality gates passing"
```
