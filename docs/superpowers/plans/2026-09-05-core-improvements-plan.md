# Kế Hoạch Thực Thi Cải Tiến Toàn Diện (Maison de FLOF)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Khắc phục triệt để 4 vấn đề kỹ thuật trọng tâm: gửi email tức thì qua Next.js 15 `after()`, gỡ bỏ `framer-motion` để giảm 150KB bundle và kích hoạt CSS animation thật sự, tối ưu hóa live chat bằng adaptive polling (3s -> 30s + 304 Not Modified), và dọn sạch Webpack alias monkey-patch trong `next.config.ts`.

**Architecture:** Sử dụng `after()` từ `next/server` cho background dispatching không block I/O; thay thế `safeMotion` bằng các CSS keyframes GPU-composited tuân thủ strict CSP; bổ sung HTTP 304 conditional check và backoff cho Chat Poller; dọn Webpack alias và đưa Route Announcer vào Root Layout an toàn.

**Tech Stack:** Next.js 15.5, React 19, TypeScript 5.7, Tailwind CSS 3.4, Prisma ORM 6.0, Node.js Test Runner (`node --test`).

---

### Task 1: Gửi Email Outbox Tức Thì & Hoàn Thiện Cron Schedule

**Files:**
- Modify: `src/app/api/orders/route.ts`
- Modify: `src/app/api/vnpay/ipn/route.ts`
- Modify: `src/app/api/vnpay/return/route.ts`
- Modify: `vercel.json`
- Test: `tests/email-delivery.test.ts`

- [ ] **Step 1: Viết test kiểm tra kích hoạt outbox tức thì**

Chạy: `node --experimental-strip-types --test tests/email-outbox.test.ts` để kiểm tra các bài test outbox hiện tại đang pass.

- [ ] **Step 2: Cập nhật `src/app/api/orders/route.ts` tích hợp Next.js 15 `after()`**

Thêm import `after` từ `next/server`, `processEmailOutboxRecord`, `sendOrderConfirmationEmail` và gọi sau khi `processCheckout` thành công:

```typescript
import { after } from "next/server";
import { processEmailOutboxRecord } from "@/lib/process-email-outbox";
import { sendOrderConfirmationEmail } from "@/lib/email";

// Sau khi result = await processCheckout(...):
if (input.paymentMethod !== "VNPAY") {
  after(async () => {
    try {
      const pendingRecord = await db.emailOutbox.findFirst({
        where: {
          type: "ORDER_CONFIRMATION",
          status: "PENDING",
          payload: { path: ["orderNumber"], equals: orderData[0].orderNumber },
        },
      });
      if (pendingRecord) {
        await processEmailOutboxRecord(db, pendingRecord, sendOrderConfirmationEmail);
      }
    } catch {
      // Lỗi tạm thời giữ nguyên outbox record để cron hourly quét lại
    }
  });
}
```

- [ ] **Step 3: Cập nhật `src/app/api/vnpay/ipn/route.ts` và `return/route.ts` tích hợp `after()`**

Sau khi thanh toán VNPay thành công và `enqueueConfirmationEmail: true` đã tạo record, kích hoạt gửi ngay:

```typescript
import { after } from "next/server";
import { processEmailOutboxRecord } from "@/lib/process-email-outbox";
import { sendOrderConfirmationEmail } from "@/lib/email";

after(async () => {
  try {
    const order = await db.order.findUnique({
      where: { id: result.orderId },
      select: { orderNumber: true },
    });
    if (!order) return;
    const pendingRecord = await db.emailOutbox.findFirst({
      where: {
        type: "ORDER_CONFIRMATION",
        status: "PENDING",
        payload: { path: ["orderNumber"], equals: order.orderNumber },
      },
    });
    if (pendingRecord) {
      await processEmailOutboxRecord(db, pendingRecord, sendOrderConfirmationEmail);
    }
  } catch {}
});
```

