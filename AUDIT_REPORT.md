# Báo cáo audit dự án Maison de FLOF

Ngày audit: 24/07/2026
Phạm vi: toàn bộ repository `D:\ProjectZ\FLOF`
Chế độ audit ban đầu: an toàn, không seed/reset database, không chạy migration, không hiển thị secret
Trạng thái tài liệu: đã cập nhật sau đợt remediation được người dùng phê duyệt; tích hợp VNPay giả lập được loại khỏi phạm vi sửa

## 1. Kết luận điều hành

**Mức hoàn thiện hiện tại ước tính: 82% cho phạm vi demo không tính VNPay** (mức audit ban đầu: 65%).

Hệ thống đã vượt mức prototype: có storefront, admin, PostgreSQL/Prisma, Auth.js, RBAC, checkout có transaction/idempotency, inventory, payment, CI và 60 unit test. Kiến trúc monolith Next.js hiện tại **có thể tiếp tục dùng** cho quy mô hiện tại. Dependency Critical/High, email outbox, rate-limit production, audit coverage, pagination, status 401/403, CSP production, runtime contract và tài liệu vận hành đã được xử lý. Vì VNPay được xác định là giả lập và nằm ngoài phạm vi remediation, kết luận 82% chỉ áp dụng cho demo; không dùng kết luận này để chứng nhận cổng thanh toán production.

### Điểm theo nhóm

| Nhóm | Trọng số | Điểm | Nhận định |
|---|---:|---:|---|
| Yêu cầu & traceability | 10% | 78% | Đã có traceability cập nhật; vẫn thiếu PRD/acceptance criteria chính thức |
| Kiến trúc | 10% | 82% | Modular monolith phù hợp, service boundary chưa đồng đều |
| Database & ORM | 12% | 84% | 6 migration đã áp dụng; migration CHECK invariant thứ 7 đã chuẩn bị và đang chờ approval |
| API & nghiệp vụ | 18% | 82% | Pagination đã bound, auth status đúng hơn, email/outbox có failure contract |
| Authentication & authorization | 12% | 82% | Auth.js + RBAC có guard; dependency audit High hiện sạch |
| Bảo mật | 15% | 79% | Rate limit auth fail-closed, audit sanitizer và CSP production đã được siết |
| Frontend & accessibility | 10% | 70% | 33 page, UI tương đối đầy đủ; client-heavy, nhiều form dùng placeholder thay label |
| Testing | 8% | 72% | 60/60 unit test và browser smoke read-only pass; vẫn chưa có DB integration/coverage |
| Deployment & vận hành | 5% | 80% | Có CI, Node 24, runbook, `vercel.json`, structured logs và Vercel telemetry; chờ Preview verification |
| **Tổng** | **100%** | **82%** | **Đạt demo-readiness trong phạm vi không tính VNPay; chưa đủ bằng chứng production** |

## 2. Stack và kiến trúc thực tế

| Thành phần | Nhận diện từ source |
|---|---|
| Frontend | Next.js 15.5.21 App Router, React 19, TailwindCSS 3, Framer Motion, Zustand, React Query |
| Backend | Next.js Route Handlers trong `src/app/api`, business service trong `src/services` |
| Database | PostgreSQL; DB đang cấu hình là Neon PostgreSQL |
| ORM | Prisma 6, `prisma/schema.prisma`, 6 migration đã áp dụng + 1 migration invariant pending |
| Authentication | Auth.js/NextAuth v5 beta.32; Credentials + Google; JWT session; Prisma adapter |
| Authorization | Role `ADMIN`, `STAFF`, `CUSTOMER`; middleware + `requireUser/Staff/Admin/Permission` |
| Test framework | Node.js built-in test runner với TypeScript strip-types |
| CI | GitHub Actions: install → generate → lint → typecheck → test → audit → build |
| Deployment | README và diagram chỉ ra Vercel + Neon; tích hợp Cloudinary, Resend, VNPay, tùy chọn Upstash |

Kiến trúc là **modular monolith**. Đây là lựa chọn hợp lý cho một nhóm nhỏ và quy mô hiện tại: cùng một deployment chứa UI, API và service, còn dữ liệu nằm ở PostgreSQL. Chưa có bằng chứng cần tách microservice. Nên giữ kiến trúc này nhưng siết domain boundary, observability, test integration và deployment automation.

## 3. Bằng chứng kiểm tra động

