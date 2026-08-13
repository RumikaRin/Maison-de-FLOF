# Maison de FLOF

[Tiếng Việt](./README.md) | **English**

Maison de FLOF is an e-commerce and interactive paint color consultation platform built with Next.js 15 (App Router), React 19, Tailwind CSS, Prisma ORM, and PostgreSQL (Neon).

The application provides an end-to-end digital experience: browsing color swatches, real-time room paint visualization, locating authorized dealers via interactive maps, online checkout via VNPay, and a comprehensive admin portal.

---

## Tech Stack & Architecture

### Core Stack
- **Frontend**: Next.js 15.5 (App Router), React 19, Tailwind CSS 3.4, Framer Motion
- **State & Data**: Zustand (Client UI/Cart state), React Query (Server cache)
- **Backend**: Next.js Route Handlers, Service Layer Pattern, Zod Validation
- **Database & ORM**: PostgreSQL (Neon Serverless DB), Prisma 6.0 with 36 Models & 17 CHECK Constraints
- **Authentication**: Auth.js v5 (NextAuth beta.32) + DB Session Registry, Admin TOTP MFA
- **Security**: Content Security Policy with dynamic per-request Nonce, Upstash Redis Rate Limiting (fail-closed), VNPay HMAC-SHA512 verification
- **Storage & Email**: Vercel Blob (`@vercel/blob`), Resend SDK with Transactional Outbox pattern
- **Maps & Charts**: MapLibre GL, Chart.js

---

## Key Features

### Storefront (B2C Client Portal)
- **Color Catalog & Search**: Filter swatches by color family, tone, NCS/RAL systems, and surface application.
- **Room Visualizer**: Preview paint colors live across 4 room scenes (Living Room, Bedroom, Kitchen, Facade) using CSS blend modes (`multiply` / `soft-light`). Save custom color palettes to user accounts.
- **Find Dealer**: Map-based locator pinpointing authorized distributors by Province and District using MapLibre GL.
- **Cart & Checkout**: Zustand cart with local storage persistence that automatically union-merges with server cart on sign-in. Supports COD and VNPay payments (with idempotency protection).
- **Profile & Customer Care**: Track orders, manage wishlists, submit product reviews, and configure security settings (MFA, password reset, GDPR data export).

### Admin Portal
- Accessible at `/admin` (Requires `ADMIN` or `STAFF` role).
- **Dashboard**: Revenue analytics, order volume, low-stock warnings, and performance charts.
- **Catalog Management**: Full CRUD for paints, SKUs, swatches, annual color collections, and hierarchical category trees.
- **Orders & Payments**: Process order transitions (PENDING → COMPLETED/CANCELLED), inspect status history, and verify payment callbacks.
- **Inventory & Transactions**: Track stock movements (InventoryTransaction: IMPORT, EXPORT, ADJUSTMENT).
- **Media & Content**: Manage Vercel Blob image library and publish bilingual blog posts.
- **Audit Logging**: Trace administrative actions with automatic PII sanitization.

---

## Directory Structure

```text
.
├── prisma/                  # DB schema, CHECK constraints & data seeding
├── public/                  # Static assets & room visualizer mockups
├── src/
│   ├── app/                 # Next.js App Router (pages, layouts, API routes)
│   │   ├── admin/           # Admin portal
│   │   ├── api/             # API Route Handlers (115 operations)
│   │   ├── color-visualizer/# Interactive room paint visualizer
│   │   ├── colors/          # Color swatches and collections
│   │   └── find-dealer/     # Map-based dealer locator
│   ├── components/          # React components (admin, features, layout, ui)
│   ├── lib/                 # Core utilities (auth, csp, rate-limit, storage)
│   ├── services/            # Domain service layer (checkout, order, privacy, mfa)
│   ├── store/               # Zustand stores (cart, language, theme)
│   └── middleware.ts        # Edge middleware (nonce CSP, rate limit, i18n, auth guard)
├── tests/                   # 200 unit tests & 24 DB integration tests
└── docs/                    # OpenAPI 3.1 specs & ERD diagrams
```

---

## Setup & Local Development

### Prerequisites
- Node.js >= 24
- PostgreSQL 16+ or Neon Database account

### Installation Steps

1. **Clone repository and install dependencies**:
   ```bash
   git clone https://github.com/RumikaRin/Maison-de-FLOF.git
   cd Maison-de-FLOF
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Update database connection parameters in `.env.local`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/flof_dev"
   AUTH_SECRET="your-32-character-secret-key"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

3. **Run Migrations & Seed Data**:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## Testing & Verification

The repository includes a multi-tiered test suite:

```bash
# Run ESLint & TypeScript typecheck
npm run lint
npm run typecheck

# Run 200 Unit Tests (Node.js test runner)
npm test

# Run 24 PostgreSQL Integration Tests
npm run test:integration

# Build Production Bundle & Check Bundle Budgets
npm run build
npm run test:bundle

# Validate OpenAPI 3.1 Specification Coverage
npm run test:openapi

# Run Playwright E2E Tests
npm run test:e2e

# Gatekeeper command before commit
npm run check
```

---

## Demo Accounts

After executing `npm run db:seed`:

- **Admin**: `admin@flof.vn` / `Admin@123456` *(Requires TOTP MFA code if enabled)*
- **Staff**: `staff@flof.vn` / `Staff@123456`
- **Customer**: `customer@flof.vn` / `Customer@123456`

---

## License

Released under the [MIT License](LICENSE).