- [ ] **Step 4: Cập nhật `vercel.json` bổ sung cron dọn dẹp đơn quá hạn & retry email**

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-unpaid-orders",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/process-outbox",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/apply-retention",
      "schedule": "35 0 * * *"
    }
  ]
}
```

- [ ] **Step 5: Chạy test xác nhận Task 1**

Run: `node --experimental-strip-types --test tests/email-outbox.test.ts tests/payment-policy.test.ts`
Expected: PASS

---

### Task 2: Gỡ Bỏ Framer Motion & Chuẩn Hóa CSS Keyframes

**Files:**
- Modify: `package.json`
- Modify: `src/components/ui/motion-safe.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/admin/page.tsx`
- Modify: `src/components/layout/ChatBubble.tsx`
- Modify: `src/components/features/visualizer/VisualizerClient.tsx`
- Modify: `src/components/features/product/ProductsClient.tsx`
- Modify: `src/components/features/colors/ColorsClient.tsx`
- Modify: `src/app/find-dealer/page.tsx`
- Test: `tests/no-inline-style.test.ts`

- [ ] **Step 1: Gỡ bỏ `framer-motion` khỏi `package.json`**

Chạy lệnh hoặc sửa `package.json` gỡ bỏ `"framer-motion": "^11.11.11"` khỏi `dependencies`.

- [ ] **Step 2: Viết lại `src/components/ui/motion-safe.tsx` thành native React wrapper 0 dependency**

```typescript
"use client";

import { createElement, forwardRef, useEffect, useState, type ReactNode } from "react";

export function useReducedMotion(): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setMatches(media.matches);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);
  return matches;
}

