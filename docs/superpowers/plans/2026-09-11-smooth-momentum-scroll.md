# Lenis Smooth Momentum Scroll Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tích hợp tính năng cuộn mượt quán tính (Lenis Smooth Momentum Scroll) vào website Maison de FLOF, giúp khi lăn chuột thì trang trượt lướt êm ái nhẹ nhàng với tốc độ khung hình 60–120fps, không gây giật khấc và tương thích hoàn hảo với App Router.

**Architecture:** Sử dụng thư viện `lenis` được nạp động (dynamic import) trong `SmoothScrollProvider` đặt tại RootLayout để tối ưu bundle, thiết lập các class CSS điều khiển cuộn chuẩn trong `globals.css`, cách ly vùng cuộn cho modal/drawer bằng `data-lenis-prevent`, và đồng bộ nút `ScrollToTop`.

**Tech Stack:** Next.js 15 (App Router), React 19, Lenis 1.3.x, Tailwind CSS, Node.js Test Runner.

---

### Task 1: Cài Đặt Dependency `lenis` & Viết Unit Test Hợp Đồng

**Files:**
- Modify: `package.json`
- Create: `tests/smooth-scroll.test.ts`

- [ ] **Step 1: Viết failing test cho Smooth Scroll**

Tạo file `tests/smooth-scroll.test.ts`:
```typescript
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import test from "node:test";

test("lenis dependency exists in package.json", async () => {
  const pkg = JSON.parse(await readFile("package.json", "utf8"));
  assert.ok(
    pkg.dependencies && pkg.dependencies.lenis,
    "lenis must be in package.json dependencies",
  );
});

test("globals.css contains Lenis smooth scroll classes", async () => {
  const css = await readFile("src/app/globals.css", "utf8");
  for (const needle of [
    "html.lenis",
    ".lenis.lenis-smooth",
    "[data-lenis-prevent]",
    ".lenis.lenis-stopped",
  ]) {
    assert.ok(css.includes(needle), `missing ${needle} in globals.css`);
  }
});

test("SmoothScrollProvider module exists", async () => {
  await access("src/providers/smooth-scroll-provider.tsx");
});

test("SmoothScrollProvider supports dynamic import and reduced motion", async () => {
  const code = await readFile("src/providers/smooth-scroll-provider.tsx", "utf8");
  assert.ok(code.includes('"use client"'), "must be client component");
  assert.ok(code.includes("prefers-reduced-motion"), "must check reduced motion");
  assert.ok(code.includes('import("lenis")'), "must dynamically import lenis");
});
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại (Failing)**

Chạy: `node --experimental-strip-types --test tests/smooth-scroll.test.ts`
Expected: FAIL vì `lenis` chưa cài và các file chưa được tạo.

- [ ] **Step 3: Cài đặt gói `lenis`**

Chạy: `npm install lenis`

- [ ] **Step 4: Commit thay đổi Task 1 ban đầu**

```bash
git add package.json package-lock.json
git commit -m "chore: add lenis dependency"
```

---

### Task 2: Cấu Hình CSS Cho Lenis Trong `globals.css`

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Bổ sung CSS rules cho Lenis trong `globals.css`**

Thêm vào `@layer base` hoặc block utilities:
```css
/* ============================================================
   Lenis Smooth Momentum Scroll Engine
   ============================================================ */
html.lenis,
html.lenis body {
  height: auto;
}

.lenis.lenis-smooth {
  scroll-behavior: auto !important;
}

.lenis.lenis-smooth [data-lenis-prevent] {
  overscroll-behavior: contain;
}

.lenis.lenis-stopped {
  overflow: hidden;
}

.lenis.lenis-smooth iframe {
  pointer-events: none;
}
```

- [ ] **Step 2: Kiểm tra test partial pass**

Chạy: `node --experimental-strip-types --test tests/smooth-scroll.test.ts`
Expected: Test `lenis dependency exists in package.json` và `globals.css contains Lenis smooth scroll classes` PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "style: add Lenis smooth scroll base styles to globals.css"
```

