# LITON BROTHERS — FULL-STACK E-COMMERCE PLATFORM
## SYSTEM ARCHITECTURE & IMPLEMENTATION BLUEPRINT (PHASE 1 SPECIFICATION)

---

## 1. COMPLETE SYSTEM ARCHITECTURE

Liton Brothers is architected as an **API-First, Modular, Decoupled E-Commerce Ecosystem**. The backend serves as the single source of truth for all business logic, data persistence, transaction handling, and security. It exposes versioned RESTful APIs (`/api/v1/*`) and WebSocket streams consumed by current web applications (Customer Website, Admin Dashboard) and future mobile clients (Flutter/React Native Customer App, Android/iOS Rider Delivery App, and external third-party integrations).

### High-Level System Architecture Diagram

```
+---------------------------------------------------------------------------------------------------------+
|                                              CLIENT TIER                                                |
+---------------------------------------------------------------------------------------------------------+
|  +--------------------+  +--------------------+  +--------------------+  +----------------------------+ |
|  | Customer Website   |  | Admin Dashboard    |  | Future Mobile App  |  | Future Delivery/Rider App  | |
|  | (Next.js 15 / SSR) |  | (Next.js 15 / SPA) |  | (Flutter / RN)     |  | (Flutter / Native)         | |
|  +---------+----------+  +---------+----------+  +---------+----------+  +-------------+--------------+ |
+------------|-----------------------|-----------------------|---------------------------|----------------+
             |                       |                       |                           |
             | HTTPS / WSS           | HTTPS / WSS           | HTTPS / WSS               | HTTPS / WSS
             v                       v                       v                           v
+---------------------------------------------------------------------------------------------------------+
|                                     EDGE & REVERSE PROXY TIER                                           |
+---------------------------------------------------------------------------------------------------------+
|  Nginx / Cloudflare / Traefik: SSL Termination, Rate Limiting, DDoS Mitigation, Gzip/Brotli, Static CDN |
+----------------------------------------------------+----------------------------------------------------+
                                                     |
                                                     v
+---------------------------------------------------------------------------------------------------------+
|                                           APPLICATION TIER                                              |
|                                    (Liton Brothers Backend API)                                         |
+---------------------------------------------------------------------------------------------------------+
|  [Security & Middleware]                                                                                |
|  - Helmet (HTTP Security Headers)          - CORS Whitelist                                             |
|  - Global Rate Limiter (Redis-backed)      - JWT Authentication & RBAC Guard                            |
|  - Global Validation Pipe (class-validator) - Maintenance Mode Interceptor                              |
|  - Request Logger & Trace ID (Correlation) - Standardized API Response / Error Interceptor              |
|                                                                                                         |
|  [Modular Domain Services]                                                                              |
|  +------------------------+ +------------------------+ +------------------------+ +-------------------+ |
|  | Auth & Security Module | | User & Customer Module | | Product & Catalog      | | Inventory Engine  | |
|  | - Phone + Pass Auth    | | - Approval State Mach. | | - Variants & Quantities| | - Atomic Ledger   | |
|  | - Token Rotation       | | - Profiles & Addresses | | - Categories & Brands  | | - Reservations    | |
|  +------------------------+ +------------------------+ +------------------------+ +-------------------+ |
|  +------------------------+ +------------------------+ +------------------------+ +-------------------+ |
|  | Cart & Pricing Engine  | | Order & Checkout Engine| | Payment Subsystem      | | Flash Deals Engine| |
|  | - Server-Side Authority| | - ACID Transaction     | | - Strategy Pattern     | | - High-Concurrency| |
|  | - Discount Evaluation  | | - Order State Machine  | | - COD/bKash/Nagad/Card | | - Redis Counter   | |
|  +------------------------+ +------------------------+ +------------------------+ +-------------------+ |
|  +------------------------+ +------------------------+ +------------------------+ +-------------------+ |
|  | Delivery Management    | | Marketing & Promotions | | CRM & Customer 360     | | CMS & Settings    | |
|  | - Zone & Threshold Fee | | - Coupons & Discounts  | | - RFM Segmentation     | | - Banners/Sliders | |
|  | - Rider Assignment     | | - Reviews & Moderation | | - Spending Analytics   | | - Shop Config     | |
|  +------------------------+ +------------------------+ +------------------------+ +-------------------+ |
|  +------------------------+ +------------------------+ +------------------------+ +-------------------+ |
|  | Audit Log Subsystem    | | Notification Service   | | Real-time Gateway      | | Health & Metrics  | |
|  | - Action Trails & Diffs| | - In-App / SMS / Email | | - WebSockets / SSE     | | - Live Probes     | |
|  +------------------------+ +------------------------+ +------------------------+ +-------------------+ |
+----------------------------------------------------+----------------------------------------------------+
                                                     |
                         +---------------------------+---------------------------+
                         v                                                       v
+----------------------------------------------------+  +------------------------------------------------+
|                   DATA TIER                        |  |             CACHE & QUEUE TIER                 |
+----------------------------------------------------+  +------------------------------------------------+
|  PostgreSQL 16 (Relational Primary Database):      |  |  Redis 7 (In-Memory Data Store):               |
|  - ACID Transactions for Orders & Inventory        |  |  - Session Store & Refresh Token Whitelist     |
|  - Row-Level Locking (`FOR UPDATE`) for Concurrency|  |  - Atomic Flash Deal Inventory Counters        |
|  - Normalized Schema with Foreign Keys & Cascades  |  |  - Distributed Rate Limiting                   |
|  - Composite B-Tree & Full-Text Search Indexes     |  |  - API Response Cache (Catalog, Settings)      |
|  - Auditing & Soft Delete Timestamps               |  |  BullMQ (Background Jobs & Asynchronous Tasks):|
|                                                    |  |  - SMS Notification Dispatch                   |
|  Object Storage (Local Filesystem / S3 / MinIO):   |  |  - Email Receipt Generation                    |
|  - Product Images & Thumbnails (Sharp optimized)   |  |  - Automatic Stock Reservation Expiry Worker   |
|  - Banner Ads & Category Icons                     |  |  - Invoice PDF Generation                      |
+----------------------------------------------------+  +------------------------------------------------+
```

---

## 2. RECOMMENDED TECHNOLOGY STACK

