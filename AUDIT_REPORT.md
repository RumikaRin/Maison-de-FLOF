# Báo cáo audit dự án Maison de FLOF

Ngày audit: 25/07/2026
Phạm vi: toàn bộ repository `D:\ProjectZ\FLOF`
Chế độ audit ban đầu: an toàn, không seed/reset database, không chạy migration, không hiển thị secret
Trạng thái tài liệu: đã cập nhật sau đợt remediation được người dùng phê duyệt; tích hợp VNPay giả lập được loại khỏi phạm vi sửa

## 1. Kết luận điều hành

**Mức hoàn thiện hiện tại ước tính: 89% cho phạm vi demo không tính VNPay** (mức audit ban đầu: 65%).

Hệ thống đã vượt mức prototype: có storefront, admin, PostgreSQL/Prisma, Auth.js, RBAC, checkout transaction/idempotency, inventory, payment và CI. Release gate hiện có 77 unit test, 7 PostgreSQL integration test, 13 Playwright E2E/axe test, OpenAPI contract validation và Lighthouse CI. Kiến trúc monolith Next.js hiện tại **có thể tiếp tục dùng** cho quy mô hiện tại. Vì VNPay được xác định là giả lập và nằm ngoài phạm vi remediation, kết luận 89% chỉ áp dụng cho demo; không dùng kết luận này để chứng nhận cổng thanh toán production.

### Điểm theo nhóm

| Nhóm | Trọng số | Điểm | Nhận định |
|---|---:|---:|---|
| Yêu cầu & traceability | 10% | 84% | 40 requirement đã nối UI/API/data/test; vẫn thiếu PRD/acceptance criteria chính thức |
| Kiến trúc | 10% | 85% | Modular monolith phù hợp; checkout/outbox đã có service boundary và DB test |
| Database & ORM | 12% | 94% | 8 migration trong repo; 17/17 CHECK constraint validated trên Neon, test DB có migration parity |
| API & nghiệp vụ | 18% | 88% | Critical error envelope, OpenAPI 9 path, checkout/order/outbox integration pass |
| Authentication & authorization | 12% | 90% | Register, reset password và credentials customer/admin chạy xuyên UI/API/DB/session; RBAC guard vẫn có role-cache SLA |
| Bảo mật | 15% | 91% | Nonce CSP, fail-closed auth limiter, audit sanitizer/persistence và audit runtime sạch |
| Frontend & accessibility | 10% | 90% | 13 browser test pass; homepage/products render SSR và có CLS regression gate <= 0.1 |
| Testing | 8% | 94% | 77 unit + 7 DB integration + 13 E2E/axe, OpenAPI và Lighthouse pass; chưa có coverage threshold |
| Deployment & vận hành | 5% | 88% | CI đã cấu hình PostgreSQL/Playwright/OpenAPI/Lighthouse; external manual evidence còn thiếu |
| **Tổng** | **100%** | **89%** | **Đạt release-quality cho demo không tính VNPay; chưa đủ bằng chứng production external** |

## 2. Stack và kiến trúc thực tế

| Thành phần | Nhận diện từ source |
|---|---|
| Frontend | Next.js 15.5.21 App Router, React 19, TailwindCSS 3, Framer Motion, Zustand, React Query |
| Backend | Next.js Route Handlers trong `src/app/api`, business service trong `src/services` |
| Database | PostgreSQL; DB đang cấu hình là Neon PostgreSQL |
| ORM | Prisma 6, `prisma/schema.prisma`, 8 migration trong repo; migration invariant có 17 CHECK constraint validated |
| Authentication | Auth.js/NextAuth v5 beta.32; Credentials + Google; JWT session; Prisma adapter |
| Authorization | Role `ADMIN`, `STAFF`, `CUSTOMER`; middleware + `requireUser/Staff/Admin/Permission` |
| Test framework | Node.js test runner, `tsx --test`, Playwright Chromium, axe-core, Redocly, Lighthouse CI |
| CI | GitHub Actions + PostgreSQL 18: migrate/fixtures → lint/unit/integration → build/typecheck → E2E/OpenAPI/Lighthouse/audit |
| Deployment | README và diagram chỉ ra Vercel + Neon; tích hợp Cloudinary, Resend, VNPay, tùy chọn Upstash |

