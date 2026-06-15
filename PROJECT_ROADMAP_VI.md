# Kế hoạch hoàn thiện dự án Maison de FLOF

## 1. Mục tiêu

Xây dựng Maison de FLOF thành nền tảng thương mại điện tử và tư vấn sơn có thể vận hành thực tế, gồm:

- Cổng khách hàng B2C: xem sản phẩm, màu sơn, phối màu, tính lượng sơn, tìm đại lý, đặt hàng, theo dõi đơn và gửi yêu cầu báo giá.
- Cổng quản trị: quản lý danh mục, sản phẩm, màu, đại lý, nội dung, khách hàng, đơn hàng, tồn kho, báo giá, hóa đơn và khuyến mãi.
- Hệ thống backend thống nhất dùng PostgreSQL/Prisma làm nguồn dữ liệu duy nhất.
- Phân quyền rõ ràng cho `CUSTOMER`, `STAFF`, `ADMIN`.
- Có kiểm thử, giám sát, bảo mật và quy trình triển khai production.

## 2. Đánh giá hiện trạng

### 2.1 Phần đã có

- Next.js 15 App Router, React 19, TypeScript strict, TailwindCSS.
- Prisma/PostgreSQL với schema tương đối đầy đủ cho người dùng, sản phẩm, màu, đơn hàng, tồn kho, báo giá, blog và đại lý.
- Auth.js Credentials, đăng ký, đăng nhập và middleware bảo vệ `/admin`, `/profile`.
- Giao diện B2C tương đối hoàn chỉnh: trang chủ, danh sách sản phẩm, màu, giỏ hàng, checkout, hồ sơ, phối màu, tìm đại lý và tính lượng sơn.
- Giao diện quản trị cho dashboard, sản phẩm, màu, đại lý, tài khoản, đơn hàng, hóa đơn, nhập kho và bài viết.
- API đọc dữ liệu cho sản phẩm, màu, đại lý, blog; API một phần cho đơn hàng, yêu thích, đăng ký và báo giá.
- Production build hiện chạy thành công với 35 route.

### 2.2 Khoảng trống cần xử lý

- `localStorage` vẫn là nguồn dữ liệu chính trong 16 file, gồm đơn hàng, tài khoản, sản phẩm, tồn kho, đại lý, địa chỉ và hồ sơ.
- 13 khu vực còn phụ thuộc `mock-data`; trang chi tiết sản phẩm và bài viết vẫn đọc dữ liệu mock.
- Quản trị CRUD hiện chủ yếu chỉ thay đổi state/localStorage, chưa ghi database.
- Checkout báo thành công trước khi API tạo đơn hoàn tất; dữ liệu giá và tổng tiền được tin trực tiếp từ client.
- Tạo đơn chưa kiểm tra tồn kho, chưa trừ kho, chưa tạo giao dịch tồn kho, chưa lưu địa chỉ giao hàng và chưa xử lý coupon thực.
- UI sử dụng `discountPercent` nhưng Prisma model `Paint` chưa có trường tương ứng.
- Quản lý báo giá, quản lý ảnh và trang gửi báo giá đang chỉ chuyển hướng.
- Hồ sơ, đổi mật khẩu và địa chỉ chưa cập nhật database.
- Hóa đơn dựng lại dữ liệu từ chuỗi và localStorage thay vì đọc trực tiếp `OrderItem`.
- Role `STAFF` có trong schema/README nhưng hiện không được cấp quyền vào admin.
- Cloudinary, Resend, React Query, React Hook Form và Zod đã cài nhưng gần như chưa được tích hợp vào nghiệp vụ.
- Rate limit trong memory không đáng tin cậy trên môi trường serverless nhiều instance.
- Chưa có Prisma migration, test tự động, lint hoạt động ổn định, CI/CD, logging tập trung hoặc giám sát lỗi.
- `next.config.ts` chứa đường dẫn tuyệt đối trên máy cá nhân để sao chép asset, gây cảnh báo trên Vercel.
- Một số page quá lớn, ví dụ trang chủ, admin sản phẩm và hồ sơ, làm tăng rủi ro bảo trì.

## 3. Phạm vi bản phát hành production đầu tiên

### 3.1 Bắt buộc

