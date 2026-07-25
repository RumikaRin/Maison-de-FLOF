# Báo cáo audit dự án Maison de FLOF

Ngày cập nhật gần nhất: 26/07/2026
Phạm vi: toàn bộ repository `D:\ProjectZ\FLOF`
Chế độ audit ban đầu: an toàn, không seed/reset database, không chạy migration, không hiển thị secret
Trạng thái tài liệu: đã cập nhật sau đợt remediation được người dùng phê duyệt; tích hợp VNPay giả lập được loại khỏi phạm vi sửa

## 1. Kết luận điều hành

**Mức hoàn thiện hiện tại ước tính: 96% cho phạm vi demo không tính VNPay** (mức audit ban đầu: 65%).

Hệ thống đã vượt mức prototype: có storefront, admin, PostgreSQL/Prisma, Auth.js, RBAC, checkout transaction/idempotency, inventory, payment và CI. Release gate P1 hiện có 112 unit test, 18 PostgreSQL integration test, 41 Playwright E2E/axe/AX test đa trình duyệt, coverage threshold, bounded load gate, OpenAPI 99/99 operation và Lighthouse CI. Toàn bộ 59 method dưới `/api/admin` đã được đối chiếu policy; public catalog/profile và admin catalog/operations có direct HTTP evidence với session và dữ liệu Prisma thật. Production demo đã có branch protection, Neon restore/migration, cron authorization và Vercel rollback drill từ P0. Kiến trúc monolith Next.js hiện tại **có thể tiếp tục dùng** cho quy mô hiện tại. Vì VNPay là giả lập và nằm ngoài phạm vi remediation, kết luận 96% chỉ áp dụng cho demo; không dùng kết luận này để chứng nhận cổng thanh toán production.

### Điểm theo nhóm

| Nhóm | Trọng số | Điểm | Nhận định |
|---|---:|---:|---|
| Yêu cầu & traceability | 10% | 93% | 41 requirement đã nối UI/API/data/test; thiếu PRD/acceptance criteria chính thức |
| Kiến trúc | 10% | 93% | Modular monolith phù hợp; commerce/catalog/customer workflow có service boundary và concurrency test |
| Database & ORM | 12% | 97% | 8 migration; 17/17 CHECK constraint validated; test DB có migration parity và 18 integration test |
| API & nghiệp vụ | 18% | 99% | OpenAPI đủ 52 route/99 operation; public/profile/admin breadth có DB + HTTP evidence |
| Authentication & authorization | 12% | 96% | Register/reset/credentials và ownership chạy xuyên tầng; OAuth live và session revocation còn thiếu |
| Bảo mật | 15% | 96% | Nonce CSP, fail-closed auth limiter, public-write limiter, audit sanitizer và abuse/rejection test |
| Frontend & accessibility | 10% | 97% | 41 browser test; Chromium full, Firefox/WebKit/mobile smoke, axe và AX tree; chưa screen reader thủ công |
| Testing | 8% | 100% | 112 unit + 18 DB integration + 41 E2E, coverage/load/OpenAPI/Lighthouse/audit đều có gate |
| Deployment & vận hành | 5% | 93% | Production/CI/restore/cron/rollback đã live-verify; external provider và alert delivery còn thiếu |
| **Tổng** | **100%** | **96%** | **Đạt release-quality cho demo không tính VNPay; chưa đủ bằng chứng external production** |

## 2. Stack và kiến trúc thực tế

| Thành phần | Nhận diện từ source |
|---|---|
| Frontend | Next.js 15.5.21 App Router, React 19, TailwindCSS 3, Framer Motion, Zustand, React Query |
| Backend | Next.js Route Handlers trong `src/app/api`, business service trong `src/services` |
| Database | PostgreSQL; DB đang cấu hình là Neon PostgreSQL |
| ORM | Prisma 6, `prisma/schema.prisma`, 8 migration trong repo; migration invariant có 17 CHECK constraint validated |
| Authentication | Auth.js/NextAuth v5 beta.32; Credentials + Google; JWT session; Prisma adapter |
| Authorization | Role `ADMIN`, `STAFF`, `CUSTOMER`; middleware + `requireUser/Staff/Admin/Permission` |
| Test framework | Node.js test runner, `tsx --test`, Playwright Chromium/Firefox/WebKit, axe-core, AX tree, Redocly, Lighthouse CI |
| CI | GitHub Actions + PostgreSQL 18: migrate/fixtures → lint/unit/coverage/integration → build/typecheck → E2E/load/OpenAPI/Lighthouse/audit |
| Deployment | README và diagram chỉ ra Vercel + Neon; tích hợp Cloudinary, Resend, VNPay, tùy chọn Upstash |