Kiến trúc là **modular monolith**. Đây là lựa chọn hợp lý cho một nhóm nhỏ và quy mô hiện tại: cùng một deployment chứa UI, API và service, còn dữ liệu nằm ở PostgreSQL. Chưa có bằng chứng cần tách microservice. Nên giữ kiến trúc này nhưng siết domain boundary, observability, test integration và deployment automation.

## 3. Bằng chứng kiểm tra động

| Kiểm tra | Kết quả ngày 25/07/2026 | Ghi chú |
|---|---|---|
| `npm run lint` | PASS, exit 0 | Không có lint error |
| `npm run build` | PASS, exit 0 | Production build và kiểm tra type tích hợp hoàn tất |
| `npm run typecheck` | PASS, exit 0 | Chạy sau build mới, `tsc --noEmit` |
| `npm test` | PASS | 77 test, 77 pass, 0 fail |
| `npm run test:integration` | PASS | 7 test PostgreSQL: checkout atomic/idempotency/rollback, order ownership, audit persistence, outbox failure/retry |
| `npm run test:e2e` | PASS | 13 Playwright Chromium: 8 axe scans + register/reset/COD + CLS gate cho home/products |
| `npm run test:openapi` | PASS | OpenAPI 3.1 Redocly lint + critical source method coverage |
| `npm run test:lighthouse` | PASS | Sau sửa CLS: home 75/99/93/92, products 76/92/93/92, login 80/100/93/91; CLS bằng 0 trên cả ba route |
| `npx prisma validate` | PASS | Schema Prisma hợp lệ |
| Test DB migration deploy | PASS | 8 migration; không còn pending migration trên PostgreSQL 18 cô lập |
| `npm audit --omit=dev --audit-level=high` | PASS | 0 vulnerability |
| Production CSP smoke | PASS | nonce header khớp 33 script tag; script-src không có `unsafe-inline`/`unsafe-eval` |
| Vercel Preview | PASS | Baseline SHA `77ef264`, deployment `dpl_4F8Dxe55ioFoBqprxgjhHwFMHAtj` READY; runtime error scan sạch |
| GitHub Actions | PASS | Baseline run `30109577643`, job quality xanh đủ PostgreSQL/unit/integration/build/E2E/OpenAPI/Lighthouse/audit |
| Neon invariant postflight | PASS | 17/17 constraint installed + validated; tổng số row vi phạm = 0 |

Trong lượt audit ban đầu không chạy migration hoặc lệnh ghi dữ liệu. Sau khi Vercel Preview pass và người dùng phê duyệt rõ ràng, chỉ `prisma migrate deploy` được chạy để áp dụng migration additive `20260724150000_add_data_invariant_checks`; không seed/reset/db push và không thử callback thanh toán. Nội dung `.env` không được đọc/hiển thị; `.env` không được Git theo dõi và đã có rule ignore. VNPay source/test không được thay đổi trong đợt remediation.

### Trạng thái remediation

