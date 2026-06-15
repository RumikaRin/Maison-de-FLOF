# Maison de FLOF — Hệ thống Phân phối & Tư vấn Sơn Nước Cao Cấp

[English](./README.en.md) | **Tiếng Việt**


Maison de FLOF (FLOF Paint Platform) là một nền tảng thương mại điện tử kết hợp tư vấn phối màu sơn nước hiện đại, được xây dựng dựa trên Next.js 15, React 19, TailwindCSS, Prisma và cơ sở dữ liệu PostgreSQL (Neon DB). 

Dự án cung cấp trải nghiệm số hóa toàn diện từ việc xem sản phẩm, phối màu trực quan trên không gian mẫu (Color Visualizer), tính toán lượng sơn cần thiết (Paint Calculator), tìm kiếm đại lý phân phối gần nhất (Find Dealer) cho đến hệ thống quản trị hành chính (Admin Dashboard) mạnh mẽ.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

### Frontend
- **Framework**: Next.js 15.1 (App Router) & React 19.
- **Styling**: TailwindCSS & Tailwind Animate.
- **Hiệu ứng & Animation**: Framer Motion (Page Transitions, Smooth Entrance Animations).
- **Quản lý trạng thái (State Management)**: Zustand.
- **Truy vấn dữ liệu**: `@tanstack/react-query` (React Query).
- **Xử lý Form**: React Hook Form kết hợp validation bằng Zod.
- **Bản đồ**: MapLibre GL (`maplibre-gl`) định vị đại lý.
- **Biểu đồ (Charts)**: Chart.js & React-Chartjs-2.
- **Thông báo toast**: Sonner.

### Backend & Database
- **Cơ sở dữ liệu**: PostgreSQL (được lưu trữ trên Neon Serverless Database).
- **ORM**: Prisma Client v6.
- **Xác thực người dùng**: NextAuth.js v5 (Beta 25) tích hợp Prisma Adapter.
- **Gửi Email**: Resend SDK.
- **Lưu trữ hình ảnh**: Cloudinary.

---

## ✨ Tính Năng Nổi Bật

### 1. Trải Nghiệm Khách Hàng (B2C Client Portal)
- **Trang chủ (Homepage)**: Thiết kế hiện đại mang phong cách "Glassmorphism" sang trọng, tích hợp hiệu ứng di chuyển mượt mà và giới thiệu bộ sưu tập màu sắc xu hướng 2026.
- **Danh mục sản phẩm (Products)**: Tìm kiếm, lọc sản phẩm theo danh mục (sơn lót, nội thất, ngoại thất, chống thấm) và theo độ bóng màng sơn (Matte, Satin, Gloss, Semi-Gloss).
- **Bộ phối màu thông minh (Color Visualizer)**: 
  - Xem trực quan các màu sơn trên 4 không gian phòng mẫu: Phòng khách (Living Room), Phòng ngủ (Bedroom), Phòng bếp (Kitchen), Mặt tiền (Facade).
  - Thay đổi màu sơn tức thì, lưu màu yêu thích.
  - Gửi biểu mẫu đăng ký tư vấn phối màu tại nhà/đại lý.
- **Tìm kiếm đại lý (Find Dealer)**: Tìm kiếm các cửa hàng phân phối ủy quyền theo Tỉnh/Thành phố và Quận/Huyện, hiển thị trực quan bằng bản đồ tương tác sử dụng MapLibre GL.
- **Giỏ hàng & Thanh toán (Cart & Checkout)**: Quản lý giỏ hàng cục bộ thông qua Zustand, áp dụng mã giảm giá, và đặt hàng trực tuyến với hình thức nhận hàng thanh toán (COD).
- **Hồ sơ cá nhân (Profile)**: Quản lý thông tin, lịch sử đơn hàng, xem trạng thái đơn hàng và lưu danh sách màu sơn/sản phẩm yêu thích.

