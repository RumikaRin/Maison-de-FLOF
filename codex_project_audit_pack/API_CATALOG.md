# API Catalog — Maison de FLOF

Ngày cập nhật: 24/07/2026
Nguồn chuẩn: 52 file `src/app/api/**/route.ts`

## Quy ước quyền

- **Public:** không yêu cầu session; vẫn đi qua general rate limit của middleware.
- **User:** `requireUser()` hoặc session authenticated.
- **Staff:** ADMIN hoặc STAFF.
- **Admin:** chỉ ADMIN hoặc permission chỉ ADMIN có.
- **Cron:** Bearer `CRON_SECRET`.
- **VNPay callback:** public callback, phải xác minh checksum; hiện có lỗi Critical vì chưa dùng `isVerified`.
- **Pagination chuẩn:** `page >= 1`, `1 <= limit <= 100`; input sai trả `400`.
- **Authentication status:** thiếu session trả `401`; có session nhưng thiếu role/permission trả `403`.
- **Admin mutation:** tất cả route mutation hiện gọi audit helper; dữ liệu audit đi qua sanitizer loại password/token/secret/credential.

## Public/Auth API

| Method | Path | Quyền | Input chính | Chức năng / dữ liệu |
|---|---|---|---|---|
| GET/POST | `/api/auth/[...nextauth]` | Public/Auth.js | Auth.js protocol | Login/logout/callback/session |
| POST | `/api/auth/register` | Public | name, email, password | Tạo User + Customer role CUSTOMER |
| POST | `/api/auth/forgot-password` | Public | email | Tạo VerificationToken hash và gửi email |
| POST | `/api/auth/reset-password` | Public | email, token, password | Consume token, cập nhật bcrypt password |
| GET | `/api/products` | Public | page?, limit? | Danh sách Paint; cache 5 phút |
| GET | `/api/products/[slug]` | Public | slug path | Chi tiết Paint, colors/reviews/related |
| GET | `/api/categories` | Public | none | Danh mục active |
| GET | `/api/suppliers` | Public | none | Nhà cung cấp active |
| GET | `/api/colors` | Public | page?, limit? | Mã màu và collection |
| GET | `/api/color-collections` | Public | none | Bộ sưu tập active |
| GET | `/api/dealers` | Public | page?, limit? | Đại lý active |
| GET | `/api/blog` | Public | page?, limit? | Bài viết active |
| GET | `/api/blog/[slug]` | Public | slug path | Chi tiết bài viết |
| GET | `/api/reviews` | Public | paintId | Reviews công khai |
| POST | `/api/quote-request` | Public | contact/project/message | Tạo QuoteRequest + staff notification |
| POST | `/api/chat` | Public | fullName/contact/message/pageUrl | Tạo ChatMessage legacy |
| POST | `/api/coupons/validate` | Public | code, subtotal | Validate coupon và trả discount |
| GET | `/api/vnpay/ipn` | VNPay callback | query VNPay | Xác nhận payment/order; **Critical: thiếu isVerified** |
| GET | `/api/vnpay/return` | VNPay callback/browser | query VNPay | Xác nhận payment rồi redirect success; **Critical: thiếu isVerified** |

## Customer/User API

| Method | Path | Quyền | Input chính | Chức năng / ownership |
|---|---|---|---|---|
| GET | `/api/profile` | User | none | Đọc profile user hiện tại |
| PATCH | `/api/profile` | User | name, phone | Sửa profile hiện tại |
| POST | `/api/profile/password` | User | current/new password | Đổi mật khẩu |
| GET | `/api/profile/addresses` | User | none | Liệt kê address theo userId |
| POST | `/api/profile/addresses` | User | address fields | Tạo address/default trong transaction |
| PATCH | `/api/profile/addresses` | User | id + address fields | Sửa address có ownership |
| DELETE | `/api/profile/addresses?id=` | User | id query | Xóa address có ownership, bảo vệ order link |
| GET | `/api/profile/favorites` | User | none | Màu yêu thích |
| POST | `/api/profile/favorites` | User | color code | Toggle màu yêu thích |
| GET | `/api/profile/favorite-products` | User | none | Sản phẩm yêu thích |
| POST | `/api/profile/favorite-products` | User | paintId | Toggle sản phẩm yêu thích |
| GET | `/api/orders` | User/Staff | email? cho staff | User chỉ thấy order của mình; staff thấy tất cả/filter |
| POST | `/api/orders` | User | checkout body + Idempotency-Key | Checkout transaction, stock, coupon, payment |
| GET | `/api/orders/[orderNumber]` | User/Staff | orderNumber | Ownership filter cho customer |
| PATCH | `/api/orders/[orderNumber]` | `ORDER_UPDATE` | status | Chuyển trạng thái, payment/stock/audit |
| POST | `/api/reviews` | User | paintId, rating, comment | Upsert review nếu có order completed |
| GET | `/api/chat/conversation` | User | none | Hội thoại và messages của user |
| POST | `/api/chat/conversation` | User | content | Tạo/reopen conversation và message |

