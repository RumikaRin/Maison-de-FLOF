# Data Dictionary — Maison de FLOF

Ngày cập nhật: 24/07/2026
Nguồn chuẩn: `prisma/schema.prisma` và `prisma/migrations/*/migration.sql`

## Tổng quan

- Database: PostgreSQL, schema `public`.
- ORM: Prisma 6.
- Khóa chính: tất cả model nghiệp vụ dùng `String @id @default(cuid())`, ngoại trừ `VerificationToken` dùng composite key.
- Schema hiện có: **32 model**, **11 enum**, **7 migration đã áp dụng**.
- `npx prisma validate`: pass.
- `prisma migrate status`: database schema up to date.
- Neon production: 17/17 CHECK constraint từ migration invariant đã installed + validated; hậu kiểm có 0 row vi phạm.
- ERD chuẩn theo source hiện tại: `docs/erd.md`; `public/erd_diagram.png` chỉ là artifact lịch sử.
- Mọi payload ghi `AuditLog` đi qua sanitizer trung tâm để loại key nhạy cảm; coverage source đã bao phủ các admin mutation.
- `EmailOutbox` chỉ chuyển `SENT` sau khi provider trả thành công; lỗi cấu hình/provider đi vào trạng thái retry/`FAILED`.

## Enums

| Enum | Giá trị | Ý nghĩa |
|---|---|---|
| RoleType | CUSTOMER, STAFF, ADMIN | Vai trò người dùng |
| OrderStatus | PENDING, CONFIRMED, PROCESSING, SHIPPING, COMPLETED, CANCELLED | Vòng đời đơn |
| InventoryType | IMPORT, EXPORT, ADJUSTMENT, AUDIT | Loại giao dịch kho |
| CouponType | PERCENTAGE, FIXED | Cách tính giảm giá |
| NotificationType | ORDER, STOCK, QUOTE, REVIEW, SYSTEM | Loại thông báo |
| PaintFinish | MATTE, EGGSHELL, SATIN, SEMI_GLOSS, GLOSS | Độ bóng |
| PaintType | INTERIOR, EXTERIOR, PRIMER, WATERPROOF, WOOD_METAL, SPECIAL | Nhóm sơn |
| QuoteStatus | PENDING, CONTACTED, QUOTED, CLOSED | Trạng thái báo giá |
| ChatStatus | NEW, IN_PROGRESS, RESOLVED, CLOSED | Trạng thái hỗ trợ |
| PaymentStatus | PENDING, PAID, FAILED, CANCELLED, REFUNDED | Trạng thái payment |
| SurfaceType | CONCRETE, PLASTER, DRYWALL, WOOD, METAL, ROOF, FLOOR, OTHER | Bề mặt |

## Models

