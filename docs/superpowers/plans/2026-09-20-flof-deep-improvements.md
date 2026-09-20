# Kế Hoạch Triển Khai Toàn Diện Các Vấn Đề Chuyên Sâu (FLOF Deep Improvements)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Giải quyết triệt để 17 điểm nghẽn và bài toán biên trong hệ thống Maison de FLOF về Hạ tầng, Thanh toán, Guest Checkout, VAT, VietQR, Cước vận chuyển theo khối lượng, Giới hạn Upload Cloudinary, và Tối ưu hóa SEO/Catalog.

**Architecture:** Tiếp cận cuốn chiếu qua 3 giai đoạn: (1) Sửa lỗi hạ tầng P0, Health Check, VNPay Retry & Cron, (2) Luồng Guest Checkout, Hóa đơn VAT, VietQR động, Quyền tự hủy đơn PENDING, (3) Bảng giá cước hàng nặng tham khảo (GHTK/GHN/ViettelPost), Direct Upload Cloudinary, Dynamic Color Sitemap và Chuẩn bị kiến trúc SKU Variant.

**Tech Stack:** Next.js 15, Prisma ORM, Neon PostgreSQL (PgBouncer), Upstash Redis, Resend API, Cloudinary, VNPay SDK, VietQR, Zod, Node test runner.

---

### Phase 1: Hạ Tầng Cốt Lõi & Khắc Phục Lỗi Thanh Toán (P0)

#### Task 1: Chuẩn hóa Connection String Neon với `pgbouncer=true`
**Files:**
- Modify: `d:\ProjectZ\FLOF\.env:1-3`
- Modify: `d:\ProjectZ\FLOF\src\lib\db.ts:1-25`

- [ ] **Step 1: Cập nhật `.env` thêm tham số `&pgbouncer=true`**
- [ ] **Step 2: Cập nhật hàm `getCleanDatabaseUrl` trong `src/lib/db.ts`** để tự động gắn `pgbouncer=true` nếu kết nối tới `-pooler` mà chưa có cờ này.
- [ ] **Step 3: Chạy test kiểm tra kết nối**: `npm test`

#### Task 2: Xây dựng Endpoint Giám Sát Hệ Thống `/api/health`
**Files:**
- Create: `d:\ProjectZ\FLOF\src\app\api\health\route.ts`
- Create: `d:\ProjectZ\FLOF\tests\health-endpoint.test.ts`

- [ ] **Step 1: Viết test cho `/api/health`** kiểm tra response format `{ status: "ok", checks: { database, redis, email } }`
- [ ] **Step 2: Thực thi route `/api/health`** sử dụng `SELECT 1` trên DB, `PING` trên Redis, và kiểm tra trạng thái Resend API key.
- [ ] **Step 3: Chạy test xác nhận:** `npm test`

#### Task 3: Xử lý Thất Bại Thanh Toán VNPay & Cơ Chế "Thanh Toán Lại / Đổi COD"
**Files:**
- Create: `d:\ProjectZ\FLOF\src\app\api\orders\[id]\retry-payment\route.ts`
- Modify: `d:\ProjectZ\FLOF\src\app\checkout\success\page.tsx`
- Modify: `d:\ProjectZ\FLOF\src\app\api\vnpay\return\route.ts`

- [ ] **Step 1: Viết test cho route retry-payment** (chỉ cho phép đơn hàng `PENDING` và chưa thanh toán).
- [ ] **Step 2: Triển khai API `/api/orders/[id]/retry-payment`** (sinh URL VNPay mới hoặc chuyển phương thức sang COD mà không tạo đơn trùng).
- [ ] **Step 3: Cập nhật UI màn hình thất bại trên `/checkout/success`** bổ sung nút: "Thanh toán lại bằng VNPay", "Chuyển sang nhận hàng trả tiền (COD)", "Hủy đơn hàng".

#### Task 4: Điều chỉnh Tần Suất Cron Outbox Email
**Files:**
- Modify: `d:\ProjectZ\FLOF\vercel.json`

- [ ] **Step 1: Đổi lịch quét outbox** từ `0 * * * *` thành `*/10 * * * *` (mỗi 10 phút) để tránh trễ email đơn hàng.

---

### Phase 2: Chuyển Đổi Mua Hàng & Nghiệp Vụ Bán Hàng (P1)

#### Task 5: Triển khai Luồng Guest Checkout (Mua Không Cần Login)
**Files:**
- Modify: `d:\ProjectZ\FLOF\prisma\schema.prisma`
- Modify: `d:\ProjectZ\FLOF\src\services\checkout.service.ts`
- Modify: `d:\ProjectZ\FLOF\src\components\features\checkout\CheckoutClient.tsx`

