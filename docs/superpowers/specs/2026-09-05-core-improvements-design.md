# Thiết Kế Kỹ Thuật: Cải Tiến Toàn Diện Dự Án Maison de FLOF

- **Ngày lập**: 2026-09-05
- **Trạng thái**: Đã phê duyệt (Approved)
- **Mục tiêu**: Khắc phục triệt để 4 điểm nghẽn và hạn chế kỹ thuật lớn đã được phát hiện qua phân tích codebase, nâng cao độ tin cậy vận hành, tối ưu hiệu năng tải trang và tinh gọn kiến trúc.

---

## 1. PHẠM VI VÀ CÁC TRỌNG TÂM KỸ THUẬT

1. **Email Outbox Delivery & Cron Jobs**: Chuyển đổi từ mô hình đợi cron thụ động 24h sang mô hình gửi tức thì trong nền qua Next.js 15 `after()`, đồng thời hoàn thiện cấu hình cron dọn dẹp đơn quá hạn trên Vercel.
2. **Loại bỏ Framer Motion & Chuẩn hóa CSS Animation**: Gỡ bỏ thư viện nặng `framer-motion`, giải quyết triệt để vấn đề "bóc sạch prop animation để lách CSP", thay thế bằng các utility CSS/Tailwind keyframes chạy trên GPU compositor thread, giảm ~150KB bundle.
3. **Tối ưu hóa Live Chat Polling**: Thay thế vòng lặp polling cố định 3 giây bằng cơ chế Adaptive Polling (Backoff 3s → 30s, Pause khi tab ẩn, hỗ trợ conditional request `304 Not Modified`).
4. **Chuẩn hóa Accessibility & Dọn sạch Webpack Monkey-patch**: Gỡ bỏ Webpack alias can thiệp module private `next/dist/...` trong `next.config.ts`, đưa route announcer vào vị trí chuẩn trong Root Layout.

---

## 2. THIẾT KẾ CHI TIẾT TỪNG PHÂN HỆ

### Phân hệ 1: Gửi Email Outbox Tức Thì & Hoàn Thiện Cron Schedule

#### Hiện trạng:
- Đơn hàng được tạo (COD/Chuyển khoản) hoặc thanh toán thành công (VNPay IPN/Return) chỉ ghi một bản ghi vào bảng `EmailOutbox`.
- File `vercel.json` chỉ cấu hình cron `/api/cron/process-outbox` chạy lúc `5 0 * * *` (1 lần/ngày), khiến khách hàng không nhận được email xác nhận ngay lập tức.
- Tuyến `/api/cron/expire-unpaid-orders` (hoàn tồn kho cho các đơn VNPay bị bỏ dở) chưa được đưa vào lịch trình cron của Vercel.

#### Giải pháp:
1. **Áp dụng Next.js 15 `after()`**:
   - Trong các API routes tạo đơn và xác nhận thanh toán:
     - `src/app/api/orders/route.ts`
     - `src/app/api/vnpay/ipn/route.ts`
     - `src/app/api/vnpay/return/route.ts`
   - Sau khi transaction lưu đơn và outbox thành công, kích hoạt hàm `after()` từ `next/server`:
     ```typescript
     after(async () => {
       try {
         const outboxRecord = await db.emailOutbox.findFirst({
           where: {
             type: "ORDER_CONFIRMATION",
             status: "PENDING",
             payload: { path: ["orderNumber"], equals: orderNumber },
           },
         });
         if (outboxRecord) {
           await processEmailOutboxRecord(db, outboxRecord, sendOrderConfirmationEmail);
         }
       } catch {
         // Lỗi mạng hoặc rate limit sẽ được Cron backup định kỳ xử lý sau
       }
     });
     ```
2. **Cập nhật `vercel.json`**:
   - Thêm cron `/api/cron/expire-unpaid-orders` chạy mỗi 15 phút: `*/15 * * * *`.
   - Điều chỉnh cron `/api/cron/process-outbox` chạy mỗi giờ: `0 * * * *` làm nhiệm vụ dọn dẹp và retry dự phòng.

---

### Phân hệ 2: Gỡ Bỏ Framer Motion & Thay Bằng CSS Keyframes Thuần

#### Hiện trạng:
- File `package.json` chứa `framer-motion: ^11.11.11` (~150KB gzip).
- `src/components/ui/motion-safe.tsx` lọc bỏ mọi prop `initial`, `animate`, `transition` do CSP cấm inline styles. Toàn bộ animation khai báo trên `safeMotion` không hoạt động.

