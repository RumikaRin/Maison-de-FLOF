# Maison de FLOF — Hệ thống Phân phối & Tư vấn Sơn Nước Cao Cấp

[English](./README.en.md) | **Tiếng Việt**


Maison de FLOF (FLOF Paint Platform) là một nền tảng thương mại điện tử kết hợp tư vấn phối màu sơn nước hiện đại, được xây dựng dựa trên Next.js 15, React 19, TailwindCSS, Prisma và cơ sở dữ liệu PostgreSQL (Neon DB). 

Dự án cung cấp trải nghiệm số hóa toàn diện từ việc xem sản phẩm, phối màu trực quan trên không gian mẫu (Color Visualizer), tìm kiếm đại lý phân phối gần nhất (Find Dealer), thanh toán trực tuyến qua VNPay cho đến hệ thống quản trị hành chính (Admin Dashboard) mạnh mẽ.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

### Frontend
- **Framework**: Next.js 15.5.21 (App Router) & React 19.
- **Styling**: TailwindCSS & Tailwind Animate.
- **Hiệu ứng & Animation**: Framer Motion (Page Transitions, Smooth Entrance Animations).
- **Quản lý trạng thái (State Management)**: Zustand (giỏ hàng, ngôn ngữ).
- **Truy vấn dữ liệu**: `@tanstack/react-query` (React Query).
- **Xử lý Form**: React Hook Form kết hợp validation bằng Zod.
- **Bản đồ**: MapLibre GL (`maplibre-gl`) định vị đại lý.
- **Biểu đồ (Charts)**: Chart.js & React-Chartjs-2.
- **Thông báo toast**: Sonner.
- **Icons**: Lucide React & Radix Icons.
- **Chế độ sáng/tối (Theme)**: `next-themes`.
- **Typography**: Noto Sans, Playfair Display (Google Fonts) & Bromise (Local Font).
- **Tiện ích UI**: Radix UI Primitives (Dropdown Menu, Slot), class-variance-authority, clsx, tailwind-merge.

### Backend & Database
- **Cơ sở dữ liệu**: PostgreSQL (được lưu trữ trên Neon Serverless Database).
- **ORM**: Prisma Client v6.
- **Xác thực người dùng**: NextAuth.js v5 (Beta 32) tích hợp Prisma Adapter.
- **Gửi Email**: Resend SDK (hệ thống Email Outbox hàng đợi & retry).
- **Lưu trữ hình ảnh**: Cloudinary.
- **Thanh toán trực tuyến**: VNPay SDK.
- **Mã hóa mật khẩu**: bcryptjs.
- **Xử lý ngày giờ**: date-fns.
- **SEO**: robots.ts & sitemap.ts tự động sinh.

### Testing & CI
- **Unit tests**: Node.js built-in test runner (`node --test`).
- **Linting**: ESLint 9 + eslint-config-next.
- **Type-checking**: TypeScript strict mode.
- **Pipeline check**: `npm run check` = lint → typecheck → test → build.

---

## ✨ Tính Năng Nổi Bật

### 1. Trải Nghiệm Khách Hàng (B2C Client Portal)
- **Trang chủ (Homepage)**: Thiết kế hiện đại mang phong cách "Glassmorphism" sang trọng, tích hợp hiệu ứng di chuyển mượt mà và giới thiệu bộ sưu tập màu sắc xu hướng 2026.
- **Danh mục sản phẩm (Products)**: Tìm kiếm, lọc sản phẩm theo 6 danh mục (sơn nội thất, ngoại thất, sơn lót, chống thấm, gỗ & kim loại, đặc biệt) và theo độ bóng màng sơn (Matte, Eggshell, Satin, Semi-Gloss, Gloss).
- **Bộ phối màu thông minh (Color Visualizer)**: 
  - Xem trực quan các màu sơn trên 4 không gian phòng mẫu: Phòng khách (Living Room), Phòng ngủ (Bedroom), Phòng bếp (Kitchen), Mặt tiền (Facade).
  - Thay đổi màu sơn tức thì, lưu màu yêu thích.
  - **Lưu thiết kế phối màu** vào tài khoản (đặt tên, mở lại, xoá) — bảng màu được gắn với phòng mẫu và tồn tại qua nhiều phiên/thiết bị.
  - Gửi biểu mẫu đăng ký tư vấn phối màu tại nhà/đại lý.
