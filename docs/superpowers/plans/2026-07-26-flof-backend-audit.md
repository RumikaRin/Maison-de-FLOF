# FLOF Backend Audit — Concurrency, Security, Feature Completeness

**Date:** 26/07/2026
**Method:** Three parallel read-only audits (concurrency, security, features) with
file:line evidence, contested claims re-verified by hand.

## Verdict headline

- **Concurrency / data integrity:** SAFE. No scenario oversells stock, double-pays,
  double-restocks, or over-uses a coupon at the database level.
- **Security:** one **CRITICAL** found and **fixed this pass** (VNPay signature
  bypass). The rest is solid.
- **Features:** ~85% complete for go-live. Real gaps are newsletter backend,
  invoice PDF, legal pages, social links.

## Fixed this pass — CRITICAL: VNPay signature bypass

`src/services/vnpay.service.ts` surfaced only the gateway's `isSuccess`
(response-code == 00) and dropped `isVerified` (the HMAC-SHA512 signature check
the `vnpay` library computes). Both callback routes gated on `isSuccess` alone,
so a forged callback with a valid `orderId`, `vnp_Amount`, and
`vnp_ResponseCode=00` but **no valid signature** would mark an order PAID.

- `payment.service.ts` — `PaymentVerificationResult` now carries `isVerified`.
- `vnpay.service.ts` — both `verifyReturn` and `verifyIpn` forward
  `verify.isVerified`.
- `vnpay/ipn/route.ts` — rejects `!isVerified` with RspCode 97 before any read.
- `vnpay/return/route.ts` — requires `isVerified && isSuccess` before mutating.
- `tests/vnpay-signature.test.ts` — pins all four.

Amount binding was already correct (`order-lifecycle.service.ts:121-126` rejects
`INVALID_AMOUNT`), and `transactionCode` is `@unique`, so with the signature fix
the payment path is sound.

## Concurrency — every hot mutation is guard-updated

Data integrity does not rely on isolation level; it relies on atomic conditional
`updateMany` guards, which is the correct pattern.

| Scenario | Verdict | Evidence |
|---|---|---|
| Two buyers, last unit | SAFE | `checkout.service.ts:140` `updateMany({where:{stock:{gte:qty}}})`; loser gets 409 |
| Coupon at its limit, concurrent | SAFE | `checkout.service.ts:211` `updateMany({where:{usageCount:{lt:limit}}})` |
| Cancel vs VNPay callback | SAFE | both guard on `status` in WHERE (`order-lifecycle.service.ts:35,166`) |
| Cron expiry vs pay/cancel | SAFE | cron cancel guards `status:"PENDING"`; callback guards same → mutual exclusion |
| Double VNPay callback (IPN + return) | SAFE | `payment.updateMany({status:"PENDING"})` idempotent (`:152`) |
| Restock twice | SAFE | `soldCount:{gte:qty}` guard + fallback (`:44-56`) |
| Duplicate order / idempotency key | SAFE | `orderNumber` and `CheckoutIdempotency.key` are `@unique`; P2002 recovery |

## Concurrency — scale caveats (not correctness)

1. **No `connection_limit` / pgbouncer** on `DATABASE_URL`. Under a real spike
   (100s of concurrent checkouts) Prisma's default pool can exhaust and requests
   queue/timeout. Set `?connection_limit=N&pool_timeout=…`, and on Neon use the
   pooled endpoint. This is a config change, not a code bug.
2. **Unbounded list reads.** `orders` list for staff and `products` without an
   explicit `take` can `findMany` the whole table. Add hard caps.
3. **READ COMMITTED** default is fine given the guards; consider
   `isolationLevel: Serializable` only if coupon contention proves extreme.

## Security — solid, verified by hand

- AdminZ per-request `requirePermission(...)` on every admin route sampled (8+).
- IDOR: customer routes scope by `userId` / email in WHERE (orders, addresses,
  favorites, profile).
- Zod on every mutating route; no `$queryRaw` interpolation; no mass-assignment.
- Session revocation via `sessionVersion`; admin MFA enforced in `authorize`.
- CSP is nonce-based, no `unsafe-inline` scripts in production.
- Cloudinary upload is staff-only, server-signed, prefix-scoped.
- Rate limiting covers auth + public writes; fail-closed in production.

## Feature gaps that matter for go-live (VN, COD-heavy)

Corrected against two agent false positives — `InventoryTransaction` **is** used
(`checkout.service.ts:193`, `order-lifecycle.service.ts:59`,
`admin/inventory/route.ts`, `catalog-service.ts:218`), and the admin import form
**does** POST to `/api/admin/inventory`. Both were hallucinated as missing.

Genuine gaps:

1. **Newsletter has no backend** — `Footer.handleSubscribe` only toasts; no model,
   no route. Dead form.
