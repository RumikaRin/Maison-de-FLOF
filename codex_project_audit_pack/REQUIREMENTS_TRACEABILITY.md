# Requirements Traceability — Maison de FLOF

Ngày cập nhật: 25/07/2026
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
| AUTH-05 | Phân quyền admin/staff/customer | All roles | `/admin`, `/profile` | middleware, `requirePermission` | User, Role | permissions unit + customer/admin E2E | Đạt có giới hạn | Middleware đã test bằng session thật; role cache tối đa 5 phút |
| CAT-01 | Xem/tìm/lọc sản phẩm | Guest | `/products` | `GET /api/products` | Paint, Category, Supplier, PaintColorLink | fallback/pagination unit + axe/Lighthouse | Đạt có giới hạn | Fallback được gắn provenance và khóa commerce; chưa API integration |
| CAT-02 | Xem chi tiết sản phẩm | Guest | `/products/[slug]` | `GET /api/products/[slug]` | Paint, Review, PaintColorLink | Không có route/UI integration test | Một phần | Chưa E2E/SEO validation |
| COLOR-01 | Xem mã màu/bộ sưu tập | Guest | `/colors` | `GET /api/colors`, `GET /api/color-collections` | PaintColor, ColorCollection | fallback/pagination unit + axe E2E | Đạt có giới hạn | Fallback được cảnh báo; chưa API integration |
| COLOR-02 | Lưu màu yêu thích | Customer | `/colors`, `/profile` | `GET/POST /api/profile/favorites` | Customer, WishlistColor, PaintColor | Không có API ownership test | Một phần | Thiếu integration test |
| VIS-01 | Phối màu không gian mẫu | Guest/Customer | `/color-visualizer` | Không có API chuyên biệt | Không có model scene/project | Không có | Một phần | `MOCK_ROOMS`, không lưu thiết kế |
| DEALER-01 | Tìm đại lý/bản đồ | Guest | `/find-dealer` | `GET /api/dealers` | Dealer, Supplier | Không có | Một phần | Fallback tọa độ; chưa geolocation/browser test |
| CART-01 | Quản lý giỏ hàng | Guest/Customer | `/cart`, header | Zustand cart store | localStorage phía client | commerce helper unit | Đạt có giới hạn | Không đồng bộ server/multi-device |
| COUPON-01 | Kiểm tra mã giảm giá | Customer | `/cart` | `POST /api/coupons/validate` | Coupon | commerce unit | Đạt có giới hạn | Chưa test API/DB concurrency ngoài checkout |
| CHECK-01 | Checkout COD/chuyển khoản | Customer | `/checkout` | `POST /api/orders`, checkout service | Order, OrderItem, Payment, InventoryTransaction, CheckoutIdempotency, Coupon, EmailOutbox | unit + 5 DB integration + COD Playwright E2E | Đạt có giới hạn | COD đã chứng minh xuyên tầng; chuyển khoản chưa có E2E |
| CHECK-02 | Thanh toán VNPay | Customer/VNPay | `/checkout`, `/checkout/success` | `/api/vnpay/ipn`, `/api/vnpay/return` | Order, Payment, OrderStatusHistory, EmailOutbox | config-only unit | **Chưa đạt** | Không kiểm tra `isVerified`; Critical |
| ORDER-01 | Xem lịch sử/chi tiết đơn | Customer/Staff | `/profile`, `/admin/orders`, `/admin/invoices` | `GET /api/orders`, `GET /api/orders/[orderNumber]` | Order, OrderItem, Payment, OrderStatusHistory | DB ownership integration + profile/admin E2E | Đạt có giới hạn | Customer/admin ownership đã chứng minh; chưa tải/race test |
| ORDER-02 | Cập nhật trạng thái đơn | Staff/Admin | `/admin/orders` | `PATCH /api/orders/[orderNumber]` | Order, Payment, InventoryTransaction, AuditLog | policy unit + admin confirms COD E2E | Đạt có giới hạn | Luồng xác nhận COD đã chạy; refund/race chưa E2E |
| REVIEW-01 | Đánh giá sản phẩm đã mua | Customer | product detail | `GET/POST /api/reviews` | Review, Order, OrderItem, User | Không có API test | Một phần | Source có purchased check; chưa integration |
| BLOG-01 | Xem bài viết | Guest | `/blog`, `/blog/[slug]` | `GET /api/blog`, `GET /api/blog/[slug]` | Blog, User | pagination unit | Một phần | Related posts để rỗng; chưa API integration |
| QUOTE-01 | Gửi và xử lý báo giá | Guest/Staff | `/quote-request`, `/admin/quotes` | `POST /api/quote-request`, `GET/PATCH /api/admin/quotes` | QuoteRequest, Notification | Không có | Một phần | Chưa anti-spam/integration test |
| CHAT-01 | Chat hỗ trợ | Guest/Customer/Staff | global chat, `/admin/chat` | `/api/chat`, `/api/chat/conversation`, admin chat APIs | ChatMessage, Conversation, Message, Notification | Không có | Một phần | Hai mô hình chat song song; notification có thể spam |
| PROFILE-01 | Sửa hồ sơ | Customer | `/profile` | `GET/PATCH /api/profile` | User | Không có | Một phần | Chưa integration test |
| PROFILE-02 | Đổi mật khẩu | Customer | `/profile` | `POST /api/profile/password` | User | password policy unit | Một phần | Chưa session revocation/E2E |
| PROFILE-03 | Sổ địa chỉ | Customer | `/profile` | CRUD `/api/profile/addresses` | Address, User, Order | Không có | Một phần | Source có ownership/transaction; chưa integration |
| WISH-01 | Lưu sản phẩm yêu thích | Customer | product detail, `/profile` | `/api/profile/favorite-products` | Wishlist, Customer, Paint | Không có | Một phần | Chưa integration test |
| ADMIN-01 | Dashboard doanh thu/tồn kho | Staff/Admin | `/admin` | `GET /api/admin/dashboard` | Order, Payment, Paint, User | Không có | Một phần | Chưa kiểm tra correctness với dữ liệu thật |
| ADMIN-02 | CRUD catalog/supplier | Admin | `/admin/catalog` | `/api/admin/categories`, `/api/admin/suppliers` | Category, Supplier, AuditLog | permissions + audit sanitizer unit | Một phần | Có audit call; chưa API/DB integration |
| ADMIN-03 | CRUD sơn/khuyến mãi | Admin | `/admin/paints` | `/api/admin/products`, `/promotions` | Paint, PaintColorLink, AuditLog | permissions + audit sanitizer unit | Một phần | Có audit call; chưa API/DB integration |
| ADMIN-04 | CRUD màu/bộ sưu tập | Admin | `/admin/colors`, `/admin/collections` | admin colors/collections APIs | PaintColor, ColorCollection, AuditLog | permissions + audit sanitizer unit | Một phần | Có audit call; chưa API/DB integration |
| ADMIN-05 | Quản lý kho | Staff/Admin | `/admin/import` | `GET/POST /api/admin/inventory` | Paint, InventoryTransaction, AuditLog | permissions unit | Một phần | Chưa concurrency/integration test |
| ADMIN-06 | Quản lý payment/refund | Staff/Admin | `/admin/orders` | `GET/PATCH /api/admin/payments` | Payment, Order, OrderStatusHistory, AuditLog | payment policy unit | Một phần | Chưa integration/refund E2E |
| ADMIN-07 | Quản lý user/role | Admin | `/admin/accounts` | `/api/admin/users` | User, Role, Customer, AuditLog | permissions + audit sanitizer unit | Một phần | Có audit trong transaction; chưa self-demotion/API integration |
| ADMIN-08 | Quản lý media | Admin | `/admin/images` | `/api/admin/media` | Cloudinary ngoài DB + AuditLog | permissions + audit sanitizer unit | Chưa xác minh | Có audit call; cần Cloudinary production |
| NOTIF-01 | Thông báo admin | Staff/Admin | dropdown admin | admin notification APIs | Notification, AuditLog | pagination + audit sanitizer unit | Một phần | limit đã bound; chưa realtime/API integration |
| AUDIT-01 | Nhật ký mọi thao tác quản trị | Admin | Chưa có page riêng | `GET /api/admin/audit-logs` + helper | AuditLog | sanitizer/source coverage + persisted DB integration | Đạt có giới hạn | Đã chứng minh sanitizer khi persist; chưa có retention/immutability policy |
| I18N-01 | Tiếng Việt/English | All | language toggle | client dictionary/store | Không có | Không có | Một phần | Không route locale; nội dung DB EN tùy chọn |
| SEO-01 | Metadata/robots/sitemap | Search engine | public pages | `robots.ts`, `sitemap.ts` | Blog, Paint | Build + Lighthouse SEO 91–92 | Đạt có giới hạn | Local production đạt gate; chưa Search Console/RUM |
| SEC-01 | Security headers/CSP | All | N/A | nonce middleware + security header builder | N/A | CSP unit + production nonce smoke + build | Đạt có giới hạn | Script không còn unsafe-inline/eval; style inline vẫn được phép |
| SEC-02 | Rate limit | All/API clients | N/A | middleware + UnifiedRateLimiter | Upstash production | fail-closed + memory-mode unit | Một phần | Auth production fail-closed; chưa health-check Upstash live |
| TEST-01 | Automated quality gate | Developer | N/A | GitHub Actions | PostgreSQL 18 test service | 77 unit + 7 DB integration + 13 E2E/axe + OpenAPI + Lighthouse | Đạt có giới hạn | Có CLS regression cho home/products; chưa có coverage threshold |
| DEPLOY-01 | Deploy production có rollback/monitoring | Operator | N/A | GitHub Actions + deployment runbook | Neon + external services | Full local release gate + GitHub/Vercel Preview smoke | Đạt có giới hạn | Baseline CI/Preview xanh; backup/alerts/provider proof còn manual |

## Tổng hợp traceability

| Trạng thái | Số requirement |
|---|---:|
| Đạt có giới hạn | 16 |
| Một phần | 22 |
| Chưa đạt | 1 |
| Chưa xác minh | 1 |

`CHECK-02` vẫn chưa đạt nhưng đã được người dùng loại khỏi phạm vi vì VNPay chỉ là giả lập. Với phạm vi còn lại, register/reset, checkout COD, ownership, outbox, audit persistence, session middleware, accessibility và performance đã có bằng chứng tự động. Khoảng trống lớn nhất còn lại là các feature phụ chưa có integration test và bằng chứng hạ tầng/provider production trực tiếp.