- **Tìm kiếm đại lý (Find Dealer)**: Tìm kiếm các cửa hàng phân phối ủy quyền theo Tỉnh/Thành phố và Quận/Huyện, hiển thị trực quan bằng bản đồ tương tác sử dụng MapLibre GL.
- **Giỏ hàng & Thanh toán (Cart & Checkout)**: Giỏ hàng Zustand lưu cục bộ cho khách vãng lai và **đồng bộ đa thiết bị** khi đăng nhập (hợp nhất union giỏ khách với giỏ server, cộng dồn số lượng, tự loại sản phẩm đã gỡ bán); áp dụng mã giảm giá, đặt hàng trực tuyến với hình thức COD hoặc thanh toán qua cổng VNPay (với cơ chế idempotency chống trùng đơn).
- **Hồ sơ cá nhân (Profile)**: Quản lý thông tin, lịch sử đơn hàng, xem trạng thái đơn hàng và lưu danh sách màu sơn/sản phẩm yêu thích.
- **Đánh giá sản phẩm (Reviews)**: Khách hàng đánh giá & bình luận sản phẩm đã mua.
- **Blog & Tin tức**: Xem các bài viết về mẹo phối màu, xu hướng thiết kế nội thất.
- **Yêu cầu báo giá (Quote Request)**: Gửi yêu cầu báo giá công trình lớn/dự án.
- **Đăng ký nhận tin (Newsletter)**: Form ở footer lưu subscriber vào DB (`NewsletterSubscriber`) qua `POST /api/newsletter`, chống trùng (idempotent theo email) và có rate-limit riêng. Mỗi bản ghi sinh sẵn `unsubscribeToken` để làm nền cho link hủy đăng ký một chạm — endpoint tiêu thụ token này **chưa được dựng** (xem mục Hạng mục chưa hoàn thiện).
- **Trang pháp lý (Legal)**: Chính sách bảo mật, Điều khoản dịch vụ, Chính sách cookie (`/privacy-policy`, `/terms-of-service`, `/cookie-policy`).
- **Liên kết mạng xã hội**: Facebook/Instagram/YouTube/Zalo ở footer, cấu hình qua biến `NEXT_PUBLIC_SOCIAL_*` (ẩn khi để trống).
- **Chat trực tuyến (Chat Bubble)**: Widget chat hỗ trợ khách hàng tích hợp trên mọi trang.
- **Đa ngôn ngữ (i18n)**: Hỗ trợ chuyển đổi Tiếng Việt / English.

### Quy ước URL ngôn ngữ và trạng thái giỏ hàng

- Giao diện công khai dùng tiền tố ngôn ngữ chuẩn: `/vi/...` và `/en/...`; URL không có tiền tố được chuyển hướng theo cookie, mặc định là Tiếng Việt.
- API, callback xác thực, asset tĩnh, `robots.txt` và `sitemap.xml` không dùng tiền tố ngôn ngữ.
- Nút đổi ngôn ngữ giữ nguyên trang hiện tại, đồng bộ URL, cookie, thuộc tính `html[lang]` và Zustand store.
- Giỏ hàng của khách vãng lai được lưu cục bộ (Zustand + LocalStorage). Khi đăng nhập, `CartSync` **hợp nhất** giỏ cục bộ với giỏ server (`CartItem`) theo phép union — cộng dồn số lượng cùng `(paint, colorCode)`, giữ mọi món của cả hai bên, tự loại sản phẩm đã gỡ bán — rồi đẩy mọi thay đổi lên server (debounce). Đăng xuất thì giữ nguyên giỏ cục bộ. Endpoint: `GET/PUT /api/cart`, `POST /api/cart/merge`.