- Danh mục sản phẩm, màu, đại lý và blog lấy hoàn toàn từ database.
- Đăng ký, đăng nhập, hồ sơ, địa chỉ, yêu thích và đổi mật khẩu hoạt động thật.
- Giỏ hàng local chỉ giữ vai trò state tạm; giá, coupon, tồn kho và tổng tiền phải được backend xác nhận.
- Checkout tạo đơn transaction-safe, lưu snapshot địa chỉ, trừ tồn kho và tạo lịch sử trạng thái.
- Admin CRUD thật cho sản phẩm, màu, danh mục, nhà cung cấp, đại lý, bài viết, coupon và tài khoản.
- Admin xử lý đơn hàng, nhập/xuất/điều chỉnh kho, báo giá và hóa đơn từ database.
- Upload ảnh Cloudinary và gửi email qua Resend.
- Phân quyền `CUSTOMER`, `STAFF`, `ADMIN`.
- Test, CI, staging, migration và giám sát lỗi.

### 3.2 Có thể triển khai sau bản đầu

- Thanh toán online tự động đối soát qua cổng thanh toán.
- Phối màu trực tiếp trên ảnh người dùng bằng segmentation/AI.
- Đồng bộ ERP/kế toán/vận chuyển.
- Chương trình thành viên, điểm thưởng và giá riêng cho nhà thầu.
- Ứng dụng mobile native.

## 4. Kiến trúc mục tiêu

### 4.1 Nguyên tắc

- PostgreSQL là nguồn dữ liệu nghiệp vụ duy nhất; không dùng localStorage làm nguồn dữ liệu quản trị hoặc đơn hàng.
- Server tự tính giá, giảm giá, phí vận chuyển và tổng đơn hàng.
- Mọi cập nhật quan trọng phải chạy trong Prisma transaction.
- Route handler dùng Zod để validate input, helper chung để xác thực session và role.
- Public page ưu tiên Server Component để cải thiện SEO và giảm JavaScript phía client.
- React Query dùng cho dữ liệu tương tác và mutation ở client; Zustand chỉ giữ giỏ hàng và trạng thái UI.
- Kiểu dữ liệu dùng Prisma/Zod/shared DTO; không import kiểu nghiệp vụ từ `mock-data`.

### 4.2 Cấu trúc đề xuất

```text
src/
  app/
    api/                 # Route handlers mỏng
  components/
    features/            # Component theo miền nghiệp vụ
  lib/
    auth/                # requireUser, requireRole
    validations/         # Zod schemas
    services/            # Order, inventory, coupon, email services
    repositories/        # Chỉ thêm khi truy vấn bắt đầu phức tạp
    dto/                 # Kiểu response dùng chung
  hooks/                 # React Query hooks
  store/                 # Cart và UI state
```

## 5. Điều chỉnh database bắt buộc

### 5.1 Đơn hàng và thanh toán

- Thêm snapshot vào `Order`: tên người nhận, điện thoại, email, địa chỉ đầy đủ.
- Thêm snapshot vào `OrderItem`: tên sản phẩm, SKU, tên/mã màu, đơn giá tại thời điểm mua.
- Tạo relation đúng cho `OrderItem.colorId` tới `PaintColor`.
- Thêm `OrderStatusHistory` để lưu người cập nhật, trạng thái cũ/mới, ghi chú và thời gian.
- Thêm `Payment` với phương thức, trạng thái, mã giao dịch, số tiền và thời điểm thanh toán.
- Dùng mã đơn duy nhất có cơ chế chống trùng thay vì số ngẫu nhiên 6 chữ số.

### 5.2 Giá và khuyến mãi

- Quyết định một trong hai hướng:
  - MVP: thêm `discountPercent`, `discountStartAt`, `discountEndAt` vào `Paint`.
  - Chuẩn dài hạn: tạo `Promotion` và `PromotionItem`.
- Hoàn thiện `Coupon`: giới hạn theo khách hàng, số lần dùng, trạng thái và lịch sử sử dụng.
- Không nhận tổng tiền hoặc đơn giá cuối cùng từ client.

### 5.3 Kho và vận hành

- Mọi nhập/xuất/điều chỉnh kho phải tạo `InventoryTransaction`.
- Checkout dùng transaction để kiểm tra tồn, tạo đơn, trừ kho và tạo log.
- Cân nhắc thêm `reservedStock` nếu cần giữ hàng cho đơn chưa thanh toán.
- Thêm `AuditLog` cho hành động admin quan trọng.

### 5.4 Nội dung và media