- [ ] **Step 1: Cập nhật schema & service** để xử lý khách vãng lai: tự động gán Customer type RETAIL theo email/phone hoặc tạo guest record.
- [ ] **Step 2: Gửi hóa đơn & thông tin đơn hàng về email và số điện thoại** thông qua hàng đợi `EmailOutbox`.
- [ ] **Step 3: Cập nhật giao diện Checkout**: Loại bỏ rào cản bắt buộc login, cho phép khách điền thông tin và đặt hàng ngay.

#### Task 6: Tùy Chọn Xuất Hóa Đơn VAT Cho Doanh Nghiệp / Thợ Thầu
**Files:**
- Modify: `d:\ProjectZ\FLOF\prisma\schema.prisma`
- Modify: `d:\ProjectZ\FLOF\src\components\features\checkout\CheckoutForm.tsx`
- Modify: `d:\ProjectZ\FLOF\src\services\checkout.service.ts`

- [ ] **Step 1: Bổ sung trường VAT vào schema và service checkout.**
- [ ] **Step 2: Cập nhật form Checkout** với checkbox: "Yêu cầu xuất hóa đơn VAT (Công ty/Doanh nghiệp)" kèm validation Mã số thuế (10 hoặc 14 ký tự).

#### Task 7: Tự Động Sinh Mã VietQR Động Cho Chuyển Khoản Ngân Hàng
**Files:**
- Create: `d:\ProjectZ\FLOF\src\lib\vietqr.ts`
- Modify: `d:\ProjectZ\FLOF\src\components\features\checkout\CheckoutSuccess.tsx`
- Modify: `d:\ProjectZ\FLOF\src\lib\email\email-templates.ts`

- [ ] **Step 1: Tạo helper `generateVietQrUrl`** chuẩn Napas: `https://img.vietqr.io/image/<BANK>-<ACC>-compact2.png?amount=<TOTAL>&addInfo=<ORDER_NUMBER>`
- [ ] **Step 2: Hiển thị mã VietQR trên trang thành công và trong email xác nhận đơn.**

#### Task 8: Khách Hàng Tự Hủy Đơn Hàng PENDING
**Files:**
- Modify: `d:\ProjectZ\FLOF\src\app\api\orders\[id]\route.ts`
- Modify: `d:\ProjectZ\FLOF\src\components\features\profile\tabs\OrderHistoryTab.tsx`

- [ ] **Step 1: Kiểm tra API cho phép chủ sở hữu đơn hàng hủy đơn khi trạng thái là `PENDING`.**
- [ ] **Step 2: Bổ sung nút "Hủy đơn" trên UI OrderHistoryTab** kèm modal xác nhận và tự động cập nhật danh sách đơn.

---

### Phase 3: Logistics Hàng Nặng, Media, SEO & SKU Variant (P1-P2)

#### Task 9: Bảng Biểu Phí Vận Chuyển Tham Khảo Hàng Nặng (GHTK, GHN, Viettel Post)
**Files:**
- Create: `d:\ProjectZ\FLOF\src\lib\logistics-calculator.ts`
- Modify: `d:\ProjectZ\FLOF\src\lib\commerce\commerce.ts`
- Modify: `d:\ProjectZ\FLOF\src\components\features\checkout\CheckoutOrderSummary.tsx`

- [ ] **Step 1: Tạo bảng biểu tính cước ước tính dựa trên khối lượng/thể tích sơn** cho 3 hãng (GHTK, GHN, Viettel Post) chia theo vùng (Nội thành, Ngoại thành, Liên tỉnh).
- [ ] **Step 2: Hiển thị mức phí ước tính minh bạch** và cho phép cắm API thật của 3 đơn vị vận chuyển này trong tương lai.

#### Task 10: Direct Signed Upload lên Cloudinary (Vượt Trần 4.5MB Vercel)
**Files:**
- Create: `d:\ProjectZ\FLOF\src\app\api\admin\media\sign\route.ts`
- Modify: `d:\ProjectZ\FLOF\src\app\admin\images\page.tsx`

- [ ] **Step 1: Tạo API ký chữ ký upload Cloudinary (HMAC SHA-1).**
- [ ] **Step 2: Cập nhật giao diện upload ảnh Admin** để đẩy file trực tiếp lên Cloudinary API, không qua Next.js serverless body.

#### Task 11: Dynamic Sitemap Bổ Sung Toàn Bộ Mã Màu Sơn
**Files:**
- Modify: `d:\ProjectZ\FLOF\src\app\sitemap.ts`

- [ ] **Step 1: Thêm query nạp tất cả `PaintColor` vào `sitemap.ts`** với URL `/colors/[code]` để kéo SEO từ khóa màu sơn.

#### Task 12: Thiết Kế Mô Hình SKU Variant (Dung Tích x Màu x Tồn Kho)
**Files:**
- Modify: `d:\ProjectZ\FLOF\prisma\schema.prisma`
- Document: `docs/architecture/sku-variant-design.md`

- [ ] **Step 1: Thiết kế migration bổ sung model `PaintVariant` (volume, colorId, sku, barcode, price, stock) với tính năng tương thích ngược (fallback về Paint hiện tại nếu chưa có variant).**