### 2. Hệ Thống Quản Trị (Admin Portal)
Đường dẫn truy cập: `/admin` (Yêu cầu tài khoản có quyền ADMIN hoặc STAFF)
- **Trang tổng quan (Dashboard)**: Thống kê doanh thu, số lượng đơn hàng, số lượng khách hàng, số lượng sơn đã bán, mức tồn kho cảnh báo dưới hạn mức (minStock), biểu đồ doanh thu theo thời gian sử dụng Chart.js.
- **Quản lý đơn hàng (Orders)**: Cập nhật trạng thái đơn hàng (PENDING → CONFIRMED → PROCESSING → SHIPPING → COMPLETED / CANCELLED), lịch sử thay đổi trạng thái (OrderStatusHistory).
- **Quản lý hóa đơn (Invoices)**: Xem và xuất hóa đơn cho các đơn hàng.
- **Quản lý thanh toán (Payments)**: Theo dõi trạng thái thanh toán VNPay (PENDING, PAID, FAILED, CANCELLED, REFUNDED).
- **Quản lý yêu cầu tư vấn & báo giá (Quotes)**: Danh sách khách hàng gửi yêu cầu phối màu và báo giá công trình, cập nhật trạng thái (PENDING → CONTACTED → QUOTED → CLOSED).
- **Quản lý danh mục (Catalog)**: Quản lý cây danh mục sản phẩm (Category Tree) với parent/children.
- **Quản lý sản phẩm sơn (Paints)**: CRUD các dòng sơn, SKU, giá bán, giá vốn, số lượng tồn kho, hình ảnh, liên kết nhà cung cấp (Supplier), khuyến mãi (discountPercent).
- **Quản lý màu sắc (Colors)**: Quản lý mã màu, tên màu tiếng Anh/tiếng Việt, hệ màu HEX, RGB, HSL, NCS, RAL, bộ sưu tập màu, tone family & color family.
- **Quản lý bộ sưu tập màu (Collections)**: Tạo và quản lý các bộ sưu tập màu theo năm (Color Collection).
- **Quản lý đại lý (Dealers)**: Quản lý vị trí địa lý (Kinh độ/Vĩ độ), thông tin liên hệ và nhà cung cấp liên kết.
- **Quản lý mã giảm giá (Coupons)**: Thiết lập mã giảm giá theo tỷ lệ phần trăm (%) hoặc giá trị cố định, giới hạn chi tiêu tối thiểu/tối đa, số lần sử dụng, ngày bắt đầu và kết thúc.
- **Quản lý tài khoản (Accounts)**: Quản lý người dùng, phân quyền (ADMIN / STAFF / CUSTOMER).
- **Quản lý bài viết (Articles/Blog)**: CRUD bài viết blog đa ngôn ngữ (VI/EN).
- **Quản lý đánh giá (Reviews)**: Xem và phản hồi (adminReply) đánh giá sản phẩm của khách hàng.
- **Quản lý nhập kho (Import)**: Nhập hàng và quản lý giao dịch kho (InventoryTransaction: IMPORT, EXPORT, ADJUSTMENT, AUDIT).
- **Quản lý hình ảnh (Images)**: Quản lý thư viện ảnh Cloudinary.
- **Chat hỗ trợ (Chat)**: Xem và phản hồi tin nhắn từ khách hàng (Conversation / Message model).
- **Thông báo realtime (Notifications)**: Hệ thống thông báo cho admin (đơn hàng mới, tồn kho thấp, yêu cầu báo giá, đánh giá mới).
- **Nhật ký hoạt động (Audit Log)**: Ghi nhận mọi hành động quản trị (actor, action, entityType, beforeData/afterData).

---

## 📂 Cấu Trúc Thư Mục Dự Án

