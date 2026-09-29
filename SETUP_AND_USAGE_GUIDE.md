# Liton Brothers — Complete Setup, Running & Operations Manual

This comprehensive guide explains how to install, configure, run, test, and operate the complete **Liton Brothers** multi-channel e-commerce system. It covers the **Customer Storefront UI**, **Operations Admin Portal**, **Backend REST API**, **Database & Double-Entry Ledger**, and **Automated Test Suites**.

---

## Table of Contents
1. [Architecture & System Overview](#1-architecture--system-overview)
2. [Prerequisites & System Requirements](#2-prerequisites--system-requirements)
3. [Repository Structure](#3-repository-structure)
4. [Step-by-Step Installation](#4-step-by-step-installation)
5. [Configuration & Environment Variables](#5-configuration--environment-variables)
6. [How to Run the Application](#6-how-to-run-the-application)
   * [Mode A: Unified Full-Stack Production Mode (Recommended)](#mode-a-unified-full-stack-production-mode-recommended)
   * [Mode B: Independent Development Mode (Hot-Reloading)](#mode-b-independent-development-mode-hot-reloading)
   * [Mode C: Production Server Deployment (PM2 / Docker)](#mode-c-production-server-deployment-pm2--docker)
7. [Pre-Seeded Credentials & Roles](#7-pre-seeded-credentials--roles)
8. [Customer Storefront User Guide (How to Use & Test the UI)](#8-customer-storefront-user-guide-how-to-use--test-the-ui)
   * [Catalog Navigation & Live Autocomplete Search](#catalog-navigation--live-autocomplete-search)
   * [Friday Flash Deals & Live Countdown Timer](#friday-flash-deals--live-countdown-timer)
   * [Multi-Quantity Variant Switching on Product Cards](#multi-quantity-variant-switching-on-product-cards)
   * [Product Detail Modal & Image Gallery](#product-detail-modal--image-gallery)
   * [Cart Drawer & Free Delivery Progress Bar](#cart-drawer--free-delivery-progress-bar)
   * [Applying Promotional Coupons & Vouchers](#applying-promotional-coupons--vouchers)
   * [One-Page Checkout & Payment Options](#one-page-checkout--payment-options)
   * [Real-Time Public 6-Stage Order Tracking](#real-time-public-6-stage-order-tracking)
   * [Customer Account Portal & Order Cancellation](#customer-account-portal--order-cancellation)
9. [Operations Admin Portal Guide (Store Management)](#9-operations-admin-portal-guide-store-management)
   * [Real-Time KPI Dashboard](#real-time-kpi-dashboard)
   * [Customer Approval Workflow (`PENDING_APPROVAL` $\rightarrow$ `ACTIVE`)](#customer-approval-workflow)
   * [Order Fulfillment & Status Transitions](#order-fulfillment--status-transitions)
   * [Printable Formal Tax Invoices](#printable-formal-tax-invoices)
   * [Warehouse Inventory & Stock Adjustments](#warehouse-inventory--stock-adjustments)
   * [Low Stock & Out of Stock Alerts](#low-stock--out-of-stock-alerts)
10. [REST API Documentation & Testing (Swagger UI / Postman)](#10-rest-api-documentation--testing-swagger-ui--postman)
11. [Running Automated Test Suites](#11-running-automated-test-suites)
12. [Troubleshooting & Common FAQs](#12-troubleshooting--common-faqs)

---

## 1. Architecture & System Overview

Liton Brothers is built using a modern **API-First Monorepo Architecture**:
* **Backend API Gateway**: Node.js, Express, TypeScript, Knex.js, SQLite with connection pooling, Winston structured logging, and Helmet/CORS security.
* **Frontend Web App (SPA / PWA)**: React 19, TypeScript, Vite, Tailwind CSS, Lucide icons, responsive layout optimized for mobile and desktop.
* **Database & Persistence**: SQLite relational database with ACID transactions, row-level stock locks, double-entry inventory ledger, price history logging, and pre-seeded Dhaka grocery products.
* **Promotions & Deals Engine**: Friday Flash Bazaar with real-time countdown, Deals of the Day, and dynamic voucher engine (`RAMADAN20`, `LITON100`, `FREEDEL`).
* **Payments Engine**: Strategy Pattern with Cash on Delivery (COD), bKash, Nagad, Rocket, and Card gateways.

---

## 2. Prerequisites & System Requirements

Before running the application, ensure the following software is installed on your machine:

| Software | Minimum Version | Recommended | Notes |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v18.0.0` | `v20.x` or `v22.x` (LTS) | `node -v` to check |
| **npm** | `v9.0.0` | `v10.x` | `npm -v` to check |
| **Git** | `v2.30.0` | Latest | `git --version` to check |
| **Browser** | Modern | Chrome / Firefox / Safari / Edge | For viewing the Storefront |

---

## 3. Repository Structure

```
e-commerce-web/
├── package.json                   # Root monorepo workspace configuration
├── package-lock.json              # Monorepo lockfile
├── README.md                      # Project summary & status
├── ARCHITECTURE_SPECIFICATION.md  # 25-Point technical architecture specification
├── SETUP_AND_USAGE_GUIDE.md       # This complete operations and testing manual
│
├── backend/                       # Backend REST API Service
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   ├── src/
│   │   ├── app.ts                 # Express application & static SPA serving
│   │   ├── server.ts              # Server bootstrapper & listener
│   │   ├── config/                # Environment variables configuration
│   │   ├── database/              # Schema migration, row-locks, & seed data
│   │   ├── common/                # Guards, middleware, utilities, error handlers
│   │   ├── docs/                  # Swagger UI & OpenAPI setup
│   │   └── modules/               # Domain feature modules:
│   │       ├── auth/              # Customer & admin JWT authentication
│   │       ├── users/             # Address manager & customer approval guard
│   │       ├── categories/        # Hierarchical category trees
│   │       ├── brands/ & tags/    # Catalog taxonomy
│   │       ├── products/          # Products & Multi-Quantity Variants
│   │       ├── inventory/         # Immutable double-entry stock ledger
│   │       ├── cart/ & wishlist/  # Shopping cart & customer wishlist
│   │       ├── deals/             # Friday Flash Deals & Deals of the Day
│   │       ├── coupons/           # Promotional voucher engine
│   │       ├── checkout/          # Server-Side Price Authority Engine (SSPA)
│   │       ├── orders/            # ACID transactional order placement & tracking
│   │       ├── payments/          # Gateway strategy adapters (COD, bKash, etc.)
│   │       ├── settings/          # Delivery fee & business parameters
│   │       └── media/             # Sharp WebP image processing
│   └── tests/                     # 57 Jest automated test suites
│
├── frontend/                      # Customer Storefront & Operations Admin Portal
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html                 # Root HTML with Google Fonts & responsive meta
│   ├── dist/                      # Production compiled assets (HTML, JS, CSS)
│   └── src/
│       ├── main.tsx               # React DOM entry point
│       ├── App.tsx                # Main application component & routing
│       ├── index.css              # Tailwind CSS styles & animations
│       ├── types/                 # Shared TypeScript interfaces
│       ├── services/api.ts        # Type-safe API client (relative `/api/v1`)
│       ├── context/               # React AuthContext & CartContext
│       └── components/            # UI Components:
│           ├── Header.tsx         # Sticky navigation, search autocomplete & pills
│           ├── CategoryBar.tsx    # Visual category explorer
│           ├── FridayFlashSection.tsx # Flash deal showcase with countdown timer
│           ├── DealsOfTheDaySection.tsx # Daily discount highlights
│           ├── ProductCard.tsx    # Card with Multi-Quantity Variant Pills
│           ├── ProductDetailModal.tsx # Full specifications & image gallery
│           ├── CartDrawer.tsx     # Slide-out cart & coupon input
│           ├── CheckoutModal.tsx  # 1-page checkout & Dhaka delivery slots
│           ├── OrderTrackingModal.tsx # Public 6-stage order tracking timeline
│           ├── AccountPortal.tsx  # Order history & address manager
│           ├── AdminPortal.tsx    # Staff Operations & Fulfillment Dashboard
│           └── Footer.tsx         # Delivery coverage, BSTI, & payment badges
│
└── api-docs/                      # API Specifications
    ├── openapi.json               # Full OpenAPI 3.0 specification
    └── liton-brothers.postman_collection.json # Ready-to-import Postman collection
```

---

## 4. Step-by-Step Installation

### Step 1: Clone the Repository & Check Out the Branch
```bash
git clone https://github.com/offahad/e-commerce-web.git
cd e-commerce-web
git checkout arena/01a0d551-e-commerce-web
```

### Step 2: Install All Dependencies
The project uses npm workspaces. Running `npm install` at the root automatically installs dependencies for both `backend` and `frontend`:
```bash
npm install
```

---

## 5. Configuration & Environment Variables

Default configuration works out-of-the-box using SQLite. If you wish to customize port numbers or JWT secrets, create a `.env` file in `backend/`:

```bash
# In backend/.env
PORT=4000
NODE_ENV=development
JWT_ACCESS_SECRET=liton-brothers-access-secret-2026-very-secure
JWT_REFRESH_SECRET=liton-brothers-refresh-secret-2026-very-secure
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
DATABASE_CLIENT=sqlite3
```

---

## 6. How to Run the Application

### Mode A: Unified Full-Stack Production Mode (Recommended)
In this mode, the Express backend serves the production-compiled React frontend at the root path (`/`) while exposing all API routes at `/api/v1` and Swagger UI at `/api/docs`.

```bash
# 1. Build both Frontend and Backend
npm run build

# 2. Start the Unified Server
npm run start --prefix backend
# OR during development with auto-reload:
npm run dev --prefix backend
```

Once started, open your browser and navigate to:
* **Customer Storefront Web App**: [http://localhost:4000/](http://localhost:4000/)
* **Interactive API Documentation (Swagger)**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
* **Raw OpenAPI Specification**: [http://localhost:4000/api/docs/openapi.json](http://localhost:4000/api/docs/openapi.json)
* **API Health Check**: [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)

---

### Mode B: Independent Development Mode (Hot-Reloading)
For active frontend development with Vite Hot Module Replacement (HMR):

1. **Terminal 1 — Start the Backend API (Port 4000)**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Terminal 2 — Start the Vite Dev Server (Port 5173)**:
   ```bash
   cd frontend
   npm run dev
   ```
   Open [http://localhost:5173/](http://localhost:5173/) in your browser. All API requests are automatically proxied to `http://localhost:4000/api/v1`.

---

### Mode C: Production Server Deployment (PM2 / Docker)

#### Using PM2:
```bash
npm install -g pm2
npm run build
pm2 start backend/dist/server.js --name "liton-brothers"
pm2 save
```

#### Using Docker:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 4000
CMD ["npm", "run", "start", "--prefix", "backend"]
```

---

## 7. Pre-Seeded Credentials & Roles

The system is pre-populated with ready-to-test accounts representing different roles:

| Role | Phone Number | Password | Account Status | Permissions & Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `01700000000` | `AdminSecret123!` | `ACTIVE` | Full control: Customer approvals, stock adjustments, order fulfillment, pricing history, and tax invoices. |
| **Store Manager**| `01711000000` | `ManagerPass123!` | `ACTIVE` | Warehouse inventory adjustments, stock alerts, order status updates. |
| **Approved Customer** | `01800000000` | `CustomerPass123!` | `ACTIVE` | Place orders, apply coupon codes, manage address book, cancel orders. |
| **Pending Customer** | `01900000000` | `CustomerPass123!` | `PENDING_APPROVAL` | Can browse catalog, but order checkout is blocked until an Admin approves the account. |

> **Tip**: The Sign In dialog in the UI includes **one-click demo login buttons** for instant testing without typing credentials!

---

## 8. Customer Storefront User Guide (How to Use & Test the UI)

### Catalog Navigation & Live Autocomplete Search
1. Open [http://localhost:4000/](http://localhost:4000/).
2. Type in the top search box (e.g., `"Soybean"`, `"Rice"`, `"Spices"`, or `"Teer"`).
3. An instant autocomplete dropdown appears with matching products, categories, and brands with live pricing and thumbnails.
4. Click any category pill (*Cooking Oil*, *Rice & Grains*, *Masala & Spices*, *Dairy & Eggs*) to filter the catalog instantly.

### Friday Flash Deals & Live Countdown Timer
1. At the top of the homepage, locate the **Mega Friday Flash Bazaar** section.
2. The countdown timer ticks down in real time: `[DD] Days : [HH] Hours : [MM] Mins : [SS] Secs`.
3. Each flash deal card shows:
   * Deal price (e.g., ৳165 vs Regular ৳180)
   * Allocated campaign quota (e.g., 50 units)
   * Real-time remaining stock progress bar.

### Multi-Quantity Variant Switching on Product Cards
1. Locate **Teer Pure Soybean Oil** or **Fresh Chinigura Rice** in the product grid.
2. Notice the interactive variant pills:
   * **Teer Oil**: `500 ML`, `1 Liter`, `2 Liter`, `5 Liter`
   * **Rice**: `1 Kg`, `5 Kg`, `10 Kg`, `25 Kg`
3. Click between different variant pills. The price (৳), sale price, savings percentage, and stock badge will update immediately without page reloading.

### Product Detail Modal & Image Gallery
1. Click on any product title or photo to open the **Product Detail Modal**.
2. View high-resolution imagery, package sizes, manufacturer details, and BSTI quality certifications.
3. Use the quantity stepper (`+` / `-`) and click **"Add to Cart"** or **"Buy Now"**.

### Cart Drawer & Free Delivery Progress Bar
1. Click the green **Cart Icon** in the top navigation bar to open the slide-out drawer.
2. **Free Delivery Progress Bar**:
   * Standard delivery fee in Dhaka is **৳60**.
   * Orders totaling **৳1,000 or more qualify for FREE Delivery**.
   * The progress bar tracks remaining amount needed (e.g. *"Add ৳350 more to unlock Free Delivery!"*).
3. Increment or decrement quantities directly in the drawer. The server validates live stock levels to prevent adding more than warehouse inventory.

### Applying Promotional Coupons & Vouchers
In the Cart Drawer, enter any of the pre-seeded coupons into the promo box and click **"Apply"**:
* **`RAMADAN20`**: 20% discount on orders of ৳500 or more.
* **`LITON100`**: ৳100 flat discount on orders of ৳800 or more.
* **`FREEDEL`**: 100% discount on the delivery fee.

> **Server-Side Price Authority Guarantee**: The frontend never calculates the payable amount. The server calculates and cryptographically verifies all subtotals, coupon validity, delivery fees, and taxes at `/api/v1/checkout/preview`.

### One-Page Checkout & Payment Options
1. In the Cart Drawer, click **"Proceed to Checkout"**.
2. Fill in the delivery recipient information (pre-filled if logged in as Demo Customer).
3. Select your preferred **Delivery Time Slot**:
   * *Morning Express (8 AM - 12 PM)*
   * *Afternoon Slot (1 PM - 5 PM)*
   * *Evening Slot (6 PM - 9 PM)*
4. Select your **Payment Method**:
   * **Cash on Delivery (COD)**: Pay upon doorstep delivery.
   * **bKash**: Seamless mobile financial service payment simulation.
   * **Nagad / Rocket / Debit & Credit Card**.
5. Click **"Confirm & Place Order"**.
6. The order is placed inside an ACID database transaction. You will receive an immediate confirmation with your **Order Number** (e.g., `ORD-2026-XXXX`) and **Tracking Number** (e.g., `TRK-2026XXXX-XXXXXX`).

### Real-Time Public 6-Stage Order Tracking
1. In the top navigation bar, click **"Track Order"**.
2. To test an active in-progress order immediately, use the pre-seeded tracking number:
   $$\mathbf{TRK\text{-}DEMO\text{-}2026\text{-}001}$$
3. Click **"Track Order"** to view the live fulfillment pipeline:
   * Stage 1: $\checkmark$ **Order Placed** (Timestamped)
   * Stage 2: $\checkmark$ **Order Confirmed** (Verified by store operations)
   * Stage 3: $\checkmark$ **Packaging & Quality Check** (Packed at Tejgaon warehouse)
   * Stage 4: $\bigcirc$ **Dispatched for Delivery**
   * Stage 5: $\bigcirc$ **Out for Doorstep Delivery**
   * Stage 6: $\bigcirc$ **Delivered**
4. View full itemized summary, delivery address, payment status (`bKash PAID`), and operations audit history.

### Customer Account Portal & Order Cancellation
1. Sign in as `01800000000` (Approved Customer).
2. Click **"My Account"** in the top navigation header.
3. In the **"My Orders"** tab:
   * View all your previous orders and their current status.
   * For orders still in `PENDING` or `CONFIRMED` status, click the red **"Cancel Order"** button.
   * Enter a reason (e.g., *"Placed by mistake"*).
   * The order will be cancelled immediately, and **warehouse inventory is atomically restocked** via the backend stock restoration engine.
4. In the **"Address Book"** tab:
   * Save and manage multiple delivery addresses (Home, Office).

---

## 9. Operations Admin Portal Guide (Store Management)

To access store operations, sign in with the Super Admin credentials (`01700000000` / `AdminSecret123!`) and click **"Admin Portal"** in the header.

### Real-Time KPI Dashboard
The Overview tab presents 4 real-time business health metrics:
* **Total Store Revenue (৳ BDT)**: Total collected across all confirmed and paid orders.
* **Pending Orders**: Orders awaiting confirmation and warehouse dispatch.
* **Pending Customer Approvals**: New customer registrations requiring review.
* **Low Stock Alerts**: Number of product variants with stock below the alert threshold (20 units).

### Customer Approval Workflow
In compliance with Section 5 of the requirements, new customer registrations are flagged as `PENDING_APPROVAL`:
1. Navigate to the **"Customer Approvals"** tab.
2. Review the list of customers awaiting verification.
3. Click **"Approve Account"** to activate the customer immediately.
4. Alternatively, click **"Block / Reject"** if credentials or contact details are suspicious.

### Order Fulfillment & Status Transitions
1. Navigate to the **"Order Fulfillment"** tab.
2. Filter orders by status (`PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`).
3. To advance an order, click **"Update Status"**:
   * Change status to `PROCESSING` or `SHIPPED`.
   * Add an internal operations comment (e.g., *"Assigned to Paperfly Courier rider #104"*).
   * When an order is updated to `DELIVERED`, **Cash on Delivery orders are automatically reconciled and marked as `PAID`**.

### Printable Formal Tax Invoices
1. In the **Order Fulfillment** list, click **"Print Invoice"** next to any order.
2. A formal tax invoice appears displaying:
   * Liton Brothers business header & BSTI trade registration numbers.
   * Customer details, shipping address, and delivery slot.
   * Itemized variant table with unit price, quantity, line totals, coupon discount, delivery fee, and net payable in **BDT (৳)**.
   * Click **"Print"** to trigger the browser's native print / save as PDF dialog.

### Warehouse Inventory & Stock Adjustments
1. Navigate to the **"Inventory & Stock"** tab.
2. View every product and multi-quantity variant alongside its current warehouse stock level.
3. To record inventory movements, click **"Stock In / Out"**:
   * Select the product and variant.
   * Choose transaction type: `STOCK_IN` (received supplier shipment), `STOCK_OUT` (damaged goods removal), or `ADJUSTMENT`.
   * Enter the quantity and reference number (e.g., `PO-2026-09-01`).
   * The system logs the change in the immutable **double-entry inventory ledger** and updates the available stock in real time.

### Low Stock & Out of Stock Alerts
* Variants with $\le 20$ units display a yellow **"Low Stock"** badge.
* Variants with $0$ units display a red **"Out of Stock"** badge.

---

## 10. REST API Documentation & Testing (Swagger UI / Postman)

### Interactive Swagger UI
Open your browser and navigate to:
```
http://localhost:4000/api/docs
```
You can execute and inspect all 35 production endpoints directly from the browser:
* `POST /api/v1/auth/login`: Test token generation.
* `GET /api/v1/products`: Test full-text search and faceted filters.
* `POST /api/v1/cart/items`: Test server-side cart operations.
* `POST /api/v1/checkout/preview`: Test server-side pricing engine.
* `POST /api/v1/orders`: Test transactional order placement.
* `GET /api/v1/orders/track/{trackingNumber}`: Test public tracking timeline.

### Postman Collection
Import the collection file directly into Postman:
```
api-docs/liton-brothers.postman_collection.json
```
Includes pre-configured requests, environment variables, authentication bearer tokens, and test scripts.

---

## 11. Running Automated Test Suites

The backend includes **57 automated integration and unit tests** built with Jest and Supertest.

### Run All 57 Tests:
```bash
npm test
```

### Run Specific Test Suites:
```bash
# Test 1: Authentication, Customer Approval Guard, & RBAC (14 tests)
npm test -- tests/auth-and-approval.test.ts

# Test 2: Catalog, Multi-Quantity Variants, & Inventory Ledger (13 tests)
npm test -- tests/catalog-and-inventory.test.ts

# Test 3: Cart, Wishlist, Flash Deals, Coupons, & Pricing Engine (16 tests)
npm test -- tests/cart-and-promotions.test.ts

# Test 4: Orders, Atomic Checkout, Row-Locks, & Payments (14 tests)
npm test -- tests/orders-and-checkout.test.ts
```

### Test Suite Summary:
```
PASS tests/orders-and-checkout.test.ts (14/14 passed)
PASS tests/cart-and-promotions.test.ts (16/16 passed)
PASS tests/catalog-and-inventory.test.ts (13/13 passed)
PASS tests/auth-and-approval.test.ts (14/14 passed)

Test Suites: 4 passed, 4 total
Tests:       57 passed, 57 total
Snapshots:   0 total
```

---

## 12. Troubleshooting & Common FAQs

### Q1: The server won't start because Port 4000 is already in use.
**Solution**: Either terminate the existing process or set a custom port:
```bash
# Find and terminate process on port 4000 (Linux/macOS)
lsof -i :4000 | awk 'NR>1 {print $2}' | xargs kill -9

# Or run on a different port:
PORT=5000 npm run dev --prefix backend
```

### Q2: Why does checkout say "Account Pending Approval"?
**Explanation**: In accordance with Section 5 of the specification, newly registered customer accounts are given the status `PENDING_APPROVAL` to prevent fraudulent grocery orders.
**Solution**: Log in as Super Admin (`01700000000` / `AdminSecret123!`), open the Admin Portal, go to **Customer Approvals**, and click **"Approve Account"**. Alternatively, log in as the pre-seeded approved customer (`01800000000` / `CustomerPass123!`).

### Q3: How do I reset the database to clean demo data?
**Solution**: Simply restart the backend server. The SQLite initialization automatically verifies schema tables and restores default seed records if needed:
```bash
npm run dev --prefix backend
```

### Q4: How do mobile applications (Flutter / React Native) authenticate?
**Explanation**: Mobile apps interact with the exact same endpoints under `/api/v1`:
1. Call `POST /api/v1/auth/login` with `{ "phone": "01800000000", "password": "..." }`.
2. Extract `accessToken` and `refreshToken` from `data.tokens`.
3. Include header `Authorization: Bearer <accessToken>` on all subsequent requests.
4. When access token expires (HTTP 401 `TOKEN_EXPIRED`), call `POST /api/v1/auth/refresh` to rotate tokens.
