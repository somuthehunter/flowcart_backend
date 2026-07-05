# Flowcart Backend API Specification

This document lists all available API endpoints, their authentication guards, required headers, query parameters, request schemas, and sample response payloads.

---

## Base Configuration
- **Base URL**: `http://localhost:3000`
- **Global Path Prefix**: `/api/v1` (with the exception of `/health` which resides at the root level).
- **Authentication**: All protected endpoints require a `Bearer <AccessToken>` in the HTTP `Authorization` header.
- **Interactive Swagger Documentation (OpenAPI UI)**: Available at `http://localhost:3000/api/docs`.

---

## 1. System Health Check

### Health Check Status
- **Method**: `GET`
- **Path**: `/health`
- **Authentication**: None
- **Request Headers**: None
- **Query Parameters**: None
- **Request Body**: None
- **Response**: `200 OK`
  ```json
  {
    "status": "up",
    "database": "up",
    "version": "1.0.0",
    "uptime": "0h 12m 45s"
  }
  ```

---

## 2. Identity & Authentication Module

### Register Merchant
- **Method**: `POST`
- **Path**: `/api/v1/auth/register`
- **Authentication**: None
- **Request Body**:
  ```json
  {
    "owner_name": "Pritam Dutta",
    "phone_number": "9876543210",
    "email": "merchant@example.com",
    "password": "StrongPassword@123",
    "shop_name": "Pritam Grocery",
    "shop_type": "GROCERY"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "success": true,
    "message": "Merchant registered successfully.",
    "data": {
      "merchant": {
        "id": "f83db28b-bfa9-448c-b01f-df6dfa61e712",
        "owner_name": "Pritam Dutta",
        "phone_number": "9876543210",
        "email": "merchant@example.com",
        "shop_name": "Pritam Grocery",
        "shop_type": "GROCERY",
        "created_at": "2026-06-28T16:20:00.000Z",
        "updated_at": "2026-06-28T16:20:00.000Z",
        "deleted_at": null,
        "created_by": "f83db28b-bfa9-448c-b01f-df6dfa61e712",
        "updated_by": "f83db28b-bfa9-448c-b01f-df6dfa61e712"
      },
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "70d24c..."
    }
  }
  ```

### Merchant Login
- **Method**: `POST`
- **Path**: `/api/v1/auth/login`
- **Authentication**: None
- **Request Body**:
  ```json
  {
    "email": "merchant@example.com",
    "password": "StrongPassword@123"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "data": {
      "merchant": {
        "id": "f83db28b-bfa9-448c-b01f-df6dfa61e712",
        "owner_name": "Pritam Dutta",
        "phone_number": "9876543210",
        "email": "merchant@example.com",
        "shop_name": "Pritam Grocery",
        "shop_type": "GROCERY",
        "created_at": "2026-06-28T16:20:00.000Z",
        "updated_at": "2026-06-28T16:20:00.000Z",
        "deleted_at": null,
        "created_by": "f83db28b-bfa9-448c-b01f-df6dfa61e712",
        "updated_by": "f83db28b-bfa9-448c-b01f-df6dfa61e712"
      },
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "a6d912..."
    }
  }
  ```

### Refresh Token (Rotation)
- **Method**: `POST`
- **Path**: `/api/v1/auth/refresh`
- **Authentication**: None
- **Request Body**:
  ```json
  {
    "refreshToken": "a6d912..."
  }
  ```
- **Response**: `200 OK` (Rotates the old refresh token and issues a new pair)
  ```json
  {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "9d901c..."
  }
  ```

### Logout Merchant
- **Method**: `POST`
- **Path**: `/api/v1/auth/logout`
- **Authentication**: None
- **Request Body**:
  ```json
  {
    "refreshToken": "9d901c..."
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Logged out successfully."
  }
  ```