| Component | Technology | Selection Justification |
| :--- | :--- | :--- |
| **Backend Framework** | **Node.js 22 LTS + NestJS (TypeScript)** | Enterprise-grade modularity, native dependency injection, decorators for Swagger/OpenAPI auto-generation, built-in validation pipelines via `class-validator`, and first-class microservice/WebSocket support. |
| **Database & Engine** | **PostgreSQL 16** | Robust relational integrity, transactional ACID guarantees for e-commerce checkouts, row-level locking (`SELECT FOR UPDATE`) to prevent overselling, jsonb support for flexible attributes, and rich indexing (B-Tree, GIN for full-text search). |
| **ORM / Query Builder** | **Prisma ORM** | Type-safe database queries, automated zero-downtime migrations, declarative schema definition (`schema.prisma`), transaction API (`$transaction`), and easy database seeding. |
| **In-Memory Cache & Queue**| **Redis 7 + BullMQ** | Sub-millisecond latency for distributed rate limiting, token revocation blacklisting, atomic counters (`DECRBY`) for flash deal concurrency, and resilient background queues for notifications. |
| **Authentication & Crypto**| **Argon2id + Passport-JWT** | Argon2id is the gold-standard winner of the Password Hashing Competition (memory-hard, resistant to GPU/ASIC attacks). JWT access tokens with cryptographically signed refresh tokens stored hashed in DB. |
| **Media Processing** | **Multer + Sharp** | File streaming, MIME-type and magic-number validation, EXIF stripping, automated thumbnail creation, and conversion to next-gen WebP format. |
| **Customer Web Frontend** | **Next.js 15 (React 19, TypeScript)** | Server-Side Rendering (SSR) and Static Site Generation (SSG) for SEO-optimized product pages, fast Initial Page Load, Image optimization component, and responsive design with Tailwind CSS. |
| **Admin Dashboard UI** | **Next.js 15 / React SPA + TanStack Table** | Data-dense tables with multi-column sorting, faceted filtering, pagination, modal wizards, Recharts for analytics, and responsive drawer navigation. |
| **State Management** | **Zustand + TanStack Query v5** | Server-state caching and invalidation handled cleanly by TanStack Query; client-only state (drawer toggles, guest cart, active filters) managed via lightweight Zustand stores. |
| **API Documentation** | **OpenAPI 3.0 / Swagger UI** | Self-documenting API via `@nestjs/swagger` decorators, generating interactive `/api/docs` and downloadable `openapi.json` for client SDK code-generation. |
| **DevOps & Containers** | **Docker & Docker Compose** | Multi-stage production containerization, reproducible development environment with PostgreSQL, Redis, and hot-reload node environments. |

---

## 3. PROJECT FOLDER STRUCTURE (MONOREPO)

```
liton-brothers/
├── .github/
│   └── workflows/
│       ├── backend-ci.yml
│       └── frontend-ci.yml
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   ├── Dockerfile.backend
│   ├── Dockerfile.customer-web
│   └── Dockerfile.admin-dashboard
├── backend/
│   ├── src/
│   │   ├── common/
│   │   │   ├── constants/
│   │   │   ├── decorators/
│   │   │   ├── filters/
│   │   │   │   └── all-exceptions.filter.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   ├── rbac.guard.ts
│   │   │   │   └── approved-customer.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── transform-response.interceptor.ts
│   │   │   │   └── audit-log.interceptor.ts
│   │   │   ├── interfaces/
│   │   │   │   └── api-response.interface.ts
│   │   │   ├── pipes/
│   │   │   └── utils/
│   │   ├── config/
│   │   │   ├── configuration.ts
│   │   │   └── env.validation.ts
│   │   ├── database/
│   │   │   ├── prisma/
│   │   │   │   ├── schema.prisma
│   │   │   │   ├── migrations/
│   │   │   │   └── seed.ts
│   │   │   └── prisma.service.ts
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── dto/
│   │   │   │   ├── strategies/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   └── auth.service.ts
│   │   │   ├── users/
│   │   │   ├── products/
│   │   │   ├── categories/
│   │   │   ├── brands/
│   │   │   ├── tags/
│   │   │   ├── inventory/
│   │   │   ├── flash-deals/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── orders/
│   │   │   ├── payments/
│   │   │   ├── delivery/
│   │   │   ├── reviews/
│   │   │   ├── coupons/
│   │   │   ├── cms/
│   │   │   ├── crm/
│   │   │   ├── notifications/
│   │   │   ├── settings/
│   │   │   ├── audit-logs/
│   │   │   └── health/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── customer-web/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── (shop)/
│   │   │   │   ├── products/
│   │   │   │   ├── categories/
│   │   │   │   ├── deals/
│   │   │   │   ├── cart/
│   │   │   │   ├── checkout/
│   │   │   │   ├── account/
│   │   │   │   └── track-order/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── header/
│   │   │   ├── footer/
│   │   │   ├── product/
│   │   │   ├── cart/
│   │   │   └── checkout/
│   │   ├── hooks/
│   │   ├── services/
│   │   │   ├── api-client.ts
│   │   │   ├── auth.service.ts
│   │   │   └── product.service.ts
│   │   ├── stores/
│   │   │   ├── cart.store.ts
│   │   │   └── auth.store.ts
│   │   └── types/
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
├── admin-dashboard/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/login/
│   │   │   └── (dashboard)/
│   │   │       ├── overview/
│   │   │       ├── customers/
│   │   │       ├── products/
│   │   │       ├── categories/
│   │   │       ├── brands/
│   │   │       ├── tags/
│   │   │       ├── inventory/
│   │   │       ├── flash-deals/
│   │   │       ├── orders/
│   │   │       ├── coupons/
│   │   │       ├── reviews/
│   │   │       ├── cms/
│   │   │       ├── crm/
│   │   │       ├── reports/
│   │   │       ├── settings/
│   │   │       └── audit-logs/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── tables/
│   │   │   ├── forms/
│   │   │   └── charts/
│   │   ├── services/
│   │   └── stores/
│   ├── package.json
│   └── tsconfig.json
├── shared/
│   ├── src/
│   │   ├── types/
│   │   │   ├── enums.ts
│   │   │   └── models.ts
│   │   ├── dtos/
│   │   └── constants/
│   └── package.json
├── api-docs/
│   ├── openapi.json
│   ├── openapi.yaml
│   └── liton-brothers.postman_collection.json
├── package.json
├── turbo.json
└── README.md
```

---

## 4. COMPLETE DATABASE ENTITY-RELATIONSHIP DIAGRAM (ERD)