| Kiểm tra | Kết quả ngày 24/07/2026 | Ghi chú |
|---|---|---|
| `npm run lint` | PASS, exit 0 | Không có lint error |
| `npm run build` | PASS, exit 0 | Sinh 81 route/page; Neon có một lỗi kết nối P1001 tạm thời khi prerender colors và fallback tĩnh hoạt động; `db:status` sau đó vẫn PASS |
| `npm run typecheck` | PASS, exit 0 | Chạy sau build mới, `tsc --noEmit` |
| `npm test` | PASS | 60 test, 60 pass, 0 fail |
| `npx prisma validate` | PASS | Schema Prisma hợp lệ |
| `npm run db:status` | EXPECTED PENDING | 6 migration đã áp dụng; `20260724150000_add_data_invariant_checks` chưa áp dụng theo approval gate |
| `npm audit --omit=dev --audit-level=high` | PASS | 0 vulnerability |
| Playwright CLI local smoke | PASS | `/`, products, colors, dealer, login; console 0 error/0 warning |
| API/header local smoke | PASS | products pagination 200/400; CSP có `object-src 'none'`, không có `unsafe-eval` |

Không chạy `db:migrate`, `db:seed`, `prisma db push`, lệnh ghi dữ liệu hoặc thử callback thanh toán. Nội dung `.env` không được đọc/hiển thị; `.env` không được Git theo dõi và đã có rule ignore. VNPay source/test không được thay đổi trong đợt remediation.

### Trạng thái remediation

| Finding ban đầu | Trạng thái hiện tại | Bằng chứng |
|---|---|---|
| C-01 VNPay callback | **Ngoài phạm vi theo yêu cầu** | Không sửa file VNPay; chỉ phù hợp mô phỏng/demo |
| C-02 dependency Critical/High | **Đã sửa** | Next 15.5.21, Auth.js beta.32, PostCSS/Sharp override; audit High = 0 |
| H-01 email/outbox báo SENT giả | **Đã sửa** | `email-delivery.ts`, `email-outbox.ts`, cron chỉ SENT sau delivery thành công |
| H-02 audit thiếu coverage/sanitization | **Đã sửa phần source** | Mọi admin route có mutation gọi audit; sanitizer trung tâm loại dữ liệu nhạy cảm |
| H-03 rate limit fallback serverless | **Đã sửa** | Auth limiter production dùng deny/fail-closed khi backend phân tán không sẵn sàng |
| H-04 thiếu integration/E2E | **Đã giảm, còn mở** | Browser smoke read-only đã pass; chưa có DB integration cho auth/checkout/ownership |
| H-05 ERD stale | **Đã bổ sung** | `docs/erd.md` phản ánh 32 model; PNG cũ được đánh dấu stale |
| M-01 CSP | **Đã sửa một phần** | Production bỏ `unsafe-eval`; `unsafe-inline` còn là residual risk |
| M-02 pagination | **Đã sửa** | Parser dùng chung: page >= 1, 1 <= limit <= 100, input sai trả 400 |
| M-07 operations | **Đã bổ sung, chờ Preview** | Runbook, Node 24, `vercel.json`, structured logs, Analytics/Speed Insights |
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

#### H-04 — Không có integration/E2E test cho luồng rủi ro cao

**Tác động:** unit test pass nhưng không chứng minh auth cookie/middleware, ownership, Prisma transaction, payment callback, email outbox và UI checkout hoạt động xuyên tầng.

**Bằng chứng:**

- `package.json` chỉ chạy `tests/*.test.ts` bằng Node test runner.
- 32 test hiện tại tập trung helper/policy/fallback; không khởi tạo app server hoặc test database.
- Không có Playwright/Cypress/Supertest/testcontainers trong dependency hay config.

**Khuyến nghị:** ưu tiên integration test VNPay + checkout transaction + RBAC; sau đó E2E register/login/cart/checkout/admin order.

#### H-05 — ERD và tài liệu thiết kế không phản ánh schema hiện tại — **đã bổ sung ERD chuẩn**

**Tác động:** thiết kế, review, test và bàn giao dựa trên quan hệ/kiểu khóa sai.

**Bằng chứng:**

- `public/erd_diagram.png` chỉ mô tả khoảng 8 bảng, lặp hai box `Paint`, dùng khóa `INT` và các field như `username`, `shipping_address`.
- `prisma/schema.prisma` thực tế có 32 model, khóa `String @default(cuid())`, role là bảng riêng và nhiều domain payment/chat/audit/outbox.
- `PROJECT_ROADMAP_VI.md:28-39` vẫn mô tả “chưa có migration/test/CRUD database”, trái với source hiện tại.

**Khuyến nghị:** sinh ERD từ Prisma hoặc cập nhật diagram trong cùng PR với migration; đánh dấu roadmap cũ là historical snapshot.

### Medium

#### M-01 — CSP vẫn cho phép `unsafe-eval` và `unsafe-inline` — **đã bỏ `unsafe-eval` ở production**

`next.config.ts:14` làm giảm đáng kể khả năng CSP chặn XSS. Nên chuyển sang nonce/hash, tách dev/prod policy và kiểm thử các integration cần script/style inline.