### Get Merchant Profile
- **Method**: `GET`
- **Path**: `/api/v1/auth/profile`
- **Authentication**: Bearer AccessToken
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "merchant": {
        "id": "f83db28b-bfa9-448c-b01f-df6dfa61e712",
        "owner_name": "Pritam Dutta",
        "phone_number": "9876543210",
        "email": "merchant@example.com",
        "shop_name": "Pritam Grocery",
        "shop_type": "GROCERY",
        "created_at": "2026-06-28T16:20:00.000Z",
        "updated_at": "2026-06-28T16:20:00.000Z",
        "deleted_at": null,
        "created_by": "f83db28b-bfa9-448c-b01f-df6dfa61e712",
        "updated_by": "f83db28b-bfa9-448c-b01f-df6dfa61e712"
      }
    }
  }
  ```

---

## 3. Product Categories Module

### Create Category
- **Method**: `POST`
- **Path**: `/api/v1/categories`
- **Authentication**: Bearer AccessToken
- **Request Body**:
  ```json
  {
    "name": "Drinks"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "success": true,
    "message": "Category created successfully.",
    "data": {
      "id": "b3e0d86c-482a-464a-a035-71bb484d59f7",
      "name": "Drinks",
      "merchant_id": "f83db28b-bfa9-448c-b01f-df6dfa61e712",
      "created_by": "f83db28b-bfa9-448c-b01f-df6dfa61e712",
      "updated_by": "f83db28b-bfa9-448c-b01f-df6dfa61e712",
      "created_at": "2026-06-28T16:25:00.000Z",
      "updated_at": "2026-06-28T16:25:00.000Z",
      "deleted_at": null
    }
  }
  ```

### List Categories
- **Method**: `GET`
- **Path**: `/api/v1/categories`
- **Authentication**: Bearer AccessToken
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "b3e0d86c-482a-464a-a035-71bb484d59f7",
        "name": "Drinks",
        "merchant_id": "f83db28b-bfa9-448c-b01f-df6dfa61e712",
        "created_at": "2026-06-28T16:25:00.000Z",
        "updated_at": "2026-06-28T16:25:00.000Z",
        "deleted_at": null,
        "created_by": "f83db28b-bfa9-448c-b01f-df6dfa61e712",
        "updated_by": "f83db28b-bfa9-448c-b01f-df6dfa61e712"
      }
    ]
  }
  ```

### Get Category by ID
- **Method**: `GET`
- **Path**: `/api/v1/categories/:id`
- **Authentication**: Bearer AccessToken
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "id": "b3e0d86c-482a-464a-a035-71bb484d59f7",
      "name": "Drinks",
      "merchant_id": "f83db28b-bfa9-448c-b01f-df6dfa61e712",
      "created_at": "2026-06-28T16:25:00.000Z",
      "updated_at": "2026-06-28T16:25:00.000Z",
      "deleted_at": null,
      "created_by": "f83db28b-bfa9-448c-b01f-df6dfa61e712",
      "updated_by": "f83db28b-bfa9-448c-b01f-df6dfa61e712"
    }
  }
  ```

### Delete Category (Soft Delete)
- **Method**: `DELETE`
- **Path**: `/api/v1/categories/:id`
- **Authentication**: Bearer AccessToken
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Category deleted successfully."
  }
  ```

---

## 4. Product Catalog Module

### Create Product
- **Method**: `POST`
- **Path**: `/api/v1/products`
- **Authentication**: Bearer AccessToken
- **Request Body** (Client MUST NOT generate product identifiers; fields like `id`, `product_code`, `barcode`, `qr_number`, `qr_code_image_url` are stripped and auto-generated by the backend):
  ```json
  {
    "category_id": "b3e0d86c-482a-464a-a035-71bb484d59f7",
    "english_name": "Rice",
    "bengali_name": "চাল",
    "description": "Premium parboiled long grain miniket rice",
    "unit": "KG",
    "base_price": 60.00,
    "track_stock": true,
    "current_stock": 100,
    "minimum_stock": 10,
    "image_url": "https://example.com/rice.png"
  }
  ```
