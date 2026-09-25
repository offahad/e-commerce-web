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
* [x] **Phase 4 — Cart, Promotions, Friday Flash Deals & Server-Side Pricing Engine**: Implemented & Verified (43/43 total automated tests passing)
  * Live Shopping Cart with variant validation, stock guards, and guest session merging
  * Customer Wishlist with toggle support and customer approval guard
  * Friday Flash Deal Engine with countdown timer, allocated stock limits, and remaining quota tracking
  * Deals of the Day daily discounted grocery showcase
  * Promotional Coupon Engine (`PERCENTAGE`, `FIXED_AMOUNT`, `FREE_SHIPPING`) with date ranges, min order amounts, and per-user limits
  * Server-Side Price Authority Engine (`/api/v1/checkout/preview`) ensuring zero client price manipulation
  * Dynamic Business Settings (Standard delivery fee, free delivery threshold, tax, operational currency in BDT ৳)
* [x] **Phase 5 — Checkout, Orders, Payments Strategy & Order Tracking Subsystem**: Implemented & Verified (57/57 total automated tests passing)
  * ACID Transactional Order Creation with row-level locks (`forUpdate()`) to prevent race conditions and overselling
  * Strategy Pattern Payment Engine (Cash on Delivery, bKash, Nagad, Rocket, Credit/Debit Cards)
  * Dynamic Delivery Fee calculation with Free Delivery rules over ৳1,000 threshold
  * Automatic stock reduction and immutable `inventory_transactions` audit logging upon order placement
  * Atomic stock restock and transaction auditing on order cancellation
  * Friday Flash Deal remaining quota deduction & coupon usage ledger tracking
  * Real-Time Public Order Tracking Timeline (`/api/v1/orders/track/:trackingNumber`) with multi-stage status progression
  * Admin Order Fulfillment Management: Status transitions (`PENDING` -> `CONFIRMED` -> `PROCESSING` -> `SHIPPED` -> `OUT_FOR_DELIVERY` -> `DELIVERED`), payment reconciliations, and printable tax invoice data
* [ ] **Phase 6 — Customer Storefront Web App & Progressive Web App**
* [ ] **Phase 7 — Admin Dashboard** (Overview Analytics, Customer Management, Inventory, Order Fulfillment, CRM)
* [ ] **Phase 8 — Frontend Polish & SEO**
* [ ] **Phase 9 — Full End-to-End & Concurrency Testing**
* [ ] **Phase 10 — Production Deployment & Docker Orchestration**

---

## Orders, Checkout & Payment Gateways Subsystem (Phase 5)

### 1. ACID Transactional Order Placement & Concurrency Guards (Section 18 & 55)
Every order is created within a strict database transaction (`knex.transaction`):
1. **Pessimistic Row-Locking**: Queries variants with `.forUpdate()` to lock rows, preventing overselling or race conditions during peak traffic or flash deal rushes.
2. **Stock Verification**: Verifies `stock_quantity >= item.quantity`. Rejects immediately if insufficient stock.
3. **Flash Deal Quotas**: Decrements `flash_deal_items.sold_stock` atomically and applies deal price if eligible.
4. **Server Price Authority**: Recalculates subtotal from server variant prices. The client can never manipulate order costs.
5. **Promotional Coupon Redemption**: Validates minimum order amount and per-user usage limits, increments `coupons.used_count`, and writes to `coupon_usages`.
6. **Stock Reduction & Audit Ledger**: Decrements variant inventory and creates an immutable `inventory_transactions` record marked `STOCK_OUT` with `reference_id = orderNumber`.
7. **Order & Order Items Record**: Writes order header, line items snapshot, and initial `order_status_history` record (`PENDING`).
8. **Cart Clearing**: Empties the customer's cart atomically.

### 2. Strategy Pattern Payment Subsystem (Section 19)
Clean, extensible payment gateway architecture implementing `IPaymentGateway`:
* `CodGateway`: Cash on Delivery with zero processing fee and cash verification instructions.
* `BkashGateway`: Direct integration adapter with bKash payment gateway simulator (URL generation, callback verification, execute payment).
* `NagadGateway`: Nagad mobile financial service adapter.
* `PaymentGatewayFactory`: Dynamic resolution of payment gateways for COD, bKash, Nagad, Rocket, and Card.

### 3. Public Real-Time Tracking Timeline (Section 55)
Customers and recipients can track their orders using their unique tracking number (`TRK-YYYYMMDD-XXXXXX`) without needing an account:
* Order Placed (`PENDING`)
* Order Confirmed (`CONFIRMED`)
* Packaging & Quality Check at Warehouse (`PROCESSING`)
* Dispatched to Delivery Team (`SHIPPED`)
* Out for Doorstep Delivery in Dhaka (`OUT_FOR_DELIVERY`)
* Successfully Delivered (`DELIVERED`) — automatically marks COD orders as `PAID`.

### 4. Cancellation & Atomic Restock (Section 18)
Eligible orders (`PENDING` or `CONFIRMED`) can be cancelled by the customer or admin:
* Reverts variant inventory levels atomically.
* Creates `inventory_transactions` audit logs marked `STOCK_IN` with reason "Order Cancellation Restock".
* Appends `CANCELLED` state to `order_status_history`.

---

---

## Cart, Promotions & Server-Side Pricing Engine (Phase 4)

### 1. Server-Side Price Authority Rule (Sections 13 & 75)
The frontend client **NEVER** calculates the final payable amount. The client submits only `variant_id` and `quantity`. The backend executes the verified pipeline:
1. **Variant & Stock Validation**: Looks up live DB records, ensures product is `ACTIVE`, and verifies requested quantity $\le$ warehouse stock.
2. **Dynamic Flash Deal Check**: If the variant is part of an active Friday Flash Deal campaign within the valid time window, the deal price takes precedence.
3. **Subtotal Calculation**: Computes verified subtotal from server-authoritative prices.
4. **Coupon Verification**: Validates coupon active status, start/end date, total usage count, customer per-user limit, and minimum cart threshold before applying discount.
5. **Delivery Charge Rules**: Fetches system settings (Standard ৳60 delivery fee inside Dhaka; automatically ৳0 Free Delivery when subtotal $\ge$ ৳1,000 threshold or when a `FREE_SHIPPING` coupon is redeemed).
6. **Grand Total Output**: Calculates exact payable amount in BDT (৳).

### 2. Friday Flash Deal Architecture & Concurrency (Section 12)
* Flash deal items feature strictly allocated stock quotas with `sold_stock` tracking.
* Prevents overselling with database row-level locking (`FOR UPDATE`) and `max_per_customer` enforcement.
* Countdown timer calculation providing exact server time and remaining seconds.

### 3. Shopping Cart & Wishlist Subsystems
* Supports both guest shoppers (via `X-Session-ID` header/cookie) and authenticated customers.
* Automatically merges guest cart items into the user's account cart upon customer login.
* Wishlist subsystem integrated with RBAC and customer account approval verification (`customerApprovalGuard`).

---

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
All 57 integration tests run in ~10 seconds across authentication, customer approval, catalog search, variants, inventory ledger, shopping cart, flash deals, coupons, pricing engine, transactional order placement, stock deduction, payment gateways, and public tracking timelines.

---

## Default Seeded Admin Credentials
* **Phone**: `01700000000`
* **Password**: `Admin@123456`
* **Role**: `SUPER_ADMIN`
*(Note: Change admin password in production via `.env` or settings)*
