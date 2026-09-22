# Kế hoạch triển khai: Tối ưu hóa toàn diện giao diện Mobile (Maison de FLOF)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển đổi toàn diện trải nghiệm di động của Maison de FLOF từ giao diện responsive cơ bản thành một ứng dụng thương mại & trải nghiệm màu sơn kiến trúc đạt chuẩn Studio quốc tế (Apple Human Interface Guidelines & Atelier Editorial), giải quyết triệt để lỗi đứt gãy điều hướng, tối ưu hoá tương tác Visualizer thời gian thực và nâng cao tỷ lệ chuyển đổi mua hàng.

**Architecture:** Áp dụng kiến trúc điều hướng liên tục (Persistent Navigation Chrome) với Bottom Bar 5 tab không bị đứt đoạn, tái cấu trúc Visualizer sang mô hình "Dual-Screen Studio" (khung phòng 3D ghim cố định ở 40dvh trên + dock trượt chọn màu ở dưới), và nâng cấp các điểm chạm cảm ứng (Touch Targets $\ge 44\text{px}$, Quick Filter Chips, Sticky Purchase Bar toàn năng).

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, TailwindCSS 3, Framer Motion (`motion-safe`), Zustand (`cart-store`), Lucide Icons, Playwright E2E.

---

## User Review Required

> [!IMPORTANT]
> **Thay đổi chính sách điều hướng trang Giỏ hàng (`/cart`)**:
> Hiện tại `mobile-surface-policy.ts` và test `e2e/mobile-surfaces.spec.ts` đang ẩn thanh Bottom Navigation khi vào `/cart`. Đề xuất tối ưu sẽ **giữ thanh Bottom Navigation hiển thị trên trang `/cart`** và di chuyển nút Thanh toán (Checkout) lên phía trên Bottom Nav (in-flow hoặc docked) để người dùng có thể dễ dàng chạm tab quay lại "Sản phẩm" hay "Trang chủ" mà không bị kẹt. Test E2E sẽ được cập nhật đồng bộ.

---

## Proposed Changes

```
src/
├── lib/
│   └── mobile-surface-policy.ts           # [MODIFY] Giữ bottomNavigation: true cho /cart
├── components/
│   ├── layout/
│   │   ├── Header.tsx                     # [MODIFY] Thêm lối tắt Avatar/Login trên Header mobile
│   │   ├── MobileBottomBar.tsx            # [MODIFY] Đồng bộ tab active & haptic feedback touch
│   │   └── ChatBubble.tsx                 # [MODIFY] Né va chạm thanh Bottom Bar & hỗ trợ virtual keyboard
│   ├── features/
│   │   ├── home/
│   │   │   ├── HeroSection.tsx            # [MODIFY] Chuyển chiều cao sang dynamic viewport 78dvh
│   │   │   └── HeroContent.tsx            # [MODIFY] Nén HeroMetadataBar thành 1 dòng ngang trên mobile
│   │   ├── visualizer/
│   │   │   └── VisualizerClient.tsx       # [MODIFY] Tái cấu trúc sang Studio Dual-Screen Dock
│   │   ├── colors/
│   │   │   └── ColorsClient.tsx           # [MODIFY] Tinh giản dải chọn họ màu & tách nút Favorite chống bấm nhầm
│   │   └── product/
│   │       ├── ProductsClient.tsx         # [MODIFY] Thêm dải Quick Filter Chips và tinh chỉnh thẻ 2 cột
│   │       └── ProductClient.tsx          # [MODIFY] Nâng cấp Sticky Buy Bar có giá, biến thể & số lượng
│   └── ui/
│       └── color-detail-drawer.tsx        # [MODIFY] Thu gọn chiều cao Swatch để hiện toàn bộ gợi ý màu
├── app/
│   ├── cart/page.tsx                      # [MODIFY] Bỏ padding đáy kép pb-32, tích hợp nút Checkout chuẩn
│   └── globals.css                        # [MODIFY] Bổ sung tiện ích mobile viewport & touch classes
e2e/
└── mobile-surfaces.spec.ts                # [MODIFY] Cập nhật test contract cho Bottom Nav trên /cart
```

---

## Chi tiết các Task triển khai theo 3 Sprint

---

### SPRINT 1: Nền tảng Điều hướng liên tục & Chrome Mobile (P0)

#### Task 1.1: Cập nhật Mobile Surface Policy & Đồng bộ E2E Test Contract
**Files:**
- Modify: `src/lib/mobile-surface-policy.ts`
- Modify: `e2e/mobile-surfaces.spec.ts`

- [ ] **Step 1: Cập nhật policy cho `/cart` giữ Bottom Navigation**
  Trong `src/lib/mobile-surface-policy.ts`, sửa nhánh `path === "/cart"`:
  ```typescript
  if (path === "/cart") {
    return {
      mode: "transaction",
      bottomNavigation: true, // Giữ Bottom Bar để người dùng không bị mất lối điều hướng
      contextualAction: "none",
      chat: false,
    };
  }
  ```
