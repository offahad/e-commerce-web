# Liton Brothers — Full-Stack E-Commerce Platform

Production-ready, multi-channel e-commerce ecosystem built with Node.js, TypeScript, Next.js, and PostgreSQL.

---

## System Status & Current Milestones
* [x] **Phase 1 — System Architecture, ERD & Technical Specifications**: Complete [`ARCHITECTURE_SPECIFICATION.md`](./ARCHITECTURE_SPECIFICATION.md)
* [x] **Phase 2 — Backend Foundation, Authentication, RBAC & Customer Approval**: Implemented & Verified (14/14 tests passing)
* [x] **Phase 3 — Catalog & Inventory Management**: Implemented & Verified (27/27 total automated tests passing)
  * Hierarchical Categories (Parent & Nested Child Categories)
  * Brand Management
  * Tag System for dynamic product sections
  * Product Catalog & Faceted Search Engine
  * Multi-Quantity Purchasable Variants (500 ML, 1L, 2L, 5L, etc.)
  * Immutable Inventory Stock Ledger (`STOCK_IN`, `STOCK_OUT`, `ADJUSTMENT`)
  * Low-Stock & Out-of-Stock Alert Engine
  * Automated Price Change History Ledger (Section 76)
  * Sharp Image Upload & Optimization (WebP Conversion + Thumbnails)
* [ ] **Phase 4 — Customer Shopping Experience** (Customer Storefront Web, Product Details, Cart, Wishlist)
* [ ] **Phase 5 — Checkout, Orders & Payments** (ACID Transactional Orders, bKash/Nagad/COD Gateways, Invoice, Tracking)
* [ ] **Phase 6 — Deals & Promotions** (Friday Flash Deals with High-Concurrency Shield, Deals of the Day, Coupons)
* [ ] **Phase 7 — Admin Dashboard** (Overview Analytics, Customer Management, Inventory, Order Fulfillment, CRM)
* [ ] **Phase 8 — Frontend Polish & SEO**
* [ ] **Phase 9 — Full End-to-End & Concurrency Testing**
* [ ] **Phase 10 — Production Deployment & Docker Orchestration**

---

## Catalog & Inventory Architecture (Phase 3)

### 1. Hierarchical Categories & Taxonomies
* **Tree Structure**: Categories support parent-child relationships (e.g. `Grocery` -> `Cooking Oil`, `Rice`, `Masala & Spices`).
* **Brands**: Linked with products, logos, descriptions, and active status filters.
* **Tags**: Flexible grouping allowing products to surface in multiple homepage collections (e.g. `Friday Flash Deal`, `Deals of the Day`, `Popular`, `Best Seller`).

### 2. Multi-Quantity Product Variants (Section 15)
Products support distinct purchasable quantities:
* **Edible Oil**: `500 ML`, `1 Liter`, `2 Liter`, `5 Liter`
* **Rice**: `1 KG`, `5 KG`, `10 KG`, `25 KG`
* **Spices**: `100 Gram`, `200 Gram`, `500 Gram`
* **Eggs**: `4 Pieces (Hali)`, `12 Pieces (Dozen)`, `30 Pieces (Tray)`

Each variant maintains its own SKU, unit, quantity multiplier, base price, sale price, barcode, and isolated inventory level.

### 3. Inventory Stock Ledger & Concurrency
* Stock changes never directly mutate without creating an immutable entry in `inventory_transactions`.
* Tracks `previous_stock`, `new_stock`, `quantity_changed`, `transaction_type` (`STOCK_IN`, `STOCK_OUT`, `ADJUSTMENT`), `reason`, `reference_id`, and `performed_by`.
* Real-time stock alerts for low inventory (`stock <= low_stock_threshold`) and sold-out products (`stock = 0`).

### 4. Automated Price History (Section 76)
Whenever an administrator updates a product's base price or sale price, the previous and new pricing are automatically recorded in `price_history` with actor ID and timestamp.

### 5. Media Management with Sharp (Section 54)
* Multipart file uploads via Multer.
* Binary MIME validation (JPEG, PNG, WebP).
* Sharp re-encoding strips dangerous EXIF tags and converts images to next-gen WebP format.
* Automatically creates high-resolution image (`1200x1200px max`) and optimized thumbnail (`300x300px`).

---

## Getting Started

### Prerequisites
* Node.js v20+ / v22+
* npm or pnpm

### Environment Configuration
Copy `.env.example` to `backend/.env`:
```bash
cp .env.example backend/.env
```

### Running Backend in Development
```bash
cd backend
npm install
npm run dev
```

The API service starts on port `4000`:
* Base API: `http://localhost:4000/api/v1`
* Health Check: `http://localhost:4000/api/v1/health`
* Interactive Swagger UI: `http://localhost:4000/api/docs`
* Raw OpenAPI 3.0 JSON: `http://localhost:4000/api/docs/openapi.json`

### Running Automated Tests
```bash
cd backend
npm test
```
All 27 integration tests run in ~4 seconds across authentication, customer approval, catalog search, variants, inventory ledger, and image processing.

---

## Default Seeded Admin Credentials
* **Phone**: `01700000000`
* **Password**: `Admin@123456`
* **Role**: `SUPER_ADMIN`
*(Note: Change admin password in production via `.env` or settings)*
