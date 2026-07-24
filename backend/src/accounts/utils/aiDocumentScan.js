import fs from "fs";
import { createRequire } from "module";
import { normalizeExtractedBill } from "./invoiceScanNormalize.js";

const require = createRequire(import.meta.url);

const INVOICE_SCHEMA = {
  invoice_type: "Tax Invoice | Bill of Supply | null",
  invoice_no: "string|null",
  invoice_date: "YYYY-MM-DD|null",
  irn: "string|null",
  ack_no: "string|null",
  ack_date: "YYYY-MM-DD|null",
  eway_bill_no: "string|null",
  delivery_note: "string|null",
  delivery_note_date: "YYYY-MM-DD|null",
  mode_of_payment: "string|null",
  reference_no: "string|null",
  reference_date: "YYYY-MM-DD|null",
  po_no: "string|null",
  po_date: "YYYY-MM-DD|null",
  other_references: "string|null",
  dispatch_doc_no: "string|null",
  dispatched_through: "string|null",
  destination: "string|null",
  bill_of_lading_no: "string|null",
  motor_vehicle_no: "string|null",
  terms_of_delivery: "string|null",
  vendor: {
    name: "string|null",
    address: "string|null",
    gstin: "string|null",
    state: "string|null",
    state_code: "string|null",
    email: "string|null",
    cin: "string|null",
    pan: "string|null",
    bank_name: "string|null",
    bank_account_no: "string|null",
    bank_branch: "string|null",
    bank_ifsc: "string|null",
  },
  buyer: {
    name: "string|null",
    address: "string|null",
    gstin: "string|null",
    state: "string|null",
    state_code: "string|null",
    pan: "string|null",
    email: "string|null",
  },
  consignee: {
    name: "string|null",
    address: "string|null",
    gstin: "string|null",
    state: "string|null",
    state_code: "string|null",
    email: "string|null",
  },
  items: [
    {
      description: "string",
      hsn_sac: "string|null",
      quantity: "number",
      unit: "string|null",
      rate: "number",
      amount: "number",
    },
  ],
  gst_details: [{ ledger_name: "CGST|SGST|IGST", rate: "number|null", amount: "number|null" }],
  taxable_value: "number|null",
  total_tax_amount: "number|null",
  total_amount: "number|null",
  amount_in_words: "string|null",
  tax_amount_in_words: "string|null",
  authorised_signatory_name: "string|null",
  authorised_signatory_designation: "string|null",
  issuing_signatory_name: "string|null",
  issuing_signatory_designation: "string|null",
  jurisdiction: "string|null",
};

const PAYMENT_RECEIPT_SCHEMA = {
  payment_date: "YYYY-MM-DD|null",
  amount: "number|null",
  payment_mode: "CASH|BANK|UPI|CHEQUE|NEFT|RTGS|null",
  reference_no: "string|null — UTR/transaction ref",
  cheque_no: "string|null",
  cheque_date: "YYYY-MM-DD|null",
  payer_name: "string|null — who paid",
  payee_name: "string|null — who received",
  bank_name: "string|null",
  account_no: "string|null",
  ifsc: "string|null",
  narration: "string|null — purpose/description",
  invoice_reference: "string|null — linked invoice/bill no",
  on_account_of: "string|null",
};

const EXPENSE_RECEIPT_SCHEMA = {
  receipt_date: "YYYY-MM-DD|null",
  amount: "number|null",
  tax_amount: "number|null",
  vendor_name: "string|null",
  vendor_gstin: "string|null",
  vendor_address: "string|null",
  description: "string|null — what was purchased",
  category_hint: "Travelling|Office|Conveyance|Accommodation|Purchase|Other|null",
  payment_mode: "Cash|Bank|UPI|Card|null",
  invoice_no: "string|null",
  narration: "string|null",
};