- [ ] **Step 2: Cập nhật E2E test `e2e/mobile-surfaces.spec.ts`**
  Đổi kỳ vọng `["/vi/cart", false]` thành `["/vi/cart", true]`:
  ```typescript
  for (const [path, bottomNav] of [
    ["/vi/products", true],
    ["/vi/cart", true],
    [`/vi/products/${TEST_FIXTURES.productSlug}`, false],
  ] as const) {
    await page.goto(path);
    await expect(page.getByLabel("Mobile navigation")).toHaveCount(bottomNav ? 1 : 0);
  }
  ```
- [ ] **Step 3: Chạy test xác minh**
  Run: `npx playwright test e2e/mobile-surfaces.spec.ts`
  Expected: PASS

---

#### Task 1.2: Bổ sung Lối tắt Tài khoản/Đăng nhập trên Header Mobile
**Files:**
- Modify: `src/components/layout/Header.tsx`

- [ ] **Step 1: Thêm User Action Icon bên cạnh nút Hamburger trên mobile**
  Trong `src/components/layout/Header.tsx`, bên cạnh nút mở Menu mobile:
  - Nếu đã đăng nhập: hiển thị avatar tròn $32\times 32\text{px}$ có link trực tiếp về `/profile`.
  - Nếu là khách (guest): hiển thị nút icon User thanh lịch có link về `/login` với `aria-label="Đăng nhập / Tài khoản"`.
  - Đảm bảo touch target $\ge 44\times 44\text{px}$ (`min-h-11 min-w-11`).
- [ ] **Step 2: Kiểm tra responsive trên trình duyệt giả lập**
  Kiểm tra trên viewport 375px và 390px đảm bảo không bị vỡ dòng Logo FLOF.

---