#### Giải pháp:
1. **Gỡ bỏ dependency**:
   - Gỡ `"framer-motion"` khỏi `package.json`.
2. **Cập nhật `src/components/ui/motion-safe.tsx`**:
   - Thay thế `safeMotion` bằng các element wrapper siêu nhẹ, pass props chuẩn.
   - Thay thế hook `useReducedMotion` bằng việc đọc trực tiếp `window.matchMedia('(prefers-reduced-motion: reduce)')`.
3. **Bổ sung Keyframes và Utility Classes vào `src/app/globals.css`**:
   - `.fl-animate-fade-in`: Fade in mượt mà.
   - `.fl-animate-slide-up`: Trượt nhẹ 12px lên và fade in.
   - `.fl-animate-spring`: Hiệu ứng nảy nhẹ tự nhiên.
   - Khai báo `@media (prefers-reduced-motion: reduce) { animation: none !important; }`.
4. **Cập nhật các Component tiêu thụ**:
   - Thay thế các prop `initial/animate` trong `src/app/admin/page.tsx`, `src/components/features/visualizer/VisualizerClient.tsx`, `src/components/features/product/ProductsClient.tsx`, `src/components/layout/ChatBubble.tsx` bằng các class CSS tương ứng.
5. **Cập nhật kiểm thử**:
   - Cập nhật `tests/no-inline-style.test.ts` để vừa xác nhận không có inline style, vừa kiểm tra không còn import từ `framer-motion`.

---

### Phân hệ 3: Tối Ưu Hóa Live Chat Bằng Adaptive Polling

#### Hiện trạng:
- `ChatBubble.tsx` gọi `setInterval(fetchMessages, 3000)` liên tục mỗi 3s khi mở tab live chat, tạo tải lớn lên Vercel Serverless và PostgreSQL.

#### Giải pháp:
1. **Phía Server (`src/app/api/chat/conversation/route.ts`)**:
   - Đọc header `If-Modified-Since` từ request.
   - Lấy `updatedAt` của Conversation hoặc tin nhắn mới nhất.
   - Nếu không có tin nhắn mới hơn mốc thời gian này, trả về ngay HTTP `304 Not Modified` với body rỗng.
2. **Phía Client (`src/components/layout/ChatBubble.tsx`)**:
   - Xây dựng poller thích ứng:
     - Bắt đầu với chu kỳ 3 giây khi vừa mở hoặc sau khi gửi tin nhắn.
     - Tăng dần thời gian (3s → 8s → 15s → 30s) nếu server liên tục trả về 304.
     - Reset về 3s khi người dùng tương tác gửi tin.
     - Lắng nghe sự kiện `visibilitychange` của trình duyệt: Tạm dừng polling khi `document.hidden === true`. Khi user quay lại tab, lập tức fetch lại một lần và tiếp tục chu kỳ.

---

### Phân hệ 4: Dọn Sạch Webpack Alias & Chuẩn Hóa Accessibility

#### Hiện trạng:
- `next.config.ts` chứa alias đè `next/dist/client/components/app-router-announcer` bằng `csp-app-router-announcer.tsx`.

#### Giải pháp:
1. **Xóa bỏ Webpack Alias**:
   - Xóa `announcerAliases` và phần ghi đè `config.resolve.alias` trong `next.config.ts`.
2. **Bố trí Route Announcer Chuẩn Tắc**:
   - Giữ nguyên component `AppRouterAnnouncer` độc lập.
   - Nhúng trực tiếp vào `src/app/layout.tsx`. Component chỉ render live-region sau khi client đã `mounted` nhằm triệt tiêu hoàn toàn nguy cơ Hydration error #418 mà không cần hack vào internals của framework.

---

## 3. KẾ HOẠCH KIỂM THỬ VÀ ĐẢM BẢO CHẤT LƯỢNG

1. **Typecheck & Lint**:
   - Chạy `npm run typecheck` đảm bảo 0 lỗi TypeScript.
   - Chạy `npm run lint` đảm bảo sạch sẽ quy chuẩn code.
2. **Unit & Integration Tests**:
   - Chạy toàn bộ 215+ unit tests qua `npm test`.
   - Đảm bảo các test về CSP, no-inline-style, rate limiter, và commerce invariants tiếp tục pass 100%.
3. **Kiểm tra Contrast & Build Production**:
   - Chạy `npm run check:contrast`.
   - Chạy `npm run build` để kiểm tra quá trình đóng gói Webpack/Next.js production thành công mỹ mãn.
