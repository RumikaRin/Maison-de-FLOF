# Maison de FLOF

[English](./README.en.md) | **Tiếng Việt**

Maison de FLOF là hệ thống thương mại điện tử và tư vấn phối màu sơn nước cao cấp, xây dựng trên Next.js 15 (App Router), React 19, Tailwind CSS, Prisma ORM và PostgreSQL (Neon).

Dự án cung cấp luồng mua sắm trực tuyến toàn diện: xem bảng màu, thử màu trực tiếp trên phòng mẫu (Visualizer), tìm đại lý gần nhất qua bản đồ, thanh toán cổng VNPay và trang quản trị Admin.

---

## Kiến trúc & Công nghệ

### Core Stack
- **Frontend**: Next.js 15.5 (App Router), React 19, Tailwind CSS 3.4, Framer Motion
- **State & Data**: Zustand (Client UI/Cart state), React Query (Server cache)
- **Backend**: Next.js Route Handlers, Service Layer Pattern, Zod Validation
- **Database & ORM**: PostgreSQL (Neon Serverless DB), Prisma 6.0 với 36 Models & 17 CHECK Constraints
- **Authentication**: Auth.js v5 (NextAuth beta.32) + DB Session Registry, Admin TOTP MFA
- **Security**: Content Security Policy với dynamic per-request Nonce, Upstash Redis Rate Limiting (fail-closed), VNPay HMAC-SHA512 verification
- **Storage & Email**: Vercel Blob (`@vercel/blob`), Resend SDK với Transactional Outbox pattern
- **Maps & Charts**: MapLibre GL, Chart.js

---

## Tính năng chính

### Giao diện Khách hàng (Storefront)
- **Bảng màu & Tìm kiếm**: Lọc mã màu theo nhóm màu, tông màu, hệ màu NCS/RAL và bề mặt thi công.
- **Phối màu phòng mẫu (Visualizer)**: Thử màu sơn theo thời gian thực trên 4 không gian phòng mẫu (Phòng khách, Phòng ngủ, Bếp, Mặt tiền) dùng chế độ hòa trộn CSS (`multiply` / `soft-light`). Lưu phối màu cá nhân vào tài khoản.
- **Bản đồ đại lý (Find Dealer)**: Định vị đại lý phân phối theo Tỉnh/Thành phố và Quận/Huyện dùng MapLibre GL.
- **Giỏ hàng & Thanh toán**: Giỏ hàng Zustand lưu local và tự động hợp nhất (union merge) với giỏ server khi đăng nhập. Hỗ trợ đặt hàng COD và thanh toán online VNPay (có idempotency key chống trùng đơn).
- **Hồ sơ & Đánh giá**: Theo dõi đơn hàng, quản lý danh sách yêu thích, đánh giá sản phẩm và quản lý bảo mật tài khoản (MFA/Đổi mật khẩu/Export dữ liệu).

### Trang Quản trị (Admin Portal)
- Truy cập tại `/admin` (Yêu cầu role `ADMIN` hoặc `STAFF`).
- **Dashboard**: Thống kê doanh thu, số đơn, cảnh báo tồn kho thấp và biểu đồ doanh thu.
- **Quản lý Catalog**: CRUD dòng sơn, SKU, bảng màu, bộ sưu tập theo năm, cây danh mục (Category Tree).
- **Đơn hàng & Thanh toán**: Cập nhật trạng thái đơn (PENDING → COMPLETED/CANCELLED), quản lý lịch sử chuyển trạng thái và soát lỗi thanh toán.
- **Kho & Nhập hàng**: Theo dõi biến động tồn kho (InventoryTransaction: IMPORT, EXPORT, ADJUSTMENT).
- **Media & Bài viết**: Quản lý thư viện ảnh Vercel Blob và viết bài chuẩn SEO đa ngôn ngữ.
- **Audit Log**: Ghi vết mọi thao tác quản trị kèm cơ chế tự động xóa dữ liệu nhạy cảm (sanitization).

---

## Cấu trúc thư mục

```text
.
├── prisma/                  # Schema DB, CHECK constraints & data seed
├── public/                  # Asset tĩnh & ảnh phòng mẫu
├── src/
│   ├── app/                 # Next.js App Router (pages, layout, API routes)
│   │   ├── admin/           # Trang quản trị admin
│   │   ├── api/             # API Route Handlers (115 operations)
│   │   ├── color-visualizer/# Công cụ phối màu phòng mẫu
│   │   ├── colors/          # Bảng màu tương tác
│   │   └── find-dealer/     # Bản đồ định vị đại lý
│   ├── components/          # React components (admin, features, layout, ui)
│   ├── lib/                 # Service utilities (auth, csp, rate-limit, storage)
│   ├── services/            # Domain service layer (checkout, order, privacy, mfa)
│   ├── store/               # Zustand stores (cart, language, theme)
│   └── middleware.ts        # Edge middleware (nonce CSP, rate limit, i18n, auth guard)
├── tests/                   # 200 unit tests & 24 DB integration tests
└── docs/                    # Tài liệu OpenAPI 3.1 & ERD
```

---

## Cài đặt & Khởi chạy

### Yêu cầu môi trường
- Node.js >= 24
- PostgreSQL 16+ hoặc Neon Database

### Các bước cài đặt

1. **Clone repository và cài dependencies**:
   ```bash
   git clone https://github.com/RumikaRin/Maison-de-FLOF.git
   cd Maison-de-FLOF
   npm install
   ```

2. **Cấu hình môi trường**:
   ```bash
   cp .env.example .env.local
   ```
   Cập nhật các chuỗi kết nối trong `.env.local`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/flof_dev"
   AUTH_SECRET="your-32-character-secret-key"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

3. **Chạy Migration & Seed Data**:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Chạy ứng dụng ở môi trường phát triển**:
   ```bash
   npm run dev
   ```
   Ứng dụng chạy tại: `http://localhost:3000`

---

## Kiểm thử & Quality Gates

Dự án tích hợp bộ kiểm thử đa tầng:

```bash
# Kiểm tra ESLint & TypeScript
npm run lint
npm run typecheck

# Chạy 200 Unit Tests (Node.js test runner)
npm test

# Chạy 24 PostgreSQL Integration Tests
npm run test:integration

# Build Production & Kiểm tra kích thước bundle
npm run build
npm run test:bundle

# Kiểm tra coverage OpenAPI 3.1
npm run test:openapi

# Chạy Playwright E2E Tests
npm run test:e2e

# Lệnh kiểm tra tổng hợp trước khi commit
npm run check
```

---

## Tài khoản thử nghiệm (Demo Accounts)

Sau khi chạy `npm run db:seed`:

- **Admin**: `admin@flof.vn` / `Admin@123456` *(Yêu cầu nhập mã TOTP MFA nếu bật)*
- **Staff**: `staff@flof.vn` / `Staff@123456`
- **Customer**: `customer@flof.vn` / `Customer@123456`

---

## Giấy phép

Phát hành theo giấy phép [MIT License](LICENSE).
