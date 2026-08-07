export const TALLY_MANUAL_FILENAME = "KLK-Tally-API-Manual.md";
export const TALLY_MANUAL_PDF_FILENAME = "KLK-Tally-API-Manual.pdf";

export const TALLY_API_MANUAL = `# KLK Expense — Tally Integration API Manual

**Version:** 1.1  
**Last updated:** 6 August 2026  
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
| \`data_status\` | \`1\` (created in app — **Software**) | \`2\` (created via Tally API — **Tally**) |
| \`approval_status\` | \`PENDING\` (default) | \`APPROVED\` (auto on POST) |
| \`tally_push_status\` | \`NOT_PUSHED\` (default) | \`PUSHED\` (auto on POST) |

### data_status values

| Value | Meaning |
|-------|---------|
| \`1\` | Record created inside KLK web application (**Source: Software** in UI) |
| \`2\` | Record created or updated through Tally API (**Source: Tally** in UI) |

### approval_status values

| Value | Meaning |
|-------|---------|
| \`PENDING\` | Awaiting approval in KLK |
| \`APPROVED\` | Approved — eligible for Tally export (GET) |
| \`REJECTED\` | Rejected in KLK |

### tally_push_status values

| Value | Meaning |
|-------|---------|
| \`NOT_PUSHED\` | Created in app; not yet queued for Tally (or already synced after Tally import) |
| \`PUSHED\` | Ready for Tally GET — senior clicked Push in app (\`data_status=1\`), or imported from Tally POST (\`data_status=2\`) |
| \`FAILED\` | Push to Tally failed |

> **GET export:** Returns \`approval_status=APPROVED\`, \`tally_push_status=PUSHED\`, \`data_status=1\` only — app records queued by senior for Tally to fetch. Records with \`data_status=2\` (Tally POST imports) are **excluded**. Approved-but-not-pushed app records (\`NOT_PUSHED\`) are also **excluded** until senior clicks **Push to Tally** in KLK.

### KLK UI — Source column

Every record in KLK Accounts lists shows a **Source** badge:

| Badge | \`data_status\` | Meaning |
|-------|-----------------|---------|
| **Software** | \`1\` | Created in KLK application |
| **Tally** | \`2\` | Imported via Tally POST API |

---

## 4. Integration Workflow

### A. KLK → Tally (export)

1. User creates & approves document in KLK app (\`data_status = 1\`).
2. Senior clicks **Push to Tally** → \`tally_push_status = PUSHED\`.
3. Tally connector calls **GET** list endpoint with \`company_id\`.
4. KLK returns \`PUSHED\` app records in Tally JSON format.
5. Tally posts voucher in Tally ERP.
6. Tally connector calls **PATCH** \`/:id/pushed\` → \`tally_push_status = NOT_PUSHED\` (synced, removed from GET queue).

### B. Tally → KLK (import)

1. Tally connector calls **POST** with document JSON + \`company_id\`.
2. KLK saves record with \`data_status = 2\`, \`approval_status = APPROVED\`, \`tally_push_status = PUSHED\`.
3. Record appears in KLK Accounts module with **Source: Tally** — **does not** appear in GET export queue.
4. Optional: **PUT** to update, **DELETE** to remove Tally-origin records.

---

## 5. Common Query Parameters

| Parameter | Required | Used on | Description |
|-----------|----------|---------|-------------|
| \`company_id\` | **Yes — always** | **All endpoints** | Tenant unique ID. Missing = 400 error. |
| \`user_id\` | No | POST / PUT only | User ID stored on the record (default: \`1\`) |

---

## 6. Response Format

### Common fields on every GET export record

All GET list/single responses include these metadata fields on each record:

| Field | Type | Description |
|-------|------|-------------|
| \`id\` | number | KLK database record ID (use for PATCH \`/pushed\`) |
| \`company_id\` | string | Tenant unique ID |
| \`DataSource\` | string | \`Software\` (\`data_status=1\`) or \`Tally\` (\`data_status=2\`) |
| \`TallyPushStatus\` | string | \`NOT_PUSHED\`, \`PUSHED\`, or \`FAILED\` |

> On GET export, \`DataSource\` is always \`Software\` and \`TallyPushStatus\` is always \`PUSHED\` (queue filter).

### GET list success

\`\`\`json
{
  "data": [
    {
      "id": 5,
      "company_id": "KLKURJA",
      "DataSource": "Software",
      "TallyPushStatus": "PUSHED",
      "PurchaseNo": "Pur0991",
      "PurchaseDate": "02/Jul/2026",
      "VendorName": "XYZ Pvt Ltd",
      "PurchaseAmount": 120000,
      "PurchaseItems": [],
      "GstDetails": []
    }
  ]
}
\`\`\`

### GET list — empty queue

When no records match the export filter:

\`\`\`json
{
  "data": [],
  "hint": "No records in Tally export queue. Create in KLK app → Approve → Senior clicks 'Push to Tally'. Records imported via Tally POST (data_status=2) are excluded from GET."
}
\`\`\`

**Why empty?** Common causes:
- Records were imported via Tally POST (\`data_status=2\`) — excluded by design
- App records are approved but **Push to Tally** not clicked yet (\`NOT_PUSHED\`)
- Records already synced — PATCH \`/pushed\` reset \`tally_push_status\` to \`NOT_PUSHED\`

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

Call after Tally ERP successfully imports a record from GET. Removes the record from the export queue.

\`\`\`json
{
  "message": "Purchase synced to Tally — removed from export queue",
  "data": { "id": 42, "tally_push_status": "NOT_PUSHED" }
}
\`\`\`

**Effect:** Sets \`tally_push_status = NOT_PUSHED\`. Record no longer appears in GET until senior clicks **Push to Tally** again in KLK.

**Requirements:** Record must be \`APPROVED\`, \`PUSHED\`, \`data_status=1\`, and match \`company_id\`. Otherwise returns \`404\`.

### Date format in GET exports

Dates are formatted as \`DD/Mon/YYYY\` (e.g. \`15/Jul/2026\`).

---

## 7. Credit Note APIs

**Database table:** \`CreditNote\` + line items

### 7.1 GET — List for Tally export

\`\`\`http
GET /api/tally/credit-notes?company_id={company_id}
\`\`\`

**Filters applied:** \`approval_status=APPROVED\`, \`tally_push_status=PUSHED\`, \`data_status=1\`, \`company_id\`

**Tally JSON fields:**

| Field | Source |
|-------|--------|
| id | id |
| company_id | company_id |
| DataSource | \`Software\` if data_status=1, else \`Tally\` |
| TallyPushStatus | tally_push_status |
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
POST /api/tally/credit-notes?company_id={company_id}
Content-Type: application/json
\`\`\`

**Tally batch format (recommended):**

\`\`\`json
{
  "data": [
    {
      "company_id": "KLKURJA",
      "CreditNoteNo": "Inv0991",
      "CreditNoteDate": "02/Jul/2026",
      "InvoiceNo": "DL0991",
      "CustomerName": "ABC Pvt Ltd",
      "BillAmount": 120000,
      "customergstin": "",
      "BillItems": [
        { "itemname": "Item A", "quantity": 1, "rate": 15844, "amount": 15844 },
        { "itemname": "Item B", "quantity": 4, "rate": 12000, "amount": 48000 }
      ],
      "GstDetails": [
        { "LedgerName": "CGST", "amount": 5822 },
        { "LedgerName": "SGST", "amount": 5822 }
      ]
    }
  ]
}
\`\`\`

**Field mapping:** CreditNoteNo → credit_note_no, CreditNoteDate → credit_note_date, InvoiceNo → original_invoice_no, CustomerName → buyer_name, BillAmount → total_amount, customergstin → buyer_gstin, BillItems → items, GstDetails → CGST/SGST/IGST amounts.

**App format (single record):**

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

**Saved as:** \`data_status=2\`, \`approval_status=APPROVED\`, \`tally_push_status=PUSHED\`, linked items in \`CreditNoteItem\` table.

### 7.4 PUT — Update

\`\`\`http
PUT /api/tally/credit-notes/{id}
\`\`\`

Pass updated fields + \`company_id\` in body. Items array replaces line items.

### 7.5 DELETE

\`\`\`http
DELETE /api/tally/credit-notes/{id}?company_id={company_id}
\`\`\`

### 7.6 PATCH — Confirm Tally import (remove from queue)

\`\`\`http
PATCH /api/tally/credit-notes/{id}/pushed?company_id={company_id}
\`\`\`

Sets \`tally_push_status = NOT_PUSHED\` after successful import in Tally ERP. See [PATCH pushed success](#patch-pushed-success) in section 6.

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

### 8.3 POST — Create from Tally

\`\`\`http
POST /api/tally/debit-notes?company_id={company_id}
Content-Type: application/json
\`\`\`

**Tally batch format (recommended):**

\`\`\`json
{
  "data": [
    {
      "company_id": "KLKURJA",
      "DebitNoteNo": "Pur0991",
      "DebitNoteDate": "02/Jul/2026",
      "PurchaseNo": "PO908",
      "VendorName": "XYZ Pvt Ltd",
      "DebitNoteAmount": 120000,
      "Vendorgstin": "",
      "PurchaseItems": [
        { "itemname": "Item A", "quantity": 1, "rate": 15844, "amount": 15844 },
        { "itemname": "Item B", "quantity": 4, "rate": 12000, "amount": 48000 }
      ],
      "GstDetails": [
        { "LedgerName": "CGST", "amount": 5822 },
        { "LedgerName": "SGST", "amount": 5822 }
      ]
    }
  ]
}
\`\`\`

**Field mapping:** DebitNoteNo → debit_note_no, DebitNoteDate → debit_note_date, PurchaseNo → original_invoice_no, VendorName → seller_name, DebitNoteAmount → total_amount, Vendorgstin → seller_gstin, PurchaseItems → items, GstDetails → CGST/SGST/IGST amounts.

**App format (single record):**

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

**Saved as:** \`data_status=2\`, \`approval_status=APPROVED\`, \`tally_push_status=PUSHED\`, linked items in \`DebitNoteItem\` table.

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

### 9.3 POST — Create from Tally

\`\`\`http
POST /api/tally/delivery-challans?company_id={company_id}
Content-Type: application/json
\`\`\`

**Tally batch format (recommended):**

\`\`\`json
{
  "data": [
    {
      "company_id": "KLKURJA",
      "Challanno": "DC0991",
      "Challandate": "02/Jul/2026",
      "CustomerName": "ABC Pvt Ltd",
      "Challanamount": 120000,
      "customergstin": "",
      "challanitems": [
        { "itemname": "Item A", "quantity": 1, "rate": 15844, "amount": 15844 }
      ],
      "GstDetails": [
        { "LedgerName": "CGST", "amount": 5822 },
        { "LedgerName": "SGST", "amount": 5822 }
      ]
    }
  ]
}
\`\`\`

**Field mapping:** Challanno → challan_no, Challandate → challan_date, CustomerName → buyer_name, Challanamount → total_amount, customergstin → buyer_gstin, challanitems → items, GstDetails → CGST/SGST/IGST amounts.

**Saved as:** \`data_status=2\`, \`approval_status=APPROVED\`, \`tally_push_status=PUSHED\`.

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

### 10.3 POST — Create from Tally

\`\`\`http
POST /api/tally/expenses?company_id={company_id}
Content-Type: application/json
\`\`\`

**Tally batch format (recommended):**

\`\`\`json
{
  "data": [
    {
      "company_id": "KLKURJA",
      "VoucherNo": "JV0089",
      "VoucherDate": "02/Jul/2026",
      "Narration": "Office expense",
      "DebitLedgers": [
        { "LedgerName": "Rent Expense", "Amount": 5000 }
      ],
      "CreditLedgers": [
        { "LedgerName": "HDFC Bank", "Amount": 5000 }
      ]
    }
  ]
}
\`\`\`

**Field mapping:** Same as Payment — VoucherNo, VoucherDate, Narration, DebitLedgers, CreditLedgers.

**App format (single record):**

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

**Saved as:** \`data_status=2\`, \`approval_status=APPROVED\`, \`tally_push_status=PUSHED\`.

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

### 11.3 POST — Create from Tally

\`\`\`http
POST /api/tally/payments?company_id={company_id}
Content-Type: application/json
\`\`\`

**Tally batch format (recommended):**

\`\`\`json
{
  "data": [
    {
      "company_id": "KLKURJA",
      "VoucherNo": "0089",
      "VoucherDate": "02/Jul/2026",
      "Narration": "paid to XYZ and ABC",
      "DebitLedgers": [
        { "LedgerName": "XYZ Imprest A/c", "Amount": 13000 },
        { "LedgerName": "ABC Imprest A/c", "Amount": 5000 }
      ],
      "CreditLedgers": [
        { "LedgerName": "HDFC Bank", "Amount": 18000 }
      ]
    }
  ]
}
\`\`\`

**Field mapping:** VoucherNo → voucher_no, VoucherDate → voucher_date, Narration → narration, DebitLedgers → Dr entries, CreditLedgers → Cr entries. Debit and credit totals must balance.

**App format (single record):**

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

**Saved as:** \`data_status=2\`, \`approval_status=APPROVED\`, \`tally_push_status=PUSHED\`, lines in \`PaymentVoucherEntry\`.

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
| id | id |
| company_id | company_id |
| DataSource | \`Software\` if data_status=1, else \`Tally\` |
| TallyPushStatus | tally_push_status |
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
POST /api/tally/purchases?company_id={company_id}
\`\`\`

Tally should POST purchases in this JSON shape. You may send **one record** or a **batch** wrapped in \`data[]\`.

**Required per record:** \`PurchaseNo\`, \`PurchaseDate\`, \`VendorName\`, \`PurchaseItems[]\`, \`company_id\`

**Optional:** \`irn\` (auto-generated as \`TALLY-{company_id}-{PurchaseNo}\` if omitted), \`PONo\`, \`Vendorgstin\`, \`GstDetails[]\`, \`PurchaseAmount\`

\`\`\`json
{
  "data": [
    {
      "company_id": "KLKURJA",
      "PurchaseNo": "Pur0991",
      "PurchaseDate": "02/Jul/2026",
      "PONo": "PO908",
      "VendorName": "XYZ Pvt Ltd",
      "PurchaseAmount": 120000,
      "Vendorgstin": "",
      "PurchaseItems": [
        {
          "itemname": "Item A",
          "quantity": 1,
          "rate": 15844,
          "amount": 15844
        },
        {
          "itemname": "Item B",
          "quantity": 4,
          "rate": 12000,
          "amount": 48000
        }
      ],
      "GstDetails": [
        { "LedgerName": "CGST", "amount": 5822 },
        { "LedgerName": "SGST", "amount": 5822 }
      ]
    }
  ]
}
\`\`\`

**Field mapping:**

| Tally field | Saved as |
|-------------|----------|
| PurchaseNo | invoice_no |
| PurchaseDate | invoice_date |
| PONo | buyers_order_no |
| VendorName | seller_name |
| Vendorgstin | seller_gstin |
| PurchaseAmount | total_amount |
| PurchaseItems | items[] |
| GstDetails | gst_details[] |

**Auto-calculated when omitted:** \`taxable_value\` (sum of item amounts), \`total_tax_amount\` (sum of GstDetails), \`irn\`, buyer defaults.

**Saved as:** \`Purchase\` row + \`PurchaseItem\` lines + \`PurchaseGstDetail\` rows, \`data_status=2\`, auto-approved and marked pushed.

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
| id | id |
| company_id | company_id |
| DataSource | \`Software\` if data_status=1, else \`Tally\` |
| TallyPushStatus | tally_push_status |
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
POST /api/tally/sales?company_id={company_id}
\`\`\`

Tally should POST sales in this JSON shape. Send **one record** or a **batch** in \`data[]\`.

**Required per record:** \`InvoiceNo\`, \`InvoiceDate\`, \`CustomerName\`, \`BillItems[]\`, \`company_id\`

\`\`\`json
{
  "data": [
    {
      "company_id": "KLKURJA",
      "InvoiceNo": "Inv0991",
      "InvoiceDate": "02/Jul/2026",
      "Challanno": "DL0991",
      "CustomerName": "ABC Pvt Ltd",
      "BillAmount": 120000,
      "customergstin": "",
      "BillItems": [
        {
          "itemname": "Item A",
          "quantity": 1,
          "rate": 15844,
          "amount": 15844
        },
        {
          "itemname": "Item B",
          "quantity": 4,
          "rate": 12000,
          "amount": 48000
        }
      ],
      "GstDetails": [
        { "LedgerName": "CGST", "amount": 5822 },
        { "LedgerName": "SGST", "amount": 5822 }
      ]
    }
  ]
}
\`\`\`

**Field mapping:**

| Tally field | Saved as |
|-------------|----------|
| InvoiceNo | invoice_no |
| InvoiceDate | invoice_date |
| Challanno | delivery_note |
| CustomerName | buyer_name |
| customergstin | buyer_gstin |
| BillAmount | total_amount |
| BillItems | items[] |
| GstDetails | cgst_amount / sgst_amount / igst_amount |

**Auto-calculated when omitted:** \`taxable_value\`, \`total_tax_amount\`, \`irn\`, seller defaults (your company).

**Saved as:** \`Sales\` row + \`SalesItem\` lines, \`data_status=2\`, auto-approved and marked pushed.

### 13.4 PUT / DELETE / PATCH

- \`PUT /api/tally/sales/{id}\`
- \`DELETE /api/tally/sales/{id}?company_id={company_id}\`
- \`PATCH /api/tally/sales/{id}/pushed?company_id={company_id}\`

---

## 14. Company Master APIs

**Database table:** \`CompanyDetail\`

Records follow the same approval and Tally push workflow: **GET** returns app records with **PUSHED** + **data_status=1**. Tally POST imports use **data_status=2** and are excluded from GET.

### 14.1 GET — Export list

\`\`\`http
GET /api/tally/companies?company_id={company_id}
\`\`\`

**Response shape (each item):**

\`\`\`json
{
  "id": 1,
  "company_id": "KLKURJA",
  "DataSource": "Software",
  "TallyPushStatus": "PUSHED",
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

**Filters applied:** Same as all modules — \`approval_status=APPROVED\`, \`tally_push_status=PUSHED\`, \`data_status=1\`, \`company_id\`

### 14.2 GET — Export one

\`\`\`http
GET /api/tally/companies/{id}?company_id={company_id}
\`\`\`

### 14.3 POST — Create from Tally

\`\`\`http
POST /api/tally/companies?company_id={company_id}
Content-Type: application/json
\`\`\`

**Tally batch format (recommended):**

\`\`\`json
{
  "data": [
    {
      "company_id": "KLKURJA",
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
  ]
}
\`\`\`

**Single record format** (same fields, without \`data\` wrapper) is also supported.

**Field mapping:** CompanyName → name, LedgerName → ledger_name, LedgerCode → code, LedgerGroup → ledger_group, AddLine1–3 → address lines, LedgerPIN → zipcode, LedState → state, LedCountry → country, ContactPerson → contact_person, ContactNumber → contact_number, EmailID → email, PanNumber → pan, GSTNumber → gst.

**Saved as:** \`data_status=2\`, \`approval_status=APPROVED\`, \`tally_push_status=PUSHED\`.

### 14.4 PUT / DELETE / PATCH

- \`PUT /api/tally/companies/{id}\`
- \`DELETE /api/tally/companies/{id}?company_id={company_id}\`
- \`PATCH /api/tally/companies/{id}/pushed?company_id={company_id}\`

---

## 15. Error Codes

| HTTP | Meaning | Common cause |
|------|---------|--------------|
| 400 | Bad Request | **Missing or empty \`company_id\`**, invalid body, unbalanced journal entries |
| 404 | Not Found | Record ID not found, or not in GET export queue for PATCH \`/pushed\` |
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

**GET export filter (all modules):** \`approval_status=APPROVED\` AND \`tally_push_status=PUSHED\` AND \`data_status=1\` AND \`company_id\`

**PATCH \`/pushed\` (all modules):** Sets \`tally_push_status=NOT_PUSHED\` — removes synced record from GET queue

---

*End of manual — KLK Ventures Pvt Ltd*
`;