#### M-02 — Pagination public không validate hoặc giới hạn page/limit — **đã sửa**

`src/app/api/products/route.ts:13-37`, `blog/route.ts`, `colors/route.ts`, `dealers/route.ts` dùng `parseInt` trực tiếp; limit âm, NaN hoặc rất lớn có thể gây 500/DB load. `admin/notifications/route.ts:13-25` cũng nhận `take` không chặn trên.

#### M-03 — Database thiếu constraint cho invariant quan trọng — **migration đã chuẩn bị, chưa áp dụng**

Production hiện có 0 public CHECK constraint. Migration `20260724150000_add_data_invariant_checks` đã bổ sung các rule cho stock, price/cost/total, quantity, payment amount, coupon, rating và inventory quantity theo mẫu `NOT VALID` rồi `VALIDATE`. Truy vấn read-only trên Neon xác nhận 0 row vi phạm các rule cốt lõi; migration vẫn pending cho tới khi có approval áp dụng production.

#### M-04 — Storefront che lỗi database bằng catalog tĩnh

`src/lib/catalog-page-data.ts:26-28,102-151` và `src/lib/home-page-data.ts:120-123` trả fallback khi DB lỗi. Điều này cải thiện availability nhưng có thể hiển thị giá/tồn kho cũ trong commerce. Fallback chỉ nên dùng cho nội dung marketing hoặc phải gắn trạng thái “catalog unavailable”, không cho checkout dữ liệu fallback.

#### M-05 — Frontend client-heavy và thiếu bằng chứng accessibility

24/33 `page.tsx` là Client Component; build cho thấy nhiều page có First Load JS khoảng 190–196 kB. Nhiều form trong `src/app/quote-request/page.tsx:86-98` và admin dùng placeholder thay nhãn hiển thị. Chưa có axe/Lighthouse/keyboard/screen-reader test.

#### M-06 — Role demotion có cửa sổ tối đa 5 phút

`src/auth.ts:9-10,23-51` cache role trong JWT và refresh mỗi 5 phút. API helper có đọc user/role lại từ DB nên mutation chính được bảo vệ tốt hơn, nhưng middleware/UI có thể tiếp tục coi role cũ hợp lệ trong cửa sổ này. Cần document revocation SLA.

#### M-07 — Deploy/operations chưa đủ tái lập — **đã bổ sung runbook, còn thiếu bằng chứng live**

Chỉ có `.github/workflows/ci.yml` và hướng dẫn bằng văn bản. Không có `vercel.json`, cấu hình cron cho hai endpoint, staging topology, backup/restore proof, monitoring/alerting, migration rollback/runbook hoặc dependency pin policy.

#### M-08 — Seed dùng credential cố định, có công tắc cho phép production

`prisma/seed.ts:7-8,34-36` có guard nhưng vẫn có thể bật `ALLOW_PRODUCTION_SEED=true`; README công khai ba credential demo ở `README.md:300-308`. Không được bật công tắc này trên production; production seed phải tách khỏi demo user.

### Low

#### L-01 — Một số route trả 401 cho user đã đăng nhập nhưng thiếu role — **đã sửa**

Ví dụ `src/app/api/admin/chat/conversations/route.ts:8-12`. Trường hợp đã xác thực nhưng thiếu quyền nên là 403 để client/monitoring phân biệt đúng.

#### L-02 — README sai số lượng API — **đã sửa**

README mô tả `api` có “18 endpoints”, source thực tế có 52 `route.ts`.

#### L-03 — Không có contract API chuẩn hóa

Không có OpenAPI/JSON Schema chung, versioning hoặc generated client; response/error shape còn khác nhau giữa route.

#### L-04 — CI không khai báo Node engine trong package — **đã sửa**

CI dùng Node 24 tại `.github/workflows/ci.yml:19`, nhưng `package.json` không có `engines`/`.nvmrc`; local/Vercel có thể chạy phiên bản khác.

## 5. Đánh giá theo lĩnh vực

### Yêu cầu và Use Case

README là nguồn yêu cầu chính, nhưng không có PRD/acceptance criteria có version. Use-case diagram bao phủ guest/customer/admin/VNPay ở mức cao, nhưng thiếu STAFF, Google OAuth, password reset, quote, blog, color collection/favorite, media, notification và cron. Ma trận chi tiết đã được cập nhật trong `codex_project_audit_pack/REQUIREMENTS_TRACEABILITY.md`.

### Database, ORM và ERD

Điểm tốt:

- 32 model, 11 enum, quan hệ và index khá đầy đủ.
- Order có snapshot shipping/product; Payment tách 1-1; idempotency có unique key.
- Prisma schema validate và migration status đều pass.

Khoảng trống:

- ERD stale nghiêm trọng.
- Chưa có DB-level CHECK invariant.
- `AuditLog.actorId` không có foreign key; đây có thể là lựa chọn giữ lịch sử sau khi xóa user nhưng cần document.
- `InventoryTransaction.referenceId` là chuỗi tự do, không có FK.
- Không có migration checksum/backup restore evidence ngoài Prisma status.

### API

Có 52 route, guard nhìn chung đúng và mutation chính dùng Zod. Checkout có transaction, conditional update chống oversell và idempotency. Các vấn đề chính là VNPay signature, pagination, response contract, audit coverage và thiếu integration test. Catalog đầy đủ ở `codex_project_audit_pack/API_CATALOG.md`.

### Authentication và Authorization

Credentials dùng bcrypt cost 12, Google OAuth mặc định không link email nguy hiểm, password reset token random 32 byte và lưu SHA-256. API admin dùng guard server-side, không chỉ ẩn UI. Dependency audit High hiện sạch. Điểm chưa đủ: không có email verification/MFA/session revocation UI và chưa có test xuyên middleware/RBAC.

### Frontend

Các luồng chính đều có UI và API nối thật. Tuy nhiên Color Visualizer vẫn dùng `MOCK_ROOMS`; blog related posts đang để rỗng; catalog/home có static fallback; 24/33 page client-side. Không có bằng chứng audit WCAG, responsive browser matrix hoặc real-user performance.

### Testing

55 unit test hiện có giá trị cho commerce rules, idempotency, cron auth, rate limiter fail-closed, password policy, email delivery/outbox, pagination, audit sanitization, CSP và cấu hình VNPay. Quality gate vẫn thiếu test DB/API/browser và coverage threshold.

### Deployment

Build production pass, dependency audit High sạch, Node 24 được khóa trong package/CI và đã có deployment runbook. Tuy vậy chưa có quyền kiểm tra cấu hình Vercel/cron/observability/rollback thật. Do đó chưa thể xác nhận production readiness end-to-end.

## 6. Ba rủi ro lớn nhất

1. **Thiếu integration/E2E cho auth, ownership, transaction, outbox và các critical path**, nên unit test chưa chứng minh hành vi xuyên tầng.
2. **Migration CHECK constraint chưa được áp dụng production**, nên trong thời gian pending writer ngoài application vẫn có thể tạo dữ liệu sai.
3. **Hạ tầng production chưa được xác minh trực tiếp:** cron, Upstash, Resend, backup/PITR, monitoring, alerting và rollback.

## 7. Năm việc phải sửa đầu tiên

1. Thêm integration test với database tách biệt cho auth/RBAC/ownership, checkout transaction, audit và outbox.
2. Thêm E2E cho register/login/cart/checkout COD/profile/admin order; VNPay tiếp tục được loại khỏi scope theo quyết định hiện tại.
3. Sau khi Preview xanh, phê duyệt và áp dụng migration CHECK constraint đã chuẩn bị lên Neon production.
4. Cấu hình và kiểm chứng staging cho cron, Upstash, Resend, backup/PITR, monitoring và alerting theo runbook.
5. Giảm tiếp CSP `unsafe-inline`, chuẩn hóa API error/OpenAPI và bổ sung accessibility/performance gate.

## 8. Phần chưa đủ dữ liệu để xác minh

- File được yêu cầu `codex_project_audit_pack/CODEX_PROJECT_AUDIT_PROMPT.md` không tồn tại trong repository hoặc `D:\ProjectZ`; audit dùng 10 yêu cầu trong lời nhắn làm baseline.
- Không có PRD/SRS, acceptance criteria đã ký, KPI/SLA/SLO hoặc biên bản UAT.
- Không kiểm tra dữ liệu row-level, PII quality, record count hay production traffic; chỉ `prisma migrate status` được phép kết nối đọc.
- Không có quyền/telemetry để xác nhận Vercel project, Neon backup/PITR, Cloudinary, Resend, Upstash, VNPay merchant và Google OAuth production.
- Không có kết quả Lighthouse, axe, browser/device matrix, penetration test hoặc load test.
- Không xác minh DNS/TLS/custom domain, webhook delivery từ VNPay thật, email deliverability, cron schedule, alerting và disaster recovery.

## 9. Quyết định kiến trúc

**Tiếp tục dùng kiến trúc hiện tại**, theo hướng modular monolith. Không tách microservice ở giai đoạn này. Điều kiện để tiếp tục an toàn:

- payment/auth/security gate phải xanh;
- route handler mỏng, nghiệp vụ đưa vào service/domain;
- test integration và observability trở thành release gate;
- Prisma migration + ERD + data dictionary được cập nhật cùng nhau;
- external integration có idempotency, timeout, retry và failure state rõ ràng.