const COMPANY_PARTY_SCHEMA = {
  name: "string|null",
  short_name: "string|null — abbreviation if visible",
  gstin: "string|null",
  pan: "string|null",
  cin: "string|null",
  tan: "string|null",
  email: "string|null",
  address: "string|null",
  city: "string|null",
  state: "string|null",
  zipcode: "string|null",
  state_code: "string|null",
  bank_accounts: [
    {
      bank_name: "string|null",
      ac_no: "string|null",
      branch_name: "string|null",
      ifsc_code: "string|null",
    },
  ],
};

const buildInvoicePrompt = (context) => `You are an expert OCR for Indian GST tax invoices.
Extract EVERY visible field into structured JSON for a ${context} form.

Rules:
1. Issuing party goes in "vendor" (seller/supplier on purchase bills; your company on sales copies).
2. "buyer" = bill-to party. "consignee" = ship-to if shown, else null.
3. Extract ALL line items — one JSON object per table row. Never skip rows.
4. Full addresses, GSTIN, bank details, IRN, e-Way Bill, dispatch fields, signatory.
5. Dates as YYYY-MM-DD. Numbers without currency symbols.
6. Return ONLY valid JSON matching:
${JSON.stringify(INVOICE_SCHEMA, null, 2)}`;

const DOCUMENT_CONFIGS = {
  purchase: {
    schema: INVOICE_SCHEMA,
    systemPrompt: buildInvoicePrompt("purchase invoice"),
    userImageText: "Read this purchase bill image. Extract every field and line item.",
    userPdfText: (text) =>
      `Extract every field and line item from this purchase bill. Do not skip rows.\n\n${text}`,
    normalize: normalizeExtractedBill,
  },
  sales: {
    schema: INVOICE_SCHEMA,
    systemPrompt: `${buildInvoicePrompt("sales invoice")}\nNote: On sales invoices, vendor=seller (issuer), buyer=customer.`,
    userImageText: "Read this sales invoice image. Extract every field and line item.",
    userPdfText: (text) =>
      `Extract every field and line item from this sales invoice. Do not skip rows.\n\n${text}`,
    normalize: normalizeExtractedBill,
  },
  payment_receipt: {
    schema: PAYMENT_RECEIPT_SCHEMA,
    systemPrompt: `You extract payment proof documents: bank receipts, UPI screenshots, NEFT/RTGS confirmations, cheque copies.
Return ONLY valid JSON matching:
${JSON.stringify(PAYMENT_RECEIPT_SCHEMA, null, 2)}`,
    userImageText: "Extract payment details from this receipt or transaction screenshot.",
    userPdfText: (text) => `Extract payment details from:\n\n${text}`,
    normalize: normalizePaymentReceipt,
  },
  expense_receipt: {
    schema: EXPENSE_RECEIPT_SCHEMA,
    systemPrompt: `You extract expense/petty cash receipts, bills, and invoices for journal voucher entry.
Suggest category_hint from: Travelling, Office, Conveyance, Accommodation, Purchase, Other.
Return ONLY valid JSON matching:
${JSON.stringify(EXPENSE_RECEIPT_SCHEMA, null, 2)}`,
    userImageText: "Extract expense receipt details for accounting entry.",
    userPdfText: (text) => `Extract expense receipt details from:\n\n${text}`,
    normalize: normalizeExpenseReceipt,
  },
  company_party: {
    schema: COMPANY_PARTY_SCHEMA,
    systemPrompt: `Extract company registration details from GST certificate, letterhead, or invoice party block.
Return ONLY valid JSON matching:
${JSON.stringify(COMPANY_PARTY_SCHEMA, null, 2)}`,
    userImageText: "Extract company master data from this document.",
    userPdfText: (text) => `Extract company details from:\n\n${text}`,
    normalize: normalizeCompanyParty,
  },
};