```text
├── prisma/                  # Cấu hình Database Schema & file Seeding dữ liệu
│   ├── migrations/          # Prisma migration files (version-controlled)
│   ├── schema.prisma        # Prisma Database Models (30+ models)
│   └── seed.ts              # Dữ liệu mẫu (roles, users, suppliers, colors, paints, dealers)
├── public/                  # File tĩnh (logo, hình ảnh phối màu trực quan)
├── reports/                 # Báo cáo đồ án & doanh nghiệp (DOCX, PDF)
├── tests/                   # Unit tests (commerce, security)
├── tools/                   # Script công cụ hỗ trợ (generate reports)
├── src/
│   ├── app/                 # Next.js App Router Pages
│   │   ├── admin/           # Quản trị hệ thống (15 modules)
│   │   │   ├── accounts/    # Quản lý tài khoản & phân quyền
│   │   │   ├── articles/    # Quản lý bài viết blog
│   │   │   ├── catalog/     # Quản lý cây danh mục sản phẩm
│   │   │   ├── chat/        # Chat hỗ trợ khách hàng
│   │   │   ├── collections/ # Quản lý bộ sưu tập màu sắc
│   │   │   ├── colors/      # Quản lý mã màu
│   │   │   ├── coupons/     # Quản lý mã giảm giá
│   │   │   ├── dealers/     # Quản lý đại lý phân phối
│   │   │   ├── images/      # Quản lý thư viện ảnh Cloudinary
│   │   │   ├── import/      # Quản lý nhập kho
│   │   │   ├── invoices/    # Quản lý hóa đơn
│   │   │   ├── orders/      # Quản lý đơn hàng
│   │   │   ├── paints/      # Quản lý sản phẩm sơn
│   │   │   ├── quotes/      # Quản lý yêu cầu báo giá
│   │   │   └── reviews/     # Quản lý đánh giá sản phẩm
│   │   ├── api/             # API Routes (67 route handlers)
│   │   │   ├── admin/       # Admin API (CRUD resources)
│   │   │   ├── auth/        # NextAuth.js authentication
│   │   │   ├── blog/        # Blog API
│   │   │   ├── categories/  # Danh mục API
│   │   │   ├── chat/        # Chat API
│   │   │   ├── colors/      # Màu sắc & bộ sưu tập API
│   │   │   ├── coupons/     # Mã giảm giá API
│   │   │   ├── cron/        # Cron jobs (email outbox, cleanup)
│   │   │   ├── dealers/     # Đại lý API
│   │   │   ├── orders/      # Đơn hàng API
│   │   │   ├── products/    # Sản phẩm API
│   │   │   ├── profile/     # Hồ sơ cá nhân API
│   │   │   ├── quote-request/ # Yêu cầu báo giá API
│   │   │   ├── reviews/     # Đánh giá API
│   │   │   ├── suppliers/   # Nhà cung cấp API
│   │   │   └── vnpay/       # Cổng thanh toán VNPay
│   │   ├── blog/            # Tin tức & mẹo phối màu
│   │   ├── cart/            # Giỏ hàng
│   │   ├── checkout/        # Thanh toán đơn hàng (+ trang success)
│   │   ├── color-visualizer/ # Phối màu phòng mẫu trực quan B2C
│   │   ├── colors/          # Xem danh sách mã màu và bộ sưu tập màu sắc
│   │   ├── find-dealer/     # Định vị đại lý bản đồ
│   │   ├── login/           # Đăng nhập
│   │   ├── register/        # Đăng ký tài khoản
│   │   ├── products/        # Danh sách & chi tiết sản phẩm ([slug])
│   │   ├── profile/         # Hồ sơ cá nhân & lịch sử đơn hàng
│   │   ├── quote-request/   # Yêu cầu báo giá công trình
│   │   ├── fonts/           # Local fonts (Bromise)
│   │   ├── globals.css      # Cấu hình thiết kế CSS & Tailwind toàn cục
│   │   ├── layout.tsx       # Root Layout (Providers, Header, Footer)
│   │   ├── loading.tsx      # Global loading state
│   │   ├── robots.ts        # SEO robots.txt generator
│   │   ├── sitemap.ts       # SEO sitemap.xml generator
│   │   └── page.tsx         # Trang chủ Maison de FLOF
│   ├── components/          # Các components React tái sử dụng
│   │   ├── admin/           # Admin-specific components (Notifications, Invoice Modal)
│   │   ├── features/        # Feature components theo domain
│   │   │   ├── admin/       # Admin feature components (paints promo modal, ...)
│   │   │   ├── blog/        # Blog components
│   │   │   ├── checkout/    # Checkout components
│   │   │   ├── home/        # Trang chủ components
│   │   │   ├── product/     # Product components
│   │   │   └── profile/     # Profile components
│   │   ├── layout/          # Header, Footer, ChatBubble, GlobalNavigationLoader, SiteLoadingScreen
│   │   ├── maps/            # Dealer Map & Location Preview Map (MapLibre GL)
│   │   └── ui/              # UI primitives (Button, Input, Label, Switch, Tooltip, Modal, ...)
│   ├── lib/                 # Hàm tiện ích & business logic
│   │   ├── constants/       # Hằng số ứng dụng (home-data.ts)
│   │   ├── api-auth.ts      # API authentication helpers
│   │   ├── audit.ts         # Audit log utilities
│   │   ├── color-utils.ts   # Color conversion & manipulation utilities
│   │   ├── commerce.ts      # Business logic thương mại (tính giá, discount)
│   │   ├── db.ts            # Prisma client khởi tạo duy nhất
│   │   ├── dictionary.ts    # Hỗ trợ đa ngôn ngữ VI/EN
│   │   ├── email.ts         # Email sending utilities (Resend)
│   │   ├── idempotency.ts   # Checkout idempotency logic
│   │   ├── mock-data.ts     # Dữ liệu mẫu cho Color Visualizer
│   │   ├── order-validation.ts # Order validation rules
│   │   ├── permissions.ts   # Authorization & permission checks
│   │   ├── rate-limit.ts    # Rate limiting (throttle API)
│   │   ├── rate-limiter.ts  # Rate limiter implementation
│   │   ├── utils.ts         # General utility functions (cn, ...)
│   │   └── vnpay.ts         # VNPay payment gateway config
│   ├── services/            # Business service layer
│   │   ├── checkout.service.ts  # Checkout orchestration
│   │   ├── payment.service.ts   # Payment processing
│   │   └── vnpay.service.ts     # VNPay integration service
│   ├── providers/           # React Context Providers
│   │   ├── query-provider.tsx   # TanStack React Query
│   │   ├── session-provider.tsx # NextAuth.js Session
│   │   └── theme-provider.tsx   # next-themes (Light/Dark mode)
│   ├── store/               # Zustand global state
│   │   ├── cart-store.ts    # Giỏ hàng (persist LocalStorage + đồng bộ server qua CartSync)
│   │   └── language-store.ts # Chuyển đổi ngôn ngữ VI/EN
│   ├── types/               # TypeScript type definitions
│   │   ├── index.ts         # Shared types & interfaces
│   │   └── next-auth.d.ts   # NextAuth.js type augmentation
│   ├── auth.ts              # NextAuth.js configuration
│   ├── auth.config.ts       # Auth config (credentials, callbacks)
│   └── middleware.ts        # Next.js middleware (auth guard, RBAC)
├── .env.example             # File mẫu định dạng biến môi trường
├── eslint.config.mjs        # ESLint 9 flat config
├── next.config.ts           # Next.js config (security headers, CSP, image domains)
├── postcss.config.js        # PostCSS config
├── prisma.config.ts         # Prisma config
├── tailwind.config.ts       # TailwindCSS config (custom design system)
├── package.json             # Danh sách thư viện và scripts chạy dự án
└── tsconfig.json            # Cấu hình TypeScript
```

