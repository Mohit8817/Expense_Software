export const TALLY_MANUAL_FILENAME = "KLK-Tally-API-Manual.md";
export const TALLY_MANUAL_PDF_FILENAME = "KLK-Tally-API-Manual.pdf";

export const TALLY_API_MANUAL = `# KLK Expense — Tally Integration API Manual

**Version:** 1.0  
**Last updated:** 28 July 2026  
**Base path:** \`/api/tally\`

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Authentication & Company Context](#2-authentication--company-context)
3. [Data Storage Rules](#3-data-storage-rules)
4. [Integration Workflow](#4-integration-workflow)
5. [Common Query Parameters](#5-common-query-parameters)
6. [Response Format](#6-response-format)
7. [Credit Note APIs](#7-credit-note-apis)
8. [Debit Note APIs](#8-debit-note-apis)
9. [Delivery Challan APIs](#9-delivery-challan-apis)
10. [Expense (Journal Voucher) APIs](#10-expense-journal-voucher-apis)
11. [Payment Voucher APIs](#11-payment-voucher-apis)
12. [Purchase Invoice APIs](#12-purchase-invoice-apis)
13. [Sales Invoice APIs](#13-sales-invoice-apis)
14. [Company Master APIs](#14-company-master-apis)
15. [Error Codes](#15-error-codes)
16. [Environment Variables](#16-environment-variables)

---

## 1. Introduction

The Tally integration APIs allow Tally (or any external accounting connector) to:

- **Pull (GET)** approved accounting documents from KLK in Tally-friendly JSON format
- **Push (POST/PUT)** documents created in Tally into KLK
- **Update or delete** records synced via Tally
- **Confirm import (PATCH)** after a record is successfully posted in Tally

All Tally routes are **public** (no JWT Bearer token). Every request **must** include \`company_id\` — there are no exceptions. It must match the tenant \`unique_id\` configured in KLK Settings → Company.

> **Mandatory rule:** If \`company_id\` is missing or empty, the API returns \`400 Bad Request\` and no action is performed.

---

## 2. Authentication & Company Context

| Item | Detail |
|------|--------|
| Auth | **Not required** — no \`Authorization\` header |
| \`company_id\` | **Required on every request** — GET, POST, PUT, PATCH, DELETE |
| \`user_id\` | Optional on write requests only (defaults to \`1\` or \`TALLY_DEFAULT_USER_ID\`) |

### Where to pass company_id (required — use query and/or body)

| Method | Required location |
|--------|-------------------|
| GET | Query string: \`?company_id=KLK19022025\` |
| POST | Request body: \`{ "company_id": "KLK19022025", ... }\` (query also accepted) |
| PUT | Request body or query — **must be present** |
| PATCH | Query string: \`?company_id=KLK19022025\` (body also accepted) |
| DELETE | Query string: \`?company_id=KLK19022025\` (body also accepted) |

Requests without \`company_id\` are rejected immediately:

\`\`\`json
{
  "message": "company_id is required on every Tally API request (pass as query parameter or in request body)"
}
\`\`\`

---

## 3. Data Storage Rules

When data is saved via Tally APIs, the following fields are set automatically:

| Field | App UI create | Tally API create |
|-------|---------------|------------------|
| \`company_id\` | From logged-in user | From request \`company_id\` |
| \`user_id\` | From logged-in user | From request or default (\`1\`) |
| \`data_status\` | \`1\` (created in app) | \`2\` (created via Tally API) |
| \`approval_status\` | \`PENDING\` (default) | \`PENDING\` (default) |
| \`tally_push_status\` | \`NOT_PUSHED\` (default) | \`NOT_PUSHED\` (default) |

### data_status values

| Value | Meaning |
|-------|---------|
| \`1\` | Record created inside KLK web application |
| \`2\` | Record created or updated through Tally API |

### approval_status values

| Value | Meaning |
|-------|---------|
| \`PENDING\` | Awaiting approval in KLK |
| \`APPROVED\` | Approved — eligible for Tally export (GET) |
| \`REJECTED\` | Rejected in KLK |

### tally_push_status values

| Value | Meaning |
|-------|---------|
| \`NOT_PUSHED\` | Waiting for Tally to pull/import |
| \`PUSHED\` | Successfully imported into Tally |

> **Important:** GET export endpoints only return records where \`approval_status = APPROVED\` AND \`tally_push_status = NOT_PUSHED\`. Records must be approved in KLK before Tally can pull them.

---

## 4. Integration Workflow

### A. KLK → Tally (export)

1. User creates & approves document in KLK app (\`data_status = 1\`).
2. Tally connector calls **GET** list endpoint with \`company_id\`.
3. KLK returns approved, not-yet-pushed records in Tally JSON format.
4. Tally posts voucher in Tally ERP.
5. Tally connector calls **PATCH** \`/:id/pushed\` to mark record as imported.
6. Record no longer appears in GET export (\`tally_push_status = PUSHED\`).

### B. Tally → KLK (import)

1. Tally connector calls **POST** with document JSON + \`company_id\`.
2. KLK saves record with \`data_status = 2\`.
3. Record appears in KLK Accounts module (may require approval depending on business rules).
4. Optional: **PUT** to update, **DELETE** to remove Tally-origin records.

---

## 5. Common Query Parameters

| Parameter | Required | Used on | Description |
|-----------|----------|---------|-------------|
| \`company_id\` | **Yes — always** | **All endpoints** | Tenant unique ID. Missing = 400 error. |
| \`user_id\` | No | POST / PUT only | User ID stored on the record (default: \`1\`) |

---

## 6. Response Format

### GET list success

\`\`\`json
{
  "data": [ { ...tallyFormattedRecord }, { ... } ]
}
\`\`\`

### GET single success

\`\`\`json
{
  "data": [ { ...tallyFormattedRecord } ]
}
\`\`\`

### POST / PUT success

\`\`\`json
{
  "message": "Purchase created successfully",
  "data": { ...fullDatabaseRecord }
}
\`\`\`

### PATCH pushed success

\`\`\`json
{
  "message": "Sales invoice marked as pushed to Tally",
  "data": { "id": 42, "tally_push_status": "PUSHED" }
}
\`\`\`

### Date format in GET exports

Dates are formatted as \`DD/Mon/YYYY\` (e.g. \`15/Jul/2026\`).

---

## 7. Credit Note APIs

**Database table:** \`CreditNote\` + line items

### 7.1 GET — List for Tally export

\`\`\`http
GET /api/tally/credit-notes?company_id={company_id}
\`\`\`

**Filters applied:** \`approval_status=APPROVED\`, \`tally_push_status=NOT_PUSHED\`, \`company_id\`

**Tally JSON fields:**

| Field | Source |
|-------|--------|
| CreditNoteNo | credit_note_no |
| CreditNoteDate | credit_note_date |
| InvoiceNo | original_invoice_no |
| CustomerName | buyer_name |
| BillAmount | total_amount |
| customergstin | buyer_gstin |
| BillItems | items[] → itemname, quantity, rate, amount |
| GstDetails | gst_details or CGST/SGST/IGST amounts |

### 7.2 GET — Single record

\`\`\`http
GET /api/tally/credit-notes/{id}?company_id={company_id}
\`\`\`

### 7.3 POST — Create from Tally

\`\`\`http
POST /api/tally/credit-notes
Content-Type: application/json
\`\`\`

**Required body fields:**

\`\`\`json
{
  "company_id": "ACME001",
  "user_id": 1,
  "credit_note_no": "CN-2026-001",
  "credit_note_date": "2026-07-15",
  "seller_name": "ACME Pvt Ltd",
  "seller_address": "Mumbai",
  "seller_gstin": "27AAAAA0000A1Z5",
  "seller_state": "Maharashtra",
  "seller_state_code": "27",
  "buyer_name": "Customer Ltd",
  "buyer_address": "Pune",
  "buyer_gstin": "27BBBBB0000B1Z5",
  "buyer_state": "Maharashtra",
  "buyer_state_code": "27",
  "total_quantity": 10,
  "taxable_value": 10000,
  "total_tax_amount": 1800,
  "total_amount": 11800,
  "items": [
    {
      "description": "Product A",
      "hsn_sac": "8471",
      "quantity": 10,
      "rate": 1000,
      "amount": 10000
    }
  ]
}
\`\`\`

**Saved as:** \`data_status=2\`, linked items in \`CreditNoteItem\` table.

### 7.4 PUT — Update

\`\`\`http
PUT /api/tally/credit-notes/{id}
\`\`\`

Pass updated fields + \`company_id\` in body. Items array replaces line items.

### 7.5 DELETE

\`\`\`http
DELETE /api/tally/credit-notes/{id}?company_id={company_id}
\`\`\`

### 7.6 PATCH — Mark as pushed

\`\`\`http
PATCH /api/tally/credit-notes/{id}/pushed?company_id={company_id}
\`\`\`

Sets \`tally_push_status = PUSHED\`.

---

## 8. Debit Note APIs

**Database table:** \`DebitNote\` + line items

### 8.1 GET — List

\`\`\`http
GET /api/tally/debit-notes?company_id={company_id}
\`\`\`

**Tally JSON fields:** DebitNoteNo, DebitNoteDate, PurchaseNo, VendorName, DebitNoteAmount, Vendorgstin, PurchaseItems, GstDetails

### 8.2 GET — Single

\`\`\`http
GET /api/tally/debit-notes/{id}?company_id={company_id}
\`\`\`

### 8.3 POST — Create

\`\`\`http
POST /api/tally/debit-notes
\`\`\`

**Required:** \`debit_note_no\`, \`debit_note_date\`, seller/buyer details, \`items[]\`, \`company_id\`

**Example key fields:**

\`\`\`json
{
  "company_id": "ACME001",
  "debit_note_no": "DN-2026-001",
  "debit_note_date": "2026-07-15",
  "seller_name": "Vendor Ltd",
  "seller_gstin": "27VVVVV0000V1Z5",
  "buyer_name": "ACME Pvt Ltd",
  "buyer_gstin": "27AAAAA0000A1Z5",
  "total_amount": 5900,
  "items": [{ "description": "Return goods", "quantity": 1, "rate": 5000, "amount": 5000 }]
}
\`\`\`

### 8.4 PUT / DELETE / PATCH

Same pattern as Credit Note:

- \`PUT /api/tally/debit-notes/{id}\`
- \`DELETE /api/tally/debit-notes/{id}?company_id={company_id}\`
- \`PATCH /api/tally/debit-notes/{id}/pushed?company_id={company_id}\`

---

## 9. Delivery Challan APIs

**Database table:** \`DeliveryChallan\` + line items

### 9.1 GET — List

\`\`\`http
GET /api/tally/delivery-challans?company_id={company_id}
\`\`\`

**Tally JSON fields:** Challanno, Challandate, CustomerName, Challanamount, customergstin, challanitems, GstDetails

### 9.2 GET — Single

\`\`\`http
GET /api/tally/delivery-challans/{id}?company_id={company_id}
\`\`\`

### 9.3 POST — Create

\`\`\`http
POST /api/tally/delivery-challans
\`\`\`

**Required:** \`challan_no\`, \`challan_date\`, buyer/seller details, \`items[]\`, \`company_id\`

### 9.4 PUT / DELETE / PATCH

- \`PUT /api/tally/delivery-challans/{id}\`
- \`DELETE /api/tally/delivery-challans/{id}?company_id={company_id}\`
- \`PATCH /api/tally/delivery-challans/{id}/pushed?company_id={company_id}\`

---

## 10. Expense (Journal Voucher) APIs

**Database table:** \`JournalVoucher\` + \`JournalVoucherEntry\` (Dr/Cr ledger lines)

> Mapped to Tally endpoint name **expenses** for historical compatibility.

### 10.1 GET — List

\`\`\`http
GET /api/tally/expenses?company_id={company_id}
\`\`\`

**Tally JSON fields:**

| Field | Description |
|-------|-------------|
| VoucherNo | voucher_no |
| VoucherDate | voucher_date |
| Narration | narration |
| DebitLedgers | entries where entry_type=Dr |
| CreditLedgers | entries where entry_type=Cr |

### 10.2 GET — Single

\`\`\`http
GET /api/tally/expenses/{id}?company_id={company_id}
\`\`\`

### 10.3 POST — Create

\`\`\`http
POST /api/tally/expenses
\`\`\`

**Required:** \`voucher_no\`, \`voucher_date\`, balanced \`entries[]\`, \`company_id\`

\`\`\`json
{
  "company_id": "ACME001",
  "voucher_no": "JV-2026-001",
  "voucher_date": "2026-07-15",
  "voucher_type": "Journal Voucher",
  "company_name": "ACME Pvt Ltd",
  "narration": "Office rent for July",
  "total_debit": 5000,
  "total_credit": 5000,
  "entries": [
    { "particulars": "Rent Expense", "debit_amount": 5000, "entry_type": "Dr" },
    { "particulars": "Bank Account", "credit_amount": 5000, "entry_type": "Cr" }
  ]
}
\`\`\`

**Validation:** Total debit must equal total credit. Each entry requires \`particulars\` and \`entry_type\` (\`Dr\` or \`Cr\`).

**Saved as:** Header in \`JournalVoucher\`, lines in \`JournalVoucherEntry\`, \`data_status=2\`.

### 10.4 PUT / DELETE / PATCH

- \`PUT /api/tally/expenses/{id}\`
- \`DELETE /api/tally/expenses/{id}?company_id={company_id}\`
- \`PATCH /api/tally/expenses/{id}/pushed?company_id={company_id}\`

---

## 11. Payment Voucher APIs

**Database table:** \`PaymentVoucher\` + entries (+ optional payment allocations)

### 11.1 GET — List

\`\`\`http
GET /api/tally/payments?company_id={company_id}
\`\`\`

**Tally JSON fields:** Same ledger structure as Expense — VoucherNo, VoucherDate, Narration, DebitLedgers, CreditLedgers

### 11.2 GET — Single

\`\`\`http
GET /api/tally/payments/{id}?company_id={company_id}
\`\`\`

### 11.3 POST — Create

\`\`\`http
POST /api/tally/payments
\`\`\`

**Required:** \`voucher_no\`, \`voucher_date\`, balanced \`entries[]\`, \`company_id\`

\`\`\`json
{
  "company_id": "ACME001",
  "voucher_no": "PV-2026-001",
  "voucher_date": "2026-07-15",
  "payment_type": "PAYMENT",
  "payee_name": "Vendor Ltd",
  "narration": "Payment against purchase invoice",
  "total_debit": 11800,
  "total_credit": 11800,
  "entries": [
    { "particulars": "Vendor Ltd", "debit_amount": 11800, "entry_type": "Dr" },
    { "particulars": "HDFC Bank", "credit_amount": 11800, "entry_type": "Cr" }
  ],
  "allocations": [
    {
      "document_type": "PURCHASE",
      "document_id": 12,
      "document_no": "PI-001",
      "document_amount": 11800,
      "paid_amount": 11800,
      "allocation_type": "FULL"
    }
  ]
}
\`\`\`

**Optional \`allocations[]\`:** Links payment to purchase/sales documents.

### 11.4 PUT / DELETE / PATCH

- \`PUT /api/tally/payments/{id}\`
- \`DELETE /api/tally/payments/{id}?company_id={company_id}\`
- \`PATCH /api/tally/payments/{id}/pushed?company_id={company_id}\`

---

## 12. Purchase Invoice APIs

**Database table:** \`Purchase\` + items + gst_details

### 12.1 GET — List

\`\`\`http
GET /api/tally/purchases?company_id={company_id}
\`\`\`

**Tally JSON fields:**

| Field | Source |
|-------|--------|
| PurchaseNo | invoice_no |
| PurchaseDate | invoice_date |
| PONo | buyers_order_no |
| VendorName | seller_name |
| PurchaseAmount | total_amount |
| Vendorgstin | seller_gstin |
| PurchaseItems | items[] |
| GstDetails | gst_details[] |

### 12.2 GET — Single

\`\`\`http
GET /api/tally/purchases/{id}?company_id={company_id}
\`\`\`

### 12.3 POST — Create

\`\`\`http
POST /api/tally/purchases
\`\`\`

**Required:** \`irn\`, \`invoice_no\`, \`invoice_date\`, seller/buyer details, \`items[]\`, \`company_id\`

\`\`\`json
{
  "company_id": "ACME001",
  "irn": "abc123-unique-irn",
  "invoice_no": "PI-2026-001",
  "invoice_date": "2026-07-15",
  "seller_name": "Vendor Ltd",
  "seller_gstin": "27VVVVV0000V1Z5",
  "buyer_name": "ACME Pvt Ltd",
  "buyer_gstin": "27AAAAA0000A1Z5",
  "taxable_value": 10000,
  "total_tax_amount": 1800,
  "total_amount": 11800,
  "items": [
    {
      "description": "Raw Material",
      "hsn_sac": "3926",
      "quantity": 100,
      "unit": "KG",
      "rate": 100,
      "amount": 10000
    }
  ],
  "gst_details": [
    { "ledger_name": "CGST", "rate": 9, "amount": 900 },
    { "ledger_name": "SGST", "rate": 9, "amount": 900 }
  ]
}
\`\`\`

**Saved as:** \`Purchase\` row + \`PurchaseItem\` lines + \`PurchaseGstDetail\` rows, \`data_status=2\`.

### 12.4 PUT / DELETE / PATCH

- \`PUT /api/tally/purchases/{id}\`
- \`DELETE /api/tally/purchases/{id}?company_id={company_id}\`
- \`PATCH /api/tally/purchases/{id}/pushed?company_id={company_id}\`

---

## 13. Sales Invoice APIs

**Database table:** \`Sales\` + line items

### 13.1 GET — List

\`\`\`http
GET /api/tally/sales?company_id={company_id}
\`\`\`

**Tally JSON fields:**

| Field | Source |
|-------|--------|
| InvoiceNo | invoice_no |
| InvoiceDate | invoice_date |
| Challanno | delivery_note / dispatch_doc_no |
| CustomerName | buyer_name |
| BillAmount | total_amount |
| customergstin | buyer_gstin |
| BillItems | items[] |
| GstDetails | CGST/SGST/IGST or gst_details |

### 13.2 GET — Single

\`\`\`http
GET /api/tally/sales/{id}?company_id={company_id}
\`\`\`

### 13.3 POST — Create

\`\`\`http
POST /api/tally/sales
\`\`\`

**Required:** \`invoice_no\`, \`invoice_date\`, seller/buyer details, \`items[]\`, \`company_id\`

\`\`\`json
{
  "company_id": "ACME001",
  "invoice_no": "SI-2026-001",
  "invoice_date": "2026-07-15",
  "seller_name": "ACME Pvt Ltd",
  "seller_gstin": "27AAAAA0000A1Z5",
  "buyer_name": "Customer Ltd",
  "buyer_gstin": "27BBBBB0000B1Z5",
  "taxable_value": 50000,
  "cgst_amount": 4500,
  "sgst_amount": 4500,
  "total_amount": 59000,
  "items": [
    {
      "description": "Finished Goods",
      "hsn_sac": "8471",
      "quantity": 5,
      "rate": 10000,
      "amount": 50000
    }
  ]
}
\`\`\`

### 13.4 PUT / DELETE / PATCH

- \`PUT /api/tally/sales/{id}\`
- \`DELETE /api/tally/sales/{id}?company_id={company_id}\`
- \`PATCH /api/tally/sales/{id}/pushed?company_id={company_id}\`

---

## 14. Company Master APIs

**Database table:** \`CompanyDetail\`

Records follow the same approval and Tally push workflow as vouchers: only **APPROVED** + **NOT_PUSHED** records appear in GET export.

### 14.1 GET — Export list

\`\`\`http
GET /api/tally/companies?company_id={company_id}
\`\`\`

**Response shape (each item):**

\`\`\`json
{
  "id": 1,
  "CompanyName": "ABC Company",
  "LedgerName": "Customer 1",
  "LedgerCode": "Cust 001",
  "LedgerGroup": "Sundry Debtors",
  "AddLine1": "wfdwqwd",
  "AddLine2": "dgwfwqfd",
  "AddLine3": "",
  "LedgerPIN": "110001",
  "LedState": "Delhi",
  "LedCountry": "India",
  "ContactPerson": "ABC",
  "ContactNumber": "9999999999",
  "EmailID": "abc@gmail.com",
  "PanNumber": "AAAAA1111A",
  "GSTNumber": "07AAAAA1111A1Z1"
}
\`\`\`

### 14.2 GET — Export one

\`\`\`http
GET /api/tally/companies/{id}?company_id={company_id}
\`\`\`

### 14.3 POST — Create from Tally

\`\`\`http
POST /api/tally/companies
\`\`\`

Pass the same JSON fields as export. \`company_id\` is **required**. Records created via Tally API are stored with \`data_status=2\`, auto-approved, and marked as already pushed.

### 14.4 PUT / DELETE / PATCH

- \`PUT /api/tally/companies/{id}\`
- \`DELETE /api/tally/companies/{id}?company_id={company_id}\`
- \`PATCH /api/tally/companies/{id}/pushed?company_id={company_id}\`

---

## 15. Error Codes

| HTTP | Meaning | Common cause |
|------|---------|--------------|
| 400 | Bad Request | **Missing or empty \`company_id\`**, invalid body, unbalanced journal entries |
| 404 | Not Found | Record ID not found or not approved for PATCH |
| 409 | Conflict | Duplicate document number or IRN |
| 500 | Server Error | Database or unexpected error |

**Example error response:**

\`\`\`json
{
  "message": "company_id is required on every Tally API request (pass as query parameter or in request body)"
}
\`\`\`

---

## 16. Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| \`TALLY_DEFAULT_USER_ID\` | User ID stored on Tally API writes when \`user_id\` omitted | \`1\` |

---

## Quick Reference — All Endpoints

| Module | GET list | GET one | POST | PUT | DELETE | PATCH pushed |
|--------|----------|---------|------|-----|--------|--------------|
| Credit Note | /credit-notes | /credit-notes/:id | /credit-notes | /credit-notes/:id | /credit-notes/:id | /credit-notes/:id/pushed |
| Debit Note | /debit-notes | /debit-notes/:id | /debit-notes | /debit-notes/:id | /debit-notes/:id | /debit-notes/:id/pushed |
| Delivery Challan | /delivery-challans | /delivery-challans/:id | /delivery-challans | /delivery-challans/:id | /delivery-challans/:id | /delivery-challans/:id/pushed |
| Expense (JV) | /expenses | /expenses/:id | /expenses | /expenses/:id | /expenses/:id | /expenses/:id/pushed |
| Payment | /payments | /payments/:id | /payments | /payments/:id | /payments/:id | /payments/:id/pushed |
| Purchase | /purchases | /purchases/:id | /purchases | /purchases/:id | /purchases/:id | /purchases/:id/pushed |
| Sales | /sales | /sales/:id | /sales | /sales/:id | /sales/:id | /sales/:id/pushed |
| Company Master | /companies | /companies/:id | /companies | /companies/:id | /companies/:id | /companies/:id/pushed |

**Full URL prefix:** \`{SERVER_HOST}/api/tally\`

---

*End of manual — KLK Ventures Pvt Ltd*
`;