```
+-------------------+        +--------------------+        +---------------------+
|      ROLES        |        |   USER_ROLES       |        |       USERS         |
+-------------------+        +--------------------+        +---------------------+
| id (PK)           |<-------| role_id (FK)       |   +--->| id (PK)             |
| name (UNIQUE)     |        | user_id (FK)       |---+    | full_name           |
| description       |        +--------------------+        | phone (UNIQUE)      |
+-------------------+                                      | password_hash       |
        ^                                                  | email (OPTIONAL)    |
        |                                                  | status (ENUM)       |
+-------------------+                                      | role (DEFAULT ENUM) |
| ROLE_PERMISSIONS  |                                      | created_at          |
+-------------------+                                      | updated_at          |
| role_id (FK)      |                                      +----------+----------+
| permission_id (FK)|                                                 |
+---------+---------+                                                 | 1:N
          |                                                           v
          v                                                +---------------------+
+-------------------+                                      | CUSTOMER_ADDRESSES  |
|    PERMISSIONS    |                                      +---------------------+
+-------------------+                                      | id (PK)             |
| id (PK)           |                                      | user_id (FK)        |
| code (UNIQUE)     |                                      | full_name           |
| description       |                                      | phone               |
+-------------------+                                      | address             |
                                                           | division, district  |
                                                           | area, postal_code   |
                                                           | address_type (ENUM) |
                                                           | is_default          |
                                                           +---------------------+

+-------------------+        +--------------------+        +---------------------+
|   CATEGORIES      |        |      BRANDS        |        |       TAGS          |
+-------------------+        +--------------------+        +---------------------+
| id (PK)           |        | id (PK)            |        | id (PK)             |
| name              |        | name (UNIQUE)      |        | name (UNIQUE)       |
| slug (UNIQUE)     |        | slug (UNIQUE)      |        | slug (UNIQUE)       |
| parent_id (FK)    |        | logo_url           |        +----------+----------+
| image_url         |        | is_active          |                   |
| sort_order        |        +---------+----------+                   | N:M
| is_active         |                  |                              v
+---------+---------+                  | 1:N               +---------------------+
          |                            |                   |    PRODUCT_TAGS     |
          | 1:N                        |                   +---------------------+
          v                            v                   | product_id (FK)     |
+-------------------------------------------------+        | tag_id (FK)         |
|                    PRODUCTS                     |<-------+---------------------+
+-------------------------------------------------+
| id (PK)                                         |
| sku (UNIQUE)                                    |
| name                                            |
| slug (UNIQUE)                                   |
| description, short_description                  |
| brand_id (FK NULLABLE)                          |
| primary_category_id (FK)                        |
| cost_price                                      |
| base_price, sale_price                          |
| discount_percentage, discount_amount            |
| stock_quantity, low_stock_threshold             |
| status (ENUM: DRAFT, ACTIVE, ARCHIVED)          |
| is_featured, is_new_arrival, is_best_seller     |
| rating_avg, review_count                        |
| unit, weight                                    |
| vat_percentage                                  |
| created_at, updated_at                          |
+------------------------+------------------------+
                         |
      +------------------+-------------------+--------------------+
      | 1:N                                  | 1:N                | 1:N
      v                                      v                    v
+-----------------------+              +-------------+      +--------------------+
|   PRODUCT_VARIANTS    |              | PRODUCT_    |      |   PRICE_HISTORY    |
+-----------------------+              |   IMAGES    |      +--------------------+
| id (PK)               |              +-------------+      | id (PK)            |
| product_id (FK)       |              | id (PK)     |      | product_id (FK)    |
| sku (UNIQUE)          |              | product_id  |      | variant_id (FK)    |
| display_name          |              | image_url   |      | old_price          |
| unit (kg, L, pcs)     |              | is_thumbnail|      | new_price          |
| quantity (numeric)    |              | sort_order  |      | changed_by (FK)    |
| price, sale_price     |              +-------------+      | created_at         |
| stock_quantity        |                                   +--------------------+
| barcode               |
| is_active             |
+-----------+-----------+
            |
            | 1:N
            +-----------------------------------------+
            |                                         |
            v                                         v
+-----------------------+                   +--------------------+
| INVENTORY_            |                   | FLASH_DEAL_ITEMS   |
|   TRANSACTIONS        |                   +--------------------+
+-----------------------+                   | id (PK)            |
| id (PK)               |                   | flash_deal_id (FK) |
| product_id (FK)       |                   | variant_id (FK)    |
| variant_id (FK)       |                   | original_price     |
| transaction_type      |                   | flash_price        |
| quantity_changed      |                   | limited_stock      |
| previous_stock        |                   | sold_stock         |
| new_stock             |                   | max_per_customer   |
| reference_id (order)  |                   +---------+----------+
| performed_by (FK)     |                             |
| created_at            |                             | N:1
+-----------------------+                             v
                                            +--------------------+
                                            |   FLASH_DEALS      |
                                            +--------------------+
                                            | id (PK)            |
                                            | title              |
                                            | banner_url         |
                                            | start_time         |
                                            | end_time           |
                                            | is_active          |
                                            +--------------------+

+-----------------------+                   +--------------------+
|        CARTS          |                   |     WISHLISTS      |
+-----------------------+                   +--------------------+
| id (PK)               |                   | id (PK)            |
| user_id (FK UNIQUE)   |                   | user_id (FK)       |
| session_id (GUESTS)   |                   | product_id (FK)    |
| updated_at            |                   | created_at         |
+-----------+-----------+                   +--------------------+
            | 1:N
            v
+-----------------------+
|      CART_ITEMS       |
+-----------------------+
| id (PK)               |
| cart_id (FK)          |
| product_id (FK)       |
| variant_id (FK)       |
| quantity              |
| added_at              |
+-----------------------+

+--------------------------------------------------------------------------------+
|                                    ORDERS                                      |
+--------------------------------------------------------------------------------+
| id (PK)                                                                        |
| order_number (UNIQUE: LB-YYYYMMDD-XXXX)                                        |
| customer_id (FK -> users.id)                                                   |
| shipping_address_json (Snapshot)                                               |
| subtotal_amount                                                                |
| discount_amount                                                                |
| delivery_fee                                                                   |
| tax_amount                                                                     |
| grand_total                                                                    |
| order_status (PENDING, CONFIRMED, PROCESSING, PACKED, OUT_FOR_DELIVERY, ...)   |
| payment_status (PENDING, PAID, FAILED, REFUNDED)                               |
| payment_method (COD, BKASH, NAGAD, CARD)                                       |
| delivery_notes, cancellation_reason                                            |
| cancelled_by (FK NULLABLE), cancelled_at                                       |
| created_at, updated_at                                                         |
+-------------------+-----------------------------------+------------------------+
                    | 1:N                               | 1:N
                    v                                   v
+------------------------------------+    +--------------------------------------+
|            ORDER_ITEMS             |    |        ORDER_STATUS_HISTORY          |
+------------------------------------+    +--------------------------------------+
| id (PK)                            |    | id (PK)                              |
| order_id (FK)                      |    | order_id (FK)                        |
| product_id (FK)                    |    | from_status, to_status               |
| variant_id (FK)                    |    | comment / note                       |
| product_name, variant_name         |    | updated_by (FK)                      |
| unit_price, sale_price             |    | created_at                           |
| quantity                           |    +--------------------------------------+
| total_amount                       |
+------------------------------------+

+------------------------------------+    +--------------------------------------+
|             PAYMENTS               |    |               RETURNS                |
+------------------------------------+    +--------------------------------------+
| id (PK)                            |    | id (PK)                              |
| order_id (FK)                      |    | order_id (FK)                        |
| payment_method (COD, BKASH, NAGAD) |    | order_item_id (FK)                   |
| transaction_reference              |    | user_id (FK)                         |
| gateway_payload (JSONB)            |    | quantity                             |
| amount                             |    | reason (ENUM), description           |
| status (ENUM)                      |    | images (JSONB)                       |
| paid_at                            |    | status (REQUESTED, APPROVED, ...)    |
+------------------------------------+    +--------------------------------------+

+------------------------------------+    +--------------------------------------+
|             COUPONS                |    |               REVIEWS                |
+------------------------------------+    +--------------------------------------+
| id (PK)                            |    | id (PK)                              |
| code (UNIQUE)                      |    | product_id (FK)                      |
| type (FIXED, PERCENTAGE, FREE_DEL) |    | user_id (FK)                         |
| value                              |    | order_id (FK - Verified Purchase)    |
| min_order_amount                   |    | rating (1-5)                         |
| max_discount_amount                |    | comment, images                      |
| start_date, expiry_date            |    | is_approved, moderated_by (FK)       |
| usage_limit, per_user_limit        |    +--------------------------------------+
| is_active                          |
+------------------------------------+

+------------------------------------+    +--------------------------------------+
|        HOMEPAGE_SECTIONS           |    |              BANNERS                 |
+------------------------------------+    +--------------------------------------+
| id (PK)                            |    | id (PK)                              |
| title, subtitle                    |    | title, subtitle, image_url           |
| section_type (DEAL, TAG, CATEGORY) |    | button_text, link_url                |
| filter_criterion (tag_id/cat_id)   |    | banner_type (HERO, POSTER, AD)       |
| sort_order, is_active              |    | start_date, end_date, is_active     |
+------------------------------------+    +--------------------------------------+

+------------------------------------+    +--------------------------------------+
|         BUSINESS_SETTINGS          |    |             AUDIT_LOGS               |
+------------------------------------+    +--------------------------------------+
| id (PK)                            |    | id (PK)                              |
| key (UNIQUE: shop_name, tax, etc.) |    | user_id (FK)                         |
| value (JSONB)                      |    | action (CREATE, UPDATE, DELETE, ...) |
| description                        |    | entity_name, entity_id               |
| is_public                          |    | old_value (JSONB), new_value (JSONB) |
+------------------------------------+    | ip_address, user_agent, created_at   |
                                          +--------------------------------------+
```