#### Task 1.3: Khắc phục xung đột Chat Bubble & Loại bỏ Padding đáy kép trên Giỏ hàng
**Files:**
- Modify: `src/components/layout/ChatBubble.tsx`
- Modify: `src/app/cart/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Sửa trang Giỏ hàng `src/app/cart/page.tsx`**
  - Xóa bỏ class `pb-32` tại thẻ bao ngoài container (tránh bị nhân đôi khoảng trắng thừa với `MainLayoutWrapper`).
  - Đưa nút Thanh toán (Checkout CTA) hiển thị nổi bật trong phần tóm tắt đơn hàng (Order summary) với chiều cao $48\text{px}$, font chữ to rõ, số tiền tổng cộng kèm thông báo miễn phí vận chuyển.
- [ ] **Step 2: Tối ưu `ChatBubble.tsx`**
  - Đảm bảo khi mở Chat popup trên mobile, popup bung dạng Bottom Sheet toàn màn hình thay vì card lơ lửng, tránh bị bàn phím ảo che mất input gõ tin nhắn.

---

### SPRINT 2: Đột phá Trải nghiệm Visualizer & Tối ưu Color Explorer (P1)

#### Task 2.1: Tái cấu trúc Visualizer sang mô hình "Studio Dual-Screen Dock"
**Files:**
- Modify: `src/components/features/visualizer/VisualizerClient.tsx`

- [ ] **Step 1: Tạo bố cục Dual-Screen trên Mobile (`< lg`)**
  - **Khung trên (Top Sticky Stage ~42dvh):** Ghim ảnh phòng mẫu 3D ở phần trên màn hình khi người dùng cuộn ở chế độ tương tác. Ảnh phòng sử dụng `aspect-[16/10]` hoặc `aspect-[4/3]` sắc nét.
  - **Dải chọn phòng mẫu (Room Switcher):** Thu gọn thành dạng horizontal pill chips ngay sát mép đáy của Top Stage.
  - **Khung dưới (Bottom Dock ~58dvh):** Chứa danh sách 6 bộ màu phối sẵn (Presets).
- [ ] **Step 2: Tương tác Zero-Latency**
  - Khi người dùng chạm ngón cái vào bất kỳ preset màu nào ở Dock dưới, state `currentCombo` đổi lập tức và Canvas phòng ở trên đổi màu ngay trước mắt người dùng mà không cần cuộn trang.
- [ ] **Step 3: Kiểm thử tương tác**
  Run: `npx playwright test e2e/visualizer.spec.ts`
  Expected: PASS

---

#### Task 2.2: Tối ưu hóa Trang Bảng màu (`/colors`) & Sheet Chi tiết màu
**Files:**
- Modify: `src/components/features/colors/ColorsClient.tsx`
- Modify: `src/components/ui/color-detail-drawer.tsx`

- [ ] **Step 1: Tinh giản dải chọn họ màu & tông màu trong `ColorsClient.tsx`**
  - Họ màu hiển thị dạng chip viên thuốc bo góc nhẹ kèm ô màu tròn $16\text{px}$ bên trong tên, giúp vuốt ngang nhanh hơn.
  - Tách riêng nút bấm Yêu thích (Heart) để không nằm đè lên vùng cảm ứng của ô màu, loại bỏ lỗi vô tình thêm/bớt yêu thích khi chỉ muốn xem chi tiết.
- [ ] **Step 2: Tối ưu `color-detail-drawer.tsx`**
  - Giảm chiều cao khối màu mẫu từ `h-52` ($208\text{px}$) xuống `h-28` ($112\text{px}$) trên mobile.
  - Đưa toàn bộ các cặp màu bổ trợ (Complementary, Analogous, Triadic) và thông số HEX/RGB lên ngay tầm mắt đầu tiên của Sheet.

---

### SPRINT 3: Tối ưu Tỷ lệ Chuyển đổi Catalog & Touch Ergonomics (P2)

#### Task 3.1: Thu gọn Hero Fold Trang chủ & Nén Metadata Bar
**Files:**
- Modify: `src/components/features/home/HeroSection.tsx`
- Modify: `src/components/features/home/HeroContent.tsx`

- [ ] **Step 1: Sửa chiều cao Hero Fold trong `HeroSection.tsx`**
  - Đổi `min-h-[620px]` thành `min-h-[calc(78dvh-theme(spacing.16))] max-h-[680px]` để lộ ~15% nội dung phía dưới, kích thích hành vi cuộn tự nhiên.
- [ ] **Step 2: Nén `HeroMetadataBar` trong `HeroContent.tsx`**
  - Trên mobile, đổi từ `flex-col gap-fl-2xs` sang `flex items-center justify-between overflow-x-auto text-[11px] uppercase tracking-wider py-2.5`, tiết kiệm hơn $100\text{px}$ chiều dọc lãng phí.

---

#### Task 3.2: Thêm Quick Filter Chips trên Danh mục Sản phẩm & Tối ưu Lưới 2 cột
**Files:**
- Modify: `src/components/features/product/ProductsClient.tsx`

- [ ] **Step 1: Bổ sung thanh Quick Filter Chips ngang**
  - Đặt dưới thanh tiêu đề: `[Tất cả] [Sơn Nội Thất] [Sơn Ngoại Thất] [Sơn Lót] [Chống Thấm]` cho phép lọc 1 chạm.
- [ ] **Step 2: Cân chỉnh thẻ sản phẩm 2 cột**
  - Tinh chỉnh typography tên sản phẩm đạt tỷ lệ vàng trên màn hình $375\text{px}-390\text{px}$, padding trong thẻ $8\text{px}$, hiển thị giá tiền và % giảm giá rõ ràng.

---

#### Task 3.3: Nâng cấp Sticky Purchase Bar trên Trang Chi tiết Sản phẩm
**Files:**
- Modify: `src/components/features/product/ProductClient.tsx`

- [ ] **Step 1: Bổ sung Giá tiền & Cụm điều khiển trên Sticky Bar**
  - Cấu trúc thanh nổi:
    `[Tên màu • Dung tích (chạm đổi)] [Giá tiền VNĐ] [Bộ nút - 1 +] [Nút THÊM GIỎ]`
  - Giúp người dùng nắm chắc giá tiền và số lượng mà không cần cuộn ngược lên đầu trang.
- [ ] **Step 2: Kiểm tra safe-area trên iOS**
  - Đảm bảo `pb-[max(var(--fl-space-xs),env(safe-area-inset-bottom))]` chuẩn xác, không bị Home Bar của iPhone che mất.

---

## Verification Plan

### Automated Tests
1. **Kiểm tra Lint & Typecheck:**
   - `npm run lint` (0 error)
   - `npm run typecheck` (0 error)
2. **Kiểm tra Unit & Integration tests:**
   - `npm test` (152/152 tests pass)
   - `npm run test:integration` (24/24 tests pass)
3. **Kiểm tra Playwright E2E Mobile Suite:**
   - `npx playwright test e2e/mobile-surfaces.spec.ts`
   - `npx playwright test e2e/responsive-journeys.spec.ts`
   - `npx playwright test e2e/visualizer.spec.ts`

### Manual Verification
- Kiểm tra trực tiếp trên Chrome DevTools Device Emulation với các thiết bị:
  - iPhone SE (375 × 667)
  - iPhone 14/15/16 (390 × 844)
  - Samsung Galaxy S20 / Pixel 7 (412 × 915)
- Kiểm tra tính năng:
  - Chuyển tab Bottom Bar mượt mà, vào Giỏ hàng không bị mất Bottom Bar.
  - Mở Visualizer trên mobile: bấm chọn các palette màu khác nhau, ảnh phòng phía trên đổi màu tức thì.
  - Thêm sản phẩm vào giỏ từ Sticky Buy Bar trên trang sản phẩm.
