# Voucher Documents (Credit Note, Debit Note, Delivery Challan)

This folder holds **shared code** used by all three voucher types. Each voucher has its own thin form + API file; logic that is the same lives here.

## Folder layout

```
Account/
├── vouchers/shared/          ← shared UI, hooks, mappers (this folder)
│   ├── voucherMapperUtils.js   Party + item + GST mapping (form ↔ API)
│   ├── voucherFormUi.jsx       Reusable form sections (party, items, GST, etc.)
│   ├── useVoucherForm.js       Shared form state & handlers
│   └── VoucherPreview.jsx      Live preview panel
├── creditNoteApi.js          Credit Note API + mapToForm / mapFormToPayload
├── debitNoteApi.js           Debit Note API + mappers
├── deliveryChallanApi.js     Delivery Challan API + mappers
├── VoucherDocumentPage.jsx   List / form shell (approve, Tally, export)
├── CreditNote/CreditNoteForm.jsx
├── DebitNote/DebitNoteForm.jsx
└── DeliveryChallan/DeliveryChallanForm.jsx
```

## Data flow

1. **List** — `VoucherDocumentPage` → `{voucher}Api.getAll()` → `map*ToList`
2. **Edit load** — `getById()` → raw Prisma record → `map*ToForm()` → form state
3. **Save** — form state → `mapFormToPayload()` → POST/PUT API
4. **Party fields** — Company master picker → `mapCompanyTo*Fields()` → snapshot saved on document

## Form field naming

- Form uses **PascalCase** (same as Purchase/Sales): `SellerName`, `BuyerGstin`, `CreditNoteNo`
- API payload uses **snake_case** (Prisma): `seller_name`, `buyer_gstin`, `credit_note_no`
- Mapping is centralized in `{voucher}Api.js` + `voucherMapperUtils.js`

## Adding a new field

1. Add column in `backend/prisma/schema.prisma`
2. Map it in `backend/.../controllers/*controller.js` `build*Data`
3. Add to `map*ToForm` and `mapFormToPayload` in the matching `*Api.js`
4. Add input in the voucher form (or a shared section if used by all three)

## Party roles by document

| Document         | Seller        | Buyer           | Consignee |
|------------------|---------------|-------------------|-----------|
| Credit Note      | Our company   | Customer          | Optional  |
| Debit Note       | Vendor        | Our company       | Optional  |
| Delivery Challan | Our company   | Customer          | —         |
