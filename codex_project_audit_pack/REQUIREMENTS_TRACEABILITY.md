# Requirements Traceability — Maison de FLOF

Ngày cập nhật: 26/07/2026
Nguồn yêu cầu khả dụng: `README.md`, `PROJECT_ROADMAP_VI.md`, source code, Prisma schema và diagram trong `public/`.

> `CODEX_PROJECT_AUDIT_PROMPT.md` không có trong repository tại thời điểm audit. Trạng thái dưới đây phản ánh source thực tế, không coi roadmap cũ là bằng chứng hoàn thành.

## Quy ước trạng thái

- **Đạt:** có UI/API/data path thực và bằng chứng kiểm tra phù hợp.
- **Một phần:** có chức năng nhưng thiếu test xuyên tầng, còn fallback/mock hoặc có rủi ro.
- **Chưa đạt:** thiếu implementation hoặc quality gate chặn sử dụng an toàn.
- **Chưa xác minh:** cần môi trường/dữ liệu/quyền ngoài repository.

## Ma trận yêu cầu → Use Case → UI → API → dữ liệu → test

| ID | Yêu cầu / Use Case | Actor | Giao diện | API / service | Bảng dữ liệu | Test | Trạng thái | Khoảng trống chính |
|---|---|---|---|---|---|---|---|---|
| AUTH-01 | Đăng ký tài khoản | Guest | `/register` | `POST /api/auth/register` | Role, User, Customer | password policy unit + register/login E2E | Đạt có giới hạn | UI/API/DB/session đã chứng minh; chưa email verification |
| AUTH-02 | Đăng nhập Credentials | User | `/login` | Auth.js credentials callback | User, Role | Playwright login customer/admin + rate-limit unit | Đạt có giới hạn | Cookie/session và redirect role đã chạy xuyên middleware; chưa có MFA |
| AUTH-03 | Đăng nhập Google | User | `/login` | Auth.js Google provider | User, Account, Customer, Role | VNPay/auth config không bao phủ OAuth | Một phần | Chưa xác minh OAuth production |
| AUTH-04 | Quên/đặt lại mật khẩu | User | `/forgot-password`, `/reset-password` | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` | User, VerificationToken | password/email unit + reset/login E2E | Đạt có giới hạn | Token consume và mật khẩu mới đã chứng minh; chưa provider live |
| AUTH-05 | Phân quyền admin/staff/customer | All roles | `/admin`, `/profile` | middleware, `requirePermission` | User, Role | permissions unit + customer/admin E2E + direct HTTP 403 | Đạt có giới hạn | Middleware/API guard đã test bằng session thật; role cache tối đa 5 phút |
| CAT-01 | Xem/tìm/lọc sản phẩm | Guest | `/products` | `GET /api/products` | Paint, Category, Supplier, PaintColorLink | fallback/pagination unit + public HTTP/Prisma + axe/Lighthouse | Đạt có giới hạn | Database path và fallback provenance đã chứng minh; chưa RUM production |
| CAT-02 | Xem chi tiết sản phẩm | Guest | `/products/[slug]` | `GET /api/products/[slug]` | Paint, Review, PaintColorLink | public HTTP/Prisma + browser smoke | Đạt có giới hạn | Route/data path đã chứng minh; chưa SEO rich-result production |
| COLOR-01 | Xem mã màu/bộ sưu tập | Guest | `/colors` | `GET /api/colors`, `GET /api/color-collections` | PaintColor, ColorCollection | public HTTP/Prisma + axe/AX + cross-browser smoke | Đạt có giới hạn | Fallback được cảnh báo; screen reader thủ công chưa xác minh |
| COLOR-02 | Lưu màu yêu thích | Customer | `/colors`, `/profile` | `GET/POST /api/profile/favorites` | Customer, WishlistColor, PaintColor | profile HTTP ownership giữa hai customer | Đạt có giới hạn | Chưa đồng bộ realtime/multi-device test |
| VIS-01 | Phối màu không gian mẫu | Guest/Customer | `/color-visualizer` | Không có API chuyên biệt | Không có model scene/project | Không có | Một phần | `MOCK_ROOMS`, không lưu thiết kế |
| DEALER-01 | Tìm đại lý/bản đồ | Guest | `/find-dealer` | `GET /api/dealers` | Dealer, Supplier | Không có | Một phần | Fallback tọa độ; chưa geolocation/browser test |
| CART-01 | Quản lý giỏ hàng | Guest/Customer | `/cart`, header | Zustand cart store | localStorage phía client | commerce helper unit | Đạt có giới hạn | Không đồng bộ server/multi-device |
| COUPON-01 | Kiểm tra mã giảm giá | Customer | `/cart` | `POST /api/coupons/validate` | Coupon | commerce unit | Đạt có giới hạn | Chưa test API/DB concurrency ngoài checkout |
| CHECK-01 | Checkout COD/chuyển khoản | Customer | `/checkout` | `POST /api/orders`, checkout service | Order, OrderItem, Payment, InventoryTransaction, CheckoutIdempotency, Coupon, EmailOutbox | unit + DB integration/concurrency + COD/TRANSFER Playwright E2E | Đạt có giới hạn | Hai phương thức demo đã chứng minh; provider email live chưa xác minh |
| CHECK-02 | Thanh toán VNPay | Customer/VNPay | `/checkout`, `/checkout/success` | `/api/vnpay/ipn`, `/api/vnpay/return` | Order, Payment, OrderStatusHistory, EmailOutbox | config-only unit | **Chưa đạt** | Không kiểm tra `isVerified`; Critical |
| ORDER-01 | Xem lịch sử/chi tiết đơn | Customer/Staff | `/profile`, `/admin/orders`, `/admin/invoices` | `GET /api/orders`, `GET /api/orders/[orderNumber]` | Order, OrderItem, Payment, OrderStatusHistory | DB/HTTP ownership + profile/admin E2E + bounded load | Đạt có giới hạn | Ownership và rejection load đã chứng minh; chưa RUM production |
| ORDER-02 | Cập nhật trạng thái đơn | Staff/Admin | `/admin/orders` | `PATCH /api/orders/[orderNumber]` | Order, Payment, InventoryTransaction, AuditLog | policy unit + COD/TRANSFER confirm/refund HTTP E2E | Đạt có giới hạn | Duplicate refund được chặn; provider payment thật ngoài phạm vi |
| REVIEW-01 | Đánh giá sản phẩm đã mua | Customer | product detail | `GET/POST /api/reviews`, review workflow service | Review, Order, OrderItem, User, Notification, AuditLog | PostgreSQL workflow + denial HTTP + completed TRANSFER review E2E | Đạt có giới hạn | Verified-purchase rule đã chứng minh cả deny/allow; moderation scale chưa tải |
| BLOG-01 | Xem bài viết | Guest | `/blog`, `/blog/[slug]` | `GET /api/blog`, `GET /api/blog/[slug]` | Blog, User | pagination unit + public list/detail HTTP/Prisma | Đạt có giới hạn | Related posts vẫn để rỗng |
| QUOTE-01 | Gửi và xử lý báo giá | Guest/Staff | `/quote-request`, `/admin/quotes` | quote workflow service dùng bởi public/admin route | QuoteRequest, Notification, AuditLog | PostgreSQL + public/admin HTTP + abuse rate-limit E2E | Đạt có giới hạn | Persistence/audit/rate limit đã chứng minh; chưa CAPTCHA |
| CHAT-01 | Chat hỗ trợ | Guest/Customer/Staff | global chat, `/admin/chat` | legacy chat + authenticated conversation workflow service | ChatMessage, Conversation, Message, Notification, AuditLog | PostgreSQL + customer/admin HTTP + public-write abuse E2E | Đạt có giới hạn | Hai mô hình chat song song còn làm retention/reporting phức tạp |
| PROFILE-01 | Sửa hồ sơ | Customer | `/profile` | `GET/PATCH /api/profile` | User | direct HTTP + Prisma + two-customer ownership | Đạt có giới hạn | Chưa audit lịch sử thay đổi hồ sơ |
| PROFILE-02 | Đổi mật khẩu | Customer | `/profile` | `POST /api/profile/password` | User | password policy + direct HTTP/current-password checks | Đạt có giới hạn | Chưa session revocation sau đổi mật khẩu |
| PROFILE-03 | Sổ địa chỉ | Customer | `/profile` | CRUD `/api/profile/addresses` | Address, User, Order | direct HTTP CRUD/default/ownership | Đạt có giới hạn | Chưa kiểm thử tranh chấp hai default đồng thời |
| WISH-01 | Lưu sản phẩm yêu thích | Customer | product detail, `/profile` | `/api/profile/favorite-products` | Wishlist, Customer, Paint | direct HTTP toggle/list + ownership | Đạt có giới hạn | Chưa UI cross-browser cho wishlist |
| ADMIN-01 | Dashboard doanh thu/tồn kho | Staff/Admin | `/admin` | `GET /api/admin/dashboard` | Order, Payment, Paint, User | direct HTTP aggregate đối chiếu Prisma + auth rejection load | Đạt có giới hạn | Chưa test volume production |
| ADMIN-02 | CRUD catalog/supplier | Admin | `/admin/catalog` | admin category/supplier services/routes | Category, Supplier, AuditLog | DB integration + category/supplier HTTP lifecycle/audit/role denial | Đạt có giới hạn | Direct lifecycle đã chứng minh; chưa tải volume lớn |
| ADMIN-03 | CRUD sơn/khuyến mãi | Admin | `/admin/paints` | admin product service/routes, `/promotions` | Paint, PaintColorLink, InventoryTransaction, AuditLog | atomic DB integration + product/promotion direct HTTP | Đạt có giới hạn | Chưa visual-regression admin UI |
| ADMIN-04 | CRUD màu/bộ sưu tập | Admin | `/admin/colors`, `/admin/collections` | color/collection services/routes | PaintColor, ColorCollection, PaintColorLink, AuditLog | delete guard DB + color/collection HTTP lifecycle/audit | Đạt có giới hạn | Chưa tải bulk import màu |
| ADMIN-05 | Quản lý kho | Staff/Admin | `/admin/import` | `GET/POST /api/admin/inventory` | Paint, InventoryTransaction, AuditLog | permissions + DB concurrency + direct HTTP import/audit | Đạt có giới hạn | Chưa kiểm thử import batch/file lớn |
| ADMIN-06 | Quản lý payment/refund | Staff/Admin | `/admin/orders` | `GET/PATCH /api/admin/payments` | Payment, Order, OrderStatusHistory, AuditLog | payment policy + transfer confirm/refund/duplicate HTTP E2E | Đạt có giới hạn | External payment provider ngoài phạm vi |
| ADMIN-07 | Quản lý user/role | Admin | `/admin/accounts` | `/api/admin/users` | User, Role, Customer, AuditLog | permissions + direct HTTP create/role/self-demotion/audit | Đạt có giới hạn | Role cache vẫn có SLA tối đa 5 phút |
| ADMIN-08 | Quản lý media | Admin | `/admin/images` | `/api/admin/media` | Cloudinary ngoài DB + AuditLog | permission + invalid upload/delete direct HTTP guard | Một phần | Guard đã chứng minh; lifecycle Cloudinary live chưa xác minh |
| NOTIF-01 | Thông báo admin | Staff/Admin | dropdown admin | admin notification APIs | Notification, AuditLog | direct HTTP scope/read/mark-all + policy unit | Đạt có giới hạn | Chưa realtime delivery/load production |
| AUDIT-01 | Nhật ký mọi thao tác quản trị | Admin | Chưa có page riêng | `GET /api/admin/audit-logs` + helper | AuditLog | sanitizer/source coverage + persisted DB integration | Đạt có giới hạn | Đã chứng minh sanitizer khi persist; chưa có retention/immutability policy |
| I18N-01 | Tiếng Việt/English | All | language toggle | client dictionary/store | Không có | Không có | Một phần | Không route locale; nội dung DB EN tùy chọn |
| SEO-01 | Metadata/robots/sitemap | Search engine | public pages | `robots.ts`, `sitemap.ts` | Blog, Paint | Build + Lighthouse SEO 91–92 | Đạt có giới hạn | Local production đạt gate; chưa Search Console/RUM |
| SEC-01 | Security headers/CSP | All | N/A | nonce middleware + security header builder | N/A | CSP unit + production nonce + Chromium/Firefox/WebKit/mobile smoke + AX | Đạt có giới hạn | WebKit HTTP test mode đã xử lý upgrade policy; style inline vẫn được phép |
| SEC-02 | Rate limit | All/API clients | N/A | middleware + UnifiedRateLimiter + public-write policy | Upstash production | fail-closed/memory unit + quote/chat abuse HTTP + bounded rejection load | Đạt có giới hạn | Local policy pass; Upstash live vẫn chưa xác minh |
| TEST-01 | Automated quality gate | Developer | N/A | GitHub Actions | PostgreSQL 18 test service | 112 unit + 18 DB integration + 41 E2E/axe/AX + coverage + load + OpenAPI 99/99 | Đạt có giới hạn | Local P1 gate xanh; manual screen reader và production load/RUM chưa có |
| DEPLOY-01 | Deploy production có rollback/monitoring | Operator | N/A | GitHub Actions + deployment runbook | Neon + external services | P1 PR/main CI + Vercel production đúng SHA + smoke 10/10; P0 rollback/restore | Đạt có giới hạn | Backup/alerts/provider proof còn manual |

## Tổng hợp traceability

| Trạng thái | Số requirement |
|---|---:|
| Đạt có giới hạn | 35 |
| Một phần | 5 |
| Chưa đạt | 1 |
| Chưa xác minh | 0 |

`CHECK-02` vẫn chưa đạt nhưng đã được người dùng loại khỏi phạm vi vì VNPay chỉ là giả lập. Với phạm vi còn lại, public catalog/profile, checkout COD/TRANSFER, ownership, concurrency, admin catalog/operations, audit, rate limit, browser matrix, accessibility automation, coverage và bounded load đã có bằng chứng tự động. OpenAPI đối chiếu đủ 52 route file/99 operation. Khoảng trống lớn nhất còn lại là provider/OAuth/alert production, screen reader thủ công, RUM/load production và PRD/UAT chính thức.