---

## ⚙️ Hướng Dẫn Cài Đặt & Chạy Dự Án

### Bước 1: Clone dự án về máy
```bash
git clone https://github.com/Manh-TH28-31/Maison-de-FLOF.git
cd Maison-de-FLOF
```

### Bước 2: Cài đặt các thư viện phụ thuộc
```bash
npm install
```

### Bước 3: Cấu hình biến môi trường (Environment Variables)
Tạo file `.env` ở thư mục gốc của dự án và sao chép cấu hình từ file `.env.example`:
```bash
cp .env.example .env
```
Điền đầy đủ thông tin cấu hình vào file `.env`:
```env
# Kết nối PostgreSQL (ví dụ từ Neon DB)
DATABASE_URL="postgresql://user:password@host.neon.tech/sonvn?sslmode=require"

# Cấu hình Auth.js (Bảo mật phiên đăng nhập)
# Tạo secret: openssl rand -base64 32
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"

# Cấu hình Cloudinary (Lưu trữ ảnh tải lên)
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

# Cấu hình gửi mail qua Resend
RESEND_API_KEY="re_your_api_key"
EMAIL_FROM="Maison de FLOF <noreply@your-domain.com>"

# Cấu hình ứng dụng
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Maison de FLOF"
NEXT_PUBLIC_HERO_IMAGE="https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069"
NEXT_PUBLIC_MESSENGER_URL="https://m.me/maisondeflof"
```

