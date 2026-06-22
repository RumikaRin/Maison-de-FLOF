# FLOF Performance Security Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Maison de FLOF faster on storefront/admin routes while preserving authentication, RBAC, checkout idempotency, payment safeguards, and rate limiting.

**Architecture:** Add small, testable security helpers for route-sensitive rate limiting and VNPay configuration. Then make scoped frontend optimizations: remove layout mount blocking, lazy-load non-critical global UI and admin charts, bound homepage data, replace raw images, and generate WebP variants for large local images without changing user-facing features.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Prisma, Auth.js/NextAuth v5, Node built-in test runner, Sharp via Next dependency.

---

## File Structure

- Modify `src/middleware.ts`: apply dedicated registration rate limiting while preserving auth and general API limits.
- Modify `tests/rate-limiter.test.ts`: add a failing test for route limit policy.
- Create `src/lib/security/rate-limit-policy.ts`: keep middleware path classification testable without instantiating Next middleware.
- Create `tests/vnpay-config.test.ts`: verify production VNPay config fails on missing payment credentials and supports sandbox/prod env.
- Modify `src/lib/vnpay.ts`: fail fast in production and make VNPay host/test mode env-driven.
- Modify `src/auth.ts`: make dangerous Google account linking opt-in by env.
- Modify `.env.example`: document VNPay and Google linking envs.
- Modify `src/app/layout.tsx`: lazy-load `ChatBubble`.
- Modify `src/components/layout/MainLayoutWrapper.tsx`: remove first-render mount gate and keep page content visible.
- Modify `src/components/admin/AdminNotificationDropdown.tsx`: make polling callback stable and fix hook dependency warning.
- Modify `src/app/admin/chat/page.tsx`: use `next/image` for user avatars.
- Create `src/components/admin/AdminRevenueChart.tsx`: isolate chart rendering.
- Modify `src/app/admin/page.tsx`: lazy-load admin chart and stop importing Chart.js in the page component.
- Modify `src/app/api/admin/dashboard/route.ts`: limit recent order query and reduce fetched relations.
- Modify `src/app/page.tsx`: remove `force-dynamic`, cap homepage data, and select only needed fields.
- Create `tools/convert-public-images.mjs`: generate WebP variants for large static PNGs.
- Modify image references for safe local WebP replacements.

---

### Task 1: Testable Rate Limit Policy

**Files:**
- Create: `src/lib/security/rate-limit-policy.ts`
- Modify: `tests/rate-limiter.test.ts`
- Modify: `src/middleware.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/rate-limiter.test.ts`:

```ts
import { getRateLimitPolicy } from "../src/lib/security/rate-limit-policy.ts";

test("rate limit policy protects credentials login and account registration separately", () => {
  assert.deepEqual(getRateLimitPolicy("/api/auth/callback/credentials"), {
    keyPrefix: "auth",
    limiter: "auth",
  });
  assert.deepEqual(getRateLimitPolicy("/api/auth/register"), {
    keyPrefix: "register",
    limiter: "auth",
  });
  assert.deepEqual(getRateLimitPolicy("/api/products"), {
    keyPrefix: "api",
    limiter: "api",
  });
  assert.equal(getRateLimitPolicy("/api/auth/session"), null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/rate-limiter.test.ts`

Expected: FAIL because `src/lib/security/rate-limit-policy.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/security/rate-limit-policy.ts`:

```ts
export type RateLimitPolicy = {
  keyPrefix: "auth" | "register" | "api";
  limiter: "auth" | "api";
};

export function getRateLimitPolicy(pathname: string): RateLimitPolicy | null {
  if (pathname === "/api/auth/callback/credentials") {
    return { keyPrefix: "auth", limiter: "auth" };
  }

  if (pathname === "/api/auth/register") {
    return { keyPrefix: "register", limiter: "auth" };
  }

  if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
    return { keyPrefix: "api", limiter: "api" };
  }

  return null;
}
```

Modify `src/middleware.ts` to import and use the helper:

```ts
import { getRateLimitPolicy } from "@/lib/security/rate-limit-policy";
```

Replace the two path-specific rate limit blocks with:

```ts
  const rateLimitPolicy = getRateLimitPolicy(pathname);
  if (rateLimitPolicy) {
    const limiter = rateLimitPolicy.limiter === "auth" ? authLimiter : apiLimiter;
    const rateCheck = await limiter.checkLimit(`${rateLimitPolicy.keyPrefix}_${ip}`);
    if (!rateCheck.success) {
      return new NextResponse(
        JSON.stringify({
          error:
            rateLimitPolicy.limiter === "auth"
              ? "Too many attempts. Please try again later."
              : "Too many requests. Please slow down.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": Math.ceil((rateCheck.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/rate-limiter.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/security/rate-limit-policy.ts src/middleware.ts tests/rate-limiter.test.ts
git commit -m "security: rate limit account registration"
```

---

### Task 2: VNPay And OAuth Security Guards

**Files:**
- Create: `tests/vnpay-config.test.ts`
- Modify: `src/lib/vnpay.ts`
- Modify: `src/auth.ts`
- Modify: `.env.example`

- [ ] **Step 1: Write the failing test**

Create `tests/vnpay-config.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { resolveVnpayConfig } from "../src/lib/vnpay.ts";

test("VNPay config rejects missing production credentials", () => {
  assert.throws(
    () =>
      resolveVnpayConfig({
        NODE_ENV: "production",
        VNPAY_TMN_CODE: "",
        VNPAY_HASH_SECRET: "",
      }),
    /VNPAY_TMN_CODE and VNPAY_HASH_SECRET/,
  );
});

test("VNPay config uses sandbox by default outside production", () => {
  const config = resolveVnpayConfig({ NODE_ENV: "development" });
  assert.equal(config.tmnCode, "SANDBOX_TMN_CODE");
  assert.equal(config.secureSecret, "SANDBOX_HASH_SECRET");
  assert.equal(config.vnpayHost, "https://sandbox.vnpayment.vn");
  assert.equal(config.testMode, true);
});

test("VNPay config supports explicit production host", () => {
  const config = resolveVnpayConfig({
    NODE_ENV: "production",
    VNPAY_TMN_CODE: "real-tmn",
    VNPAY_HASH_SECRET: "real-secret",
    VNPAY_HOST: "https://pay.vnpay.vn",
    VNPAY_TEST_MODE: "false",
  });
  assert.equal(config.tmnCode, "real-tmn");
  assert.equal(config.secureSecret, "real-secret");
  assert.equal(config.vnpayHost, "https://pay.vnpay.vn");
  assert.equal(config.testMode, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/vnpay-config.test.ts`

Expected: FAIL because `resolveVnpayConfig` is not exported.

- [ ] **Step 3: Write minimal implementation**

Modify `src/lib/vnpay.ts`:

```ts
import { VNPay, ignoreLogger, HashAlgorithm } from "vnpay";

type VnpayEnv = Pick<NodeJS.ProcessEnv, "NODE_ENV" | "VNPAY_TMN_CODE" | "VNPAY_HASH_SECRET" | "VNPAY_HOST" | "VNPAY_TEST_MODE">;

export function resolveVnpayConfig(env: VnpayEnv = process.env) {
  const isProduction = env.NODE_ENV === "production";
  const tmnCode = env.VNPAY_TMN_CODE || (isProduction ? "" : "SANDBOX_TMN_CODE");
  const secureSecret = env.VNPAY_HASH_SECRET || (isProduction ? "" : "SANDBOX_HASH_SECRET");

  if (isProduction && (!tmnCode || !secureSecret)) {
    throw new Error("VNPAY_TMN_CODE and VNPAY_HASH_SECRET are required in production");
  }

  return {
    tmnCode,
    secureSecret,
    vnpayHost: env.VNPAY_HOST || "https://sandbox.vnpayment.vn",
    testMode: env.VNPAY_TEST_MODE ? env.VNPAY_TEST_MODE !== "false" : !isProduction,
  };
}

const vnpayConfig = resolveVnpayConfig();

export const vnpayInstance = new VNPay({
  ...vnpayConfig,
  hashAlgorithm: HashAlgorithm.SHA512,
  enableLog: process.env.NODE_ENV !== "production",
  loggerFn: ignoreLogger,
});
```