| Finding ban đầu | Trạng thái hiện tại | Bằng chứng |
|---|---|---|
| C-01 VNPay callback | **Ngoài phạm vi theo yêu cầu** | Không sửa file VNPay; chỉ phù hợp mô phỏng/demo |
| C-02 dependency Critical/High | **Đã sửa** | Next 15.5.21, Auth.js beta.32, PostCSS 8.5.23/Next override 8.5.22; production audit High = 0 |
| H-01 email/outbox báo SENT giả | **Đã sửa** | `email-delivery.ts`, `email-outbox.ts`, cron chỉ SENT sau delivery thành công |
| H-02 audit thiếu coverage/sanitization | **Đã sửa phần source** | Mọi admin route có mutation gọi audit; sanitizer trung tâm loại dữ liệu nhạy cảm |
| H-03 rate limit fallback serverless | **Đã sửa** | Auth limiter production dùng deny/fail-closed khi backend phân tán không sẵn sàng |
| H-04 thiếu integration/E2E | **Đã sửa critical path** | 7 DB integration + 13 Playwright E2E/axe; register/reset/session, checkout COD, ownership, audit, outbox và CLS có bằng chứng |
| H-05 ERD stale | **Đã bổ sung** | `docs/erd.md` phản ánh 32 model; PNG cũ được đánh dấu stale |
| M-01 CSP | **Đã sửa cho script** | Nonce per-request trong middleware; production script-src không còn `unsafe-inline`/`unsafe-eval` |
| M-02 pagination | **Đã sửa** | Parser dùng chung: page >= 1, 1 <= limit <= 100, input sai trả 400 |
| M-07 operations | **Đã bổ sung và xác minh Preview** | Runbook, Node 24, `vercel.json`, structured logs, Analytics/Speed Insights; Vercel READY |
| L-01/L-02/L-04 | **Đã sửa** | 401/403 tách đúng, README/API count cập nhật, Node engine được khai báo |

## 4. Phát hiện theo mức độ

### Critical (phát hiện audit ban đầu)

#### C-01 — Callback VNPay không bắt buộc chữ ký hợp lệ — **ngoài phạm vi remediation**

**Tác động:** kẻ tấn công có thể tạo callback có `vnp_ResponseCode=00`, chỉ định `orderId` và số tiền, sau đó đi vào luồng đánh dấu payment `PAID`/order `CONFIRMED` dù checksum không hợp lệ.

**Bằng chứng:**

- `src/services/vnpay.service.ts:21-44` chỉ trả `isSuccess`, không trả/kiểm tra `isVerified`.
- `src/app/api/vnpay/ipn/route.ts:10-27` và `src/app/api/vnpay/return/route.ts:10-21` dùng `result.isSuccess` để cập nhật payment.
- Dependency thực tế `node_modules/vnpay/dist/chunk-PHIG47AV.js:501-519` tạo hai cờ độc lập: `isVerified` từ checksum và `isSuccess` từ response code.
- `tests/vnpay-config.test.ts` chỉ kiểm tra cấu hình; không có test callback chữ ký sai.

**Khuyến nghị:** bắt buộc `isVerified === true && isSuccess === true`; chỉ IPN hợp lệ được là nguồn xác nhận chính; thêm regression test chữ ký sai/amount sai/replay/race.

#### C-02 — Runtime dependency có 2 lỗ hổng Critical và 4 High — **đã sửa**

**Tác động:** tăng rủi ro bypass/DoS/disclosure trong Auth.js và Next.js runtime.

**Bằng chứng:**

- `package.json` dùng `next-auth ^5.0.0-beta.31`, `@auth/prisma-adapter ^2.7.4`, `next ^15.1.6`.
- `npm audit --omit=dev --audit-level=low` exit 1, báo 2 Critical trong `@auth/core` và 4 High trong Next.js/PostCSS/Sharp.
- `.github/workflows/ci.yml:26` đã có audit-level High, nên trạng thái dependency hiện tại cũng làm CI quality gate thất bại.

**Khuyến nghị:** tạo nhánh nâng dependency có kiểm soát, chạy lại toàn bộ auth/payment regression và chỉ phát hành khi `npm audit --omit=dev --audit-level=high` exit 0 hoặc có risk acceptance cụ thể.

### High (phát hiện audit ban đầu)

#### H-01 — Email outbox có thể đánh dấu SENT dù email không được gửi — **đã sửa**

**Tác động:** email xác nhận đơn hoặc reset/welcome có thể mất im lặng; vận hành nhìn thấy trạng thái giả.

**Bằng chứng:**

