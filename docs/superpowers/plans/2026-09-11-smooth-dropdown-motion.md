# Smooth Dropdown Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nâng cấp hiệu ứng mở và đóng của Mega-Menu Dropdown trên `Header.tsx` thành chuyển động trượt và mờ (Studio Fluid Slide & Fade) mượt mà 60fps, có exit transition êm ái khi đóng và scrim fade-in/out không chớp giật.

**Architecture:** Sử dụng kiến trúc CSS-driven GPU hardware accelerated (`transform` và `opacity` với `visibility: hidden/visible`), loại bỏ hoàn toàn `hidden={!open}` ngắt cụt animation, điều phối lớp nền mờ Scrim với transition opacity, và áp dụng staggered reveal cho các cột nội dung.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS, Native CSS Transitions & Keyframes.

---

### Task 1: Viết Unit Test Hợp Đồng Cho Dropdown Motion

**Files:**
- Create: `tests/dropdown-motion.test.ts`

- [ ] **Step 1: Viết failing test**

```typescript
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("globals.css defines fl-mega-panel with entry, exit, and visibility transitions", async () => {
  const css = await readFile("src/app/globals.css", "utf8");
  for (const needle of [
    ".fl-mega-panel",
    ".fl-mega-panel.is-open",
    "fl-item-reveal",
    "visibility",
    "pointer-events",
  ]) {
    assert.ok(css.includes(needle), `missing ${needle} in globals.css`);
  }
});

test("Header.tsx uses fl-mega-panel and does not use hidden attribute for mega panel", async () => {
  const header = await readFile("src/components/layout/Header.tsx", "utf8");
  assert.ok(header.includes("fl-mega-panel"), "Header.tsx must use fl-mega-panel class");
  assert.ok(!header.includes("hidden={!open}"), "Header.tsx must not abruptly hide panel with hidden attribute");
  assert.ok(header.includes("fl-panel-col-1"), "Header.tsx must include staggered column classes");
});
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại**

Chạy: `node --experimental-strip-types --test tests/dropdown-motion.test.ts`
Expected: FAIL.

- [ ] **Step 3: Commit**

```bash
git add tests/dropdown-motion.test.ts
git commit -m "test: add failing contract test for smooth dropdown motion"
```

---

### Task 2: Cấu Hình CSS Cho MegaPanel Trong `globals.css`

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Thêm CSS rules cho MegaPanel vào `src/app/globals.css`**

Thêm:
- `.fl-mega-panel` với `opacity: 0`, `visibility: hidden`, `transform: translateY(-10px)`, `pointer-events: none`, `transition: opacity, transform, visibility`.
- `.fl-mega-panel.is-open` với `opacity: 1`, `visibility: visible`, `transform: translateY(0)`, `pointer-events: auto`.
- Keyframes `@keyframes fl-item-reveal` và các class `.fl-panel-col-1`, `.fl-panel-col-2`, `.fl-panel-promo` với staggered animation delay.
- `@media (prefers-reduced-motion: reduce)` fallback an toàn.

- [ ] **Step 2: Chạy test kiểm tra partial pass**

Chạy: `node --experimental-strip-types --test tests/dropdown-motion.test.ts`
Expected: Test 1 PASS, Test 2 FAIL.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "style: add smooth mega-panel CSS transitions to globals.css"
```

---

### Task 3: Cập Nhật `Header.tsx` Cho MegaPanel, Scrim & Staggered Reveal

**Files:**
- Modify: `src/components/layout/Header.tsx`

- [ ] **Step 1: Nâng cấp `MegaPanel` component**

Thay thế `hidden={!open}` bằng class `.fl-mega-panel` và toggle `.is-open`:
```tsx
function MegaPanel({
  id,
  open,
  children,
}: {
  id: string;
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      role="region"
      aria-hidden={!open}
      className={cn("fl-mega-panel", open && "is-open")}
    >
      <div className="mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,1.5rem)] py-fl-lg">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Nâng cấp Scrim chuyển động mượt mà**

Cập nhật Backdrop Scrim:
```tsx
<div
  aria-hidden="true"
  onClick={() => closePanel()}
  className={cn(
    "fixed inset-x-0 -z-10 h-screen bg-atelier-espresso/25 transition-opacity duration-300 ease-fl-out cursor-pointer",
    condensed ? "top-14 md:top-16" : "top-16 md:top-[4.5rem]",
    openPanel ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
  )}
/>
```

- [ ] **Step 3: Gắn class staggered cho `ProductPanel` và `ColourPanel`**

Thêm `fl-panel-col-1`, `fl-panel-col-2`, `fl-panel-promo` vào các cột nội dung.

- [ ] **Step 4: Chạy test `tests/dropdown-motion.test.ts`**

Chạy: `node --experimental-strip-types --test tests/dropdown-motion.test.ts`
Expected: ALL PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Header.tsx
git commit -m "feat: upgrade Header mega panels with fluid entrance/exit and smooth scrim"
```

---

### Task 4: Kiểm Thử Toàn Diện & Quality Gates

**Files:**
- Run: `npm run typecheck`, `npm run lint`, `npm test`
- Manual Verification via Browser MCP

- [ ] **Step 1: Chạy Typecheck & Lint**
Chạy: `npm run typecheck && npm run lint`
Expected: 0 errors.

- [ ] **Step 2: Chạy toàn bộ test suites**
Chạy: `npm test`
Expected: 227+ tests pass.

- [ ] **Step 3: Kiểm thử tương tác đóng mở menu trên trình duyệt**
Mở và đóng "Sản phẩm", "Bảng màu", chuyển đổi tab qua lại và chụp ảnh/kiểm tra độ mượt.

- [ ] **Step 4: Commit hoàn tất**
```bash
git add .
git commit -m "feat(ui): complete smooth dropdown motion upgrade"
```
