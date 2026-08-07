const MONTH_MAP = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

export function strVal(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
}

export function numVal(value, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
}

export function nullifyOptional(value) {
  if (value === undefined || value === "") return null;
  return value;
}

export function stateCodeFromGstin(gstin) {
  const normalized = strVal(gstin).replace(/\s/g, "").toUpperCase();
  if (normalized.length >= 2 && /^\d{2}/.test(normalized)) {
    return normalized.slice(0, 2);
  }
  return "";
}

/** Parse Tally / Indian invoice date strings into JS Date. */
export function parseTallyDate(value) {
  if (value === undefined || value === null || value === "") return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  const str = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const parsed = new Date(str);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  // 02/Jul/2026, 4-Jun-26
  const textMonth = str.match(/^(\d{1,2})[-\/]([A-Za-z]{3})[-\/](\d{2,4})$/i);
  if (textMonth) {
    const [, day, monthText, yearText] = textMonth;
    const month = MONTH_MAP[monthText.toLowerCase()];
    if (month == null) return null;
    let year = Number(yearText);
    if (yearText.length === 2) year += 2000;
    const parsed = new Date(year, month, Number(day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const numeric = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (numeric) {
    const [, day, month, yearText] = numeric;
    let year = Number(yearText);
    if (yearText.length === 2) year += 2000;
    const parsed = new Date(year, Number(month) - 1, Number(day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Unwrap Tally POST body — single record, { data: [...] }, or JSON string. */
function extractTallyBatchRecords(body, rootMarkers = []) {
  if (body == null) return [];

  if (typeof body === "string") {
    const trimmed = body.trim();
    if (!trimmed) return [];
    try {
      return extractTallyBatchRecords(JSON.parse(trimmed), rootMarkers);
    } catch {
      return [];
    }
  }

  if (typeof body !== "object") return [];

  if (Array.isArray(body)) {
    return body.filter((row) => row && typeof row === "object");
  }

  let { data } = body;

  if (typeof data === "string") {
    const trimmed = data.trim();
    if (!trimmed) return [];
    try {
      data = JSON.parse(trimmed);
    } catch {
      return [];
    }
  }

  if (data != null) {
    if (Array.isArray(data)) {
      return data.filter((row) => row && typeof row === "object");
    }
    if (typeof data === "object") {
      return [data];
    }
  }

  if (rootMarkers.some((key) => body[key])) {
    return [body];
  }

  if (Object.keys(body).length > 0) {
    return [body];
  }

  return [];
}

export function extractTallyPurchaseRecords(body) {
  return extractTallyBatchRecords(body, [
    "PurchaseNo",
    "invoice_no",
    "PurchaseItems",
    "items",
  ]);
}

export function extractTallySalesRecords(body) {
  return extractTallyBatchRecords(body, [
    "InvoiceNo",
    "invoice_no",
    "BillItems",
    "items",
  ]);
}

export function extractTallyCreditNoteRecords(body) {
  return extractTallyBatchRecords(body, [
    "CreditNoteNo",
    "credit_note_no",
    "BillItems",
    "items",
  ]);
}

export function extractTallyDebitNoteRecords(body) {
  return extractTallyBatchRecords(body, [
    "DebitNoteNo",
    "debit_note_no",
    "PurchaseItems",
    "items",
  ]);
}

export function extractTallyPaymentRecords(body) {
  return extractTallyBatchRecords(body, [
    "VoucherNo",
    "voucher_no",
    "DebitLedgers",
    "CreditLedgers",
    "entries",
  ]);
}

export function extractTallyCompanyRecords(body) {
  return extractTallyBatchRecords(body, [
    "CompanyName",
    "LedgerName",
    "LedgerCode",
    "name",
    "code",
  ]);
}

export function extractTallyDeliveryChallanRecords(body) {
  return extractTallyBatchRecords(body, [
    "Challanno",
    "challan_no",
    "challanitems",
    "items",
  ]);
}

export const extractTallyExpenseRecords = extractTallyPaymentRecords;

export function isTallyBatchRequest(body) {
  if (!body || typeof body !== "object") return false;
  if (Array.isArray(body)) return body.length > 1;
  if (Array.isArray(body.data)) return body.data.length > 0;
  if (body.data && typeof body.data === "object") return true;
  return false;
}

export const isTallyPurchaseBatchRequest = isTallyBatchRequest;
export const isTallySalesBatchRequest = isTallyBatchRequest;
export const isTallyCreditNoteBatchRequest = isTallyBatchRequest;
export const isTallyDebitNoteBatchRequest = isTallyBatchRequest;
export const isTallyPaymentBatchRequest = isTallyBatchRequest;
export const isTallyCompanyBatchRequest = isTallyBatchRequest;
export const isTallyDeliveryChallanBatchRequest = isTallyBatchRequest;
export const isTallyExpenseBatchRequest = isTallyBatchRequest;

export function describeTallyBodyIssue(body, docType = "purchase") {
  const label =
    docType === "sales"
      ? "sales invoice"
      : docType === "credit note"
        ? "credit note"
        : docType === "debit note"
          ? "debit note"
          : docType === "payment"
            ? "payment"
            : docType === "company"
              ? "company"
              : docType === "delivery challan"
                ? "delivery challan"
                : docType === "expense"
                  ? "expense"
                  : "purchase";
  const example =
    docType === "sales"
      ? '{ "data": [ { "InvoiceNo": "...", "InvoiceDate": "...", "CustomerName": "...", "BillItems": [] } ] }'
      : docType === "credit note"
        ? '{ "data": [ { "CreditNoteNo": "...", "CreditNoteDate": "...", "InvoiceNo": "...", "CustomerName": "...", "BillItems": [] } ] }'
        : docType === "debit note"
          ? '{ "data": [ { "DebitNoteNo": "...", "DebitNoteDate": "...", "PurchaseNo": "...", "VendorName": "...", "PurchaseItems": [] } ] }'
          : docType === "payment"
            ? '{ "data": [ { "VoucherNo": "...", "VoucherDate": "...", "Narration": "...", "DebitLedgers": [], "CreditLedgers": [] } ] }'
            : docType === "company"
              ? '{ "data": [ { "CompanyName": "...", "LedgerName": "...", "LedgerCode": "...", "AddLine1": "..." } ] }'
              : docType === "delivery challan"
                ? '{ "data": [ { "Challanno": "...", "Challandate": "...", "CustomerName": "...", "challanitems": [] } ] }'
                : docType === "expense"
                  ? '{ "data": [ { "VoucherNo": "...", "VoucherDate": "...", "Narration": "...", "DebitLedgers": [], "CreditLedgers": [] } ] }'
                  : '{ "data": [ { "PurchaseNo": "...", "PurchaseDate": "...", "VendorName": "...", "PurchaseItems": [] } ] }';

  if (body == null) {
    return "Request body is empty. Use POST with Content-Type: application/json.";
  }
  if (typeof body === "string") {
    return "Body was received as plain text. Send JSON and set Content-Type: application/json.";
  }
  if (Array.isArray(body) && body.length === 0) {
    return `Body is an empty array. Wrap ${label}s in { "data": [ {...} ] }.`;
  }
  if (body?.data != null) {
    if (Array.isArray(body.data) && body.data.length === 0) {
      return `Field "data" is an empty array. Add at least one ${label} object.`;
    }
    if (typeof body.data === "string") {
      return 'Field "data" must be a JSON array/object, not a string (auto-parse failed).';
    }
  }
  return `Expected format: ${example}`;
}

export const describeTallySalesBodyIssue = (body) => describeTallyBodyIssue(body, "sales");
export const describeTallyCreditNoteBodyIssue = (body) =>
  describeTallyBodyIssue(body, "credit note");
export const describeTallyDebitNoteBodyIssue = (body) =>
  describeTallyBodyIssue(body, "debit note");
export const describeTallyPaymentBodyIssue = (body) =>
  describeTallyBodyIssue(body, "payment");
export const describeTallyCompanyBodyIssue = (body) =>
  describeTallyBodyIssue(body, "company");
export const describeTallyDeliveryChallanBodyIssue = (body) =>
  describeTallyBodyIssue(body, "delivery challan");
export const describeTallyExpenseBodyIssue = (body) =>
  describeTallyBodyIssue(body, "expense");

export function mapTallyPurchaseAliases(body = {}) {
  return {
    ...body,
    invoice_no: body.invoice_no ?? body.PurchaseNo,
    invoice_date: body.invoice_date ?? body.PurchaseDate,
    seller_name: body.seller_name ?? body.VendorName,
    seller_gstin: body.seller_gstin ?? body.Vendorgstin,
    buyer_name: body.buyer_name ?? body.CustomerName ?? body.BuyerName,
    buyer_gstin: body.buyer_gstin ?? body.customergstin,
    total_amount: body.total_amount ?? body.PurchaseAmount,
    taxable_value: body.taxable_value ?? body.TaxableValue,
    buyers_order_no: body.buyers_order_no ?? body.PONo,
  };
}

export function normalizePurchaseItems(items = []) {
  if (!Array.isArray(items)) return [];

  return items.map((item) => ({
    description: strVal(item.description ?? item.itemname, "Item"),
    hsn_sac: strVal(item.hsn_sac ?? item.hsn, "-"),
    quantity: numVal(item.quantity ?? item.qty, 0),
    unit: nullifyOptional(item.unit),
    rate: numVal(item.rate, 0),
    per: nullifyOptional(item.per ?? item.unit),
    amount: numVal(item.amount, 0),
  }));
}

export function normalizePurchaseGstDetails(gstDetails = []) {
  if (!Array.isArray(gstDetails)) return [];

  return gstDetails.map((row) => ({
    ledger_name: strVal(row.ledger_name ?? row.LedgerName, "Tax"),
    rate: numVal(row.rate, 0),
    amount: numVal(row.amount, 0),
  }));
}

/** Fill missing purchase header fields before Prisma create/update. */
export function normalizePurchasePayload(body = {}, items = [], gstDetails = [], companyId = "") {
  const mapped = mapTallyPurchaseAliases(body);
  const normalizedItems = normalizePurchaseItems(
    items.length ? items : mapped.items ?? mapped.PurchaseItems
  );
  const normalizedGst = normalizePurchaseGstDetails(
    gstDetails.length ? gstDetails : mapped.gst_details ?? mapped.GstDetails
  );

  const invoiceDate = parseTallyDate(mapped.invoice_date) ?? new Date();
  const ackDate = parseTallyDate(mapped.ack_date) ?? invoiceDate;
  const invoiceNo = strVal(mapped.invoice_no ?? mapped.PurchaseNo);

  const sellerGstin = strVal(mapped.seller_gstin ?? mapped.Vendorgstin);
  const buyerGstin = strVal(mapped.buyer_gstin);

  const itemsTotal = normalizedItems.reduce((sum, item) => sum + numVal(item.amount), 0);
  const taxTotal = normalizedGst.reduce((sum, row) => sum + numVal(row.amount), 0);

  const taxableValue =
    mapped.taxable_value != null && mapped.taxable_value !== ""
      ? numVal(mapped.taxable_value)
      : itemsTotal;

  const totalTaxAmount =
    mapped.total_tax_amount != null && mapped.total_tax_amount !== ""
      ? numVal(mapped.total_tax_amount)
      : taxTotal;

  const totalAmount =
    mapped.total_amount != null && mapped.total_amount !== ""
      ? numVal(mapped.total_amount)
      : numVal(mapped.PurchaseAmount, taxableValue + totalTaxAmount);

  const totalQuantity =
    mapped.total_quantity != null && mapped.total_quantity !== ""
      ? numVal(mapped.total_quantity)
      : normalizedItems.reduce((sum, item) => sum + numVal(item.quantity), 0);

  const irn =
    strVal(mapped.irn) ||
    (companyId && invoiceNo ? `TALLY-${companyId}-${invoiceNo}` : "");

  return {
    body: {
      ...mapped,
      irn,
      ack_no: strVal(mapped.ack_no),
      ack_date: ackDate,
      invoice_no: invoiceNo,
      invoice_date: invoiceDate,
      seller_name: strVal(mapped.seller_name ?? mapped.VendorName, "Unknown Vendor"),
      seller_address: strVal(mapped.seller_address),
      seller_gstin: sellerGstin || "NA",
      seller_state: strVal(mapped.seller_state),
      seller_state_code: strVal(mapped.seller_state_code) || stateCodeFromGstin(sellerGstin),
      seller_email: nullifyOptional(mapped.seller_email),
      seller_cin: nullifyOptional(mapped.seller_cin),
      buyer_name: strVal(mapped.buyer_name, companyId || "Company"),
      buyer_address: strVal(mapped.buyer_address),
      buyer_gstin: buyerGstin || "NA",
      buyer_state: strVal(mapped.buyer_state),
      buyer_state_code: strVal(mapped.buyer_state_code) || stateCodeFromGstin(buyerGstin),
      buyer_pan: nullifyOptional(mapped.buyer_pan),
      buyer_email: nullifyOptional(mapped.buyer_email),
      consignee_name: nullifyOptional(mapped.consignee_name),
      consignee_address: nullifyOptional(mapped.consignee_address),
      consignee_gstin: nullifyOptional(mapped.consignee_gstin),
      consignee_state: nullifyOptional(mapped.consignee_state),
      consignee_state_code: nullifyOptional(mapped.consignee_state_code),
      consignee_email: nullifyOptional(mapped.consignee_email),
      total_quantity: totalQuantity,
      taxable_value: taxableValue,
      igst_rate: numVal(mapped.igst_rate),
      igst_amount: numVal(mapped.igst_amount),
      total_tax_amount: totalTaxAmount,
      total_amount: totalAmount,
      eway_bill_no: nullifyOptional(mapped.eway_bill_no),
      delivery_note: nullifyOptional(mapped.delivery_note),
      mode_of_payment: nullifyOptional(mapped.mode_of_payment),
      reference_no: nullifyOptional(mapped.reference_no),
      reference_date: parseTallyDate(mapped.reference_date),
      buyers_order_no: nullifyOptional(mapped.buyers_order_no ?? mapped.PONo),
      other_references: nullifyOptional(mapped.other_references),
      dispatch_doc_no: nullifyOptional(mapped.dispatch_doc_no),
      delivery_note_date: parseTallyDate(mapped.delivery_note_date),
      dispatched_through: nullifyOptional(mapped.dispatched_through),
      destination: nullifyOptional(mapped.destination),
      bill_of_lading_no: nullifyOptional(mapped.bill_of_lading_no),
      motor_vehicle_no: nullifyOptional(mapped.motor_vehicle_no),
      terms_of_delivery: nullifyOptional(mapped.terms_of_delivery),
      amount_in_words: nullifyOptional(mapped.amount_in_words),
      tax_amount_in_words: nullifyOptional(mapped.tax_amount_in_words),
      bank_name: nullifyOptional(mapped.bank_name),
      bank_account_no: nullifyOptional(mapped.bank_account_no),
      bank_ifsc_branch: nullifyOptional(mapped.bank_ifsc_branch),
      declaration: nullifyOptional(mapped.declaration),
      authorised_signatory_name: nullifyOptional(mapped.authorised_signatory_name),
      authorised_signatory_designation: nullifyOptional(mapped.authorised_signatory_designation),
      issuing_signatory_name: nullifyOptional(mapped.issuing_signatory_name),
      issuing_signatory_designation: nullifyOptional(mapped.issuing_signatory_designation),
      jurisdiction: nullifyOptional(mapped.jurisdiction),
      invoice_type: nullifyOptional(mapped.invoice_type),
    },
    items: normalizedItems,
    gst_details: normalizedGst,
  };
}

export function mapTallySalesAliases(body = {}) {
  return {
    ...body,
    invoice_no: body.invoice_no ?? body.InvoiceNo,
    invoice_date: body.invoice_date ?? body.InvoiceDate,
    delivery_note: body.delivery_note ?? body.Challanno ?? body.challanno,
    buyer_name: body.buyer_name ?? body.CustomerName,
    buyer_gstin: body.buyer_gstin ?? body.customergstin,
    total_amount: body.total_amount ?? body.BillAmount,
    taxable_value: body.taxable_value ?? body.TaxableValue,
  };
}

export function normalizeSalesItems(items = []) {
  return normalizePurchaseItems(items);
}

export function splitSalesGstAmounts(gstDetails = []) {
  const rows = normalizePurchaseGstDetails(gstDetails);
  const amountFor = (name) => {
    const row = rows.find((r) => strVal(r.ledger_name).toUpperCase() === name);
    return row ? numVal(row.amount) : 0;
  };

  const cgst_amount = amountFor("CGST");
  const sgst_amount = amountFor("SGST");
  const igst_amount = amountFor("IGST");
  const total_tax_amount = rows.reduce((sum, row) => sum + numVal(row.amount), 0);

  return { cgst_amount, sgst_amount, igst_amount, total_tax_amount };
}

/** Fill missing sales header fields before Prisma create/update. */
export function normalizeSalesPayload(body = {}, items = [], gstDetails = [], companyId = "") {
  const mapped = mapTallySalesAliases(body);
  const normalizedItems = normalizeSalesItems(
    items.length ? items : mapped.items ?? mapped.BillItems
  );
  const gstRows = normalizePurchaseGstDetails(
    gstDetails.length ? gstDetails : mapped.gst_details ?? mapped.GstDetails
  );
  const gstSplit = splitSalesGstAmounts(gstRows);

  const invoiceDate = parseTallyDate(mapped.invoice_date) ?? new Date();
  const ackDate = parseTallyDate(mapped.ack_date) ?? invoiceDate;
  const invoiceNo = strVal(mapped.invoice_no ?? mapped.InvoiceNo);

  const buyerGstin = strVal(mapped.buyer_gstin ?? mapped.customergstin);
  const sellerGstin = strVal(mapped.seller_gstin);

  const itemsTotal = normalizedItems.reduce((sum, item) => sum + numVal(item.amount), 0);

  const taxableValue =
    mapped.taxable_value != null && mapped.taxable_value !== ""
      ? numVal(mapped.taxable_value)
      : itemsTotal;

  const totalTaxAmount =
    mapped.total_tax_amount != null && mapped.total_tax_amount !== ""
      ? numVal(mapped.total_tax_amount)
      : gstSplit.total_tax_amount;

  const totalAmount =
    mapped.total_amount != null && mapped.total_amount !== ""
      ? numVal(mapped.total_amount)
      : numVal(mapped.BillAmount, taxableValue + totalTaxAmount);

  const totalQuantity =
    mapped.total_quantity != null && mapped.total_quantity !== ""
      ? numVal(mapped.total_quantity)
      : normalizedItems.reduce((sum, item) => sum + numVal(item.quantity), 0);

  const irn =
    strVal(mapped.irn) ||
    (companyId && invoiceNo ? `TALLY-${companyId}-${invoiceNo}` : null);

  return {
    body: {
      ...mapped,
      irn,
      ack_no: strVal(mapped.ack_no) || null,
      ack_date: ackDate,
      invoice_no: invoiceNo,
      invoice_date: invoiceDate,
      delivery_note: nullifyOptional(mapped.delivery_note ?? mapped.Challanno),
      seller_name: strVal(mapped.seller_name, companyId || "Company"),
      seller_address: strVal(mapped.seller_address),
      seller_gstin: sellerGstin || "NA",
      seller_state: strVal(mapped.seller_state),
      seller_state_code: strVal(mapped.seller_state_code) || stateCodeFromGstin(sellerGstin),
      seller_cin: nullifyOptional(mapped.seller_cin),
      seller_email: nullifyOptional(mapped.seller_email),
      buyer_name: strVal(mapped.buyer_name ?? mapped.CustomerName, "Unknown Customer"),
      buyer_address: strVal(mapped.buyer_address),
      buyer_gstin: buyerGstin || "NA",
      buyer_state: strVal(mapped.buyer_state),
      buyer_state_code: strVal(mapped.buyer_state_code) || stateCodeFromGstin(buyerGstin),
      buyer_pan: nullifyOptional(mapped.buyer_pan),
      buyer_email: nullifyOptional(mapped.buyer_email),
      consignee_name: nullifyOptional(mapped.consignee_name),
      consignee_address: nullifyOptional(mapped.consignee_address),
      consignee_gstin: nullifyOptional(mapped.consignee_gstin),
      consignee_state: nullifyOptional(mapped.consignee_state),
      consignee_state_code: nullifyOptional(mapped.consignee_state_code),
      consignee_email: nullifyOptional(mapped.consignee_email),
      total_quantity: totalQuantity,
      taxable_value: taxableValue,
      igst_rate: numVal(mapped.igst_rate),
      igst_amount: mapped.igst_amount != null ? numVal(mapped.igst_amount) : gstSplit.igst_amount,
      cgst_rate: numVal(mapped.cgst_rate),
      cgst_amount: mapped.cgst_amount != null ? numVal(mapped.cgst_amount) : gstSplit.cgst_amount,
      sgst_rate: numVal(mapped.sgst_rate),
      sgst_amount: mapped.sgst_amount != null ? numVal(mapped.sgst_amount) : gstSplit.sgst_amount,
      total_tax_amount: totalTaxAmount,
      total_amount: totalAmount,
      eway_bill_no: nullifyOptional(mapped.eway_bill_no),
      mode_of_payment: nullifyOptional(mapped.mode_of_payment),
      reference_no: nullifyOptional(mapped.reference_no),
      reference_date: parseTallyDate(mapped.reference_date),
      buyers_order_no: nullifyOptional(mapped.buyers_order_no),
      other_references: nullifyOptional(mapped.other_references),
      dispatch_doc_no: nullifyOptional(mapped.dispatch_doc_no),
      delivery_note_date: parseTallyDate(mapped.delivery_note_date),
      dispatched_through: nullifyOptional(mapped.dispatched_through),
      destination: nullifyOptional(mapped.destination),
      bill_of_lading_no: nullifyOptional(mapped.bill_of_lading_no),
      motor_vehicle_no: nullifyOptional(mapped.motor_vehicle_no),
      terms_of_delivery: nullifyOptional(mapped.terms_of_delivery),
      amount_in_words: nullifyOptional(mapped.amount_in_words),
      tax_amount_in_words: nullifyOptional(mapped.tax_amount_in_words),
      bank_name: nullifyOptional(mapped.bank_name),
      bank_account_no: nullifyOptional(mapped.bank_account_no),
      bank_ifsc_branch: nullifyOptional(mapped.bank_ifsc_branch),
      declaration: nullifyOptional(mapped.declaration),
      authorised_signatory_name: nullifyOptional(mapped.authorised_signatory_name),
      authorised_signatory_designation: nullifyOptional(mapped.authorised_signatory_designation),
      issuing_signatory_name: nullifyOptional(mapped.issuing_signatory_name),
      issuing_signatory_designation: nullifyOptional(mapped.issuing_signatory_designation),
      jurisdiction: nullifyOptional(mapped.jurisdiction),
      invoice_type: nullifyOptional(mapped.invoice_type),
    },
    items: normalizedItems,
  };
}

export function mapTallyCreditNoteAliases(body = {}) {
  return {
    ...body,
    credit_note_no: body.credit_note_no ?? body.CreditNoteNo,
    credit_note_date: body.credit_note_date ?? body.CreditNoteDate,
    original_invoice_no: body.original_invoice_no ?? body.InvoiceNo,
    original_invoice_date: body.original_invoice_date ?? body.InvoiceDate,
    buyer_name: body.buyer_name ?? body.CustomerName,
    buyer_gstin: body.buyer_gstin ?? body.customergstin,
    total_amount: body.total_amount ?? body.BillAmount,
    taxable_value: body.taxable_value ?? body.TaxableValue,
  };
}

/** Fill missing credit note header fields before Prisma create/update. */
export function normalizeCreditNotePayload(body = {}, items = [], gstDetails = [], companyId = "") {
  const mapped = mapTallyCreditNoteAliases(body);
  const normalizedItems = normalizeSalesItems(
    items.length ? items : mapped.items ?? mapped.BillItems
  );
  const gstRows = normalizePurchaseGstDetails(
    gstDetails.length ? gstDetails : mapped.gst_details ?? mapped.GstDetails
  );
  const gstSplit = splitSalesGstAmounts(gstRows);

  const creditNoteDate = parseTallyDate(mapped.credit_note_date) ?? new Date();
  const ackDate = parseTallyDate(mapped.ack_date) ?? creditNoteDate;
  const creditNoteNo = strVal(mapped.credit_note_no ?? mapped.CreditNoteNo);

  const buyerGstin = strVal(mapped.buyer_gstin ?? mapped.customergstin);
  const sellerGstin = strVal(mapped.seller_gstin);

  const itemsTotal = normalizedItems.reduce((sum, item) => sum + numVal(item.amount), 0);

  const taxableValue =
    mapped.taxable_value != null && mapped.taxable_value !== ""
      ? numVal(mapped.taxable_value)
      : itemsTotal;

  const totalTaxAmount =
    mapped.total_tax_amount != null && mapped.total_tax_amount !== ""
      ? numVal(mapped.total_tax_amount)
      : gstSplit.total_tax_amount;

  const totalAmount =
    mapped.total_amount != null && mapped.total_amount !== ""
      ? numVal(mapped.total_amount)
      : numVal(mapped.BillAmount, taxableValue + totalTaxAmount);

  const totalQuantity =
    mapped.total_quantity != null && mapped.total_quantity !== ""
      ? numVal(mapped.total_quantity)
      : normalizedItems.reduce((sum, item) => sum + numVal(item.quantity), 0);

  const irn =
    strVal(mapped.irn) ||
    (companyId && creditNoteNo ? `TALLY-${companyId}-${creditNoteNo}` : null);

  return {
    body: {
      ...mapped,
      invoice_type: nullifyOptional(mapped.invoice_type) || "Credit Note",
      irn,
      ack_no: nullifyOptional(mapped.ack_no),
      ack_date: ackDate,
      credit_note_no: creditNoteNo,
      credit_note_date: creditNoteDate,
      eway_bill_no: nullifyOptional(mapped.eway_bill_no),
      original_invoice_no: nullifyOptional(mapped.original_invoice_no ?? mapped.InvoiceNo),
      original_invoice_date: parseTallyDate(mapped.original_invoice_date ?? mapped.InvoiceDate),
      buyers_order_no: nullifyOptional(mapped.buyers_order_no),
      other_references: nullifyOptional(mapped.other_references),
      dispatch_doc_no: nullifyOptional(mapped.dispatch_doc_no),
      dispatched_through: nullifyOptional(mapped.dispatched_through),
      destination: nullifyOptional(mapped.destination),
      terms_of_delivery: nullifyOptional(mapped.terms_of_delivery),
      seller_name: strVal(mapped.seller_name, companyId || "Company"),
      seller_address: strVal(mapped.seller_address),
      seller_gstin: sellerGstin || "NA",
      seller_state: strVal(mapped.seller_state),
      seller_state_code: strVal(mapped.seller_state_code) || stateCodeFromGstin(sellerGstin),
      seller_cin: nullifyOptional(mapped.seller_cin),
      seller_email: nullifyOptional(mapped.seller_email),
      seller_pan: nullifyOptional(mapped.seller_pan),
      consignee_name: nullifyOptional(mapped.consignee_name),
      consignee_address: nullifyOptional(mapped.consignee_address),
      consignee_gstin: nullifyOptional(mapped.consignee_gstin),
      consignee_state: nullifyOptional(mapped.consignee_state),
      consignee_state_code: nullifyOptional(mapped.consignee_state_code),
      consignee_email: nullifyOptional(mapped.consignee_email),
      buyer_name: strVal(mapped.buyer_name ?? mapped.CustomerName, "Unknown Customer"),
      buyer_address: strVal(mapped.buyer_address),
      buyer_gstin: buyerGstin || "NA",
      buyer_state: strVal(mapped.buyer_state),
      buyer_state_code: strVal(mapped.buyer_state_code) || stateCodeFromGstin(buyerGstin),
      buyer_pan: nullifyOptional(mapped.buyer_pan),
      buyer_email: nullifyOptional(mapped.buyer_email),
      total_quantity: totalQuantity,
      taxable_value: taxableValue,
      igst_rate: numVal(mapped.igst_rate),
      igst_amount: mapped.igst_amount != null ? numVal(mapped.igst_amount) : gstSplit.igst_amount,
      cgst_rate: numVal(mapped.cgst_rate),
      cgst_amount: mapped.cgst_amount != null ? numVal(mapped.cgst_amount) : gstSplit.cgst_amount,
      sgst_rate: numVal(mapped.sgst_rate),
      sgst_amount: mapped.sgst_amount != null ? numVal(mapped.sgst_amount) : gstSplit.sgst_amount,
      total_tax_amount: totalTaxAmount,
      total_amount: totalAmount,
      authorised_signatory_name: nullifyOptional(mapped.authorised_signatory_name),
      authorised_signatory_designation: nullifyOptional(mapped.authorised_signatory_designation),
    },
    items: normalizedItems,
  };
}

export function mapTallyDebitNoteAliases(body = {}) {
  return {
    ...body,
    debit_note_no: body.debit_note_no ?? body.DebitNoteNo,
    debit_note_date: body.debit_note_date ?? body.DebitNoteDate,
    original_invoice_no: body.original_invoice_no ?? body.PurchaseNo,
    original_invoice_date: body.original_invoice_date ?? body.PurchaseDate,
    seller_name: body.seller_name ?? body.VendorName,
    seller_gstin: body.seller_gstin ?? body.Vendorgstin,
    buyer_name: body.buyer_name ?? body.CustomerName ?? body.BuyerName,
    buyer_gstin: body.buyer_gstin ?? body.customergstin,
    total_amount: body.total_amount ?? body.DebitNoteAmount,
    taxable_value: body.taxable_value ?? body.TaxableValue,
  };
}

/** Fill missing debit note header fields before Prisma create/update. */
export function normalizeDebitNotePayload(body = {}, items = [], gstDetails = [], companyId = "") {
  const mapped = mapTallyDebitNoteAliases(body);
  const normalizedItems = normalizePurchaseItems(
    items.length ? items : mapped.items ?? mapped.PurchaseItems
  );
  const gstRows = normalizePurchaseGstDetails(
    gstDetails.length ? gstDetails : mapped.gst_details ?? mapped.GstDetails
  );
  const gstSplit = splitSalesGstAmounts(gstRows);

  const debitNoteDate = parseTallyDate(mapped.debit_note_date) ?? new Date();
  const debitNoteNo = strVal(mapped.debit_note_no ?? mapped.DebitNoteNo);

  const sellerGstin = strVal(mapped.seller_gstin ?? mapped.Vendorgstin);
  const buyerGstin = strVal(mapped.buyer_gstin);

  const itemsTotal = normalizedItems.reduce((sum, item) => sum + numVal(item.amount), 0);

  const taxableValue =
    mapped.taxable_value != null && mapped.taxable_value !== ""
      ? numVal(mapped.taxable_value)
      : itemsTotal;

  const totalTaxAmount =
    mapped.total_tax_amount != null && mapped.total_tax_amount !== ""
      ? numVal(mapped.total_tax_amount)
      : gstSplit.total_tax_amount;

  const totalAmount =
    mapped.total_amount != null && mapped.total_amount !== ""
      ? numVal(mapped.total_amount)
      : numVal(mapped.DebitNoteAmount, taxableValue + totalTaxAmount);

  const totalQuantity =
    mapped.total_quantity != null && mapped.total_quantity !== ""
      ? numVal(mapped.total_quantity)
      : normalizedItems.reduce((sum, item) => sum + numVal(item.quantity), 0);

  return {
    body: {
      ...mapped,
      debit_note_no: debitNoteNo,
      debit_note_date: debitNoteDate,
      original_invoice_no: nullifyOptional(mapped.original_invoice_no ?? mapped.PurchaseNo),
      original_invoice_date: parseTallyDate(mapped.original_invoice_date ?? mapped.PurchaseDate),
      other_references: nullifyOptional(mapped.other_references),
      seller_name: strVal(mapped.seller_name ?? mapped.VendorName, "Unknown Vendor"),
      seller_address: strVal(mapped.seller_address),
      seller_gstin: sellerGstin || "NA",
      seller_state: strVal(mapped.seller_state),
      seller_state_code: strVal(mapped.seller_state_code) || stateCodeFromGstin(sellerGstin),
      seller_cin: nullifyOptional(mapped.seller_cin),
      seller_email: nullifyOptional(mapped.seller_email),
      seller_pan: nullifyOptional(mapped.seller_pan),
      consignee_name: nullifyOptional(mapped.consignee_name),
      consignee_address: nullifyOptional(mapped.consignee_address),
      consignee_gstin: nullifyOptional(mapped.consignee_gstin),
      consignee_state: nullifyOptional(mapped.consignee_state),
      consignee_state_code: nullifyOptional(mapped.consignee_state_code),
      consignee_email: nullifyOptional(mapped.consignee_email),
      buyer_name: strVal(mapped.buyer_name, companyId || "Company"),
      buyer_address: strVal(mapped.buyer_address),
      buyer_gstin: buyerGstin || "NA",
      buyer_state: strVal(mapped.buyer_state),
      buyer_state_code: strVal(mapped.buyer_state_code) || stateCodeFromGstin(buyerGstin),
      buyer_pan: nullifyOptional(mapped.buyer_pan),
      buyer_email: nullifyOptional(mapped.buyer_email),
      total_quantity: totalQuantity,
      taxable_value: taxableValue,
      igst_rate: numVal(mapped.igst_rate),
      igst_amount: mapped.igst_amount != null ? numVal(mapped.igst_amount) : gstSplit.igst_amount,
      cgst_rate: numVal(mapped.cgst_rate),
      cgst_amount: mapped.cgst_amount != null ? numVal(mapped.cgst_amount) : gstSplit.cgst_amount,
      sgst_rate: numVal(mapped.sgst_rate),
      sgst_amount: mapped.sgst_amount != null ? numVal(mapped.sgst_amount) : gstSplit.sgst_amount,
      total_tax_amount: totalTaxAmount,
      total_amount: totalAmount,
      amount_in_words: nullifyOptional(mapped.amount_in_words),
      authorised_signatory_name: nullifyOptional(mapped.authorised_signatory_name),
      authorised_signatory_designation: nullifyOptional(mapped.authorised_signatory_designation),
    },
    items: normalizedItems,
  };
}

export function mapTallyLedgerVoucherAliases(body = {}) {
  return {
    ...body,
    voucher_no: body.voucher_no ?? body.VoucherNo,
    voucher_date: body.voucher_date ?? body.VoucherDate,
    narration: body.narration ?? body.Narration,
  };
}

export function normalizeTallyLedgerEntries(debitLedgers = [], creditLedgers = []) {
  const debits = Array.isArray(debitLedgers) ? debitLedgers : [];
  const credits = Array.isArray(creditLedgers) ? creditLedgers : [];

  const debitEntries = debits.map((row) => ({
    particulars: strVal(row.particulars ?? row.LedgerName, "Ledger"),
    debit_amount: numVal(row.debit_amount ?? row.Amount ?? row.amount),
    credit_amount: null,
    entry_type: "Dr",
  }));

  const creditEntries = credits.map((row) => ({
    particulars: strVal(row.particulars ?? row.LedgerName, "Ledger"),
    debit_amount: null,
    credit_amount: numVal(row.credit_amount ?? row.Amount ?? row.amount),
    entry_type: "Cr",
  }));

  return [...debitEntries, ...creditEntries];
}

function sumLedgerEntries(entries = [], entryType, amountField) {
  return entries
    .filter((entry) => entry.entry_type === entryType)
    .reduce((sum, entry) => sum + numVal(entry[amountField]), 0);
}

/** Fill missing payment voucher fields before Prisma create/update. */
export function normalizePaymentPayload(
  body = {},
  debitLedgers = [],
  creditLedgers = [],
  existingEntries = []
) {
  const mapped = mapTallyLedgerVoucherAliases(body);
  const entries = existingEntries.length
    ? existingEntries
    : normalizeTallyLedgerEntries(
        debitLedgers.length ? debitLedgers : mapped.DebitLedgers,
        creditLedgers.length ? creditLedgers : mapped.CreditLedgers
      );

  const totalDebit = sumLedgerEntries(entries, "Dr", "debit_amount");
  const totalCredit = sumLedgerEntries(entries, "Cr", "credit_amount");
  const debitRows = entries.filter((entry) => entry.entry_type === "Dr");
  const creditRows = entries.filter((entry) => entry.entry_type === "Cr");

  return {
    body: {
      ...mapped,
      voucher_no: strVal(mapped.voucher_no ?? mapped.VoucherNo),
      voucher_date: parseTallyDate(mapped.voucher_date) ?? new Date(),
      payment_type: strVal(mapped.payment_type, "GENERAL"),
      payment_mode: strVal(mapped.payment_mode, "BANK"),
      narration: nullifyOptional(mapped.narration ?? mapped.Narration),
      on_account_of: nullifyOptional(mapped.on_account_of),
      from_company_name: nullifyOptional(mapped.from_company_name),
      from_company_address: nullifyOptional(mapped.from_company_address),
      from_company_gstin: nullifyOptional(mapped.from_company_gstin),
      payee_type: strVal(mapped.payee_type, "COMPANY"),
      party_name: nullifyOptional(mapped.party_name ?? debitRows[0]?.particulars),
      party_gstin: nullifyOptional(mapped.party_gstin),
      party_address: nullifyOptional(mapped.party_address),
      linked_document_type: nullifyOptional(mapped.linked_document_type),
      linked_document_no: nullifyOptional(mapped.linked_document_no),
      bank_name: nullifyOptional(mapped.bank_name ?? creditRows[0]?.particulars),
      bank_account_no: nullifyOptional(mapped.bank_account_no),
      bank_ifsc: nullifyOptional(mapped.bank_ifsc),
      reference_no: nullifyOptional(mapped.reference_no),
      cheque_no: nullifyOptional(mapped.cheque_no),
      cheque_date: parseTallyDate(mapped.cheque_date),
      authorised_signatory_name: nullifyOptional(mapped.authorised_signatory_name),
      authorised_signatory_designation: nullifyOptional(mapped.authorised_signatory_designation),
    },
    entries,
    totalDebit,
    totalCredit,
  };
}

export function mapTallyDeliveryChallanAliases(body = {}) {
  return {
    ...body,
    challan_no: body.challan_no ?? body.Challanno ?? body.challanno,
    challan_date: body.challan_date ?? body.Challandate ?? body.challandate,
    buyer_name: body.buyer_name ?? body.CustomerName,
    buyer_gstin: body.buyer_gstin ?? body.customergstin,
    total_amount: body.total_amount ?? body.Challanamount ?? body.challanamount,
    taxable_value: body.taxable_value ?? body.TaxableValue,
  };
}

/** Fill missing delivery challan header fields before Prisma create/update. */
export function normalizeDeliveryChallanPayload(
  body = {},
  items = [],
  gstDetails = [],
  companyId = ""
) {
  const mapped = mapTallyDeliveryChallanAliases(body);
  const normalizedItems = normalizeSalesItems(
    items.length ? items : mapped.items ?? mapped.challanitems ?? mapped.Challanitems
  );
  const gstRows = normalizePurchaseGstDetails(
    gstDetails.length ? gstDetails : mapped.gst_details ?? mapped.GstDetails
  );
  const gstSplit = splitSalesGstAmounts(gstRows);

  const challanDate = parseTallyDate(mapped.challan_date) ?? new Date();
  const challanNo = strVal(mapped.challan_no ?? mapped.Challanno);

  const buyerGstin = strVal(mapped.buyer_gstin ?? mapped.customergstin);
  const sellerGstin = strVal(mapped.seller_gstin);

  const itemsTotal = normalizedItems.reduce((sum, item) => sum + numVal(item.amount), 0);

  const taxableValue =
    mapped.taxable_value != null && mapped.taxable_value !== ""
      ? numVal(mapped.taxable_value)
      : itemsTotal;

  const totalTaxAmount =
    mapped.total_tax_amount != null && mapped.total_tax_amount !== ""
      ? numVal(mapped.total_tax_amount)
      : gstSplit.total_tax_amount;

  const totalAmount =
    mapped.total_amount != null && mapped.total_amount !== ""
      ? numVal(mapped.total_amount)
      : numVal(mapped.Challanamount, taxableValue + totalTaxAmount);

  const totalQuantity =
    mapped.total_quantity != null && mapped.total_quantity !== ""
      ? numVal(mapped.total_quantity)
      : normalizedItems.reduce((sum, item) => sum + numVal(item.quantity), 0);

  return {
    body: {
      ...mapped,
      challan_no: challanNo,
      challan_date: challanDate,
      reference_no: nullifyOptional(mapped.reference_no),
      reference_date: parseTallyDate(mapped.reference_date),
      invoice_no: nullifyOptional(mapped.invoice_no),
      invoice_date: parseTallyDate(mapped.invoice_date),
      buyers_order_no: nullifyOptional(mapped.buyers_order_no),
      buyers_order_date: parseTallyDate(mapped.buyers_order_date),
      dispatch_doc_no: nullifyOptional(mapped.dispatch_doc_no),
      dispatched_through: nullifyOptional(mapped.dispatched_through),
      destination: nullifyOptional(mapped.destination),
      motor_vehicle_no: nullifyOptional(mapped.motor_vehicle_no),
      bill_of_lading_no: nullifyOptional(mapped.bill_of_lading_no),
      terms_of_delivery: nullifyOptional(mapped.terms_of_delivery),
      policy_no: nullifyOptional(mapped.policy_no),
      place_of_supply: nullifyOptional(mapped.place_of_supply),
      seller_name: strVal(mapped.seller_name, companyId || "Company"),
      seller_address: strVal(mapped.seller_address),
      seller_gstin: sellerGstin || "NA",
      seller_state: strVal(mapped.seller_state),
      seller_state_code: strVal(mapped.seller_state_code) || stateCodeFromGstin(sellerGstin),
      seller_cin: nullifyOptional(mapped.seller_cin),
      seller_email: nullifyOptional(mapped.seller_email),
      seller_pan: nullifyOptional(mapped.seller_pan),
      buyer_name: strVal(mapped.buyer_name ?? mapped.CustomerName, "Unknown Customer"),
      buyer_address: strVal(mapped.buyer_address),
      buyer_gstin: buyerGstin || "NA",
      buyer_state: nullifyOptional(mapped.buyer_state),
      buyer_state_code: nullifyOptional(mapped.buyer_state_code) || stateCodeFromGstin(buyerGstin),
      buyer_email: nullifyOptional(mapped.buyer_email),
      total_quantity: totalQuantity,
      taxable_value: taxableValue,
      igst_rate: numVal(mapped.igst_rate),
      igst_amount: mapped.igst_amount != null ? numVal(mapped.igst_amount) : gstSplit.igst_amount,
      cgst_rate: numVal(mapped.cgst_rate),
      cgst_amount: mapped.cgst_amount != null ? numVal(mapped.cgst_amount) : gstSplit.cgst_amount,
      sgst_rate: numVal(mapped.sgst_rate),
      sgst_amount: mapped.sgst_amount != null ? numVal(mapped.sgst_amount) : gstSplit.sgst_amount,
      total_tax_amount: totalTaxAmount,
      total_amount: totalAmount,
      amount_in_words: nullifyOptional(mapped.amount_in_words),
      authorised_signatory_name: nullifyOptional(mapped.authorised_signatory_name),
      authorised_signatory_designation: nullifyOptional(mapped.authorised_signatory_designation),
    },
    items: normalizedItems,
  };
}

/** Fill missing journal/expense voucher fields before Prisma create/update. */
export function normalizeJournalVoucherPayload(
  body = {},
  debitLedgers = [],
  creditLedgers = [],
  existingEntries = [],
  companyId = ""
) {
  const ledgerPayload = normalizePaymentPayload(body, debitLedgers, creditLedgers, existingEntries);
  const mapped = ledgerPayload.body;

  return {
    body: {
      voucher_no: mapped.voucher_no,
      voucher_date: mapped.voucher_date,
      voucher_type: strVal(body.voucher_type, "Journal Voucher"),
      company_name: strVal(body.company_name, companyId || "Company"),
      company_address: strVal(body.company_address),
      company_state: strVal(body.company_state),
      company_state_code: strVal(body.company_state_code),
      company_cin: nullifyOptional(body.company_cin),
      company_email: nullifyOptional(body.company_email),
      payee_type: strVal(body.payee_type, "COMPANY"),
      payee_name: nullifyOptional(body.payee_name ?? ledgerPayload.entries.find((e) => e.entry_type === "Dr")?.particulars),
      payee_address: nullifyOptional(body.payee_address),
      payee_state: nullifyOptional(body.payee_state),
      payee_state_code: nullifyOptional(body.payee_state_code),
      payee_gstin: nullifyOptional(body.payee_gstin),
      payee_email: nullifyOptional(body.payee_email),
      payee_designation: nullifyOptional(body.payee_designation),
      narration: mapped.narration,
      on_account_of: nullifyOptional(body.on_account_of),
      total_debit: ledgerPayload.totalDebit,
      total_credit: ledgerPayload.totalCredit,
      authorised_signatory_name: nullifyOptional(mapped.authorised_signatory_name),
      authorised_signatory_designation: nullifyOptional(mapped.authorised_signatory_designation),
    },
    entries: ledgerPayload.entries,
    totalDebit: ledgerPayload.totalDebit,
    totalCredit: ledgerPayload.totalCredit,
  };
}