- **Response**: `201 Created` (Calculates sequence number N inside a transaction and builds product_code, barcode, and base64 QR PNG image)
  ```json
  {
    "success": true,
    "message": "Product created successfully.",
    "data": {
      "id": "6c8076d5-dfa5-4b3e-a99d-3f98c9bb0b55",
      "category_id": "b3e0d86c-482a-464a-a035-71bb484d59f7",
      "english_name": "Rice",
      "bengali_name": "চাল",
      "description": "Premium parboiled long grain miniket rice",
      "unit": "KG",
      "base_price": 60,
      "track_stock": true,
      "current_stock": 100,
      "minimum_stock": 10,
      "image_url": "https://example.com/rice.png",
      "product_code": "FLOW-PROD-000001",
      "barcode": "890000000001",
      "qr_number": "FLOW-QR-000001",
      "qr_code_image_url": "data:image/png;base64,iVBORw0KG...",
      "merchant_id": "f83db28b-bfa9-448c-b01f-df6dfa61e712",
      "created_by": "f83db28b-bfa9-448c-b01f-df6dfa61e712",
      "updated_by": "f83db28b-bfa9-448c-b01f-df6dfa61e712",
      "created_at": "2026-06-28T16:26:00.000Z",
      "updated_at": "2026-06-28T16:26:00.000Z",
      "deleted_at": null
    }
  }
  ```

### List Products (Paginated & Searchable)
- **Method**: `GET`
- **Path**: `/api/v1/products`
- **Authentication**: Bearer AccessToken
- **Query Parameters**:
  - `page` (optional, integer, default `1`)
  - `limit` (optional, integer, default `10`, max `100`)
  - `search` (optional, case-insensitive partial match on `product_code`, `english_name`, `bengali_name`, `barcode`, `qr_number`)
  - `sort` (optional, column to sort by, e.g. `base_price` or `current_stock`)
  - `order` (optional, `ASC` or `DESC`, default `ASC`)
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "6c8076d5-dfa5-4b3e-a99d-3f98c9bb0b55",
        "english_name": "Rice",
        "product_code": "FLOW-PROD-000001",
        "barcode": "890000000001",
        "qr_number": "FLOW-QR-000001",
        "base_price": "60.00",
        "current_stock": 100,
        "category": {
          "id": "b3e0d86c-482a-464a-a035-71bb484d59f7",
          "name": "Rice"
        }
      }
    ],
    "meta": {
      "totalItems": 1,
      "itemCount": 1,
      "itemsPerPage": 10,
      "totalPages": 1,
      "currentPage": 1
    }
  }
  ```

### Product Scan API (Used during Checkout)
- **Method**: `POST`
- **Path**: `/api/v1/products/scan`
- **Authentication**: Bearer AccessToken
- **Request Body**:
  ```json
  {
    "code": "FLOW-QR-000001"
  }
  ```
- **Response**: `200 OK` (Scans either `qr_number` or falls back to `barcode` and returns complete product details)
  ```json
  {
    "success": true,
    "data": {
      "id": "6c8076d5-dfa5-4b3e-a99d-3f98c9bb0b55",
      "product_code": "FLOW-PROD-000001",
      "barcode": "890000000001",
      "qr_number": "FLOW-QR-000001",
      "english_name": "Rice",
      "base_price": "60.00",
      "current_stock": 100
    }
  }
  ```

### Export Labels PDF
- **Method**: `GET`
- **Path**: `/api/v1/products/export/labels`
- **Authentication**: Bearer AccessToken
- **Query Parameters**:
  - `layout` (optional, `Portrait` or `Landscape`, default `Landscape`)
  - `qr_size` (optional, default `55`)
  - `rows` (optional)
  - `columns` (optional)
- **Response**: `200 OK` (Downloads a PDF containing QR codes, barcodes, product codes, and names optimized to fit labels on an A4 sheet)
  - **Headers**:
    - `Content-Type`: `application/pdf`
    - `Content-Disposition`: `attachment; filename="product-labels.pdf"`

### Export Quick-Scan Catalogue PDF
- **Method**: `GET`
- **Path**: `/api/v1/products/export/catalog`
- **Authentication**: Bearer AccessToken
- **Response**: `200 OK` (Downloads a Landscape A4 catalog with rows of QR codes, barcodes, and names to be placed next to the counter)
  - **Headers**:
    - `Content-Type`: `application/pdf`
    - `Content-Disposition`: `attachment; filename="product-catalog.pdf"`

### Export Bulk Excel Spreadsheet
- **Method**: `GET`
- **Path**: `/api/v1/products/export/excel`
- **Authentication**: Bearer AccessToken
- **Response**: `200 OK` (Downloads styled Excel spreadsheet with columns: Product Code, Barcode, QR Number, English/Bengali names, Category, Unit, Price, Stock)
  - **Headers**:
    - `Content-Type`: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
    - `Content-Disposition`: `attachment; filename="products.xlsx"`

### Bulk Import Products (Future Capability)
- **Method**: `POST`
- **Path**: `/api/v1/products/import`
- **Authentication**: Bearer AccessToken
- **Response**: `202 Accepted` (Reserved endpoint returning status placeholder)
  ```json
  {
    "success": true,
    "message": "Bulk product import will be supported in future versions. CSV and Excel file formats will be integrated."
  }
  ```

### Get Product by ID
- **Method**: `GET`
- **Path**: `/api/v1/products/:id`
- **Authentication**: Bearer AccessToken
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "id": "6c8076d5-dfa5-4b3e-a99d-3f98c9bb0b55",
      "product_code": "FLOW-PROD-000001",
      "english_name": "Rice",
      "base_price": "60.00",
      "created_at": "...",
      "updated_at": "..."
    }
  }
  ```