- Thêm `MediaAsset` để quản lý ảnh Cloudinary, alt text, kích thước và người tải lên.
- Bổ sung category/tag/SEO fields cho `Blog`.
- Bổ sung trạng thái duyệt cho `Review` nếu mở đánh giá sản phẩm.
- Bổ sung `assignedTo`, lịch sử liên hệ và thời hạn xử lý cho `QuoteRequest`.

## 6. Danh sách API cần hoàn thiện

### 6.1 Public

- `GET /api/products`, `GET /api/products/[slug]`: filter, search, sort, pagination.
- `GET /api/categories`, `GET /api/suppliers`.
- `GET /api/colors`, `GET /api/colors/[code]`, `GET /api/color-collections`.
- `GET /api/dealers`: lọc tỉnh/quận, tìm gần vị trí.
- `GET /api/blog`, `GET /api/blog/[slug]`.
- `POST /api/quotes`.
- `POST /api/coupons/validate`.

### 6.2 Khách hàng đã đăng nhập

- `GET/PATCH /api/profile`.
- `POST /api/profile/password`.
- CRUD `/api/profile/addresses`.
- CRUD `/api/profile/favorite-products` và `/api/profile/favorite-colors`.
- `GET /api/orders`, `GET /api/orders/[orderNumber]`.
- `POST /api/checkout`: endpoint duy nhất tạo đơn và tính tổng phía server.
- `POST /api/reviews`.

### 6.3 Admin và staff

- `GET /api/admin/dashboard`.
- CRUD `/api/admin/products`, `/categories`, `/suppliers`, `/colors`, `/collections`.
- CRUD `/api/admin/dealers`, `/blogs`, `/coupons`, `/users`.
- `GET/PATCH /api/admin/orders/[id]`.
- `POST /api/admin/inventory/import`, `/export`, `/adjust`.
- `GET/PATCH /api/admin/quotes/[id]`.
- `POST/DELETE /api/admin/media`.
- `GET /api/admin/audit-logs`.

Tất cả API admin phải kiểm tra role ở server. `STAFF` chỉ được cấp các quyền vận hành được định nghĩa; chỉ `ADMIN` được quản lý tài khoản, role và cấu hình nhạy cảm.

## 7. Lộ trình triển khai

Ước lượng cho nhóm 2 lập trình viên full-stack và 1 QA part-time: 8-11 tuần. Nếu chỉ có 1 lập trình viên: khoảng 13-17 tuần.

### Giai đoạn 0 - Chuẩn hóa nền tảng (3-5 ngày)

- Xóa asset copier dùng đường dẫn máy cá nhân; giữ asset trong `public` hoặc Cloudinary.
- Thêm scripts `typecheck`, `lint`, `test`, `test:e2e`, `prisma:migrate`.
- Thiết lập ESLint, Prettier, Husky/lint-staged nếu nhóm cần.
- Tạo Prisma migration đầu tiên và quy trình migration cho staging/production.
- Tạo shared DTO, Zod schema, helper `requireUser`, `requireRole`.
- Chuẩn hóa error response, logging và toast/error state phía client.
- Tách biến môi trường dev/staging/prod; cập nhật README.

**Nghiệm thu:** build, typecheck và lint chạy ổn định; migration có thể tạo database mới từ đầu; không còn đường dẫn tuyệt đối máy cá nhân.

### Giai đoạn 1 - Hợp nhất dữ liệu và API nền (1-1.5 tuần)

- Hoàn thiện thay đổi schema ở mục 5 và migration.
- Xây service cho product, order, inventory, coupon và profile.
- Hoàn thiện API public có pagination/filter.
- Chuyển trang chủ, sản phẩm, chi tiết sản phẩm, màu, chi tiết blog và đại lý sang database.
- Loại bỏ fallback localStorage/mock khỏi luồng production; mock chỉ dùng cho test/story/demo.
- Dùng React Query hooks hoặc Server Components thống nhất.

**Nghiệm thu:** sửa dữ liệu trong database phản ánh đúng trên toàn bộ storefront; refresh hoặc đổi thiết bị không làm mất dữ liệu.

### Giai đoạn 2 - Auth, hồ sơ và phân quyền (1 tuần)