### Bước 4: Chạy migration và seed dữ liệu local/staging
Hệ thống dùng Prisma migration để Neon và source code luôn cùng phiên bản. Không dùng `prisma db push` trên production.
```bash
# Áp dụng migration đã được kiểm soát
npm run db:migrate

# Chỉ seed trên local/staging
npm run db:seed
```

### Bước 5: Chạy dự án ở môi trường phát triển (Development Mode)
```bash
npm run dev
```
Mở trình duyệt truy cập vào [http://localhost:3000](http://localhost:3000) để trải nghiệm nền tảng.

### Kiểm tra chất lượng trước khi deploy
```bash
npm run check
npm run db:status
```

Trên Vercel, cấu hình đầy đủ `DATABASE_URL`, `AUTH_SECRET`, Cloudinary và Resend. Chạy `npm run db:migrate` trong quy trình phát hành trước khi chuyển traffic sang bản mới.

Tài liệu vận hành và dữ liệu:

- `docs/deployment-runbook.md`: checklist release, migration, cron, smoke test, rollback và monitoring.
- `docs/erd.md`: ERD hiện tại sinh theo 38 model trong Prisma schema.

---

## 📜 Scripts Có Sẵn

| Script | Lệnh | Mô tả |
| :--- | :--- | :--- |
| Dev server | `npm run dev` | Chạy Next.js development server |
| Build | `npm run build` | Build production bundle |
| Start | `npm run start` | Chạy production server |
| Lint | `npm run lint` | Kiểm tra linting với ESLint |
| Typecheck | `npm run typecheck` | Kiểm tra TypeScript types |
| Test | `npm run test` | Chạy unit tests |
| Full check | `npm run check` | lint → typecheck → test → build |
| DB migrate | `npm run db:migrate` | Áp dụng Prisma migrations |
| DB generate | `npm run db:generate` | Sinh Prisma Client |
| DB status | `npm run db:status` | Kiểm tra trạng thái migration |
| DB seed | `npm run db:seed` | Seed dữ liệu mẫu |

---

## 🔐 Tài Khoản Đăng Nhập Mẫu (Seeded Users)

Sau khi chạy lệnh `seed` thành công, bạn có thể đăng nhập bằng các tài khoản sau:

| Vai trò (Role) | Email đăng nhập | Mật khẩu (Password) | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (ADMIN)** | `admin@sonvn.com` | `admin123` | Toàn quyền cấu hình sản phẩm, đại lý, xem doanh số và xử lý đơn hàng. |
| **Nhân viên (STAFF)** | `staff@sonvn.com` | `staff123` | Xem đơn hàng, quản lý sản phẩm và xử lý thông tin yêu cầu tư vấn phối màu. |
| **Khách hàng (CUSTOMER)** | `customer1@sonvn.com` | `customer123` | Đặt mua sản phẩm, gửi yêu cầu báo giá dự án, quản lý giỏ hàng & lịch sử đơn hàng. |

> **Nếu không đăng nhập được, kiểm tra hai điều sau:**
>
> 1. **Chạy lại `npm run db:seed`.** Các bản seed cũ tạo tài khoản mà không đặt
>    `emailVerified`, và ADMIN / STAFF bị chặn đăng nhập khi email chưa xác minh.
>    Lệnh seed hiện đã đóng dấu xác minh cho cả ba tài khoản trên, kể cả khi
>    tài khoản đã tồn tại từ trước.
>
>    Muốn xem chính xác vì sao một tài khoản không đăng nhập được:
>    ```bash
>    npm run check:account -- admin@sonvn.com admin123
>    ```
>    Nếu chỉ muốn vá đúng một tài khoản mà không seed lại toàn bộ catalog:
>    ```bash
>    npm run check:account -- admin@sonvn.com --fix
>    ```
> 2. **Nếu đang chạy bản production build** (`npm run build && npm run start`):
>    rate limiter chuyển sang chế độ *fail-closed*, nên khi thiếu
>    `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` thì **mọi** request
>    đăng nhập trả về `503 SERVICE_UNAVAILABLE` trước khi kiểm tra mật khẩu.
>    Đây là hành vi bảo mật có chủ đích. Khi phát triển cục bộ hãy dùng
>    `npm run dev` (rate limiter dùng bộ nhớ trong), hoặc cấu hình Upstash.
>
> Lưu ý về xác minh email: khách hàng **không bắt buộc** xác minh — đăng ký xong
> là đăng nhập được luôn, và có thể xác minh sau tại *Hồ sơ → Xác minh email*.
> Riêng ADMIN / STAFF thì bắt buộc phải có email đã xác minh.

---

## 🔒 Bảo Mật (Security)

- **Security Headers**: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, HSTS, Content-Security-Policy (CSP).
- **Middleware Auth Guard**: Bảo vệ routes admin, profile và API bằng NextAuth.js middleware với RBAC.
- **Rate Limiting**: Giới hạn tần suất request trên các API endpoint nhạy cảm.
- **Idempotency**: Chống tạo đơn hàng trùng lặp khi checkout.
- **Audit Logging**: Ghi nhận đầy đủ hành động quản trị (ai làm gì, lúc nào, dữ liệu trước/sau).
- **Password Hashing**: bcryptjs với salt rounds = 12.
- **Production Seed Guard**: Chặn seed trên production trừ khi có biến `ALLOW_PRODUCTION_SEED=true`.

---

## 🚧 Hạng Mục Chưa Hoàn Thiện (Known Gaps)

Cập nhật 26/07/2026. Toàn bộ luồng mua–bán, thanh toán, quản trị đã chạy và có test; các mục dưới đây là phần *mở rộng* còn để ngỏ, không chặn phát hành:

1. **Hoàn tiền tự động qua cổng thanh toán.** Hành động REFUND trong Admin → Payments hiện là **ghi sổ thủ công** — đổi trạng thái `REFUNDED` và lưu `refundCode` / `refundedBy` / `refundedAt`, nhưng **không gọi API hoàn tiền** của VNPay (`vnp_Command=refund`) hay ngân hàng. Nhân viên phải hoàn tiền ngoài hệ thống rồi nhập mã đối soát. Cần tự động hóa nếu muốn hoàn tiền một chạm.
2. **Endpoint hủy đăng ký newsletter.** `NewsletterSubscriber.unsubscribeToken` đã được sinh và lưu, nhưng chưa có route (ví dụ `GET /api/newsletter/unsubscribe?token=...`) để người dùng tự hủy. Hiện chỉ hủy được bằng thao tác thủ công trên DB.
3. **Connection pooling cho `DATABASE_URL`.** Chưa cấu hình `connection_limit` / pgbouncer. Với Prisma trên môi trường serverless, khi tải cao có thể chạm trần kết nối của Postgres. Nên thêm tham số pool (hoặc dùng Neon pooled endpoint) trước khi mở lưu lượng lớn.

Mọi mutation "nóng" (trừ/cộng tồn kho, dùng coupon, hủy/thanh toán đơn) đều dùng cập nhật có điều kiện atomic (`updateMany` với guard trạng thái), nên **không oversell và không sập khi nhiều người thao tác đồng thời** — xem `docs/superpowers/plans/2026-07-26-flof-backend-audit.md`.

---