| Model | Khóa/field chính | Quan hệ | Constraint/index | Mục đích |
|---|---|---|---|---|
| Role | `id`, `name`, `type` | 1-N User | `type` unique | Danh mục vai trò |
| User | `id`, `email`, `password?`, `name?`, `phone?`, `roleId` | Role; Customer; Address; Review; Account; Session; Blog; Notification; Conversation | email unique; index roleId | Tài khoản đăng nhập |
| Account | provider/account/token fields | N-1 User | unique provider+providerAccountId; index userId; cascade | OAuth account Auth.js |
| Session | `sessionToken`, `expires`, `userId` | N-1 User | token unique; index userId; cascade | Auth.js DB session compatibility; app dùng JWT |
| VerificationToken | `identifier`, `token`, `expires` | Không FK | token unique; composite PK/unique | Token verification/password reset hash |
| Customer | `userId`, `totalSpent`, `customerType`, company/tax | 1-1 User; Orders; Wishlists; Quotes | userId unique; cascade | Hồ sơ khách mua |
| Address | shipping fields, `isDefault`, `userId` | N-1 User; 1-N Order | index userId; cascade | Sổ địa chỉ |
| Category | name/slug/parentId/sort/isActive | self tree; 1-N Paint | slug unique; index parentId | Cây danh mục |
| Supplier | name/slug/contact/isActive | Paint; Dealer | slug unique | Nhà cung cấp |
| PaintColor | code/name/hex/rgb/hsl/NCS/RAL/family flags | ColorCollection; PaintColorLink; WishlistColor | code unique; indexes family/collection | Mã màu |
| ColorCollection | name/slug/year/isActive | 1-N PaintColor | slug unique | Bộ sưu tập màu |
| Paint | sku/name/slug/type/finish/volume/price/cost/discount/stock/minStock/images | Category; Supplier; Colors; OrderItem; Review; Wishlist; InventoryTransaction | sku/slug unique; indexes category/supplier/type/active+featured | Sản phẩm sơn và tồn kho |
| PaintColorLink | `paintId`, `colorId` | N-1 Paint, N-1 PaintColor | unique pair; indexes FKs; cascade | M-N sơn–màu |
| Dealer | contact/address/province/district/lat/lng/active | Supplier | indexes province/active/supplier | Đại lý phân phối |
| QuoteRequest | contact/project/area/message/status/adminNote | Customer optional | indexes status/customer | Yêu cầu báo giá |
| ChatMessage | guest contact/message/page/status/adminNote | Không relation | indexes status/createdAt | Luồng chat/form legacy cho guest |
| Order | number/status/totals/coupon/paymentMethod/shipping snapshot | Customer; Address; Coupon; Items; History; Payment; Idempotency | number unique; indexes customer/status/date/address/coupon | Đơn hàng |
| Payment | orderId/method/status/amount/transaction/refund metadata | 1-1 Order | orderId, transactionCode, refundCode unique; indexes status/date; cascade | Thanh toán/đối soát |
| CheckoutIdempotency | key/userId/requestHash/orderId | Order optional | key unique; orderId unique; indexes user/date | Chống tạo đơn trùng |
| OrderItem | orderId/paintId/colorId?/snapshot/quantity/price/total | Order; Paint | indexes order/paint; order cascade | Chi tiết đơn và snapshot sản phẩm |
| OrderStatusHistory | previous/new/status actor/note/date | Order | indexes order/date; cascade | Lịch sử trạng thái |
| Coupon | code/type/value/min/max/date/usage | Orders | code unique | Mã giảm giá |
| Review | paintId/userId/rating/comment/adminReply | Paint; User | unique paint+user; indexes | Đánh giá đã mua |
| Wishlist | customerId/paintId/date | Customer; Paint | unique pair; indexes; cascade | Sản phẩm yêu thích |
| WishlistColor | customerId/colorId/date | Customer; PaintColor | unique pair; indexes; cascade | Màu yêu thích |
| Notification | userId/type/title/message/isRead/date | User | index userId; cascade | Thông báo cá nhân admin/staff |
| Blog | title/slug/summary/content/image/author/isActive | User author | slug unique; index author | Bài viết song ngữ |
| InventoryTransaction | paintId/type/quantity/reason/referenceId/date | Paint | index paint; cascade | Sổ giao dịch kho |
| AuditLog | actorId/email/action/entity/id/before/after/date | Không FK | indexes actor/entity/date | Nhật ký quản trị |
| EmailOutbox | type/payload/status/error/retry/nextRetry/date | Không FK | index status+nextRetry | Hàng đợi email |
| Conversation | userId/status/date | User; Messages | userId unique; index status; cascade | Hội thoại authenticated |
| Message | conversationId/senderId/isAdmin/content/isRead/date | Conversation | indexes conversation/date; conversation cascade | Tin nhắn hội thoại |

## Invariant và ownership từ application

| Invariant | Enforcement hiện tại | Bằng chứng |
|---|---|---|
| Mỗi user có một email | DB unique | `User.email @unique` |
| Mỗi product review/user là duy nhất | DB composite unique | `Review @@unique([paintId,userId])` + migration `unique_product_reviews` |
| Stock không âm khi checkout | Conditional update trong transaction | `checkout.service.ts` dùng `stock: { gte: quantity }` |
| Checkout không replay khác payload/user | DB unique + request hash/user check | `CheckoutIdempotency` + `processCheckout` |
| Một payment cho một order | DB unique | `Payment.orderId @unique` |
| Customer chỉ đọc order của mình | API ownership filter | `orders/[orderNumber]/route.ts` |
| Customer chỉ sửa address của mình | API `id + userId` filter | profile addresses route |
| Chỉ người mua đơn completed được review | API query Order/Item | reviews route |
| Coupon usage không vượt limit khi checkout | Conditional update trong transaction | checkout service |
| Stock, giá, số lượng, total, payment, coupon, rating và inventory hợp lệ | DB CHECK constraint | migration `20260724150000_add_data_invariant_checks`; 17/17 validated |

## Khoảng trống dữ liệu

1. `AuditLog.actorId` không có FK; cần ghi rõ retention/immutability policy.
2. `InventoryTransaction.referenceId` không có FK/type discriminator.
3. `ChatMessage` và `Conversation/Message` là hai mô hình chat song song, làm reporting và retention phức tạp.
4. Không có model consent/privacy/retention cho PII trong user, address, quote, chat và audit.
5. Không có bằng chứng backup restore/PITR, masking non-production hoặc data retention job.
6. ERD trong `public/erd_diagram.png` không khớp dictionary này; dùng `docs/erd.md` làm nguồn tài liệu hiện tại.

## Migration catalog

| Migration | Thay đổi chính |
|---|---|
| `20260609000000_baseline` | Baseline role/user/catalog/order/review/wishlist/blog/inventory |
| `20260609150000_add_paint_discount` | Thêm discountPercent |
| `20260609170000_order_snapshots_and_history` | Shipping/product snapshot và order status history |
| `20260610010000_unique_product_reviews` | Unique review theo paint+user |
| `20260610040000_add_chat_messages` | ChatMessage và indexes |
| `20260611180000_payment_idempotency_audit` | Payment, idempotency, audit, outbox và constraint liên quan |
| `20260724150000_add_data_invariant_checks` | CHECK constraint additive cho catalog, order, payment, coupon, review và inventory; **đã áp dụng, 17/17 validated** |
