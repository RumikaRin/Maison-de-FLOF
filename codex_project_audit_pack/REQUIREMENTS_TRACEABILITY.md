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
| AUTH-01 | Đăng ký và xác minh email | Guest | `/register`, `/verify-email` | register/resend/verify API | Role, User, Customer, VerificationToken | token unit + auth lifecycle E2E | Đạt có giới hạn | Credentials bị chặn trước `emailVerified`; provider mailbox live chưa xác minh |
| AUTH-02 | Đăng nhập Credentials và session thu hồi được | User | `/login`, profile Sessions | Auth.js + `/api/profile/sessions` | User, Role, AuthSession | session registry unit + revoke/demotion E2E | Đạt | Cookie, registry, revoke session khác và invalidate khi đổi role đã chứng minh |
| AUTH-03 | Đăng nhập Google | User | `/login`, `/register` khi provider sẵn sàng | Auth.js Google provider có policy đủ cặp credential | User, Account, Customer, Role | provider-policy unit + credential-only UI E2E | Một phần | UI ẩn an toàn khi thiếu cấu hình; chưa xác minh OAuth consent production |
| AUTH-04 | Quên/đặt lại mật khẩu | User | `/forgot-password`, `/reset-password` | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` | User, VerificationToken | password/email unit + reset/login E2E | Đạt có giới hạn | Token consume và mật khẩu mới đã chứng minh; chưa provider live |
| AUTH-05 | Phân quyền admin/staff/customer | All roles | `/admin`, `/profile` | middleware, `requirePermission` | User, Role, AuthSession | permissions unit + customer/admin E2E + role-demotion revoke | Đạt | API guard và sessionVersion loại bỏ cửa sổ role cache cũ |
| AUTH-06 | MFA TOTP cho quản trị viên đã bật | Admin | `/profile` Security | setup/verify/disable MFA APIs + credentials callback | MfaCredential, User | RFC 6238/encryption unit + setup/recovery/login/disable MFA UI E2E | Đạt | UI chỉ dành cho admin; secret mã hóa, recovery hash và lifecycle xuyên tầng đã chứng minh |
| CAT-01 | Xem/tìm/lọc sản phẩm | Guest | `/products` | `GET /api/products` | Paint, Category, Supplier, PaintColorLink | fallback/pagination unit + public HTTP/Prisma + axe/Lighthouse | Đạt có giới hạn | Database path và fallback provenance đã chứng minh; chưa RUM production |
| CAT-02 | Xem chi tiết sản phẩm | Guest | `/products/[slug]` | `GET /api/products/[slug]` | Paint, Review, PaintColorLink | public HTTP/Prisma + browser smoke | Đạt có giới hạn | Route/data path đã chứng minh; chưa SEO rich-result production |
| COLOR-01 | Xem mã màu/bộ sưu tập | Guest | `/colors` | `GET /api/colors`, `GET /api/color-collections` | PaintColor, ColorCollection | public HTTP/Prisma + axe/AX + cross-browser smoke | Đạt có giới hạn | Fallback được cảnh báo; screen reader thủ công chưa xác minh |
| COLOR-02 | Lưu màu yêu thích | Customer | `/colors`, `/profile` | `GET/POST /api/profile/favorites` | Customer, WishlistColor, PaintColor | profile HTTP ownership giữa hai customer | Đạt có giới hạn | Chưa đồng bộ realtime/multi-device test |
| VIS-01 | Phối màu và lưu thiết kế riêng tư | Guest/Customer | `/color-visualizer` | rooms + designs CRUD API | VisualizerRoom, VisualizerDesign, User | integration ownership + guest/customer E2E | Đạt | Guest thử được nhưng phải đăng nhập để lưu; customer reopen/rename/delete đã chứng minh |
| DEALER-01 | Tìm đại lý/bản đồ | Guest | `/find-dealer` | `GET /api/dealers` | Dealer, Supplier | public HTTP + responsive/retry E2E + axe | Đạt có giới hạn | Danh sách/map/retry đã test; geolocation thiết bị thật chưa xác minh |
| CART-01 | Quản lý giỏ hàng | Guest/Customer | `/cart`, header | Zustand cart store | localStorage phía client | commerce helper unit | Đạt có giới hạn | Không đồng bộ server/multi-device |
| COUPON-01 | Kiểm tra mã giảm giá | Customer | `/cart` | `POST /api/coupons/validate` | Coupon | commerce unit | Đạt có giới hạn | Chưa test API/DB concurrency ngoài checkout |
| CHECK-01 | Checkout COD/chuyển khoản | Customer | `/checkout` | `POST /api/orders`, checkout service | Order, OrderItem, Payment, InventoryTransaction, CheckoutIdempotency, Coupon, EmailOutbox | unit + DB integration/concurrency + COD/TRANSFER Playwright E2E | Đạt có giới hạn | Hai phương thức demo đã chứng minh; provider email live chưa xác minh |
| CHECK-02 | Thanh toán VNPay | Customer/VNPay | `/checkout`, `/checkout/success` | `/api/vnpay/ipn`, `/api/vnpay/return` | Order, Payment, OrderStatusHistory, EmailOutbox | config-only unit | **Chưa đạt** | Không kiểm tra `isVerified`; Critical |
| ORDER-01 | Xem lịch sử/chi tiết đơn | Customer/Staff | `/profile`, `/admin/orders`, `/admin/invoices` | `GET /api/orders`, `GET /api/orders/[orderNumber]` | Order, OrderItem, Payment, OrderStatusHistory | DB/HTTP ownership + profile/admin E2E + bounded load | Đạt có giới hạn | Ownership và rejection load đã chứng minh; chưa RUM production |
| ORDER-02 | Cập nhật trạng thái đơn | Staff/Admin | `/admin/orders` | `PATCH /api/orders/[orderNumber]` | Order, Payment, InventoryTransaction, AuditLog | policy unit + COD/TRANSFER confirm/refund HTTP E2E | Đạt có giới hạn | Duplicate refund được chặn; provider payment thật ngoài phạm vi |
| REVIEW-01 | Đánh giá sản phẩm đã mua | Customer | product detail | `GET/POST /api/reviews`, review workflow service | Review, Order, OrderItem, User, Notification, AuditLog | PostgreSQL workflow + denial HTTP + completed TRANSFER review E2E | Đạt có giới hạn | Verified-purchase rule đã chứng minh cả deny/allow; moderation scale chưa tải |
| BLOG-01 | Xem bài viết và bài liên quan | Guest | `/blog`, `/blog/[slug]` | blog API + blog service ranking | Blog, User | ranking unit + list/detail HTTP/Prisma | Đạt | Ưu tiên cùng category, loại current/inactive, fallback recency và cap 3 |
| PRIV-01 | Export dữ liệu và xóa/anonymize tài khoản | Customer | `/profile` Privacy | data-export/delete-account/retention cron | User, Customer và dữ liệu sở hữu | privacy integration + HTTP/E2E | Đạt có giới hạn | Ownership/anonymization/revoke/retention đã test; retention cần legal review |
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
| NOTIF-01 | Thông báo admin polling có điều kiện | Staff/Admin | dropdown admin | notification APIs + ETag/304 | Notification, AuditLog | polling/validator unit + HTTP hidden-tab E2E | Đạt | Một request in-flight, pause hidden/offline, backoff 10/30/60 và private ETag |
| AUDIT-01 | Nhật ký quản trị có lọc/phân trang/chi tiết | Admin | `/admin/audit` | `GET /api/admin/audit-logs` + helper | AuditLog | sanitizer/integration + admin audit E2E/axe | Đạt có giới hạn | UI và RBAC đã chứng minh; DB immutability/retention policy chưa có |
| I18N-01 | Route tiếng Việt/English | All | `/vi/**`, `/en/**`, language toggle | locale middleware/navigation helpers | Không có | locale unit + route/switch E2E | Đạt có giới hạn | API/static asset excluded đúng; dịch nội dung DB vẫn phụ thuộc field EN |
| SEO-01 | Metadata/robots/sitemap | Search engine | public pages | `robots.ts`, `sitemap.ts` | Blog, Paint | Build + Lighthouse SEO 91–92 | Đạt có giới hạn | Local production đạt gate; chưa Search Console/RUM |
| SEC-01 | Security headers/CSP | All | N/A | nonce middleware + security header builder | N/A | CSP unit + production nonce + Chromium/Firefox/WebKit/mobile smoke + AX | Đạt có giới hạn | WebKit HTTP test mode đã xử lý upgrade policy; style inline vẫn được phép |
| SEC-02 | Rate limit | All/API clients | N/A | middleware + UnifiedRateLimiter + public-write policy | Upstash production | fail-closed/memory unit + quote/chat abuse HTTP + bounded rejection load + live PING | Đạt | Vercel Marketplace Upstash Free `sin1` Available và sanitized PING PASS |
| TEST-01 | Automated quality gate | Developer | N/A | GitHub Actions | PostgreSQL 18 test service | 152 unit + 24 DB integration + 73 E2E + coverage/local+production load/OpenAPI 115/115/bundle/Lighthouse | Đạt có giới hạn | Automated gate xanh; manual screen reader và RUM đủ mẫu chưa có |
| DEPLOY-01 | Deploy production có migration/rollback/monitoring | Operator | N/A | GitHub Actions + deployment runbook | Neon + Upstash + external services | local gate + Neon 13/13 + Upstash PING + production load + Vercel exact SHA/smoke/log | Đạt có giới hạn | Analytics/Speed Insights đã bật; Resend/Cloudinary, alert delivery và DR RTO/RPO vẫn manual |

## Tổng hợp traceability

| Trạng thái | Số requirement |
|---|---:|
| Đạt | 7 |
| Đạt có giới hạn | 32 |
| Một phần | 2 |
| Chưa đạt | 1 |
| Chưa xác minh | 0 |

`CHECK-02` vẫn chưa đạt nhưng đã được người dùng loại khỏi phạm vi vì VNPay chỉ là giả lập. Với phạm vi còn lại, email ownership, session revocation, admin MFA UI, privacy, visualizer persistence, related blog, locale routes, governed audit, bounded polling, responsive/accessibility, Upstash và local/production load budget đều có evidence. OpenAPI đối chiếu đủ 64 route file/115 operation. Khoảng trống lớn nhất còn lại là Google/Resend/Cloudinary/alert production, screen reader thủ công, RUM đủ mẫu và PRD/UAT chính thức.
