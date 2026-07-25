# API Catalog — Maison de FLOF

Ngày cập nhật: 26/07/2026
Nguồn chuẩn: 52 file `src/app/api/**/route.ts`, 99 operation (42 GET, 27 POST, 18 PATCH, 12 DELETE)

## Quy ước quyền

- **Public:** không yêu cầu session; vẫn đi qua general rate limit của middleware. Hai public write route quote/chat có policy riêng 5 request/phút để giới hạn abuse.
- **User:** `requireUser()` hoặc session authenticated.
- **Staff:** ADMIN hoặc STAFF.
- **Admin:** chỉ ADMIN hoặc permission chỉ ADMIN có.
- **Cron:** Bearer `CRON_SECRET`.
- **VNPay callback:** tích hợp giả lập, được người dùng loại khỏi phạm vi production/remediation; không dùng làm bằng chứng sẵn sàng thanh toán thật.
- **Pagination chuẩn:** `page >= 1`, `1 <= limit <= 100`; input sai trả `400`.
- **Authentication status:** thiếu session trả `401`; có session nhưng thiếu role/permission trả `403`.
- **Admin mutation:** tất cả route mutation hiện gọi audit helper; dữ liệu audit đi qua sanitizer loại password/token/secret/credential.
- **Admin policy inventory:** `src/lib/admin/admin-api-policy.ts` khai báo đủ 59 method thực tế; `tests/admin-api-policy.test.ts` đối chiếu route tree, guard, audit decision và role-permission matrix.
- **Error contract:** critical route trả envelope `{ error: { code, message, details? }, requestId }`; client parser vẫn đọc được legacy payload trong giai đoạn chuyển đổi.
- **OpenAPI:** `docs/openapi.yaml` (OpenAPI 3.1) bao phủ đủ 99/99 operation. `scripts/api-route-inventory.ts` phát hiện cả function export và Auth.js destructured export; validator đối chiếu source ↔ contract hai chiều, kiểm tra `operationId`, response, security và schema dùng chung.

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
| GET | `/api/vnpay/ipn` | VNPay giả lập | query VNPay | Demo callback; ngoài phạm vi production-readiness |
| GET | `/api/vnpay/return` | VNPay giả lập/browser | query VNPay | Demo return/redirect; ngoài phạm vi production-readiness |

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

### Bằng chứng Admin API

- `tests/admin-api-policy.test.ts`: đủ 59/59 method, không trùng, đúng `requireStaff`/`requireAdmin`/`requirePermission`.
- `tests/integration/admin-catalog.integration.test.ts`: category lifecycle, product/color-link transaction, inventory import ban đầu, duplicate SKU/slug, soft deactivate và linked-color delete guard.
- `tests/integration/customer-workflows.integration.test.ts`: verified review/upsert/staff reply-delete, quote notify/status, authenticated conversation reopen/scope/reply/read.
- `e2e/admin-api-http.spec.ts`: session Auth.js thật qua HTTP cho category create/duplicate/update/deactivate + audit, CUSTOMER bị chặn 403, review chưa mua bị chặn, quote public → ADMIN update và customer ↔ ADMIN chat/reply/read.
- `e2e/admin-catalog-api-http.spec.ts`: lifecycle HTTP + Prisma cho supplier, collection, color, product và promotion, gồm audit và role denial.
- `e2e/admin-operations-api-http.spec.ts`: dashboard đối chiếu aggregate Prisma; inventory import; transfer confirm/refund chống lặp; user/role/self-demotion; notification ownership; media guard không cần gọi Cloudinary.
- Cloudinary media dùng phân loại `provider-contract`; chưa được coi là live integration khi không có credential/provider evidence.

### Bằng chứng Public/Customer API

- `e2e/public-catalog-api-http.spec.ts`: public catalog, product detail, suppliers, colors, collections, dealers và blog list/detail được đối chiếu trực tiếp với Prisma.
- `e2e/profile-api-http.spec.ts`: profile, password, address, favorite color/product và ownership giữa hai customer.
- `e2e/bank-transfer-review.spec.ts`: checkout chuyển khoản, admin xác nhận payment và verified-purchase review qua browser/API/database.
- `e2e/public-write-abuse.spec.ts`: quote/chat bị giới hạn bởi public-write policy; unit test kiểm tra đúng policy và failure mode.
- `tests/integration/commerce-concurrency.integration.test.ts`: idempotency, stock và coupon race trên PostgreSQL.
- `e2e/load-gate.spec.ts`: bốn scenario bounded/non-mutating; p95 local lần xác minh gần nhất lần lượt 68/21/18/15 ms, không có status ngoài dự kiến hoặc 5xx.

## Cron API

| Method | Path | Quyền | Side effect |
|---|---|---|---|
| GET | `/api/cron/expire-unpaid-orders` | Bearer CRON_SECRET | Hủy order VNPay quá hạn, hoàn kho/coupon, ghi history |
| GET | `/api/cron/process-outbox` | Bearer CRON_SECRET | Gửi tối đa 10 email; chỉ đánh dấu SENT khi provider thành công, nếu lỗi chuyển FAILED/retry |

## Contract và security gaps

1. VNPay là mô phỏng ngoài phạm vi; không được dùng callback hiện tại với merchant production.
2. OpenAPI đã bao phủ 99/99 operation nhưng chưa có versioning/generated client; các operation `provider` và `simulated` không phải bằng chứng live integration.
3. Critical path đã dùng error envelope thống nhất; các route còn lại vẫn có payload legacy hoặc redirect dù đã có inventory contract.
4. Nhiều list admin chưa có cursor/pagination; có hard cap 100/200 hoặc trả toàn bộ.
5. Audit decision bao phủ đủ 59 admin method; catalog/review/quote/chat service mới đặt mutation và audit trong transaction, nhưng chưa chứng minh tính atomic ở mọi mutation cũ.
6. Register, reset-password, auth middleware, ownership, checkout, public catalog/profile và admin catalog/operations đã có direct HTTP evidence; Google OAuth và external provider live vẫn chưa xác minh.
7. Cron dùng GET cho side effect; nên cân nhắc POST và bổ sung lease chống concurrent worker/replay.