---

### Task 3: Xây Dựng `SmoothScrollProvider` & Tích Hợp Vào `RootLayout`

**Files:**
- Create: `src/providers/smooth-scroll-provider.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Tạo `src/providers/smooth-scroll-provider.tsx`**

```tsx
"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";

// Global reference dispatchable by other components (e.g. ScrollToTop)
let globalLenisInstance: any = null;

export function getGlobalLenis() {
  return globalLenisInstance;
}

export function scrollToTopLenis(duration = 1.2) {
  if (globalLenisInstance) {
    globalLenisInstance.scrollTo(0, { duration });
  } else if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Respect user's motion preferences
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let isDestroyed = false;
    let rafId: number;

    import("lenis").then(({ default: Lenis }) => {
      if (isDestroyed) return;

      const lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        touchMultiplier: 1,
      });

      globalLenisInstance = lenis;

      function raf(time: number) {
        if (!isDestroyed) {
          lenis.raf(time);
          rafId = requestAnimationFrame(raf);
        }
      }

      rafId = requestAnimationFrame(raf);
    });

    return () => {
      isDestroyed = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (globalLenisInstance) {
        globalLenisInstance.destroy();
        globalLenisInstance = null;
      }
    };
  }, []);

  // Recalculate dimensions on route change
  useEffect(() => {
    if (globalLenisInstance) {
      globalLenisInstance.resize();
    }
  }, [pathname]);

  return <>{children}</>;
}
```

- [ ] **Step 2: Tích hợp `SmoothScrollProvider` vào `src/app/layout.tsx`**

Bọc `SmoothScrollProvider` quanh nội dung trong `RootLayout`.

- [ ] **Step 3: Chạy test `tests/smooth-scroll.test.ts`**

Chạy: `node --experimental-strip-types --test tests/smooth-scroll.test.ts`
Expected: 4/4 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/providers/smooth-scroll-provider.tsx src/app/layout.tsx
git commit -m "feat: implement SmoothScrollProvider and integrate with layout"
```

---

### Task 4: Đồng Bộ `ScrollToTop` & Cách Ly Vùng Cuộn Cho Drawer/Modal

**Files:**
- Modify: `src/components/ui/scroll-to-top.tsx`
- Modify: `src/components/ui/color-detail-drawer.tsx`
- Modify: `src/components/features/cart/CartDrawer.tsx` (hoặc drawer giỏ hàng nếu có)

- [ ] **Step 1: Cập nhật `src/components/ui/scroll-to-top.tsx`**

Sử dụng hàm `scrollToTopLenis()` thay cho `window.scrollTo({ top: 0, behavior: "smooth" })` để mượt mà theo gia tốc Lenis.

- [ ] **Step 2: Thêm `data-lenis-prevent` vào các vùng cuộn độc lập (drawer, modal body)**

Gắn `data-lenis-prevent` vào container cuộn của `ColorDetailDrawer` để khi cuộn mã màu trong drawer không làm trôi trang nền bên ngoài.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/scroll-to-top.tsx src/components/ui/color-detail-drawer.tsx
git commit -m "feat: synchronize ScrollToTop and isolate drawer scrolling with Lenis"
```

---

### Task 5: Kiểm Thử Toàn Diện & Quality Gates

**Files:**
- Run commands: `npm run typecheck`, `npm run lint`, `npm run check:contrast`, `npm test`

- [ ] **Step 1: Chạy Typecheck & Lint**
Chạy: `npm run typecheck && npm run lint`
Expected: 0 errors.

- [ ] **Step 2: Chạy toàn bộ test suites**
Chạy: `npm test`
Expected: All tests pass.

- [ ] **Step 3: Kiểm tra trực quan cuộn mượt trên trình duyệt**
Khởi động dev server hoặc kiểm tra bằng browser subagent/script để xác nhận cuộn quán tính trượt êm ái.

- [ ] **Step 4: Commit hoàn tất**
```bash
git add .
git commit -m "feat(motion): complete Lenis smooth momentum scroll implementation"
```