---

## 5. DATABASE TABLE LIST WITH RELATIONSHIPS & CONSTRAINTS

| Table Name | Primary Key | Foreign Keys & References | Key Unique / Check Constraints | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **users** | `id` (UUID) | None | `phone` UNIQUE, `email` UNIQUE | Stores customers, admins, staff with hashed passwords and status. |
| **roles** | `id` (UUID) | None | `name` UNIQUE (`SUPER_ADMIN`, `ADMIN`, etc.) | System roles for RBAC. |
| **permissions** | `id` (UUID) | None | `code` UNIQUE (`PRODUCT_CREATE`, etc.) | Granular security permissions. |
| **user_roles** | `id` (UUID) | `user_id` -> users(id) ON DELETE CASCADE, `role_id` -> roles(id) | Composite UNIQUE (`user_id`, `role_id`) | Mapping users to roles. |
| **role_permissions** | `id` (UUID) | `role_id` -> roles(id), `permission_id` -> permissions(id) | Composite UNIQUE (`role_id`, `permission_id`) | Mapping roles to permissions. |
| **customer_addresses**| `id` (UUID) | `user_id` -> users(id) ON DELETE CASCADE | None | Multi-address support (Home, Office, Other). |
| **categories** | `id` (UUID) | `parent_id` -> categories(id) ON DELETE SET NULL | `slug` UNIQUE | Hierarchical category tree (Grocery -> Oil, etc.). |
| **brands** | `id` (UUID) | None | `name` UNIQUE, `slug` UNIQUE | Brand entities with logos and status. |
| **tags** | `id` (UUID) | None | `name` UNIQUE, `slug` UNIQUE | Multi-tag grouping for dynamic sections. |
| **products** | `id` (UUID) | `brand_id` -> brands(id), `primary_category_id` -> categories(id) | `sku` UNIQUE, `slug` UNIQUE | Master product catalogue with pricing & metadata. |
| **product_tags** | `id` (UUID) | `product_id` -> products(id), `tag_id` -> tags(id) | Composite UNIQUE (`product_id`, `tag_id`) | N:M product to tag mapping. |
| **product_variants** | `id` (UUID) | `product_id` -> products(id) ON DELETE CASCADE | `sku` UNIQUE, CHECK (`price` >= 0) | Distinct purchasable quantities (500g, 1L, etc.). |
| **product_images** | `id` (UUID) | `product_id` -> products(id) ON DELETE CASCADE | None | Multiple image gallery per product. |
| **price_history** | `id` (UUID) | `product_id` -> products, `variant_id` -> variants, `changed_by` -> users | None | Complete price audit ledger. |
| **inventory_transactions** | `id` (UUID) | `product_id` -> products, `variant_id` -> variants, `performed_by` -> users | None | Immutable stock ledger (In/Out/Reserved/Adjust). |
| **flash_deals** | `id` (UUID) | None | CHECK (`end_time` > `start_time`) | Friday Flash Deal event header. |
| **flash_deal_items** | `id` (UUID) | `flash_deal_id` -> flash_deals(id), `variant_id` -> product_variants(id) | Composite UNIQUE (`flash_deal_id`, `variant_id`) | Discounted flash prices with allocated stock limits. |
| **carts** | `id` (UUID) | `user_id` -> users(id) ON DELETE CASCADE | `user_id` UNIQUE | Persistent server-side customer carts. |
| **cart_items** | `id` (UUID) | `cart_id` -> carts(id), `variant_id` -> product_variants(id) | Composite UNIQUE (`cart_id`, `variant_id`) | Cart line items. |
| **wishlists** | `id` (UUID) | `user_id` -> users(id), `product_id` -> products(id) | Composite UNIQUE (`user_id`, `product_id`) | Customer saved favourite items. |
| **orders** | `id` (UUID) | `customer_id` -> users(id), `cancelled_by` -> users(id) | `order_number` UNIQUE | Top-level order ledger with monetary snapshots. |
| **order_items** | `id` (UUID) | `order_id` -> orders(id) ON DELETE CASCADE, `variant_id` -> product_variants | None | Immutable order item snapshot with price at purchase. |
| **order_status_history**| `id` (UUID)| `order_id` -> orders(id) ON DELETE CASCADE, `updated_by` -> users | None | Chronological tracking timeline. |
| **payments** | `id` (UUID) | `order_id` -> orders(id) | None | Payment transaction records and gateway responses. |
| **returns** | `id` (UUID) | `order_id` -> orders(id), `order_item_id` -> order_items, `user_id` -> users | None | Customer return/refund claims. |
| **coupons** | `id` (UUID) | None | `code` UNIQUE | Promo discount codes and validity limits. |
| **coupon_usages** | `id` (UUID) | `coupon_id` -> coupons(id), `user_id` -> users(id), `order_id` -> orders(id) | Composite UNIQUE (`coupon_id`, `order_id`) | Usage tracking to enforce per-user limits. |
| **reviews** | `id` (UUID) | `product_id` -> products, `user_id` -> users, `order_id` -> orders | Composite UNIQUE (`user_id`, `product_id`, `order_id`) | Customer verified rating (1-5 stars) and comments. |
| **homepage_sections** | `id` (UUID) | None | None | Reusable CMS homepage product sections. |
| **banners** | `id` (UUID) | None | None | Promotional sliders, posters, and advertisements. |
| **business_settings** | `id` (UUID) | None | `key` UNIQUE | System configs (shop info, delivery fee, currency). |
| **notifications** | `id` (UUID) | `user_id` -> users(id) ON DELETE CASCADE | None | User and admin notification inbox. |
| **audit_logs** | `id` (UUID) | `user_id` -> users(id) ON DELETE SET NULL | None | Security and admin activity logs with JSON diffs. |

---

## 6. BACKEND MODULE STRUCTURE

The backend follows NestJS modular architecture with explicit encapsulation:

1. **AuthModule**: Handles Phone + Password authentication, JWT issuance, Refresh Token rotation in Redis/DB, password resets, and session management.
2. **UsersModule**: Profile updates, address management, and customer administration.
3. **RbacModule**: Role definitions, permissions enforcement via `@Roles()` and `@Permissions()` decorators and guards.
4. **ProductsModule**: Full catalogue management, multi-category assignment, tagging, specifications, and price audit logging.
5. **VariantsModule**: Variant matrix management (units, quantities, pricing, SKUs, barcodes).
6. **CategoriesModule**: Hierarchical categories with parent-child recursive tree queries.
7. **BrandsModule**: Brand CRUD and brand-filtered product listings.
8. **TagsModule**: Tag management and tag-based product query grouping.
9. **InventoryModule**: ACID-compliant stock ledger, stock adjustments, low-stock threshold triggers, and temporary stock reservations.
10. **FlashDealsModule**: Friday deal scheduling, concurrent atomic stock deductions, and countdown state management.
11. **CartModule**: Server-side cart persistence, guest-to-user cart merging, and real-time stock/price validation.
12. **CheckoutModule & OrdersModule**: Order placement within a PostgreSQL transaction, address snapshotting, delivery fee calculation, and order state transition machine.
13. **PaymentsModule**: Polymorphic payment strategy (COD, bKash, Nagad, SSLCommerz) with idempotency and webhook handlers.
14. **DeliveryModule**: Zone-based delivery fees, free delivery threshold checks, minimum order amount enforcement, and rider integration stubs.
15. **ReviewsModule**: Verified-purchase reviews, 1-5 star ratings, and admin moderation.
16. **CouponsModule**: Discount rule evaluations (percentage, fixed amount, free delivery) and usage restrictions.
17. **CmsModule**: Banner sliders, promo posters, homepage dynamic sections, and policy content.
18. **CrmModule**: Customer segmentation (RFM model), lifetime value analytics, and high-value customer reports.
19. **NotificationsModule**: In-app event dispatches and BullMQ worker integrations for SMS/Email.
20. **SettingsModule**: Dynamic shop settings (BDT currency symbol, tax, delivery charges, maintenance mode toggle).
21. **AuditLogsModule**: Automated interceptor logging changes across administrative entities.
22. **HealthModule**: Readiness and liveness probes (`/api/v1/health`) for Docker and Kubernetes.

---

## 7. CUSTOMER WEBSITE ARCHITECTURE

The customer web application is built with **Next.js 15 (App Router)** and TypeScript, engineered for mobile-first responsiveness, high SEO performance, and sub-second page transitions.

### Route Hierarchy
* `/`: Dynamic homepage rendered from CMS configuration (Header, Banners, Friday Flash Deals, Deals of the Day, Category Bar, Dynamic Tag Sections, Footer).
* `/products`: Product listing page with multi-faceted filtering (Category, Brand, Price Range, Tags, In-Stock, Sorting).
* `/products/[slug]`: Rich Product Details Page (Image Gallery, Variant Selector, Stock indicator, Specifications, Verified Reviews, Related Items, Buy Now / Add to Cart).
* `/categories`: Visual Category Directory.
* `/categories/[slug]`: Category-filtered product list.
* `/deals/friday-flash`: Dedicated Friday Flash Deal page with live synchronized countdown timer.
* `/deals/day`: Deals of the Day showcase.
* `/cart`: Full shopping cart page with delivery charge estimator and price breakdown.
* `/checkout`: Streamlined 1-page checkout (Address selection/creation, Delivery instructions, Payment selection).
* `/checkout/success/[orderId]`: Order confirmation and summary with immediate tracking link.
* `/track-order`: Public and authenticated order tracking with visual progress timeline.
* `/wishlist`: Customer favourite products with "Move all to cart" capability.
* `/account/*`: Protected customer portal:
  * `/account/profile`: Edit name, email, avatar.
  * `/account/orders`: Order history with invoice downloads.
  * `/account/orders/[id]`: Detailed order view with status history and return requests.
  * `/account/addresses`: Multi-address book manager.
  * `/account/notifications`: In-app notification alerts.
* `/auth/login`, `/auth/register`, `/auth/forgot-password`.
* `/pages/[slug]`: Dynamic CMS pages (About Us, Terms, Privacy Policy, Return Policy).

### Key Frontend Components
* `Header`: Sticky search bar with instant autocomplete suggestions, quick cart counter, favourite count, and mobile drawer toggle.
* `ProductCard`: Uniform design across all sections showing badge (discount %), thumbnail, product title, unit/variant label, current price (৳), original price, quick "Add to Cart" button, and wishlist toggle.
* `VariantSelector`: Interactive pill/dropdown buttons displaying quantities (e.g. `500 ML - ৳90`, `1 L - ৳175`, `5 L - ৳820`) that update pricing and stock dynamically.
* `CountdownTimer`: Accurate client-synced countdown for Flash Deals with auto-expiry trigger.
* `MobileNavigationDrawer`: Left slide-out drawer providing full site navigation, account links, categories, and contact info.
* `CartDrawer`: Right slide-out mini-cart enabling immediate checkout access without leaving the active shopping page.

---

## 8. ADMIN DASHBOARD ARCHITECTURE

The Admin Dashboard is a data-dense, role-protected interface designed for desktop and tablet operations with granular permission enforcement.

### Administrative Route Map
* `/admin/login`: Secure staff login with device audit trail.
* `/admin/dashboard`: Overview with Real-Time KPI Cards (Total Sales Today, Monthly Sales, Total Revenue in BDT, Pending Approvals, Pending Orders, Low Stock Alerts) + Visual Charts (Sales by day, Orders by status, Top Categories).
* `/admin/customers`: Customer management table with tabbed filtering (`All`, `Pending Approval`, `Approved`, `Blocked`, `Suspended`). Actions: Approve, Reject, Block, Unblock, View 360 CRM Profile.
* `/admin/products`: Product catalog with live search, stock alerts, quick price edit, and modal/page for creating and updating variants, images, and SEO slugs.
* `/admin/inventory`: Stock ledger interface with manual Stock-In / Stock-Out / Stock Adjustment modals and reason logs.
* `/admin/flash-deals`: Scheduler for Friday Flash Deals (Product & Variant selection, discount price, allocation limit, max purchase per user).
* `/admin/orders`: Order management table with status filtering (`Pending`, `Confirmed`, `Processing`, `Out for Delivery`, `Delivered`, `Cancelled`). Includes invoice printing modal and order status timeline updates.
* `/admin/returns`: Return request queue with approval/rejection and refund status tracking.
* `/admin/coupons`: Coupon code generator with percentage/fixed discount rules and usage trackers.
* `/admin/cms/banners` & `/admin/cms/sections`: Homepage drag-and-drop ordering for promotional banners and reusable product sliders.
* `/admin/crm`: RFM segmentation dashboard (New, Active, High-Value, Churned Customers) with exportable CSVs.
* `/admin/reports`: Exportable sales reports (Daily, Weekly, Monthly) and inventory movement logs.
* `/admin/settings`: Business settings (Shop Name, Logo upload, Hotline, Email, BDT Currency, Delivery Fee tiers, Free Delivery threshold, Maintenance Mode toggle).
* `/admin/audit-logs`: Chronological log of administrative actions with old vs new JSON diffs.

---

## 9. AUTHENTICATION & TOKEN ROTATION FLOW

```
[ Customer / Admin ]                  [ Backend API ]                 [ PostgreSQL / Redis ]
         |                                   |                                   |
         |---- 1. POST /api/v1/auth/login -->|                                   |
         |    { phone, password }            |                                   |
         |                                   |---- 2. Query user by phone ------>|
         |                                   |<--- 3. Return user record --------|
         |                                   |                                   |
         |                                   |---- 4. Verify Argon2id hash       |
         |                                   |---- 5. Verify Account Status      |
         |                                   |       (If PENDING/BLOCKED -> 403) |
         |                                   |                                   |
         |                                   |---- 6. Generate Access Token (15m)|
         |                                   |---- 7. Generate Refresh Token (7d)|
         |                                   |---- 8. Store Refresh Hash in DB ->|
         |<--- 9. 200 OK + Tokens + User ----|                                   |
         |                                   |                                   |
         |    [ Access Token Expires ]       |                                   |
         |                                   |                                   |
         |---- 10. POST /auth/refresh ------>|                                   |
         |    { refreshToken }               |                                   |
         |                                   |---- 11. Validate Refresh Hash --->|
         |                                   |---- 12. Invalidate Old Refresh -->|
         |                                   |---- 13. Issue New Token Pair ---->|
         |<--- 14. 200 OK + New Tokens ------|                                   |
```