## Admin/Staff API

| Method | Path | Quyền | Input chính | Chức năng |
|---|---|---|---|---|
| GET | `/api/admin/dashboard` | Staff | none | KPI/order/revenue/stock summary |
| GET/POST/PATCH/DELETE | `/api/admin/products` | Read Staff; mutate `CATALOG_MANAGE` | Product schema/id | CRUD Paint |
| PATCH | `/api/admin/products/promotions` | `PROMOTION_MANAGE` | paintIds, discount | Cập nhật promotion |
| GET/POST/PATCH/DELETE | `/api/admin/categories` | Read Staff; mutate `CATALOG_MANAGE` | Category schema/id | CRUD Category |
| GET/POST/PATCH/DELETE | `/api/admin/suppliers` | Read Staff; mutate `CATALOG_MANAGE` | Supplier schema/id | CRUD Supplier |
| GET/POST/PATCH/DELETE | `/api/admin/colors` | Read Staff; mutate `CATALOG_MANAGE` | Color schema/id | CRUD PaintColor |
| GET/POST/PATCH/DELETE | `/api/admin/collections` | Read Staff; mutate `CATALOG_MANAGE` | Collection schema/id | CRUD ColorCollection |
| GET/POST/PATCH/DELETE | `/api/admin/dealers` | Read Staff; mutate `CATALOG_MANAGE` | Dealer schema/id | CRUD Dealer |
| GET/POST/PATCH/DELETE | `/api/admin/coupons` | Read Staff; mutate `COUPON_MANAGE` | Coupon schema/id | CRUD Coupon + audit |
| GET | `/api/admin/inventory` | Staff | none | 100 inventory logs + paints |
| POST | `/api/admin/inventory` | `INVENTORY_IMPORT` | paintId, quantity, reason | Nhập kho transaction + audit |
| GET | `/api/admin/payments` | `ORDER_READ` | none | 200 payment gần nhất |
| PATCH | `/api/admin/payments` | `PAYMENT_CONFIRM` | paymentId, transactionCode, action | Confirm/refund TRANSFER + audit |
| GET/PATCH | `/api/admin/quotes` | Staff | id/status/adminNote | Đọc/xử lý QuoteRequest |
| GET/PATCH/DELETE | `/api/admin/reviews` | Staff | id/reply | Quản lý Review |
| GET/PATCH | `/api/admin/chat` | Staff | id/status/adminNote | Quản lý ChatMessage legacy |
| GET | `/api/admin/chat/conversations` | Staff | none | Danh sách Conversation |
| POST | `/api/admin/chat/conversations` | Staff | conversationId, content | Staff reply Message |
| GET | `/api/admin/chat/conversations/[id]` | Staff | id path | Chi tiết và mark-read |
| GET/POST/PATCH/DELETE | `/api/admin/articles` | Read Staff; mutate `CATALOG_MANAGE` | Blog schema/id | CRUD Blog |
| GET | `/api/admin/media` | Staff | none | Liệt kê Cloudinary media |
| POST | `/api/admin/media` | Staff | upload data | Upload Cloudinary |
| DELETE | `/api/admin/media?publicId=` | `MEDIA_DELETE` | publicId | Xóa Cloudinary asset |
| GET/POST/PATCH/DELETE | `/api/admin/users` | Admin | user/role/id | CRUD User và role |
| GET | `/api/admin/audit-logs` | Admin | entityType?, entityId? | 200 audit log gần nhất |
| GET | `/api/admin/notifications` | Staff | type?, limit? | Notifications của user hiện tại |
| PATCH | `/api/admin/notifications/[id]/read` | Staff | id path | Mark one read có ownership |
| POST | `/api/admin/notifications/mark-all-read` | Staff | none | Mark all của user hiện tại |

## Cron API

| Method | Path | Quyền | Side effect |
|---|---|---|---|
| GET | `/api/cron/expire-unpaid-orders` | Bearer CRON_SECRET | Hủy order VNPay quá hạn, hoàn kho/coupon, ghi history |
| GET | `/api/cron/process-outbox` | Bearer CRON_SECRET | Gửi tối đa 10 email; chỉ đánh dấu SENT khi provider thành công, nếu lỗi chuyển FAILED/retry |

## Contract và security gaps

1. VNPay IPN/return không kiểm tra `isVerified`; xem `AUDIT_REPORT.md` C-01.
2. Không có OpenAPI/versioning/generated client.
3. Error shape chưa thống nhất hoàn toàn (`error`, `details`, mảng rỗng fallback, redirect).
4. Nhiều list admin chưa có cursor/pagination; có hard cap 100/200 hoặc trả toàn bộ.
5. Audit call đã bao phủ source của admin mutation nhưng chưa có integration test chứng minh ghi log atomically ở mọi nhánh.
6. Không có integration test xác minh guard/ownership/transaction cho catalog này.
7. Cron dùng GET cho side effect; nên cân nhắc POST và bổ sung lease chống concurrent worker/replay.