Modify Google provider in `src/auth.ts`:

```ts
      allowDangerousEmailAccountLinking: process.env.AUTH_ALLOW_DANGEROUS_EMAIL_LINKING === "true",
```

Append to `.env.example`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
AUTH_ALLOW_DANGEROUS_EMAIL_LINKING="false"

# VNPay
VNPAY_TMN_CODE=""
VNPAY_HASH_SECRET=""
VNPAY_HOST="https://sandbox.vnpayment.vn"
VNPAY_TEST_MODE="true"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/vnpay-config.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/vnpay.ts src/auth.ts .env.example tests/vnpay-config.test.ts
git commit -m "security: guard vnpay and oauth configuration"
```

---

### Task 3: Layout And Global JavaScript Reduction

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/components/layout/MainLayoutWrapper.tsx`

- [ ] **Step 1: Run baseline build**

Run: `npm run build`

Expected: Build succeeds. Record the First Load JS values for `/`, `/products`, `/admin`, and shared JS.

- [ ] **Step 2: Lazy-load chat**

Modify `src/app/layout.tsx`:

```ts
import dynamic from "next/dynamic";
```

Replace the direct ChatBubble import with:

```ts
const ChatBubble = dynamic(
  () => import("@/components/layout/ChatBubble").then((mod) => mod.ChatBubble),
  { ssr: false },
);
```

Keep `<ChatBubble />` in the JSX.

- [ ] **Step 3: Remove mount gate**

Modify `src/components/layout/MainLayoutWrapper.tsx`:

```ts
import { useEffect } from "react";
```

Remove `SiteLoadingScreen` import, `mounted` state, its effect, and this block:

```ts
  if (!mounted) {
    return <SiteLoadingScreen />;
  }
```

- [ ] **Step 4: Run lint/build**

Run: `npm run lint && npm run build`

Expected: No new errors. Shared or route initial JS should not increase.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/components/layout/MainLayoutWrapper.tsx
git commit -m "perf: reduce global layout hydration cost"
```

---

### Task 4: Admin Warnings And Chart Chunk Split

**Files:**
- Modify: `src/components/admin/AdminNotificationDropdown.tsx`
- Modify: `src/app/admin/chat/page.tsx`
- Create: `src/components/admin/AdminRevenueChart.tsx`
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Fix notification callback**

In `src/components/admin/AdminNotificationDropdown.tsx`, import `useCallback`:

```ts
import { useCallback, useEffect, useState, useRef } from "react";
```

Wrap `fetchNotifications`:

```ts
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/notifications?type=${activeTab}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error(err);
    }
  }, [activeTab]);
```

Update the polling effect dependency:

```ts
  }, [fetchNotifications]);
```

- [ ] **Step 2: Replace raw admin chat images**

In `src/app/admin/chat/page.tsx`, import Image:

```ts
import Image from "next/image";
```

Replace each raw avatar image with:

```tsx
<Image
  src={conv.user.image}
  alt={conv.user.name || ""}
  width={40}
  height={40}
  className="h-full w-full object-cover"
/>
```

For active conversation:

```tsx
<Image
  src={activeConvDetail.user.image}
  alt={activeConvDetail.user.name || ""}
  width={40}
  height={40}
  className="h-full w-full object-cover"
/>
```

- [ ] **Step 3: Extract chart component**

Create `src/components/admin/AdminRevenueChart.tsx`:

```tsx
"use client";

