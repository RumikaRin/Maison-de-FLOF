# Thiết Kế Kỹ Thuật: Cuộn Mượt Quán Tính (Lenis Smooth Momentum Scroll)

- **Ngày lập**: 2026-09-11
- **Trạng thái**: Đã phê duyệt (Approved)
- **Mục tiêu**: Nâng tầm trải nghiệm tương tác trên website Maison de FLOF bằng cơ chế cuộn mượt quán tính (Smooth Momentum / Inertial Scroll), loại bỏ cảm giác khựng nấc chuột giật cục trên máy tính, tạo cảm giác lướt êm ái sang trọng chuẩn Boutique / Awwwards Studio mà vẫn bảo đảm hiệu năng 60-120fps và tôn trọng accessibility.

---

## 1. YÊU CẦU & THAM SỐ VẬT LÝ (SCROLL PHYSICS)

1. **Cảm giác cuộn (Motion Dynamics)**:
   - Khi người dùng lăn con lăn chuột (mouse wheel) trên desktop, trang web không giật cục theo bước nhảy mặc định của trình duyệt (100–120px) mà trôi nhẹ nhàng với độ trễ quán tính tự nhiên.
   - **Duration**: `1.2s` (đủ êm ái, thanh thoát nhưng không gây cảm giác trễ hay trôi quá đà).
   - **Easing**: Exponential decay `(t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))` (hoặc cubic-bezier tương đương) — phản hồi tức thì khi lăn chuột và hãm phanh êm ái.
   - **Wheel Multiplier**: `1.0` (giữ nguyên cự ly cuộn tự nhiên của người dùng, không phóng đại gây chóng mặt).

2. **Mobile & Touch Behavior**:
   - Thiết bị cảm ứng (iOS, Android, màn hình cảm ứng) đã có cơ chế cuộn quán tính phần cứng tối ưu của hệ điều hành.
   - Lenis cấu hình `smoothWheel: true`, `touchMultiplier: 1`, không can thiệp (hijack) gesture cảm ứng trên mobile để tránh hiện tượng lag hoặc mất cảm giác haptic tự nhiên.

3. **Accessibility (`prefers-reduced-motion`)**:
   - Tự động kiểm tra `(prefers-reduced-motion: reduce)`. Nếu người dùng bật tùy chọn này trên hệ điều hành, Lenis sẽ được tắt hoặc hủy đăng ký requestAnimationFrame để cuộn theo mặc định trình duyệt.

---

## 2. KIẾN TRÚC THÀNH PHẦN

### 2.1. Cài đặt Dependency
- Gói chính thức: `lenis` (~4KB gzipped).
- Đảm bảo tương thích hoàn toàn với Next.js 15 (App Router) và React 19.

### 2.2. Component `SmoothScrollProvider` (`src/providers/smooth-scroll-provider.tsx`)
- Đánh dấu `"use client"`.
- Tạo một React Context hoặc cung cấp hook `useLenis()` (hoặc export helper) để các component con có thể điều khiển cuộn (ví dụ `lenis.scrollTo(...)`).
- Khởi tạo instance Lenis khi client mount:
  ```typescript
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: "vertical",
    gestureOrientation: "vertical",
    smoothWheel: true,
    touchMultiplier: 1,
  });
  ```
- Duy trì vòng lặp `requestAnimationFrame`:
  ```typescript
  function raf(time: number) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
  ```
- Dọn dẹp (`lenis.destroy()`) khi unmount.
- Bắt sự kiện chuyển trang của Next.js (App Router `pathname` thay đổi): gọi `lenis.resize()` và đảm bảo cuộn mượt không bị tính sai chiều cao trang sau khi re-render.

### 2.3. Cấu hình CSS (`src/app/globals.css`)
- Bổ sung các class tiêu chuẩn của Lenis:
  ```css
  html.lenis, html.lenis body {
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

---

## 3. TÍCH HỢP HỆ THỐNG & CÁCH LY VÙNG CUỘN (SCROLL ISOLATION)

1. **Tích hợp vào RootLayout (`src/app/layout.tsx`)**:
   - Bọc `SmoothScrollProvider` bên trong `ThemeProvider` / `SessionProvider` để bao phủ toàn bộ cây DOM.
2. **Cách ly vùng cuộn độc lập (Prevent Scroll Chaining)**:
   - Các modal, popup, drawer (như `ColorDetailDrawer`, Cart Drawer, Chat widget) có danh sách cuộn riêng.
   - Thêm thuộc tính `data-lenis-prevent` vào các container cuộn bên trong các component này để việc lăn chuột trong popup không kích hoạt cuộn trang nền.
3. **Đồng bộ với `ScrollToTop` (`src/components/ui/scroll-to-top.tsx`)**:
   - Thay vì gọi `window.scrollTo({ top: 0, behavior: "smooth" })` (có thể xung đột với Lenis RAF loop), sử dụng hook hoặc dispatch gọi `lenis.scrollTo(0, { duration: 1.2 })` để việc cuộn ngược lên đầu trang đồng bộ tuyệt đối với nhịp độ quán tính chung.
4. **Tương thích với `fl-reveal` & `IntersectionObserver`**:
   - Vì Lenis v1 sử dụng native window scroll (`window.scrollY`), các observer trong `src/lib/fl-reveal.ts` tiếp tục hoạt động mượt mà và chuẩn xác 100%.

---

## 4. KẾ HOẠCH XÁC THỰC (VERIFICATION PLAN)

1. **Kiểm tra biên dịch & Typecheck**:
   - Chạy `npm run typecheck` đảm bảo không có lỗi TypeScript.
   - Chạy `npm run lint` đảm bảo code tuân thủ quy tắc ESLint.
2. **Kiểm tra Bundle & Contrast Gate**:
   - Chạy `npm run check:contrast` và kiểm tra bundle.
3. **Kiểm tra tương tác thực tế trên trình duyệt**:
   - Mở trang chủ bằng subagent/headless browser: kiểm tra hành vi lăn chuột, cuộn quán tính mượt mà, không giật khấc.
   - Kiểm tra cuộn bên trong Drawer (Cart, Color Drawer): trang nền không bị trượt khi cuộn nội dung drawer.
   - Bấm nút `ScrollToTop`: trang trượt lướt mượt mà lên đầu trang.
4. **Bộ test hồi quy**:
   - Chạy `npm test` để xác nhận tất cả unit test hiện có tiếp tục pass.