- `src/lib/email.ts:18-24` trả về khi thiếu cấu hình và nuốt exception sau khi chỉ `console.error`.
- `src/app/api/cron/process-outbox/route.ts:37-50` luôn cập nhật record thành `SENT` sau lời gọi không ném lỗi.

**Khuyến nghị:** `sendEmail` phải trả delivery result hoặc ném lỗi; outbox chỉ chuyển `SENT` khi provider xác nhận; thêm lease/idempotency để tránh hai cron worker gửi trùng.

#### H-02 — Audit log không bao phủ phần lớn hành động quản trị — **đã sửa phần source**

**Tác động:** không truy vết đầy đủ thay đổi user, article, category, supplier, color, collection, dealer, media, quote, review và chat.

**Bằng chứng:**

- `createAuditLog` chỉ được gọi trong coupon, product, inventory, payment và order status.
- Có mutating handlers ở 19 nhóm route admin, nhưng `src/app/api/admin/audit-logs/route.ts` chỉ đọc dữ liệu đã ghi.
- README tuyên bố “ghi nhận mọi hành động quản trị”, không khớp source.

**Khuyến nghị:** audit middleware/service chung cho mọi mutation; ghi actor, permission, entity, before/after, request correlation ID; cấm ghi secret/token/password.

#### H-03 — Rate limit giảm xuống memory-local trong môi trường serverless — **đã sửa**

**Tác động:** khi Upstash thiếu hoặc lỗi, mỗi instance giữ counter riêng; attacker có thể phân tán request qua instance/cold start để vượt limit đăng nhập, reset password và API.

**Bằng chứng:**

- `src/lib/rate-limiter.ts:31-43` tự động fallback sang Map trong memory khi Redis lỗi.
- `src/middleware.ts:11-25` tạo limiter ở module scope.
- Deployment diagram chỉ ra Vercel serverless, nơi không có shared memory giữa instance.

**Khuyến nghị:** production fail closed hoặc dùng distributed store bắt buộc cho auth/payment/public-write endpoint; health check xác nhận rate-limit backend.

#### H-04 — Không có integration/E2E test cho luồng rủi ro cao — **đã sửa critical path**

**Tác động:** unit test pass nhưng không chứng minh auth cookie/middleware, ownership, Prisma transaction, payment callback, email outbox và UI checkout hoạt động xuyên tầng.

**Bằng chứng hiện tại:**

- `docker-compose.test.yml` cung cấp PostgreSQL 18 cô lập và fixture script từ chối database production-like.
- 7 integration test chứng minh checkout COD atomic/idempotent/rollback, order ownership, audit persistence và outbox failure/retry.
- 13 Playwright test chạy production build, đăng ký/reset, đăng nhập customer/admin, đặt COD, cập nhật order, axe scan 8 màn hình và đo CLS sau hydration cho home/products.

**Khoảng trống còn lại:** chưa có integration cho phần lớn admin CRUD, OAuth/Google, concurrency/load và VNPay bị loại khỏi phạm vi.

#### H-05 — ERD và tài liệu thiết kế không phản ánh schema hiện tại — **đã bổ sung ERD chuẩn**

**Tác động:** thiết kế, review, test và bàn giao dựa trên quan hệ/kiểu khóa sai.

**Bằng chứng:**

- `public/erd_diagram.png` chỉ mô tả khoảng 8 bảng, lặp hai box `Paint`, dùng khóa `INT` và các field như `username`, `shipping_address`.
- `prisma/schema.prisma` thực tế có 32 model, khóa `String @default(cuid())`, role là bảng riêng và nhiều domain payment/chat/audit/outbox.
- `PROJECT_ROADMAP_VI.md:28-39` vẫn mô tả “chưa có migration/test/CRUD database”, trái với source hiện tại.

**Khuyến nghị:** sinh ERD từ Prisma hoặc cập nhật diagram trong cùng PR với migration; đánh dấu roadmap cũ là historical snapshot.

### Medium

#### M-01 — CSP vẫn cho phép `unsafe-eval` và `unsafe-inline` — **đã sửa cho script**