- Mở quyền phù hợp cho `STAFF`; tạo ma trận quyền chi tiết.
- Hoàn thiện cập nhật hồ sơ, đổi mật khẩu, CRUD địa chỉ và yêu thích.
- Xóa cơ chế `sonvn-user` trong localStorage; chỉ dùng Auth.js session.
- Thêm quên mật khẩu, reset mật khẩu và xác minh email qua Resend.
- Thay rate limiter memory bằng Redis/Upstash trên production.
- Chuẩn hóa type extension cho Auth.js để loại bỏ ép kiểu `any`.

**Nghiệm thu:** mọi role chỉ truy cập được đúng chức năng; thay đổi hồ sơ/địa chỉ tồn tại sau khi đăng nhập trên thiết bị khác.

### Giai đoạn 3 - Commerce, checkout và kho (1.5-2 tuần)

- Tạo coupon validation thật; xóa mã giảm giá hard-code trong cart.
- Viết `checkoutService` tính lại giá, giảm giá, phí giao hàng và tồn kho.
- Tạo đơn, order items, snapshot địa chỉ, payment và inventory log trong một transaction.
- Chỉ hiển thị thành công sau khi backend trả về order number.
- Hoàn thiện trạng thái đơn và quy tắc chuyển trạng thái hợp lệ.
- Admin đơn hàng đọc/ghi database; cập nhật trạng thái và hủy đơn có hoàn kho đúng quy tắc.
- Admin nhập kho, điều chỉnh kho và cảnh báo tồn thấp đọc/ghi database.
- Hóa đơn lấy trực tiếp từ Order/OrderItem và có bản in/PDF ổn định.

**Nghiệm thu:** client không thể sửa giá bằng DevTools; không bán vượt tồn; đơn, kho và hóa đơn luôn khớp nhau.

### Giai đoạn 4 - Admin CRUD và nội dung (1.5-2 tuần)

- Chuyển admin dashboard sang số liệu tổng hợp từ database.
- Hoàn thiện CRUD sản phẩm, danh mục, nhà cung cấp, màu, bộ sưu tập và đại lý.
- Hoàn thiện CRUD blog và trang chi tiết blog động.
- Hoàn thiện quản lý tài khoản và role.
- Hoàn thiện trang báo giá: danh sách, lọc, phân công, cập nhật trạng thái và ghi chú.
- Hoàn thiện Cloudinary upload, thư viện media và chọn ảnh trong form.
- Thêm audit log cho các thay đổi quan trọng.

**Nghiệm thu:** không còn trang admin nào ghi localStorage; mọi CRUD có validation, quyền truy cập và trạng thái loading/error.

### Giai đoạn 5 - Trải nghiệm khách hàng và tích hợp (1 tuần)

- Hoàn thiện form báo giá thực thay cho trang chuyển hướng.
- Gửi email xác nhận đăng ký, đơn hàng, thay đổi trạng thái và báo giá.
- Kết nối visualizer với màu/sản phẩm thực; cho phép lưu phối màu.
- Kết nối paint calculator với coverage và quy cách lon sản phẩm thực.
- Hoàn thiện tìm đại lý theo vị trí, fallback khi không cấp quyền location.
- Thêm review sản phẩm và thông báo người dùng nếu nằm trong phạm vi bản đầu.

**Nghiệm thu:** các công cụ tư vấn dẫn được người dùng tới sản phẩm, giỏ hàng hoặc yêu cầu báo giá có dữ liệu thật.

### Giai đoạn 6 - Chất lượng, SEO và production (1-1.5 tuần)

- Tách các page lớn thành feature components và hooks dễ kiểm thử.
- Thêm metadata động, canonical, sitemap, robots, structured data sản phẩm/bài viết.
- Tối ưu ảnh, lazy loading, MapLibre dynamic import và bundle.
- Kiểm tra responsive, keyboard navigation, focus, contrast và screen reader.
- Thực hiện security review: authorization, validation, CSRF/session, secret, upload, injection và abuse.
- Thiết lập CI, preview deployment, staging, production migration và rollback.
- Tích hợp error tracking, uptime monitoring, log và cảnh báo.
- Chạy load test cho catalog, checkout và admin dashboard.

**Nghiệm thu:** toàn bộ quality gate đạt; staging được kiểm thử end-to-end; có runbook triển khai và xử lý sự cố.

## 8. Chiến lược kiểm thử

### 8.1 Unit test

- `paint-calculator`, color utils, format tiền.
- Tính subtotal, coupon, shipping fee, total.
- Quy tắc chuyển trạng thái đơn và hoàn kho.
- Validation schemas và permission helpers.