### 2. Hệ Thống Quản Trị (Admin Portal)
Đường dẫn truy cập: `/admin` (Yêu cầu tài khoản có quyền ADMIN hoặc STAFF)
- **Trang tổng quan (Dashboard)**: Thống kê doanh thu, số lượng đơn hàng, số lượng khách hàng, số lượng sơn đã bán, mức tồn kho cảnh báo dưới hạn mức (minStock), biểu đồ doanh thu theo thời gian sử dụng Chart.js.
- **Quản lý đơn hàng (Orders)**: Cập nhật trạng thái đơn hàng (PENDING, CONFIRMED, PROCESSING, SHIPPING, COMPLETED, CANCELLED).
- **Quản lý tư vấn phối màu**: Danh sách khách hàng gửi yêu cầu phối màu từ trang Color Visualizer, cập nhật trạng thái liên hệ.
- **Quản lý danh mục & sản phẩm (Categories & Paints)**: CRUD (Thêm, Sửa, Xóa) các dòng sơn, SKU, giá bán, giá vốn, số lượng tồn kho, hình ảnh.
- **Quản lý màu sắc (Colors)**: Quản lý mã màu, tên màu tiếng Anh/tiếng Việt, hệ màu HEX, RGB, bộ sưu tập màu.
- **Quản lý đại lý (Dealers)**: Quản lý vị trí địa lý (Kinh độ/Vĩ độ) và thông tin liên hệ của các đại lý ủy quyền.
- **Quản lý mã giảm giá (Coupons)**: Thiết lập mã giảm giá theo tỷ lệ phần trăm (%) hoặc giá trị cố định, giới hạn chi tiêu tối thiểu, ngày bắt đầu và kết thúc.

---

## 📂 Cấu Trúc Thư Mục Dự Án

```text
├── prisma/               # Cấu hình Database Schema & file Seeding dữ liệu
│   ├── schema.prisma     # Prisma Database Models
│   └── seed.ts           # Dữ liệu mẫu (roles, users, colors, paints, dealers)
├── public/               # File tĩnh (logo, hình ảnh phối màu trực quan)
├── src/
│   ├── app/              # Next.js App Router Pages
│   │   ├── admin/        # Quản trị hệ thống (Dashboard, Quản lý đơn hàng, v.v.)
│   │   ├── blog/         # Tin tức & mẹo phối màu
│   │   ├── cart/         # Giỏ hàng
│   │   ├── checkout/     # Thanh toán đơn hàng
│   │   ├── color-visualizer/ # Phối màu phòng mẫu trực quan B2C
│   │   ├── colors/       # Xem danh sách mã màu và bộ sưu tập màu sắc
│   │   ├── find-dealer/  # Định vị đại lý bản đồ
│   │   ├── paint-calculator/ # Công cụ tính lượng sơn cần thiết
│   │   ├── quote-request/# Yêu cầu báo giá công trình
│   │   ├── globals.css   # Cấu hình thiết kế CSS & Tailwind toàn cục
│   │   └── page.tsx      # Trang chủ Maison de FLOF
│   ├── components/       # Các components React tái sử dụng
│   │   ├── layout/       # Header, Footer, AdminSidebar
│   │   └── ui/           # Các nút bấm, bản đồ, form, modal (Shadcn style)
│   ├── lib/              # Hàm tiện ích (từ điển dịch thuật, kết nối prisma)
│   │   ├── dictionary.ts # Hỗ trợ đa ngôn ngữ VI/EN
│   │   └── prisma.ts     # Client khởi tạo Prisma duy nhất
│   ├── providers/        # React-Query và Auth Providers
│   └── store/            # Zustand global state (cart, wishlist)
├── .env.example          # File mẫu định dạng biến môi trường
├── package.json          # Danh sách thư viện và scripts chạy dự án
└── tsconfig.json         # Cấu hình TypeScript
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
Điền đầy đủ thông tin cấu hình cơ sở dữ liệu của bạn vào file `.env`:
```env
# Kết nối PostgreSQL (ví dụ từ Neon DB)
DATABASE_URL="postgresql://user:password@ep-host-name.pooler.neon.tech/dbname?sslmode=require"

# Cấu hình NextAuth (Bảo mật phiên đăng nhập)
AUTH_SECRET="your-super-secret-auth-key-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Cấu hình Cloudinary (Lưu trữ ảnh tải lên - Tùy chọn)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Cấu hình gửi mail qua Resend (Gửi thông báo - Tùy chọn)
RESEND_API_KEY="re_yourApiKeyHere"
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

---

## 🔐 Tài Khoản Đăng Nhập Mẫu (Seeded Users)

Sau khi chạy lệnh `seed` thành công, bạn có thể đăng nhập bằng các tài khoản sau:

| Vai trò (Role) | Email đăng nhập | Mật khẩu (Password) | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (ADMIN)** | `admin@sonvn.com` | `admin123` | Toàn quyền cấu hình sản phẩm, đại lý, xem doanh số và xử lý đơn hàng. |
| **Nhân viên (STAFF)** | `staff@sonvn.com` | `staff123` | Xem đơn hàng, quản lý sản phẩm và xử lý thông tin yêu cầu tư vấn phối màu. |
| **Khách hàng (CUSTOMER)** | `customer1@sonvn.com` | `customer123` | Đặt mua sản phẩm, gửi yêu cầu báo giá dự án, quản lý giỏ hàng & lịch sử đơn hàng. |

---