`src/middleware.ts` tạo nonce theo request, chuyển nonce vào server render và gắn CSP response. Production smoke xác nhận nonce header khớp 33 script tag và `script-src` không còn `unsafe-inline`/`unsafe-eval`. `style-src 'unsafe-inline'` vẫn là residual risk do cách sinh style hiện tại.

#### M-02 — Pagination public không validate hoặc giới hạn page/limit — **đã sửa**

`src/app/api/products/route.ts:13-37`, `blog/route.ts`, `colors/route.ts`, `dealers/route.ts` dùng `parseInt` trực tiếp; limit âm, NaN hoặc rất lớn có thể gây 500/DB load. `admin/notifications/route.ts:13-25` cũng nhận `take` không chặn trên.

#### M-03 — Database thiếu constraint cho invariant quan trọng — **đã sửa**

Migration `20260724150000_add_data_invariant_checks` đã được áp dụng sau approval, bổ sung 17 rule cho stock, price/cost/total, quantity, payment amount, coupon, rating và inventory quantity theo mẫu `NOT VALID` rồi `VALIDATE`. Hậu kiểm trực tiếp trên Neon xác nhận 17/17 constraint đã installed + validated và tổng số row vi phạm bằng 0.

#### M-04 — Storefront che lỗi database bằng catalog tĩnh — **đã khóa commerce khi fallback**

Các loader trả provenance `database|fallback` và `commerceAvailable`; home/products hiển thị cảnh báo, còn hai điểm add-to-cart trên home từ chối dữ liệu fallback. Unit test chứng minh fallback content không thể thêm vào cart. Rủi ro còn lại là các feature marketing vẫn có thể hiển thị catalog tĩnh cũ.

#### M-05 — Frontend client-heavy và thiếu bằng chứng accessibility — **đã bổ sung gate tự động**

Form login/checkout/quote đã có label, interactive nesting trong Color Explorer đã được tách, control quantity/notification có accessible name và contrast chính đã sửa. Axe không còn violation critical/serious trên home, products, colors, login, cart, quote, profile và admin orders. Lighthouse accessibility đạt 92–100. Client JS 187–196 kB ở một số route và browser/device matrix thủ công vẫn là khoảng trống.

#### M-06 — Role demotion có cửa sổ tối đa 5 phút

`src/auth.ts:9-10,23-51` cache role trong JWT và refresh mỗi 5 phút. API helper có đọc user/role lại từ DB nên mutation chính được bảo vệ tốt hơn, nhưng middleware/UI có thể tiếp tục coi role cũ hợp lệ trong cửa sổ này. Cần document revocation SLA.

#### M-07 — Deploy/operations chưa đủ tái lập — **đã bổ sung runbook và xác minh Vercel Preview**

Đã có CI, `vercel.json`, cron outbox, Node 24 contract, runbook, structured log, Analytics/Speed Insights và Preview deployment tự động từ GitHub. Vẫn thiếu bằng chứng backup/restore, alerting, Resend/Upstash production và rollback drill.

#### M-08 — Seed dùng credential cố định, có công tắc cho phép production

`prisma/seed.ts:7-8,34-36` có guard nhưng vẫn có thể bật `ALLOW_PRODUCTION_SEED=true`; README công khai ba credential demo ở `README.md:300-308`. Không được bật công tắc này trên production; production seed phải tách khỏi demo user.

### Low

#### L-01 — Một số route trả 401 cho user đã đăng nhập nhưng thiếu role — **đã sửa**

Ví dụ `src/app/api/admin/chat/conversations/route.ts:8-12`. Trường hợp đã xác thực nhưng thiếu quyền nên là 403 để client/monitoring phân biệt đúng.

#### L-02 — README sai số lượng API — **đã sửa**

README mô tả `api` có “18 endpoints”, source thực tế có 52 `route.ts`.

#### L-03 — Không có contract API chuẩn hóa — **đã sửa critical path**