* Passwords hashed using **Argon2id** (memory cost: 65536 KB, time cost: 3 iterations).
* Access tokens expire in 15 minutes; Refresh tokens expire in 7 days.
* Refresh Token Rotation: Each refresh token can be used exactly once. Reusing an old refresh token indicates a compromise and revokes all active sessions for that user.

---

## 10. CUSTOMER APPROVAL WORKFLOW & STATE MACHINE

```
   [ REGISTRATION ]
          |
          v
+--------------------+
|  PENDING_APPROVAL  | <--- Default state upon signup.
+--------------------+      - Customer CAN browse catalog.
          |                 - Customer CAN add items to wishlist.
          |                 - Customer CANNOT checkout or place orders.
          |
    [ Admin Review ]
     /     |      \
    /      |       \
   v       v        v
+--------+ +----------+ +---------+
|APPROVED| | REJECTED | | BLOCKED |
+--------+ +----------+ +---------+
    |           |            |
    | Orders    | No order   | Completely
    | permitted | permitted  | prohibited
    v           v            v
```

1. **Signup**: Customer enters Full Name, Phone, Password, and Address. User is saved with status `PENDING_APPROVAL`.
2. **Notification**: Admin receives real-time alert (via WebSocket & In-App notification).
3. **Restricted Access**: If a `PENDING_APPROVAL` customer calls `POST /api/v1/orders` or attempts checkout, the API responds with HTTP 403 and error code `ACCOUNT_PENDING_APPROVAL`.
4. **Admin Approval**: An admin inspects the customer details and updates status to `APPROVED`, `REJECTED`, or `BLOCKED`.
5. **Customer Notification**: Customer receives SMS/Notification confirming account approval.

---

## 11. PRODUCT, VARIANT, AND INVENTORY ARCHITECTURE

A product represents the general conceptual item (e.g. "Teer Soybean Oil"), while variants represent the specific purchasable packaging and quantities (e.g., 500 ML, 1 Liter, 2 Liter, 5 Liter).

```
+-------------------------------------------------------------+
| PRODUCT: Teer Pure Soybean Oil                              |
| Slug: teer-pure-soybean-oil | Category: Grocery > Cooking Oil|
+-------------------------------------------------------------+
                               |
         +---------------------+---------------------+
         |                     |                     |
         v                     v                     v
+------------------+  +------------------+  +------------------+
| VARIANT: 1 Liter |  | VARIANT: 2 Liter |  | VARIANT: 5 Liter |
| SKU: TSO-1L      |  | SKU: TSO-2L      |  | SKU: TSO-5L      |
| Price: ৳175      |  | Price: ৳340      |  | Price: ৳820      |
| Stock: 100       |  | Stock: 60        |  | Stock: 30        |
+------------------+  +------------------+  +------------------+
```

### Immutable Stock Ledger (`inventory_transactions`)
Stock is never mutated without recording an audit record:
* `STOCK_IN`: Warehouse restock.
* `STOCK_OUT`: Order fulfillment.
* `STOCK_RESERVED`: Temporary lock during checkout.
* `STOCK_RELEASED`: Checkout expired or order cancelled.
* `MANUAL_ADJUSTMENT`: Inventory recount with admin notes.

---

## 12. FRIDAY FLASH DEAL ARCHITECTURE & CONCURRENCY CONTROLS

Friday Flash Deals feature strictly limited inventory and high customer contention. Overselling is completely eliminated using a **dual-layer concurrency shield**:

```
[ Incoming Simultaneous Requests (100 Users buying 2 remaining items) ]
                                   |
                                   v
+-----------------------------------------------------------------------+
| LAYER 1: In-Memory Atomic Reservation via Redis                       |
| Command: `DECRBY flash_deal:{id}:variant:{id}:stock {quantity}`       |
| -> If returned count < 0: Atomic INCRBY rollback; Return "Sold Out"   |
+-----------------------------------+-----------------------------------+
                                    | Successful reservation
                                    v
+-----------------------------------------------------------------------+
| LAYER 2: PostgreSQL ACID Transaction with Row-Level Locking           |
| `SELECT stock_quantity FROM flash_deal_items                          |
|  WHERE id = $1 FOR UPDATE;`                                           |
| -> Decrement remaining stock safely inside transaction.               |
| -> Insert order and commit.                                           |
+-----------------------------------------------------------------------+
```

* **Max Per Customer**: Enforced at database level (`CHECK (user_deal_count <= max_per_customer)`).
* **Automatic Expiry**: Once `remaining_stock == 0` or `NOW() > end_time`, WebSocket broadcasts `DEAL_EXHAUSTED` to all active clients, disabling purchase buttons instantly.

---

## 13. CART, CHECKOUT, AND ORDER WORKFLOW

### Server-Side Price Authority Rule
The frontend NEVER calculates the final payable amount. The client submits only `variant_id` and `quantity`. The backend executes the following transactional pipeline:

```
[ Step 1: Lock Variants ] 
  SELECT * FROM product_variants WHERE id IN (...) FOR UPDATE;
       |
[ Step 2: Validate Stock ] 
  Check requested_quantity <= stock_quantity for every line item.
       |
[ Step 3: Compute Subtotal ] 
  Subtotal = SUM(variant.sale_price * quantity)
       |
[ Step 4: Validate Coupon (if provided) ]
  Verify validity, expiry, min_order_amount, and per-user limits.
       |
[ Step 5: Calculate Delivery Charge ]
  Fetch BusinessSettings (e.g. Free if subtotal >= 1000 BDT, else 60 BDT).
       |
[ Step 6: Compute Grand Total ]
  Grand Total = Subtotal - Discount + Delivery Fee + Tax
       |
[ Step 7: Create Order Record ]
  Insert into `orders` and `order_items` (snapshotting variant data).
       |
[ Step 8: Deduct Stock & Write Ledger ]
  Update variant stock and insert `inventory_transactions`.
       |
[ Step 9: Clear Server Cart ]
  Delete items from `cart_items`.
```

---

## 14. PAYMENT SUBSYSTEM (STRATEGY PATTERN)

The payment subsystem is decoupled via an extensible TypeScript interface:

```typescript
export interface IPaymentGateway {
  initiatePayment(order: Order): Promise<PaymentInitiationResult>;
  verifyPayment(payload: any): Promise<PaymentVerificationResult>;
  processWebhook(headers: any, body: any): Promise<WebhookResult>;
  refund(paymentId: string, amount: number, reason: string): Promise<RefundResult>;
}
```

### Concrete Implementations
1. `CashOnDeliveryService`: Instantly sets payment status to `PENDING`, order status to `CONFIRMED`.
2. `BKashService`: Generates bKash payment URL using bKash Tokenized Checkout API; processes callback webhook.
3. `NagadService`: Integrates Nagad payment gateway redirect and encrypted verification.
4. `SSLCommerzService`: Full card and multi-banking aggregator gateway.

---

## 15. DELIVERY MANAGEMENT ARCHITECTURE

