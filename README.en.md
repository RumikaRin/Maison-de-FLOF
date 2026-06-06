# Maison de FLOF — Premium Paint Distribution & Consultation Platform

[Tiếng Việt](./README.md) | **English**

Maison de FLOF (FLOF Paint Platform) is a modern e-commerce and paint color consultation platform built on top of Next.js 15, React 19, TailwindCSS, Prisma, and PostgreSQL (Neon DB).

The project delivers a comprehensive digital experience, ranging from browsing premium paint catalogs, real-time interactive color visualization on sample spaces (Color Visualizer), finding nearby authorized distributors (Find Dealer), to a robust administrative dashboard (Admin Dashboard).

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.1 (App Router) & React 19.
- **Styling**: TailwindCSS & Tailwind Animate.
- **Effects & Animations**: Framer Motion (Page Transitions, Smooth Entrance Animations).
- **State Management**: Zustand.
- **Data Fetching**: `@tanstack/react-query` (React Query).
- **Form Handling**: React Hook Form with Zod validation.
- **Map Integration**: MapLibre GL (`maplibre-gl`) for dealer locator.
- **Charts**: Chart.js & React-Chartjs-2.
- **Toasts**: Sonner.

### Backend & Database
- **Database**: PostgreSQL (Hosted on Neon Serverless Database).
- **ORM**: Prisma Client v6.
- **Authentication**: NextAuth.js v5 (Beta 25) integrated with Prisma Adapter.
- **Email Delivery**: Resend SDK.
- **Media Storage**: Cloudinary.

---

## ✨ Key Features

### 1. Client Portal (B2C)
- **Homepage**: Elegant "Glassmorphism" styled landing page featuring smooth scrolling entrance animations and the 2026 Color Trends collection.
- **Products**: Search and filter products by category (primers, interior, exterior, waterproofing) and paint finish (Matte, Satin, Gloss, Semi-Gloss).
- **Color Visualizer**:
  - Interactively preview paint colors on 4 rooms: Living Room, Bedroom, Kitchen, and Facade.
  - Instantly switch colors, save to favorites, and submit a consultation request form.
- **Find Dealer**: Locates authorized distributor stores by Province and District, displayed interactively using MapLibre GL maps.
- **Cart & Checkout**: Local cart management using Zustand, coupon code support, and cash-on-delivery (COD) order placement.
- **Profile**: Manages personal profile details, order history, tracking order status, and viewing favorite paint colors or items.

### 2. Admin Portal
URL: `/admin` (Requires account with ADMIN or STAFF role)
- **Dashboard**: Track overall revenue, total orders, customers, items sold, low-stock warnings (minStock alert), and revenue charts using Chart.js.
- **Orders Management**: Process and update order statuses (PENDING, CONFIRMED, PROCESSING, SHIPPING, COMPLETED, CANCELLED).
- **Consultation Requests Management**: Review and track color consultation forms submitted from the Color Visualizer.
- **Categories & Paints Management**: Full CRUD operations for paint products, SKUs, sales price, cost price, stock levels, and gallery images.
- **Colors Management**: Manage paint color codes, names in English/Vietnamese, HEX/RGB values, and color collections.
- **Dealers Management**: Manage contact information and coordinates (latitude/longitude) of authorized dealers.
- **Coupons Management**: Set up discount coupons (percentage or fixed amount), minimum spend limits, usage limits, and active date ranges.

---

## 📂 Project Folder Structure

```text
├── prisma/               # Database Schema configuration & Seeding script
│   ├── schema.prisma     # Prisma Database Models
│   └── seed.ts           # Sample seed dataset (roles, users, colors, paints, dealers)
├── public/               # Static assets (logos, visualizer mockups)
├── src/
│   ├── app/              # Next.js App Router Pages
│   │   ├── admin/        # Admin portal (Dashboard, Orders, Catalog management, etc.)
│   │   ├── blog/         # News and color trends guides
│   │   ├── cart/         # Shopping cart page
│   │   ├── checkout/     # Order checkout processing
│   │   ├── color-visualizer/ # Interactive B2C room paint visualizer
│   │   ├── colors/       # Color swatches and collections overview
│   │   ├── find-dealer/  # Map-based dealer locator
│   │   ├── globals.css   # Main CSS & Tailwind configuration
│   │   └── page.tsx      # Maison de FLOF Homepage
│   ├── components/       # Reusable React components
│   │   ├── layout/       # Shared layouts (Header, Footer, AdminSidebar)
│   │   └── ui/           # Standard input, button, map, modal components
│   ├── lib/              # Helper utilities (translation dictionaries, Prisma client)
│   │   ├── dictionary.ts # Multilingual dictionary support (VI/EN)
│   │   └── prisma.ts     # Singleton Prisma Client instance
│   ├── providers/        # React-Query and Auth context providers
│   └── store/            # Zustand store (cart, wishlist)
├── .env.example          # Sample environment variables template
├── package.json          # Node dependencies & project scripts
└── tsconfig.json         # TypeScript configuration
```

---

## ⚙️ Installation & Setup Guide

### Step 1: Clone the Repository
```bash
git clone https://github.com/Manh-TH28-31/Maison-de-FLOF.git
cd Maison-de-FLOF
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a `.env` file in the root folder of the project by copying the `.env.example`:
```bash
cp .env.example .env
```
Open the `.env` file and populate it with your database and API credentials:
```env
# PostgreSQL connection string (e.g., Neon DB)
DATABASE_URL="postgresql://user:password@ep-host-name.pooler.neon.tech/dbname?sslmode=require"

# NextAuth configuration
AUTH_SECRET="your-super-secret-auth-key-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Cloudinary credentials (Optional - for image uploads)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Resend Mail SDK (Optional - for emails)
RESEND_API_KEY="re_yourApiKeyHere"
```

### Step 4: Synchronize Database & Seed Initial Data
The project uses Prisma to generate tables and populate them with over 50 realistic color swatches, authorized dealers, top paint brands (Jotun, Dulux, Nippon), and sample test accounts:
```bash
# Push schema changes to the database
npx prisma db push

# Seed initial database records
npx prisma db seed
```

### Step 5: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🔐 Sample Credentials (Seeded Users)

After running the database seed script successfully, you can sign in using these accounts:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (ADMIN)** | `admin@sonvn.com` | `admin123` | Full access to manage catalog, colors, dealers, view sales metrics, and update orders. |
| **Nhân viên (STAFF)** | `staff@sonvn.com` | `staff123` | Access to manage catalog, process orders, and handle color consultation requests. |
| **Khách hàng (CUSTOMER)** | `customer1@sonvn.com` | `customer123` | Ability to purchase items, add items to cart/wishlist, and view order history. |