`docs/openapi.yaml` dùng OpenAPI 3.1 cho 9 critical path; CI chạy Redocly và đối chiếu method với source. Critical route dùng error envelope có `requestId`, client parser hỗ trợ cả structured/legacy. 43 route còn lại, versioning và generated client vẫn chưa được bao phủ.

#### L-04 — CI không khai báo Node engine trong package — **đã sửa**

CI dùng Node 24 tại `.github/workflows/ci.yml:19`, nhưng `package.json` không có `engines`/`.nvmrc`; local/Vercel có thể chạy phiên bản khác.

## 5. Đánh giá theo lĩnh vực

### Yêu cầu và Use Case

README là nguồn yêu cầu chính, nhưng không có PRD/acceptance criteria có version. Use-case diagram bao phủ guest/customer/admin/VNPay ở mức cao, nhưng thiếu STAFF, Google OAuth, password reset, quote, blog, color collection/favorite, media, notification và cron. Ma trận chi tiết đã được cập nhật trong `codex_project_audit_pack/REQUIREMENTS_TRACEABILITY.md`.

### Database, ORM và ERD

Điểm tốt:

- 32 model, 11 enum, quan hệ và index khá đầy đủ.
- Order có snapshot shipping/product; Payment tách 1-1; idempotency có unique key.
- Prisma schema validate pass; 17 CHECK constraint invariant đã validated trên Neon.
- PostgreSQL 18 test DB áp dụng đủ 8 migration và chạy 7 integration test. Migration reconciliation mới idempotent nhưng chưa được ghi vào production migration history vì chưa có approval mới.

Khoảng trống:

- ERD stale nghiêm trọng.
- `AuditLog.actorId` không có foreign key; đây có thể là lựa chọn giữ lịch sử sau khi xóa user nhưng cần document.
- `InventoryTransaction.referenceId` là chuỗi tự do, không có FK.
- Không có migration checksum/backup restore evidence ngoài Prisma status.

### API

Có 52 route, guard nhìn chung đúng và mutation chính dùng Zod. Checkout có transaction, conditional update chống oversell và idempotency. Critical route đã có error envelope và OpenAPI 3.1 cho 9 path; checkout/order/outbox có DB integration. Khoảng trống chính là VNPay ngoài phạm vi, contract của 43 route còn lại và admin CRUD integration. Catalog đầy đủ ở `codex_project_audit_pack/API_CATALOG.md`.

### Authentication và Authorization

Credentials dùng bcrypt cost 12, Google OAuth mặc định không link email nguy hiểm, password reset token random 32 byte và lưu SHA-256. API admin dùng guard server-side, không chỉ ẩn UI. Playwright đã chứng minh đăng ký tạo đúng Customer/role, token reset chỉ dùng một lần, mật khẩu mới đăng nhập được, cùng session cookie + middleware cho customer/admin. Điểm chưa đủ: không có email verification/MFA/session revocation UI, OAuth và email provider production chưa xác minh, role demotion có SLA tối đa 5 phút.

### Frontend

Các luồng chính đều có UI và API nối thật. Axe gate đã pass trên 8 màn hình và Lighthouse đạt accessibility 92–100. Nguyên nhân CLS được truy về `HomeClient`/`ProductsClient` trả `null` trước hydration rồi chèn toàn bộ nội dung phía trên footer; mount-gate đã được bỏ. Regression test dùng Layout Instability API đo home/products dưới ngưỡng tốt 0.1, còn Lighthouse hoàn chỉnh sau sửa ghi CLS bằng 0 và performance 75/76/80. Hai lần chạy Lighthouse bổ sung trên Windows gặp `EPERM` khi Chrome Launcher dọn thư mục temp; đây là flake của runner local, không phải assertion hoặc runtime app. Color Visualizer vẫn dùng `MOCK_ROOMS`; blog related posts đang để rỗng; nhiều page client-side và chưa có responsive browser/device matrix, screen-reader thủ công hoặc real-user performance.

### Testing