### 8.2 Integration test

- Đăng ký/đăng nhập/phân quyền.
- CRUD sản phẩm, màu, đại lý, blog và tài khoản.
- Checkout transaction, coupon, tồn kho và hủy đơn.
- Hồ sơ, địa chỉ, yêu thích, báo giá và upload.
- Dùng database test riêng; reset dữ liệu giữa test.

### 8.3 E2E test

- Khách đăng ký -> đăng nhập -> chọn sản phẩm/màu -> giỏ hàng -> checkout -> xem lịch sử.
- Admin đăng nhập -> xử lý đơn -> khách thấy trạng thái mới.
- Admin nhập kho -> storefront phản ánh tồn kho.
- Khách gửi báo giá -> staff xử lý.
- Kiểm tra role CUSTOMER/STAFF/ADMIN không vượt quyền.

### 8.4 Quality gate

- `npm run build`, typecheck, lint, unit/integration/E2E đều thành công.
- Không còn lỗi TypeScript hoặc API input không validate.
- Không còn mock/localStorage làm nguồn dữ liệu production.
- Lighthouse mục tiêu: Performance >= 85, Accessibility >= 90, SEO >= 90 trên các trang chính.

## 9. CI/CD và vận hành

- Pull request: install lockfile -> Prisma generate -> lint -> typecheck -> test -> build.
- Preview deployment cho từng PR; staging dùng database và Cloudinary riêng.
- Production deploy chạy `prisma migrate deploy`, không dùng `prisma db push`.
- Seed chỉ dùng cho local/staging; không ghi đè dữ liệu production.
- Bật backup database, theo dõi lỗi API, lỗi checkout, tồn kho âm và email gửi thất bại.
- Chuẩn bị runbook cho rollback deployment, rollback migration và khôi phục database.
- Không commit secret hoặc tài khoản admin mặc định vào production.

## 10. Thứ tự ưu tiên backlog

### P0 - Chặn phát hành

- Backend tính giá/checkout an toàn.
- Admin ghi database thay vì localStorage.
- Hồ sơ, địa chỉ, đơn hàng và tồn kho hoạt động thật.
- Phân quyền server-side và validation đầy đủ.
- Migration, test luồng chính, CI và staging.
- Loại bỏ đường dẫn asset cục bộ.

### P1 - Cần có cho trải nghiệm hoàn chỉnh

- Báo giá, quản lý ảnh, email, coupon, dashboard thật.
- Blog/product detail động, SEO và tối ưu hiệu năng.
- Staff permissions, audit log và thông báo.

### P2 - Mở rộng sau phát hành

- Thanh toán online, đối soát, vận chuyển.
- Review nâng cao, loyalty, B2B pricing.
- AI visualizer trên ảnh người dùng và tích hợp ERP.

## 11. Tiêu chí dự án được xem là hoàn chỉnh

- Tất cả dữ liệu nghiệp vụ quan trọng được lưu trong PostgreSQL và có migration.
- Storefront, profile và admin sử dụng cùng một nguồn dữ liệu.
- Không thể giả mạo giá, coupon, role, trạng thái đơn hoặc số lượng tồn từ client.
- Mọi chức năng trong menu đều hoạt động thật, không còn redirect placeholder.
- CUSTOMER, STAFF và ADMIN có quyền đúng theo ma trận đã duyệt.
- Checkout, cập nhật đơn, hủy đơn và nhập kho đảm bảo tính nhất quán transaction.
- Có test tự động cho luồng doanh thu và quyền truy cập.
- Có staging, CI/CD, logging, monitoring, backup và runbook production.
- Tài liệu cài đặt, biến môi trường, migration, seed và vận hành được cập nhật.

## 12. Mốc bàn giao đề xuất

| Mốc | Nội dung | Thời gian dự kiến |
|---|---|---:|
| M1 | Nền tảng, migration, API và dữ liệu thống nhất | Cuối tuần 2 |
| M2 | Auth/profile và commerce transaction-safe | Cuối tuần 4 |
| M3 | Admin CRUD, kho, đơn, hóa đơn, báo giá | Cuối tuần 7 |
| M4 | Tích hợp email/media, UX, SEO và test đầy đủ | Cuối tuần 9 |
| M5 | UAT, sửa lỗi, hardening và phát hành production | Tuần 10-11 |