Configurable delivery parameters managed via Business Settings:
* `delivery_charge_standard`: Default shipping fee (e.g. ৳60).
* `free_delivery_threshold`: Minimum subtotal for ৳0 delivery (e.g. ৳1000).
* `minimum_order_amount`: Minimum order value allowed for checkout (e.g. ৳200).
* `delivery_zones`: Division / District / Thana mappings with differential rates.
* **Future Rider Integration Hook**: Prepared with `order.assigned_rider_id`, `order.delivery_otp`, and `order.delivery_status`.

---

## 16. CRM (CUSTOMER RELATIONSHIP MANAGEMENT) ARCHITECTURE

The Admin CRM calculates customer segmentation dynamically using the **RFM (Recency, Frequency, Monetary)** model:

| Segment | Criteria | Strategic Action |
| :--- | :--- | :--- |
| **New Customers** | Joined within last 30 days, orders <= 1 | Welcome discount coupon |
| **Active Customers** | Placed an order within the last 30 days | Regular weekly flash deal promos |
| **High-Value / VIP** | Lifetime spend > ৳20,000 | Dedicated priority support, free delivery |
| **Frequent Buyers** | Completed >= 5 orders | Loyalty rewards |
| **Churn Risk / Inactive**| No order placed in > 60 days | Re-engagement SMS campaign |
| **Zero-Order Customers** | Registered > 7 days ago, 0 orders placed | First-order coupon incentive |
| **Blocked Customers** | Manually flagged for fraud/abuse | Blocked from authentication |

---

## 17. API VERSIONING STRATEGY

* **Prefix-Based URI Versioning**: All production endpoints are strictly routed under `/api/v1/*`.
* **Deprecation Notice Policy**: When an endpoint is marked for deprecation in `/api/v2`, HTTP headers `Deprecation: @<timestamp>` and `Sunset: <date>` are returned.
* **Mobile Backward Compatibility**: Existing mobile versions are guaranteed contract stability; database migrations never drop columns without an intermediate deprecated release.

---

## 18. API ENDPOINT DIRECTORY

### Authentication & Customer Account (`/api/v1/auth`)
* `POST /api/v1/auth/register`: Customer signup (creates `PENDING_APPROVAL` account).
* `POST /api/v1/auth/login`: Customer & staff login with phone and password.
* `POST /api/v1/auth/refresh`: Refresh JWT access token via rotated refresh token.
* `POST /api/v1/auth/logout`: Revoke active session tokens.
* `POST /api/v1/auth/forgot-password`: Initiate password reset flow.
* `POST /api/v1/auth/reset-password`: Set new password with verified OTP/token.
* `GET /api/v1/auth/me`: Get current authenticated user profile and roles.

### Customer Profile & Addresses (`/api/v1/customers`)
* `PUT /api/v1/customers/profile`: Update profile info.
* `GET /api/v1/customers/addresses`: List customer saved addresses.
* `POST /api/v1/customers/addresses`: Add a new delivery address.
* `PUT /api/v1/customers/addresses/:id`: Edit existing address.
* `DELETE /api/v1/customers/addresses/:id`: Remove saved address.
* `PATCH /api/v1/customers/addresses/:id/default`: Set default delivery address.

### Catalog (`/api/v1/products`, `/categories`, `/brands`, `/tags`)
* `GET /api/v1/products`: Search and filter catalog with pagination.
* `GET /api/v1/products/:slug`: Get detailed product information with variants and reviews.
* `GET /api/v1/products/suggestions`: Fast autocomplete search suggestions.
* `GET /api/v1/categories`: Get category hierarchy tree.
* `GET /api/v1/categories/:slug`: Get specific category and children.
* `GET /api/v1/brands`: List active brands.
* `GET /api/v1/tags`: List active product tags.

### Cart & Wishlist (`/api/v1/cart`, `/api/v1/wishlist`)
* `GET /api/v1/cart`: Get current user cart with live validated prices and stock.
* `POST /api/v1/cart/items`: Add variant to cart.
* `PUT /api/v1/cart/items/:id`: Update cart item quantity.
* `DELETE /api/v1/cart/items/:id`: Remove item from cart.
* `DELETE /api/v1/cart`: Empty shopping cart.
* `GET /api/v1/wishlist`: List user favourites.
* `POST /api/v1/wishlist/:productId`: Toggle item in wishlist.

### Checkout, Orders & Tracking (`/api/v1/orders`)
* `POST /api/v1/checkout/preview`: Server-side total calculation (subtotal, coupon, delivery, tax).
* `POST /api/v1/orders`: Atomic order creation and inventory deduction.
* `GET /api/v1/orders`: Get customer order history.
* `GET /api/v1/orders/:id`: Get specific order details.
* `POST /api/v1/orders/:id/cancel`: Cancel order (if eligible).
* `GET /api/v1/orders/track/:trackingNumber`: Public/authenticated order tracking progress.

### Deals & Promotions (`/api/v1/deals`, `/coupons`)
* `GET /api/v1/deals/friday-flash`: Current active Friday Flash Deal with remaining stock.
* `GET /api/v1/deals/deals-of-the-day`: Current active Deals of the Day.
* `POST /api/v1/coupons/validate`: Validate coupon code against current cart.

### Reviews (`/api/v1/reviews`)
* `POST /api/v1/reviews`: Submit review for verified purchased product.
* `GET /api/v1/reviews/product/:productId`: Get approved customer reviews.

### Admin Customer Management (`/api/v1/admin/customers`)
* `GET /api/v1/admin/customers`: List customers with search, status filters, and pagination.
* `GET /api/v1/admin/customers/:id`: Customer 360 view (orders, spend, addresses).
* `PATCH /api/v1/admin/customers/:id/status`: Approve, Reject, Block, Suspend customer.

### Admin Catalog & Inventory (`/api/v1/admin/products`, `/admin/inventory`)
* `POST /api/v1/admin/products`: Create product with variants and images.
* `PUT /api/v1/admin/products/:id`: Update product details and pricing.
* `DELETE /api/v1/admin/products/:id`: Soft delete product.
* `POST /api/v1/admin/inventory/adjust`: Record Stock In, Stock Out, or Adjustment.
* `GET /api/v1/admin/inventory/transactions`: Query immutable inventory history.

### Admin Orders, CMS & Settings (`/api/v1/admin/orders`, `/admin/cms`, `/admin/settings`)
* `GET /api/v1/admin/orders`: List all customer orders.
* `PATCH /api/v1/admin/orders/:id/status`: Transition order status (Confirmed, Packed, Delivered, etc.).
* `GET /api/v1/admin/orders/:id/invoice`: Get printable invoice data.
* `POST /api/v1/admin/cms/banners`: Create promotional banners.
* `GET /api/v1/admin/settings`: Get all business configuration keys.
* `PUT /api/v1/admin/settings`: Update shop settings (delivery fees, currency, maintenance mode).

---

## 19. SWAGGER / OPENAPI STRATEGY

* Built using NestJS Swagger integration (`@nestjs/swagger`).
* Interactive UI accessible at `/api/docs`.
* Dynamic OpenAPI 3.0 specification exported at `/api/docs-json` and saved as `/api-docs/openapi.json`.
* Every endpoint includes DTO request/response schemas, JWT bearer security annotations, parameter descriptions, and concrete error schemas (400, 401, 403, 404, 409, 422, 500).

---

## 20. SECURITY ARCHITECTURE