Kiến trúc là **modular monolith**. Đây là lựa chọn hợp lý cho một nhóm nhỏ và quy mô hiện tại: cùng một deployment chứa UI, API và service, còn dữ liệu nằm ở PostgreSQL. Chưa có bằng chứng cần tách microservice. Nên giữ kiến trúc này nhưng siết domain boundary, observability, test integration và deployment automation.

## 3. Bằng chứng kiểm tra động

| Kiểm tra | Kết quả gần nhất | Ghi chú |
|---|---|---|
| `npm run lint` | PASS, exit 0 | Không có lint error |
| `npm run build` | PASS, exit 0 | Production build và kiểm tra type tích hợp hoàn tất |
| `npm run typecheck` | PASS, exit 0 | Chạy sau build mới, `tsc --noEmit` |
| `npm test` | PASS | 112 test, 112 pass, 0 fail; gồm API inventory, policy 59 admin method, rate-limit/load/coverage contracts |
| `npm run test:coverage` | PASS | Global lines/functions/branches 89.73/88.10/87.98%; critical 96.56/100/89.19% |
| `npm run test:integration` | PASS | 18 test PostgreSQL: checkout/order/audit/outbox/catalog/workflow + idempotency/stock/coupon concurrency |
| `npm run test:e2e` | PASS | 41 Playwright: Chromium full suite, Firefox/WebKit/mobile smoke, axe/AX, public/profile/admin direct HTTP và TRANSFER review |
| `npm run test:load` | PASS | 4 bounded/non-mutating scenario; p95 local 68/21/18/15 ms, không unexpected status hoặc 5xx |
| `npm run test:openapi` | PASS | OpenAPI 3.1 Redocly lint sạch + source ↔ contract coverage 99/99 operation |
| `npm run test:lighthouse` | PASS, 1 warning | Home 68/99/93/92 (performance warning dưới ngưỡng cảnh báo 70), products 76/92/93/92, login 80/100/93/91; CLS bằng 0 trên cả ba route |
| `npx prisma validate` | PASS | Schema Prisma hợp lệ |
| Test DB migration deploy | PASS | 8 migration; không còn pending migration trên PostgreSQL 18 cô lập |
| `npm audit --omit=dev --audit-level=high` | PASS | 0 vulnerability |
| Production CSP smoke | PASS | nonce header khớp 33 script tag; script-src không có `unsafe-inline`/`unsafe-eval` |
| Vercel Production | PASS | P1 deployment `dpl_7MEFGW5tECnsMeSDRY6TTSD3whBE` READY đúng merge SHA `2cdab5e`; 3 alias, canonical smoke 10/10 và không có log 5xx |
| GitHub Actions | PASS | PR run `30173488439` và post-merge `main` run `30173685951` xanh đủ PostgreSQL/unit/coverage/integration/build/E2E/load/OpenAPI/Lighthouse/audit |
| Neon recovery/migration | PASS | Restore branch TTL đọc aggregate 3 bảng; reconcile migration additive được deploy; schema up-to-date và metadata mục tiêu tồn tại |
| Cron và rollback | PASS | Cron không token 401, authorized in-memory 200; Vercel promote known-good rồi restore current, cả hai lần smoke 10/10 |

Trong lượt audit ban đầu không chạy migration hoặc lệnh ghi dữ liệu. Sau khi người dùng phê duyệt rõ ràng, chỉ `prisma migrate deploy` được chạy cho các migration additive đã review, gồm `20260724150000_add_data_invariant_checks` và `20260724170000_reconcile_missing_schema_objects`; không seed/reset/db push và không thử callback thanh toán. Neon restore dùng branch TTL riêng; cron check chỉ xử lý outbox hợp lệ. Secret không được hiển thị hoặc lưu trong báo cáo. VNPay source/test không được thay đổi trong đợt remediation.

### Trạng thái remediation

