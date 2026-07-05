# Developer Guidelines & Architectural Constraints

This document outlines the design standards, architecture rules, and coding conventions that must be adhered to when developing or modifying the Flowcart Backend.

---

## 1. Architecture Rules (Clean Architecture)

- **Feature-Based Modules**: Code must be organized inside self-contained modules under `src/modules/` (e.g., `auth`, `products`, `bills`, `categories`).
- **Strict Layer Separation**:
  - **Controllers**: Responsible only for parsing HTTP requests, query validation, and formatting responses. They must **never** interact with the database or inject repositories directly. They must use Services.
  - **Services**: Contain all business logic, validation, transaction orchestration, and data mapping.
  - **Repositories**: Abstract the database access layer. Services must only communicate with the database via these custom Repository classes.
- **Dependency Inversion**: Custom repositories should wrap TypeORM's standard repository API to cleanly separate third-party ORM details from the service layer.

---

## 2. Database Guidelines & Conventions

- **Audit Fields**: Every table must include the following audit columns:
  - `created_at` (timestamp, not null)
  - `updated_at` (timestamp, not null)
  - `deleted_at` (timestamp, nullable) - utilized for soft deletion
  - `created_by` (UUID, nullable)
  - `updated_by` (UUID, nullable)
- **Soft Delete Pattern**: Do **not** physically delete database records. Always perform a soft delete by setting `deleted_at` to the current timestamp.
- **Constraints**:
  - Unique email & phone number on the `merchants` table.
  - Unique `product_code` per merchant (composite unique index).
  - Unique `barcode` per merchant (composite unique index).
  - Configure foreign keys with appropriate cascade rules (e.g., `onDelete: 'CASCADE'` for tokens/categories, and `onDelete: 'RESTRICT'` for products/bills to prevent accidental data cascades).
- **Required Indexes**:
  - `merchant_id` (foreign key columns)
  - `product_code`
  - `barcode`
  - `qr_code`
  - `invoice_number`

---

## 3. Authentication & Token Management

- **Access Token**:
  - Life: 15 minutes.
  - Claims: must contain `merchant_id` (or `id`), `email`, and `shop_type`.
- **Refresh Token**:
  - Life: 30 days.
  - Storage: Must be stored **hashed** (SHA-256 or bcrypt) inside the `refresh_tokens` database table. Never write plain text tokens to the database.
  - **Rotation (RTR)**: Old refresh tokens must be marked as revoked immediately when used to obtain a new token pair.
  - **Logout**: Perform logout by revoking the refresh token in the database (set `revoked_at`).

---

## 4. API & Endpoint Conventions

- **Versioning**: All business endpoints must be prefixed with `api/v1` (e.g., `/api/v1/auth`, `/api/v1/products`, `/api/v1/bills`).
- **Health Checks**: Place `/health` at the root route (not prefixed with `api/v1`). It must return the API status, database connection state, app version, and uptime.
- **Pagination**: All listing endpoints must accept standard query parameters (`page`, `limit`, `search`, `sort`, `order`) using `PaginationDto` and return meta-wrapped results using `createPaginatedResponse`.

---

## 5. Stock Tracking & Invoice Formatting

- **Stock Tracking**:
  - If `track_stock` is false for a product, billing does not modify its stock.
  - If `track_stock` is true, checkout must verify sufficient stock and deduct quantity from `current_stock`.
- **Invoice Formatting**:
  - Format: `INV-YYYYMMDD-XXXXXX` where `XXXXXX` is a sequential 6-digit increment for the current day.
  - Count soft-deleted records when determining the daily count to prevent generating duplicate invoice numbers.

---

## 6. Logging & Security Audit

- **HTTP Request Log Format**: Log each completed request in this specific format:
  `[Timestamp] [RequestId] [MerchantId] [IP Address] [HTTP Method] [Route] [Response Time] [Status Code] [User Agent] [Environment]`
- **Privacy Policies**:
  - **Never** log passwords or plaintext login credentials.
  - **Never** log raw access tokens or refresh tokens.
  - **Never** log sensitive headers (like `Authorization`).