1. **Password Storage**: Argon2id with unique cryptographic salts.
2. **Access Token & Refresh Token Security**:
   - Access tokens (JWT) signed with RSA-256 or HMAC-SHA256 (15-minute validity).
   - Refresh tokens stored as SHA-256 hashes in PostgreSQL/Redis; rotated upon every single use.
3. **Role-Based Access Control (RBAC)**: Enforced via declarative NestJS decorators and Guards.
4. **Rate Limiting**: Redis-backed sliding window rate limiter (`express-rate-limit` / `@nestjs/throttler`):
   - Auth endpoints: 5 attempts per minute per IP.
   - Public read endpoints: 120 requests per minute per IP.
   - Checkout endpoints: 10 requests per minute per user.
5. **Security Headers**: `helmet` enabled (CSP, HSTS, X-Content-Type-Options, X-Frame-Options).
6. **Input Sanitization & Validation**: `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, and `transform: true` to prevent parameter injection.
7. **File Upload Hardening**:
   - Validation of file extension AND magic numbers (MIME checking).
   - Re-encoding and resizing all images through `sharp` to strip malicious payloads or scripts.
   - Size strictly capped at 5 MB per image.
8. **Audit Trail**: Every administrative write operation automatically records user ID, IP address, user agent, old value snapshot, and new value snapshot in `audit_logs`.

---

## 21. TESTING STRATEGY

1. **Unit Testing (Jest)**:
   - Price & discount calculation routines.
   - Coupon validity checks (percentage, fixed amount, thresholds).
   - Order state machine transitions.
2. **Integration Testing (Testcontainers / Postgres Test DB)**:
   - Database transactions and rollbacks.
   - Atomic stock updates and row-level locks.
   - Flash deal inventory concurrency simulations.
3. **End-to-End (E2E) API Testing (Supertest)**:
   - Full flow: Customer Registration -> Status Check (`PENDING_APPROVAL`) -> Admin Approval -> Customer Login -> Add to Cart -> Checkout -> Stock Deduction -> Payment Confirmation -> Order Delivery -> Verified Review.

---

## 22. DOCKER & DEPLOYMENT TOPOLOGY

```
+------------------------------------------------------------------------------------+
|                               DOCKER COMPOSE TOPOLOGY                              |
+------------------------------------------------------------------------------------+
|                                                                                    |
|  +--------------------+     +--------------------+     +------------------------+  |
|  |   customer-web     |     |  admin-dashboard   |     |      backend-api       |  |
|  |   (Port 3000)      |     |   (Port 3001)      |     |      (Port 4000)       |  |
|  +---------+----------+     +---------+----------+     +-----------+------------+  |
|            |                          |                            |               |
|            +--------------------------+----------------------------+               |
|                                       |                                            |
|                                       v                                            |
|                  +--------------------+--------------------+                       |
|                  |     internal-network (bridge)           |                       |
|                  +--------------------+--------------------+                       |
|                                       |                                            |
|                   +-------------------+-------------------+                        |
|                   v                                       v                        |
|         +-------------------+                   +-------------------+              |
|         |    postgres:16    |                   |      redis:7      |              |
|         |    (Port 5432)    |                   |    (Port 6379)    |              |
|         +-------------------+                   +-------------------+              |
|                                                                                    |
+------------------------------------------------------------------------------------+
```

* Multi-stage Docker builds to produce lean, unprivileged production images (`node:22-alpine`).
* Health check hooks on backend container (`curl -f http://localhost:4000/api/v1/health || exit 1`).
* Automatic migration execution on container startup.

---

## 23. DEVELOPMENT ROADMAP & PHASES

* **Phase 1: Architecture & Specifications Review (Current Task)**: Detailed analysis, ERD, technology selection, API specifications, and risk mitigation plan.
* **Phase 2: Backend Foundation**: Project initialization, database schemas, migrations, seeds, Auth, RBAC, Customer Approval logic, Global exception filters, and Swagger setup.
* **Phase 3: Catalog & Inventory Management**: Products, variants, categories, brands, tags, stock ledger, image uploading with Sharp, and search/filter APIs.
* **Phase 4: Customer Shopping Experience**: Customer web store, responsive header/drawer, product catalog with faceted navigation, product details page, variant selection, wishlist, and cart drawer.
* **Phase 5: Checkout, Orders & Payments**: Server-side checkout calculation, ACID transactional order placement, COD/bKash/Nagad payment gateways, order tracking, and invoice generator.
* **Phase 6: Deals & Promotions Subsystem**: Friday Flash Deal high-concurrency engine, countdown timers, Deals of the Day, and dynamic coupon engine.
* **Phase 7: Admin Dashboard**: Full admin portal with metrics overview, customer approval management, product & variant manager, order processing, and CRM segmentation.
* **Phase 8: Frontend Polish & Optimization**: SEO metadata, OpenGraph tags, responsive UI testing (Mobile/Tablet/Desktop), loading skeletons, empty states, and accessibility enhancements.
* **Phase 9: Automated Testing & Verification**: Unit tests, concurrency race-condition tests on flash deals, and end-to-end API verification.
* **Phase 10: Production Readiness & Documentation**: Final OpenAPI specs, Postman collection, Docker Compose orchestration, and comprehensive deployment runbooks.

---

## 24. IDENTIFIED RISKS & EDGE-CASE MITIGATION

| Risk / Edge Case | Architectural Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Simultaneous Flash Deal Checkouts** | Race conditions causing overselling beyond allocated stock. | Redis atomic `DECR` combined with PostgreSQL row-level locking (`SELECT ... FOR UPDATE`). Database constraints prevent negative inventory. |
| **Price Drift in Abandoned Carts** | Product prices or discounts change while sitting in a user's cart. | The cart only stores IDs and quantities; price is dynamically evaluated at the moment of checkout preview and transaction execution. |
| **Pending Approval Shopping Attempt** | Customer attempts checkout before admin review. | `ApprovedCustomerGuard` intercepts all checkout and order placement calls, returning standard `403 Forbidden` with `ACCOUNT_PENDING_APPROVAL`. |
| **Payment Gateway Callback Failure** | User's browser closes before returning from bKash/Nagad. | Secure asynchronous server-to-server webhook endpoints with replay attack protection and signature verification. |
| **Database Deadlocks during Multi-Item Orders** | Multiple checkouts locking rows in reverse order. | Sort variant IDs deterministically (e.g. `ORDER BY id ASC`) prior to acquiring row locks. |
| **Image Upload Exploits** | Malicious script disguised as JPEG image. | Magic-number binary header inspection + complete raster re-encoding via `sharp`, stripping metadata and scripts. |

---

## 25. RECOMMENDED IMPROVEMENTS TO SPECIFICATION

1. **SMS Gateway & OTP Verification**: For customer onboarding in Bangladesh, integrating an SMS gateway (e.g. Greenweb, SSL Wireless, or Twilio) with an OTP verification step before admin approval guarantees authentic phone numbers.
2. **Idempotency Keys for Checkout**: Requiring an `Idempotency-Key` header on `POST /api/v1/orders` prevents duplicate orders caused by double-clicking buttons or mobile network retries.
3. **Delivery Time Slot Selection**: Allow customers to select preferred delivery windows (e.g. "Morning: 9 AM - 12 PM", "Afternoon: 2 PM - 6 PM").
4. **Real-time Order Status Updates via WebSockets**: Push order status updates directly to the customer's browser or mobile app without requiring manual page refresh.
5. **Partial Order Fulfillment Handling**: Support shipping available items first if a single line item encounters supply delay.