| Finding ban đầu | Trạng thái hiện tại | Bằng chứng |
|---|---|---|
| C-01 VNPay callback | **Ngoài phạm vi theo yêu cầu** | Không sửa file VNPay; chỉ phù hợp mô phỏng/demo |
| C-02 dependency Critical/High | **Đã sửa** | Next 15.5.21, Auth.js beta.32, PostCSS 8.5.23/Next override 8.5.22; production audit High = 0 |
| H-01 email/outbox báo SENT giả | **Đã sửa** | `email-delivery.ts`, `email-outbox.ts`, cron chỉ SENT sau delivery thành công |
| H-02 audit thiếu coverage/sanitization | **Đã sửa và có policy gate** | 59 admin method có audit decision; mutation catalog/workflow đưa audit vào transaction; sanitizer loại dữ liệu nhạy cảm |
| H-03 rate limit fallback serverless | **Đã sửa** | Auth limiter production dùng deny/fail-closed khi backend phân tán không sẵn sàng |
| H-04 thiếu integration/E2E | **Đã mở rộng** | 18 DB integration + 41 Playwright E2E/axe/AX; public/profile/admin breadth, TRANSFER review, concurrency, cross-browser và load gate |
| H-05 ERD stale | **Đã bổ sung** | `docs/erd.md` phản ánh 32 model; PNG cũ được đánh dấu stale |
| M-01 CSP | **Đã sửa cho script** | Nonce per-request trong middleware; production script-src không còn `unsafe-inline`/`unsafe-eval` |
| M-02 pagination | **Đã sửa** | Parser dùng chung: page >= 1, 1 <= limit <= 100, input sai trả 400 |
| M-07 operations | **Đã live-verify phần lõi** | Production SHA, branch protection, Neon restore/migration, cron auth, HTTPS aliases và rollback drill pass; provider/alert delivery còn blocked |
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

#### H-04 — Không có integration/E2E test cho luồng rủi ro cao — **đã mở rộng**

**Tác động:** unit test pass nhưng không chứng minh auth cookie/middleware, ownership, Prisma transaction, payment callback, email outbox và UI checkout hoạt động xuyên tầng.

**Bằng chứng hiện tại:**

- `docker-compose.test.yml` cung cấp PostgreSQL 18 cô lập và fixture script từ chối database production-like.
- 18 integration test chứng minh checkout atomic/idempotent/rollback, stock/coupon concurrency, order ownership, audit persistence, outbox retry, catalog transaction và review/quote/chat lifecycle.
- 41 Playwright test chạy production build: đăng ký/reset, COD/TRANSFER/order/review, axe/AX, CLS, public/profile/admin direct HTTP và smoke trên Chromium/Firefox/WebKit/mobile.

**Khoảng trống còn lại:** OAuth/Google, provider live, screen reader thủ công và load/RUM production; VNPay bị loại khỏi phạm vi.

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

Form login/checkout/quote đã có label, interactive nesting trong Color Explorer đã được tách, control quantity/notification và nút favorite màu có accessible name, contrast chính đã sửa. Axe không còn violation critical/serious trên các màn hình trọng yếu; AX tree xác minh login semantics. Chromium chạy full suite, Firefox/WebKit và mobile có smoke matrix. Lighthouse accessibility đạt 92–100. Client JS 187–196 kB ở một số route và screen reader thủ công vẫn là khoảng trống.

#### M-06 — Role demotion có cửa sổ tối đa 5 phút

`src/auth.ts:9-10,23-51` cache role trong JWT và refresh mỗi 5 phút. API helper có đọc user/role lại từ DB nên mutation chính được bảo vệ tốt hơn, nhưng middleware/UI có thể tiếp tục coi role cũ hợp lệ trong cửa sổ này. Cần document revocation SLA.

#### M-07 — Deploy/operations chưa đủ tái lập — **đã live-verify phần lõi, còn provider/alert**

Đã có CI, `vercel.json`, cron outbox, Node 24 contract, runbook, structured log, Analytics/Speed Insights, production deployment đúng SHA, strict branch protection, Neon restore/migration, authorized cron và rollback drill hai chiều. Vercel default error/critical alert rule tự subscribe owner/admin nhưng chưa có test-alert delivery; Upstash bị chặn bởi bước chấp nhận Marketplace terms, còn credential Resend/Cloudinary remote bị provider từ chối.