function normalizeDate(value) {
  if (!value) return null;
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const dmy = str.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (dmy) {
    let [, day, month, year] = dmy;
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return null;
}

function normalizePaymentReceipt(scan) {
  if (!scan || typeof scan !== "object") return scan;
  const modeMap = {
    cash: "CASH",
    bank: "BANK",
    upi: "UPI",
    cheque: "CHEQUE",
    neft: "NEFT",
    rtgs: "RTGS",
  };
  const rawMode = (scan.payment_mode || "").toLowerCase();
  const payment_mode = modeMap[rawMode] || scan.payment_mode || null;
  return {
    ...scan,
    payment_date: normalizeDate(scan.payment_date),
    cheque_date: normalizeDate(scan.cheque_date),
    amount: scan.amount != null ? Number(scan.amount) : null,
    payment_mode,
  };
}

function normalizeExpenseReceipt(scan) {
  if (!scan || typeof scan !== "object") return scan;
  return {
    ...scan,
    receipt_date: normalizeDate(scan.receipt_date),
    amount: scan.amount != null ? Number(scan.amount) : null,
    tax_amount: scan.tax_amount != null ? Number(scan.tax_amount) : null,
  };
}

function normalizeCompanyParty(scan) {
  if (!scan || typeof scan !== "object") return scan;
  const gstin = scan.gstin ? String(scan.gstin).replace(/\s/g, "").toUpperCase() : null;
  return {
    ...scan,
    gstin,
    state_code: scan.state_code || (gstin?.length >= 2 ? gstin.slice(0, 2) : null),
    bank_accounts: (scan.bank_accounts || []).filter((b) => b?.bank_name || b?.ac_no),
  };
}

async function extractPdfText(filePath) {
  try {
    const pdfParse = require("pdf-parse");
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return (data.text || "").trim();
  } catch {
    return "";
  }
}

async function callOpenAI({ apiKey, systemPrompt, userContent }) {
  const model = process.env.OPENAI_SCAN_MODEL || process.env.OPENAI_MODEL || "gpt-4o";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 8192,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || "OpenAI request failed");
  }

  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error("No extraction result from AI");

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("AI returned invalid JSON");
  }
}

export async function extractDocumentFromFile(filePath, mimeType, documentType = "purchase") {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key is not configured on the server (OPENAI_API_KEY)");
  }

  const config = DOCUMENT_CONFIGS[documentType];
  if (!config) {
    throw new Error(`Unsupported document type: ${documentType}`);
  }

  const isPdf = mimeType === "application/pdf" || filePath.toLowerCase().endsWith(".pdf");
  const isImage = mimeType?.startsWith("image/");

  if (!isPdf && !isImage) {
    throw new Error("Unsupported file type. Upload a PDF or image (JPG, PNG, WEBP).");
  }

  let userContent;

  if (isImage) {
    const buffer = fs.readFileSync(filePath);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;
    userContent = [
      { type: "text", text: config.userImageText },
      { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
    ];
  } else {
    const text = await extractPdfText(filePath);
    if (!text || text.length < 20) {
      throw new Error("Could not read text from PDF. Try a clear photo instead.");
    }
    userContent = [{ type: "text", text: config.userPdfText(text.slice(0, 30000)) }];
  }

  const extracted = await callOpenAI({
    apiKey,
    systemPrompt: config.systemPrompt,
    userContent,
  });

  return config.normalize(extracted);
}

export const extractPurchaseBillFromFile = (filePath, mimeType) =>
  extractDocumentFromFile(filePath, mimeType, "purchase");

export const extractSalesBillFromFile = (filePath, mimeType) =>
  extractDocumentFromFile(filePath, mimeType, "sales");

export const extractPaymentReceiptFromFile = (filePath, mimeType) =>
  extractDocumentFromFile(filePath, mimeType, "payment_receipt");

export const extractExpenseReceiptFromFile = (filePath, mimeType) =>
  extractDocumentFromFile(filePath, mimeType, "expense_receipt");

export const extractCompanyPartyFromFile = (filePath, mimeType) =>
  extractDocumentFromFile(filePath, mimeType, "company_party");