2. **Invoice PDF export** — modal is display-only; VN tax records need a real PDF.
3. **Legal pages stubbed** — privacy / terms / cookies footer links are `#`.
4. **Social links inert** — brand names render without hrefs.
5. **Multi-device cart** — localStorage only (documented, intentional).
6. **VisualizerDesign** persistence — model + route exist but the UI uses mock
   data and never calls the API.
7. **Refund** is an admin status toggle only — no bank/VNPay refund call.

Everything else (catalog, cart, checkout ×3 methods, coupons, orders lifecycle,
reviews, blog, dealers, B2B quotes, chat, full profile suite, RBAC admin, audit
log, transactional email outbox with retry) is implemented.


## Follow-up: 4 feature gaps closed

1. **Newsletter now has a backend.** New `NewsletterSubscriber` model +
   migration `20260726150243_newsletter_subscriber`; `POST /api/newsletter`
   (Zod, public-write rate limit 5/min, generic non-enumerating response);
   `src/lib/newsletter.ts` is idempotent (subscribe twice = no-op, reactivates
   an unsubscribed address) with an opaque unsubscribe token. Footer form does a
   real fetch with loading/error states. Verified live: 200 / 200 (dedupe to one
   row) / 400. Tests in `tests/newsletter.test.ts`; OpenAPI + inventory updated.
2. **Legal pages** — `/privacy-policy`, `/terms-of-service`, `/cookie-policy`,
   real Vietnamese content (privacy cites Nghị định 13/2023), Long Document
   family via a shared `LegalDocument`. Footer links now point at them.
3. **Social links** — real `https` hrefs from `NEXT_PUBLIC_SOCIAL_*` env with
   brand defaults (Facebook / Instagram / YouTube / Zalo — VN-relevant), open in
   a new tab, and the whole row hides if none are configured. No more `#`.
4. **Printable invoice** — `/(print)/admin/invoices/[orderNumber]/print`,
   admin/staff-only (anon → /login, verified), a proper VN sales invoice
   rendered as print-CSS HTML (Ctrl+P → Save as PDF), no PDF library, CSP-safe.
   Wired into the admin InvoiceModal.

**Latent bug found and fixed while verifying #4:** Footer, ChatBubble, and
MainLayoutWrapper guarded on `pathname.startsWith("/admin")` against the raw
locale-prefixed path (`/vi/admin/...`), so the guard never matched — the public
footer and chat bubble leaked onto the invoice print page (and would have
printed). All three now strip the locale prefix first, matching how the Header
already did it.

Gates after this pass: typecheck ✅ · lint ✅ · 170/170 unit ✅ · build ✅ ·
e2e 52/52 ✅.


## Follow-up: multi-device cart + saved visualizer designs

**Multi-device cart sync** (was localStorage-only, intentionally deferred):
- New `CartItem` model (`unique(userId, paintId, colorCode)`, `colorCode` NOT
  NULL defaulting to `""` so the key is stable) + migration
  `20260726180001_cart_persistence`.
- `src/lib/cart-merge.ts` — pure, testable union logic; `cart.service.ts` writes
  atomic snapshots and drops delisted paints; `GET/PUT /api/cart` +
  `POST /api/cart/merge`.
- `CartSync` (mounted in root layout): on sign-in it merges the guest cart into
  the server cart (union of quantities) and adopts the result; while
  authenticated it pushes every change debounced; on sign-out it leaves the
  local cart alone.
- Verified end to end via authenticated API: Device A PUT {p0:2}; Device B merge
  {p0:3, p1:1} → server = {p0:5, p1:1} — the union, no lost items.
  Tests in `tests/cart-merge.test.ts`.

**Saved visualizer designs** — the persistence code (models, service,
`GET/POST/PATCH/DELETE /api/visualizer/designs`, and the wired VisualizerClient
save/open/delete UI) already existed; the earlier "UI uses mock data" claim was
another agent false positive. The real gap was that **`VisualizerRoom` was never
seeded**, so `/api/visualizer/rooms` returned empty and there was no room to bind
a design to. Added the four rooms (facade/living/bedroom/kitchen) to `seed.ts`.
Verified end to end: create (201) → list (1) → reload (200, palette intact) →
delete (200); and the logged-in UI shows the four room tabs, the name field, the
Save button and the "My designs" list.

**Migration ordering fix:** new migrations were auto-timestamped from the machine
clock (15:0x) which sorted *before* the hand-dated visualizer/blog migrations
(16:00/17:00) — the newsletter migration even carried an
`ALTER TABLE VisualizerDesign` that would replay before the table existed. The
two new migrations were renamed to `20260726180000/180001` so a fresh
`migrate deploy` applies them last, in a valid order.

Gates: typecheck ✅ · lint ✅ · 174/174 unit ✅ · openapi coverage ✅ · build ✅ ·
e2e 50/50 ✅.