import { formatPrice } from "@/lib/utils";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export function AdminRevenueChart({
  language,
  dailyLabels,
  dailyRevenue,
}: {
  language: "vi" | "en";
  dailyLabels: string[];
  dailyRevenue: number[];
}) {
  return (
    <Line
      data={{
        labels: dailyLabels,
        datasets: [
          {
            label: language === "vi" ? "Doanh thu (VND)" : "Revenue (VND)",
            data: dailyRevenue,
            fill: true,
            backgroundColor: "rgba(0, 123, 138, 0.12)",
            borderColor: "rgba(0, 123, 138, 1)",
            borderWidth: 2.5,
            tension: 0.4,
            pointBackgroundColor: "#ffffff",
            pointBorderColor: "rgba(0, 123, 138, 1)",
            pointBorderWidth: 2,
            pointRadius: 3.5,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: "rgba(0, 123, 138, 1)",
            pointHoverBorderColor: "#ffffff",
            pointHoverBorderWidth: 2,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: language === "vi" ? "Doanh thu 30 ngày" : "30-day revenue trend",
            color: "#6B5F52",
            font: { family: "sans-serif", size: 11, weight: "normal" },
            padding: { bottom: 15 },
          },
          tooltip: {
            backgroundColor: "#2F2822",
            titleColor: "#FAF9F6",
            bodyColor: "#FAF9F6",
            padding: 10,
            borderRadius: 8,
            displayColors: false,
            callbacks: {
              label: (context) => ` ${formatPrice(context.parsed.y)}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "#F3EFE8" },
            ticks: {
              color: "#6B5F52",
              callback: (value) => `${(Number(value) / 1000000).toFixed(1)}M`,
            },
          },
          x: {
            grid: { display: false },
            ticks: { color: "#6B5F52", maxRotation: 45, minRotation: 45 },
          },
        },
      }}
    />
  );
}
```

- [ ] **Step 4: Lazy-load chart in admin page**

In `src/app/admin/page.tsx`, remove Chart.js and `Line` imports/register calls. Import dynamic:

```ts
import dynamic from "next/dynamic";
```

Add:

```ts
const AdminRevenueChart = dynamic(
  () => import("@/components/admin/AdminRevenueChart").then((mod) => mod.AdminRevenueChart),
  {
    ssr: false,
    loading: () => <div className="h-full w-full rounded-xl bg-warm-50 animate-pulse" />,
  },
);
```

Replace `<Line data={revenueChartData} options={chartOptions} />` with:

```tsx
<AdminRevenueChart language={language} dailyLabels={dailyLabels} dailyRevenue={dailyRevenue} />
```

Remove unused `revenueChartData` and `chartOptions`.

- [ ] **Step 5: Run lint/build**

Run: `npm run lint && npm run build`

Expected: no `<img>` warnings and no hook dependency warning.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/AdminNotificationDropdown.tsx src/app/admin/chat/page.tsx src/components/admin/AdminRevenueChart.tsx src/app/admin/page.tsx
git commit -m "perf: split admin chart and clear lint warnings"
```

---

### Task 5: Homepage Data Boundaries

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Build current page**

Run: `npm run build`

Expected: Build succeeds. Record `/` route Size and First Load JS.

- [ ] **Step 2: Cap homepage queries**

Modify `src/app/page.tsx`:

```ts
export const revalidate = 300;
```

Remove:

```ts
export const dynamic = "force-dynamic";
```

Set query `take` values:

```ts
      take: 12,
```

for paints, and:

```ts
      take: 36,
```

for colors, and:

```ts
      take: 3,
```

for blogs.

Keep existing mapped object shape so child components do not lose required props.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: Build succeeds and `/` is static or ISR-capable instead of force dynamic.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "perf: bound homepage data payload"
```

---

### Task 6: Admin Dashboard Query Scope

**Files:**
- Modify: `src/app/api/admin/dashboard/route.ts`

- [ ] **Step 1: Refactor recent order query**

Change the `orders` query to fetch only recent orders:

```ts
      db.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 4,
        select: {
          orderNumber: true,
          createdAt: true,
          total: true,
          status: true,
          customer: { select: { user: { select: { name: true, email: true } } } },
          items: {
            select: {
              quantity: true,
              productName: true,
              paint: { select: { name: true } },
            },
          },
        },
      }),
```

Add a second completed-orders query for revenue chart:

```ts
      db.order.findMany({
        where: { createdAt: { gte: since }, status: "COMPLETED" },
        select: { createdAt: true, total: true },
      }),
```

Use that chart query for `revenueByDate`.

- [ ] **Step 2: Run typecheck/build**

Run: `npm run typecheck && npm run build`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/dashboard/route.ts
git commit -m "perf: narrow admin dashboard queries"
```

---

### Task 7: WebP Static Asset Variants

**Files:**
- Create: `tools/convert-public-images.mjs`
- Modify: selected image references in `src/app` and `src/components`
- Add: generated `.webp` files under `public`

- [ ] **Step 1: Create conversion script**

Create `tools/convert-public-images.mjs`:

```js
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const publicDir = path.join(process.cwd(), "public");
const minBytes = 500 * 1024;

const entries = await fs.readdir(publicDir, { withFileTypes: true });
const pngFiles = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith(".png"))
  .map((entry) => path.join(publicDir, entry.name));

for (const file of pngFiles) {
  const stat = await fs.stat(file);
  if (stat.size < minBytes) continue;

  const output = file.replace(/\.png$/, ".webp");
  await sharp(file).webp({ quality: 82 }).toFile(output);
  const nextStat = await fs.stat(output);
  console.log(`${path.basename(file)} -> ${path.basename(output)} ${stat.size} ${nextStat.size}`);
}
```

- [ ] **Step 2: Run conversion**

Run: `node tools/convert-public-images.mjs`

Expected: WebP files are generated for PNG files over 500 KB.

- [ ] **Step 3: Update safe image references**

Replace stable local display references with `.webp` when the generated file exists:

- `src/components/features/home/HeroSection.tsx`: `/hero_bg.png` to `/hero_bg.webp`
- `src/components/features/home/VisualizerPromoSection.tsx`: `/visualizer_mockup.png` to `/visualizer_mockup.webp`
- `src/components/features/home/PromotionSection.tsx`: `/product_interior.png` to `/product_interior.webp`
- `src/app/find-dealer/page.tsx`: `/showroom_hero.png` to `/showroom_hero.webp`
- `src/app/blog/[slug]/page.tsx`: `/room_inspiration.png` to `/room_inspiration.webp`
- `src/app/api/blog/[slug]/route.ts`: `/room_inspiration.png` to `/room_inspiration.webp`
- Product fallback references in `src/app/cart/page.tsx`, `src/components/features/checkout/CheckoutOrderSummary.tsx`, `src/components/features/profile/tabs/PersonalInfoTab.tsx`, `src/components/features/home/ColorExplorerSection.tsx`, `src/components/features/home/FeaturedProductsSection.tsx`, `src/components/features/product/ProductClient.tsx`, `src/components/features/product/ProductsClient.tsx`, `src/lib/mock-data.ts`, and `src/app/api/admin/products/route.ts`: `/product_interior.png` to `/product_interior.webp`.

Do not update `payment_qr.png` unless visually verified, because QR images are functional.

- [ ] **Step 4: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tools/convert-public-images.mjs public/*.webp src
git commit -m "perf: add optimized webp image assets"
```

---

### Task 8: Full Verification

**Files:**
- No new files unless verification exposes a required fix.

- [ ] **Step 1: Run lint**

Run: `npm run lint`

Expected: 0 errors. Any remaining warnings must be listed explicitly.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: exit 0.

- [ ] **Step 3: Run tests**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 4: Run production build**

Run: `npm run build`

Expected: exit 0. Record route size changes.

- [ ] **Step 5: Run audit**

Run: `npm audit --json`

Expected: no new vulnerabilities. If the existing moderate Next/PostCSS advisory remains, report it as upstream Next internal dependency and do not claim audit is clean.

- [ ] **Step 6: Check final git state**

Run: `git status --short`

Expected: no unstaged verification-only changes remain. If verification exposed a defect, fix it with the same TDD loop used above and commit the exact files touched by that fix before reporting completion.