#### M-08 — Seed dùng credential cố định, có công tắc cho phép production

`prisma/seed.ts:7-8,34-36` có guard nhưng vẫn có thể bật `ALLOW_PRODUCTION_SEED=true`; README công khai ba credential demo ở `README.md:300-308`. Không được bật công tắc này trên production; production seed phải tách khỏi demo user.

### Low

#### L-01 — Một số route trả 401 cho user đã đăng nhập nhưng thiếu role — **đã sửa**

Ví dụ `src/app/api/admin/chat/conversations/route.ts:8-12`. Trường hợp đã xác thực nhưng thiếu quyền nên là 403 để client/monitoring phân biệt đúng.

#### L-02 — README sai số lượng API — **đã sửa**

README mô tả `api` có “18 endpoints”, source thực tế có 52 `route.ts`.

#### L-03 — Không có contract API chuẩn hóa — **đã có full operation inventory**

`docs/openapi.yaml` dùng OpenAPI 3.1 cho đủ 99/99 operation từ 52 route file; CI chạy Redocly và đối chiếu source ↔ contract hai chiều, kể cả Auth.js destructured GET/POST export. Critical route dùng error envelope có `requestId`, client parser hỗ trợ cả structured/legacy. Khoảng trống còn lại là chuẩn hóa error envelope cho mọi route, versioning và generated client.

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
- PostgreSQL 18 test DB áp dụng đủ 8 migration và chạy 18 integration test. Migration reconciliation idempotent đã được ghi vào production migration history theo bằng chứng P0; P1 không mutate Neon.

Khoảng trống:

- ERD Markdown đã phản ánh 32 model; ảnh PNG cũ vẫn được đánh dấu stale.
- `AuditLog.actorId` không có foreign key; đây có thể là lựa chọn giữ lịch sử sau khi xóa user nhưng cần document.
- `InventoryTransaction.referenceId` là chuỗi tự do, không có FK.
- Đã có restore-branch/readability evidence; vẫn thiếu kiểm định checksum migration độc lập và RPO/RTO theo một sự cố đầy đủ.

### API

Có 52 route file/99 operation, guard nhìn chung đúng và mutation chính dùng Zod. Checkout có transaction, conditional update chống oversell, idempotency và concurrency regression test. OpenAPI 3.1 bao phủ 99/99 operation bằng inventory hai chiều. Manifest `admin-api-policy.ts` bảo đảm đủ 59 admin method và đúng guard; public catalog/profile cùng admin catalog/operations có DB/direct HTTP evidence. Khoảng trống chính là VNPay ngoài phạm vi, error envelope legacy ở một số route và external provider live. Catalog đầy đủ ở `codex_project_audit_pack/API_CATALOG.md`.

### Authentication và Authorization

Credentials dùng bcrypt cost 12, Google OAuth mặc định không link email nguy hiểm, password reset token random 32 byte và lưu SHA-256. API admin dùng guard server-side, không chỉ ẩn UI. Playwright đã chứng minh đăng ký tạo đúng Customer/role, token reset chỉ dùng một lần, mật khẩu mới đăng nhập được, cùng session cookie + middleware cho customer/admin. Điểm chưa đủ: không có email verification/MFA/session revocation UI, OAuth và email provider production chưa xác minh, role demotion có SLA tối đa 5 phút.

### Frontend

Các luồng chính đều có UI và API nối thật. Axe/AX gate đã pass trên các màn hình trọng yếu, Lighthouse đạt accessibility từ 90 trở lên. Nút sort mobile và favorite màu có accessible name, giá khuyến mãi đủ contrast và product heading đúng thứ tự. Regression test dùng Layout Instability API đo home/products dưới ngưỡng tốt 0.1. Chromium full suite cùng Firefox/WebKit/mobile smoke đều pass. Color Visualizer vẫn dùng `MOCK_ROOMS`; blog related posts đang để rỗng; chưa có screen-reader thủ công hoặc real-user performance.

### Testing

112 unit test, 18 PostgreSQL integration test và 41 Playwright E2E/axe/AX test đều pass. Gate còn có coverage threshold, bốn bounded load scenario, OpenAPI source coverage 99/99, Lighthouse và production dependency audit. Critical path COD/TRANSFER, register/reset/auth/ownership, commerce concurrency, public/profile/admin HTTP breadth, accessibility và cross-browser smoke đã có bằng chứng. Còn thiếu OAuth/provider live, screen reader thủ công và production load/RUM.