### Update Product Details
- **Method**: `PATCH`
- **Path**: `/api/v1/products/:id`
- **Authentication**: Bearer AccessToken
- **Request Body** (Allows modifying details, strictly ignoring or blocking identifier updates):
  ```json
  {
    "base_price": 65.00,
    "current_stock": 120
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Product updated successfully.",
    "data": {
      "id": "6c8076d5-dfa5-4b3e-a99d-3f98c9bb0b55",
      "product_code": "FLOW-PROD-000001",
      "english_name": "Rice",
      "base_price": 65.00,
      "current_stock": 120,
      "updated_at": "..."
    }
  }
  ```

### Delete Product (Soft Delete)
- **Method**: `DELETE`
- **Path**: `/api/v1/products/:id`
- **Authentication**: Bearer AccessToken
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Product deleted successfully."
  }
  ```

---

## 5. Billing & Invoicing Module

### Generate Invoice (Create Bill)
- **Method**: `POST`
- **Path**: `/api/v1/bills`
- **Authentication**: Bearer AccessToken
- **Request Body** (Prices are auto-resolved from the database to prevent pricing fraud. Subtotals and grand totals are calculated server-side. Stock is auto-deducted for products configured with `track_stock = true`):
  ```json
  {
    "items": [
      {
        "product_id": "d7486e0c-d55e-4efb-8664-df8f5f6b2111",
        "quantity": 2
      }
    ],
    "tax_amount": 5.00,
    "discount_amount": 10.00
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "success": true,
    "message": "Invoice generated successfully.",
    "data": {
      "merchant_id": "f83db28b-bfa9-448c-b01f-df6dfa61e712",
      "invoice_number": "INV-20260628-000001",
      "total_amount": 90.00,
      "tax_amount": 5.00,
      "discount_amount": 10.00,
      "net_amount": 85.00,
      "created_by": "f83db28b-bfa9-448c-b01f-df6dfa61e712",
      "updated_by": "f83db28b-bfa9-448c-b01f-df6dfa61e712",
      "id": "e2f12a32-72cf-4b2a-89a3-df2fa1124ac3",
      "created_at": "2026-06-28T16:28:00.000Z",
      "updated_at": "2026-06-28T16:28:00.000Z",
      "deleted_at": null,
      "items": [
        {
          "id": "a9d72c11-9a74-4b53-b291-df6ef8292fa1",
          "product_id": "d7486e0c-d55e-4efb-8664-df8f5f6b2111",
          "quantity": 2,
          "unit_price": 45.00,
          "subtotal": 90.00,
          "created_by": "f83db28b-bfa9-448c-b01f-df6dfa61e712",
          "updated_by": "f83db28b-bfa9-448c-b01f-df6dfa61e712",
          "created_at": "2026-06-28T16:28:00.000Z",
          "updated_at": "2026-06-28T16:28:00.000Z",
          "deleted_at": null
        }
      ]
    }
  }
  ```

### List Invoices (Paginated & Searchable)
- **Method**: `GET`
- **Path**: `/api/v1/bills`
- **Authentication**: Bearer AccessToken
- **Query Parameters**:
  - `page` (optional, integer, default `1`)
  - `limit` (optional, integer, default `10`, max `100`)
  - `search` (optional, filters by exact/partial invoice number prefix like `INV-20260628`)
  - `sort` (optional, column to sort by, e.g. `net_amount`)
  - `order` (optional, `ASC` or `DESC`, default `DESC`)
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "e2f12a32-72cf-4b2a-89a3-df2fa1124ac3",
        "invoice_number": "INV-20260628-000001",
        "total_amount": "90.00",
        "tax_amount": "5.00",
        "discount_amount": "10.00",
        "net_amount": "85.00",
        "created_at": "2026-06-28T16:28:00.000Z",
        "items": [
          {
            "id": "a9d72c11-9a74-4b53-b291-df6ef8292fa1",
            "product_id": "d7486e0c-d55e-4efb-8664-df8f5f6b2111",
            "quantity": 2,
            "unit_price": "45.00",
            "subtotal": "90.00",
            "product": {
              "id": "d7486e0c-d55e-4efb-8664-df8f5f6b2111",
              "english_name": "Coca Cola 250ml",
              "product_code": "PROD001"
            }
          }
        ]
      }
    ],
    "meta": {
      "totalItems": 1,
      "itemCount": 1,
      "itemsPerPage": 10,
      "totalPages": 1,
      "currentPage": 1
    }
  }
  ```

### Get Invoice by ID
- **Method**: `GET`
- **Path**: `/api/v1/bills/:id`
- **Authentication**: Bearer AccessToken
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "id": "e2f12a32-72cf-4b2a-89a3-df2fa1124ac3",
      "invoice_number": "INV-20260628-000001",
      "total_amount": "90.00",
      "tax_amount": "5.00",
      "discount_amount": "10.00",
      "net_amount": "85.00",
      "created_at": "2026-06-28T16:28:00.000Z",
      "items": [
        {
          "id": "a9d72c11-9a74-4b53-b291-df6ef8292fa1",
          "product_id": "d7486e0c-d55e-4efb-8664-df8f5f6b2111",
          "quantity": 2,
          "unit_price": "45.00",
          "subtotal": "90.00",
          "product": {
            "id": "d7486e0c-d55e-4efb-8664-df8f5f6b2111",
            "english_name": "Coca Cola 250ml",
            "product_code": "PROD001"
          }
        }
      ]
    }
  }
  ```

### Delete Invoice (Soft Delete)
- **Method**: `DELETE`
- **Path**: `/api/v1/bills/:id`
- **Authentication**: Bearer AccessToken
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Invoice soft-deleted successfully."
  }
  ```