77 unit test, 7 PostgreSQL integration test và 13 Playwright E2E/axe test đều pass. Gate còn có OpenAPI source coverage, Lighthouse và production dependency audit. Critical path COD/register/reset/auth/order/audit/outbox cùng layout stability đã có bằng chứng; vẫn thiếu coverage threshold, admin CRUD breadth, OAuth, load/race và cross-browser.

### Deployment

Build production pass, dependency audit High sạch, Node 24 được khóa trong package/CI và đã có deployment runbook. Workflow cấu hình PostgreSQL 18, migration/fixture, unit/integration, Playwright, OpenAPI, Lighthouse và audit; baseline GitHub Actions đã xanh trên code SHA `77ef264`. Vercel Git Preview cùng SHA READY và runtime error scan sạch. Vẫn chưa có bằng chứng cron production execution, external-provider delivery, backup/PITR, alerting và rollback drill.

## 6. Ba rủi ro lớn nhất

1. **Vận hành production còn thiếu bằng chứng trực tiếp:** Neon backup/PITR restore, cron execution, Upstash, Resend, monitoring/alert routing và rollback drill.
2. **Phạm vi integration chưa phủ hết 52 API:** admin CRUD, OAuth, review, quote/chat và concurrency/load vẫn có thể lỗi xuyên tầng.
3. **Các tích hợp/feature chưa sẵn sàng production:** VNPay bị loại khỏi scope, Cloudinary/Google OAuth chưa live-verify, visualizer vẫn dùng room mock và style CSP còn `unsafe-inline`.

## 7. Năm việc phải sửa đầu tiên

1. Review và merge Draft PR #2 chỉ khi branch protection vẫn giữ GitHub Actions/Vercel xanh; không promote production tự động.
2. Thực hiện và lưu bằng chứng manual cho Neon backup/PITR restore, cron, Upstash, Resend, monitoring và alert routing theo runbook.
3. Mở rộng integration/API test cho admin CRUD, OAuth, review, quote/chat và các race/concurrency quan trọng.
4. Mở rộng OpenAPI/error envelope từ 9 critical path ra toàn bộ public/customer/admin API, sau đó mới sinh client nếu cần.
5. Thêm coverage threshold, Firefox/WebKit/mobile matrix, screen-reader thủ công và tối ưu JS/performance; tiếp tục loại `style-src 'unsafe-inline'` khi khả thi.

## 8. Phần chưa đủ dữ liệu để xác minh

- File được yêu cầu `codex_project_audit_pack/CODEX_PROJECT_AUDIT_PROMPT.md` không tồn tại trong repository hoặc `D:\ProjectZ`; audit dùng 10 yêu cầu trong lời nhắn làm baseline.
- Không có PRD/SRS, acceptance criteria đã ký, KPI/SLA/SLO hoặc biên bản UAT.
- Không đọc nội dung row-level/PII hoặc production traffic; chỉ chạy aggregate invariant count và metadata constraint/migration.
- Đã xác minh GitHub Actions và Vercel Preview trên baseline SHA `77ef264`, cùng Neon invariant migration trực tiếp. Chưa xác nhận Neon backup/PITR restore, Cloudinary, Resend, Upstash, VNPay merchant và Google OAuth production.
- Lighthouse và axe local đã có; chưa có Firefox/WebKit/mobile matrix, screen-reader thủ công, penetration test, load test hoặc real-user metrics.
- Không xác minh DNS/TLS/custom domain, webhook delivery từ VNPay thật, email deliverability, cron schedule, alerting và disaster recovery.

## 9. Quyết định kiến trúc

**Tiếp tục dùng kiến trúc hiện tại**, theo hướng modular monolith. Không tách microservice ở giai đoạn này. Điều kiện để tiếp tục an toàn:

- payment/auth/security gate phải xanh;
- route handler mỏng, nghiệp vụ đưa vào service/domain;
- test integration và observability trở thành release gate;
- Prisma migration + ERD + data dictionary được cập nhật cùng nhau;
- external integration có idempotency, timeout, retry và failure state rõ ràng.