### Deployment

Build production pass, dependency audit High sạch, Node 24 được khóa trong package/CI và official `checkout`/`setup-node` dùng v5. PR run `30173488439` và post-merge `main` run `30173685951` xanh toàn bộ; `main` yêu cầu strict `quality` + `Vercel`, linear history và resolved conversations. Production `dpl_7MEFGW5tECnsMeSDRY6TTSD3whBE` READY đúng SHA `2cdab5e`, 3 alias, canonical smoke 10/10 và không có log 5xx. Log error duy nhất trong lượt smoke là cron 401 có chủ đích để kiểm tra authorization. Neon restore/migration và rollback drill hai chiều từ P0 vẫn pass. Còn thiếu Upstash resource, credential thật cho Resend/Cloudinary và bằng chứng alert delivery.

## 6. Ba rủi ro lớn nhất

1. **External-provider và cảnh báo chưa sẵn sàng:** Upstash cần chấp nhận Marketplace terms; Resend/Cloudinary đang dùng credential remote bị từ chối; alert delivery chưa có test trực tiếp.
2. **Bằng chứng production ngoài lõi còn thiếu:** Google OAuth, screen reader thủ công, email deliverability, lịch cron/alert và real-user/load metrics chưa được chứng minh trên môi trường thật.
3. **Một số feature chưa sẵn sàng production:** VNPay bị loại khỏi scope, visualizer vẫn dùng room mock, blog/i18n còn dang dở và style CSP vẫn cho `unsafe-inline`.

## 7. Năm việc phải sửa đầu tiên

1. Chấp nhận Vercel/Upstash Marketplace terms, tạo Redis free Singapore và live-verify PING/fail-closed auth.
2. Thay credential thật cho Resend/Cloudinary rồi chạy acceptance + disposable lifecycle; chứng minh alert tới owner.
3. Xác minh Google OAuth và chạy screen-reader thủ công (NVDA/VoiceOver) cho login, catalog, cart/checkout, profile và admin.
4. Chuẩn hóa error envelope cho mọi operation, hoàn thiện email verification/session revocation/role demotion và giảm CSP `style-src 'unsafe-inline'`.
5. Hoàn thiện visualizer/blog/i18n/notification; thêm RUM, production load profile và SLO/alert có người nhận rõ ràng.

## 8. Phần chưa đủ dữ liệu để xác minh

- File được yêu cầu `codex_project_audit_pack/CODEX_PROJECT_AUDIT_PROMPT.md` không tồn tại trong repository hoặc `D:\ProjectZ`; audit dùng 10 yêu cầu trong lời nhắn làm baseline.
- Không có PRD/SRS, acceptance criteria đã ký, KPI/SLA/SLO hoặc biên bản UAT.
- Không đọc nội dung row-level/PII hoặc production traffic; chỉ chạy aggregate invariant count và metadata constraint/migration.
- Đã xác minh GitHub Actions, Vercel Production, Neon restore/migration, cron authorization, HTTPS aliases và rollback drill. Chưa xác nhận Cloudinary, Resend, Upstash, VNPay merchant và Google OAuth production.
- Lighthouse, axe/AX, Firefox/WebKit/mobile smoke và bounded local load đã có; chưa có screen-reader thủ công, penetration test, production load hoặc real-user metrics.
- Đã xác minh TLS trên ba alias Vercel; dự án không gắn custom domain. Chưa xác minh webhook VNPay thật, email deliverability, lần chạy cron theo lịch, alert delivery tới owner hoặc full disaster-recovery RTO/RPO.

## 9. Quyết định kiến trúc

**Tiếp tục dùng kiến trúc hiện tại**, theo hướng modular monolith. Không tách microservice ở giai đoạn này. Điều kiện để tiếp tục an toàn:

- payment/auth/security gate phải xanh;
- route handler mỏng, nghiệp vụ đưa vào service/domain;
- test integration và observability trở thành release gate;
- Prisma migration + ERD + data dictionary được cập nhật cùng nhau;
- external integration có idempotency, timeout, retry và failure state rõ ràng.