export function AnimatePresence({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

function safeElement(tag: string) {
  return forwardRef<HTMLElement, Record<string, unknown>>(
    function MotionSafeElement(props, ref) {
      const {
        initial, animate, exit, transition, variants,
        whileHover, whileTap, whileFocus, whileInView,
        layout, layoutId, ...validProps
      } = props;
      return createElement(tag, { ...validProps, ref });
    },
  );
}

export const safeMotion = {
  article: safeElement("article"),
  aside: safeElement("aside"),
  button: safeElement("button"),
  div: safeElement("div"),
  header: safeElement("header"),
  main: safeElement("main"),
  p: safeElement("p"),
  span: safeElement("span"),
};
```

- [ ] **Step 3: Bổ sung Keyframes và Utility Classes vào `src/app/globals.css`**

Thêm các lớp animation chuẩn GPU:

```css
@keyframes flFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes flSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes flSpring {
  0% { opacity: 0; transform: scale(0.96) translateY(8px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.fl-animate-fade-in {
  animation: flFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.fl-animate-slide-up {
  animation: flSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.fl-animate-spring {
  animation: flSpring 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@media (prefers-reduced-motion: reduce) {
  .fl-animate-fade-in,
  .fl-animate-slide-up,
  .fl-animate-spring {
    animation: none !important;
  }
}
```

- [ ] **Step 4: Gắn các class animation vào các view chính**

- Trong `ChatBubble.tsx`: Gắn `fl-animate-spring` vào container khung chat khi mở.
- Trong `admin/page.tsx`: Gắn `fl-animate-slide-up` vào header và dashboard stats card.
- Trong `VisualizerClient.tsx` & `ProductsClient.tsx`: Gắn `fl-animate-fade-in` vào các khung hiển thị.

- [ ] **Step 5: Cập nhật `tests/no-inline-style.test.ts` và chạy test**

Cập nhật test đảm bảo kiểm tra:
1. Không có `style={{` (no inline styles).
2. Không có `<motion.`
3. Không có import từ `"framer-motion"`.

Run: `node --experimental-strip-types --test tests/no-inline-style.test.ts`
Expected: PASS

---

### Task 3: Tối Ưu Hóa Adaptive Live Chat Polling

**Files:**
- Modify: `src/app/api/chat/conversation/route.ts`
- Modify: `src/components/layout/ChatBubble.tsx`
- Test: `tests/notification-polling.test.ts`

- [ ] **Step 1: Cập nhật Server Route `/api/chat/conversation` hỗ trợ `If-Modified-Since` & 304**

Trong `src/app/api/chat/conversation/route.ts`:
- Đọc `request.headers.get("if-modified-since")`.
- Lấy `conversation.updatedAt`.
- Nếu `if-modified-since` hợp lệ và `conversation.updatedAt <= ifModifiedSince`, trả về `new NextResponse(null, { status: 304, headers: { "Last-Modified": conversation.updatedAt.toUTCString() } })`.

- [ ] **Step 2: Nâng cấp client polling trong `src/components/layout/ChatBubble.tsx`**

Thay thế `setInterval` 3s thô sơ bằng poller thích ứng:
```typescript
useEffect(() => {
  if (!open || view !== "live-chat" || !session?.user) return;

  let timer: NodeJS.Timeout | null = null;
  let currentDelay = 3000;
  let lastModified: string | null = null;
  let isCancelled = false;

  const poll = async () => {
    if (document.hidden) return; // Tạm dừng nếu tab bị ẩn

    try {
      const headers: Record<string, string> = {};
      if (lastModified) headers["If-Modified-Since"] = lastModified;

      const res = await fetch("/api/chat/conversation", { headers });
      if (res.status === 304) {
        // Không có tin mới -> tăng dần delay (3s -> 8s -> 15s -> 30s)
        currentDelay = Math.min(currentDelay * 1.8, 30000);
      } else if (res.ok) {
        const mod = res.headers.get("Last-Modified");
        if (mod) lastModified = mod;
        const data = await res.json();
        setMessages(data.messages || []);
        currentDelay = 3000; // Reset về 3s khi có tin mới
      }
    } catch {
      currentDelay = 15000;
    } finally {
      if (!isCancelled) {
        timer = setTimeout(poll, currentDelay);
      }
    }
  };

  const handleVisibility = () => {
    if (!document.hidden) {
      currentDelay = 3000;
      poll();
    }
  };

  document.addEventListener("visibilitychange", handleVisibility);
  poll();

  return () => {
    isCancelled = true;
    if (timer) clearTimeout(timer);
    document.removeEventListener("visibilitychange", handleVisibility);
  };
}, [open, view, session?.user]);
```

- [ ] **Step 3: Chạy test xác nhận chat và notification polling**

Run: `node --experimental-strip-types --test tests/notification-polling.test.ts`
Expected: PASS

---

### Task 4: Dọn Sạch Webpack Alias & Chuẩn Hóa Accessibility

**Files:**
- Modify: `next.config.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/csp-app-router-announcer.tsx`
- Test: `tests/security-headers.test.ts`

- [ ] **Step 1: Gỡ bỏ `announcerAliases` trong `next.config.ts`**

Loại bỏ:
```typescript
const cspAnnouncer = fileURLToPath(...);
const announcerAliases = [...];
// và remove config.resolve.alias trong webpack(config)
```
Giúp `next.config.ts` sạch sẽ, không can thiệp private module của Next.js.

- [ ] **Step 2: Đưa `AppRouterAnnouncer` vào `src/app/layout.tsx`**

Nhúng `<AppRouterAnnouncer />` trực tiếp bên trong `<body>` của `src/app/layout.tsx`. Component đảm bảo chỉ mount ở client sau hydration:
```tsx
import { AppRouterAnnouncer } from "@/components/csp-app-router-announcer";

// Trong RootLayout return:
<body ...>
  ...
  <AppRouterAnnouncer />
</body>
```

- [ ] **Step 3: Kiểm tra security headers và hydration**

Run: `node --experimental-strip-types --test tests/security-headers.test.ts`
Expected: PASS

---

### Task 5: Toàn Diện Verification Gates

**Files:** Toàn bộ dự án

- [ ] **Step 1: Typecheck toàn dự án**
Run: `npm run typecheck`
Expected: Code 0, 0 errors.

- [ ] **Step 2: Lint toàn bộ code**
Run: `npm run lint`
Expected: Code 0, 0 errors.

- [ ] **Step 3: Chạy toàn bộ test suites**
Run: `npm test`
Expected: 215/215 tests pass.

- [ ] **Step 4: Kiểm tra Contrast Accessibility Gate**
Run: `npm run check:contrast`
Expected: 23/23 contrast pairs pass WCAG AA.

- [ ] **Step 5: Kiểm tra Build Production hoàn chỉnh**
Run: `npm run build`
Expected: Build thành công, tạo `.next` production bundle với dung lượng nhỏ hơn đáng kể do đã gỡ bỏ Framer Motion.
