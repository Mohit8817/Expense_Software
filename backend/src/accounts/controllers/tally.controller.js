import { PrismaClient } from "@prisma/client";
import { DATA_STATUS_APP } from "../constants/dataStatus.js";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Settings — change here if Tally rules change
// ---------------------------------------------------------------------------
/**
 * App → Tally export queue:
 * Senior clicks "Push to Tally" → tally_push_status=PUSHED, data_status=1
 * Tally GET fetches these records. Tally POST imports (data_status=2) are excluded.
 */
function getTallyWhere(req) {
  return {
    approval_status: "APPROVED",
    tally_push_status: "PUSHED",
    data_status: DATA_STATUS_APP,
    company_id: req.tally_company_id,
  };
}

function tallyListResponse(rows, mapper) {
  const data = rows.map(mapper);
  if (!data.length) {
    return {
      data,
      hint: "No records in Tally export queue. Create in KLK app → Approve → Senior clicks 'Push to Tally'. Records imported via Tally POST (data_status=2) are excluded from GET.",
    };
  }
  return { data };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ---------------------------------------------------------------------------
// Helpers — format DB row to Tally JSON
// ---------------------------------------------------------------------------
function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  return `${day}/${MONTHS[date.getMonth()]}/${date.getFullYear()}`;
}

function mapItems(items = []) {
  return [...items]
    .sort((a, b) => (a.sl_no ?? a.id ?? 0) - (b.sl_no ?? b.id ?? 0))
    .map((item) => ({
      itemname: item.description || "",
      quantity: Number(item.quantity) || 0,
      rate: Number(item.rate) || 0,
      amount: Number(item.amount) || 0,
    }));
}

function mapTallyMeta(row) {
  return {
    DataSource: Number(row.data_status) === 2 ? "Tally" : "Software",
    TallyPushStatus: row.tally_push_status || "NOT_PUSHED",
  };
}

function mapGstDetails(record) {
  if (record.gst_details?.length) {
    return record.gst_details.map((row) => ({
      LedgerName: row.ledger_name || "",
      amount: Number(row.amount) || 0,
    }));
  }

  const rows = [];
  if (Number(record.cgst_amount) > 0) rows.push({ LedgerName: "CGST", amount: Number(record.cgst_amount) });
  if (Number(record.sgst_amount) > 0) rows.push({ LedgerName: "SGST", amount: Number(record.sgst_amount) });
  if (Number(record.igst_amount) > 0) rows.push({ LedgerName: "IGST", amount: Number(record.igst_amount) });
  return rows;
}

function mapLedgers(entries = []) {
  const sorted = [...entries].sort((a, b) => (a.sl_no || 0) - (b.sl_no || 0));
  return {
    DebitLedgers: sorted
      .filter((e) => e.entry_type === "Dr")
      .map((e) => ({ LedgerName: e.particulars || "", Amount: Number(e.debit_amount) || 0 })),
    CreditLedgers: sorted
      .filter((e) => e.entry_type === "Cr")
      .map((e) => ({ LedgerName: e.particulars || "", Amount: Number(e.credit_amount) || 0 })),
  };
}

function mapCreditNote(row) {
  return {
    id: row.id,
    company_id: row.company_id || "",
    ...mapTallyMeta(row),
    CreditNoteNo: row.credit_note_no || "",
    CreditNoteDate: formatDate(row.credit_note_date),
    InvoiceNo: row.original_invoice_no || "",
    CustomerName: row.buyer_name || "",
    BillAmount: Number(row.total_amount) || 0,
    customergstin: row.buyer_gstin || "",
    BillItems: mapItems(row.items),
    GstDetails: mapGstDetails(row),
  };
}

function mapDebitNote(row) {
  return {
    id: row.id,
    company_id: row.company_id || "",
    ...mapTallyMeta(row),
    DebitNoteNo: row.debit_note_no || "",
    DebitNoteDate: formatDate(row.debit_note_date),
    PurchaseNo: row.original_invoice_no || "",
    VendorName: row.seller_name || "",
    DebitNoteAmount: Number(row.total_amount) || 0,
    Vendorgstin: row.seller_gstin || "",
    PurchaseItems: mapItems(row.items),
    GstDetails: mapGstDetails(row),
  };
}

function mapDeliveryChallan(row) {
  return {
    id: row.id,
    company_id: row.company_id || "",
    ...mapTallyMeta(row),
    Challanno: row.challan_no || "",
    Challandate: formatDate(row.challan_date),
    CustomerName: row.buyer_name || "",
    Challanamount: Number(row.total_amount) || 0,
    customergstin: row.buyer_gstin || "",
    challanitems: mapItems(row.items),
    GstDetails: mapGstDetails(row),
  };
}

function mapExpense(row) {
  const ledgers = mapLedgers(row.entries);
  return {
    id: row.id,
    company_id: row.company_id || "",
    ...mapTallyMeta(row),
    VoucherNo: row.voucher_no || "",
    VoucherDate: formatDate(row.voucher_date),
    Narration: row.narration || "",
    DebitLedgers: ledgers.DebitLedgers,
    CreditLedgers: ledgers.CreditLedgers,
  };
}

function mapPayment(row) {
  const ledgers = mapLedgers(row.entries);
  return {
    id: row.id,
    company_id: row.company_id || "",
    ...mapTallyMeta(row),
    VoucherNo: row.voucher_no || "",
    VoucherDate: formatDate(row.voucher_date),
    Narration: row.narration || "",
    DebitLedgers: ledgers.DebitLedgers,
    CreditLedgers: ledgers.CreditLedgers,
  };
}

function mapPurchase(row) {
  return {
    id: row.id,
    company_id: row.company_id || "",
    ...mapTallyMeta(row),
    PurchaseNo: row.invoice_no || "",
    PurchaseDate: formatDate(row.invoice_date),
    PONo: row.buyers_order_no || "",
    VendorName: row.seller_name || "",
    PurchaseAmount: Number(row.total_amount) || 0,
    Vendorgstin: row.seller_gstin || "",
    PurchaseItems: mapItems(row.items),
    GstDetails: mapGstDetails(row),
  };
}

function mapSales(row) {
  return {
    id: row.id,
    company_id: row.company_id || "",
    ...mapTallyMeta(row),
    InvoiceNo: row.invoice_no || "",
    InvoiceDate: formatDate(row.invoice_date),
    Challanno: row.delivery_note || row.dispatch_doc_no || row.buyers_order_no || "",
    CustomerName: row.buyer_name || "",
    BillAmount: Number(row.total_amount) || 0,
    customergstin: row.buyer_gstin || "",
    BillItems: mapItems(row.items),
    GstDetails: mapGstDetails(row),
  };
}

function mapCompany(row) {
  return {
    id: row.id,
    company_id: row.company_id || "",
    ...mapTallyMeta(row),
    CompanyName: row.name || "",
    LedgerName: row.ledger_name || row.name || "",
    LedgerCode: row.code || "",
    LedgerGroup: row.ledger_group || "",
    AddLine1: row.add_line1 || row.address || "",
    AddLine2: row.add_line2 || "",
    AddLine3: row.add_line3 || "",
    LedgerPIN: row.zipcode != null ? String(row.zipcode) : "",
    LedState: row.state || "",
    LedCountry: row.country || "India",
    ContactPerson: row.contact_person || "",
    ContactNumber: row.contact_number || "",
    EmailID: row.email || "",
    PanNumber: row.pan || "",
    GSTNumber: row.gst || "",
  };
}

// ---------------------------------------------------------------------------
// Credit Note — GET /api/tally/credit-notes
// ---------------------------------------------------------------------------
export async function getCreditNotesForTally(req, res) {
  try {
    const where = getTallyWhere(req);

    const rows = await prisma.creditNote.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(tallyListResponse(rows, mapCreditNote));
  } catch (error) {
    console.error("Tally credit notes:", error);
    return res.status(500).json({ message: "Failed to fetch credit notes" });
  }
}

export async function getCreditNoteForTally(req, res) {
  try {
    const where = getTallyWhere(req);

    const row = await prisma.creditNote.findFirst({
      where: { id: Number(req.params.id), ...where },
      include: { items: true },
    });
    if (!row) return res.status(404).json({ message: "Credit note not found" });
    return res.json({ data: [mapCreditNote(row)] });
  } catch (error) {
    console.error("Tally credit note:", error);
    return res.status(500).json({ message: "Failed to fetch credit note" });
  }
}

// ---------------------------------------------------------------------------
// Debit Note — GET /api/tally/debit-notes
// ---------------------------------------------------------------------------
export async function getDebitNotesForTally(req, res) {
  try {
    const where = getTallyWhere(req);

    const rows = await prisma.debitNote.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(tallyListResponse(rows, mapDebitNote));
  } catch (error) {
    console.error("Tally debit notes:", error);
    return res.status(500).json({ message: "Failed to fetch debit notes" });
  }
}

export async function getDebitNoteForTally(req, res) {
  try {
    const where = getTallyWhere(req);

    const row = await prisma.debitNote.findFirst({
      where: { id: Number(req.params.id), ...where },
      include: { items: true },
    });
    if (!row) return res.status(404).json({ message: "Debit note not found" });
    return res.json({ data: [mapDebitNote(row)] });
  } catch (error) {
    console.error("Tally debit note:", error);
    return res.status(500).json({ message: "Failed to fetch debit note" });
  }
}

// ---------------------------------------------------------------------------
// Delivery Challan — GET /api/tally/delivery-challans
// ---------------------------------------------------------------------------
export async function getDeliveryChallansForTally(req, res) {
  try {
    const where = getTallyWhere(req);

    const rows = await prisma.deliveryChallan.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(tallyListResponse(rows, mapDeliveryChallan));
  } catch (error) {
    console.error("Tally delivery challans:", error);
    return res.status(500).json({ message: "Failed to fetch delivery challans" });
  }
}

export async function getDeliveryChallanForTally(req, res) {
  try {
    const where = getTallyWhere(req);

    const row = await prisma.deliveryChallan.findFirst({
      where: { id: Number(req.params.id), ...where },
      include: { items: true },
    });
    if (!row) return res.status(404).json({ message: "Delivery challan not found" });
    return res.json({ data: [mapDeliveryChallan(row)] });
  } catch (error) {
    console.error("Tally delivery challan:", error);
    return res.status(500).json({ message: "Failed to fetch delivery challan" });
  }
}

// ---------------------------------------------------------------------------
// Expense — GET /api/tally/expenses
// ---------------------------------------------------------------------------
export async function getExpensesForTally(req, res) {
  try {
    const where = getTallyWhere(req);

    const rows = await prisma.journalVoucher.findMany({
      where,
      include: { entries: { orderBy: { sl_no: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return res.json(tallyListResponse(rows, mapExpense));
  } catch (error) {
    console.error("Tally expenses:", error);
    return res.status(500).json({ message: "Failed to fetch expenses" });
  }
}

export async function getExpenseForTally(req, res) {
  try {
    const where = getTallyWhere(req);

    const row = await prisma.journalVoucher.findFirst({
      where: { id: Number(req.params.id), ...where },
      include: { entries: { orderBy: { sl_no: "asc" } } },
    });
    if (!row) return res.status(404).json({ message: "Expense voucher not found" });
    return res.json({ data: [mapExpense(row)] });
  } catch (error) {
    console.error("Tally expense:", error);
    return res.status(500).json({ message: "Failed to fetch expense voucher" });
  }
}

// ---------------------------------------------------------------------------
// Payment — GET /api/tally/payments
// ---------------------------------------------------------------------------
export async function getPaymentsForTally(req, res) {
  try {
    const where = getTallyWhere(req);

    const rows = await prisma.paymentVoucher.findMany({
      where,
      include: { entries: { orderBy: { sl_no: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return res.json(tallyListResponse(rows, mapPayment));
  } catch (error) {
    console.error("Tally payments:", error);
    return res.status(500).json({ message: "Failed to fetch payments" });
  }
}

export async function getPaymentForTally(req, res) {
  try {
    const where = getTallyWhere(req);

    const row = await prisma.paymentVoucher.findFirst({
      where: { id: Number(req.params.id), ...where },
      include: { entries: { orderBy: { sl_no: "asc" } } },
    });
    if (!row) return res.status(404).json({ message: "Payment voucher not found" });
    return res.json({ data: [mapPayment(row)] });
  } catch (error) {
    console.error("Tally payment:", error);
    return res.status(500).json({ message: "Failed to fetch payment voucher" });
  }
}

// ---------------------------------------------------------------------------
// Purchase — GET /api/tally/purchases
// ---------------------------------------------------------------------------
export async function getPurchasesForTally(req, res) {
  try {
    const where = getTallyWhere(req);

    const rows = await prisma.purchase.findMany({
      where,
      include: { items: true, gst_details: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(tallyListResponse(rows, mapPurchase));
  } catch (error) {
    console.error("Tally purchases:", error);
    return res.status(500).json({ message: "Failed to fetch purchases" });
  }
}

export async function getPurchaseForTally(req, res) {
  try {
    const where = getTallyWhere(req);

    const row = await prisma.purchase.findFirst({
      where: { id: Number(req.params.id), ...where },
      include: { items: true, gst_details: true },
    });
    if (!row) return res.status(404).json({ message: "Purchase invoice not found" });
    return res.json({ data: [mapPurchase(row)] });
  } catch (error) {
    console.error("Tally purchase:", error);
    return res.status(500).json({ message: "Failed to fetch purchase invoice" });
  }
}

// ---------------------------------------------------------------------------
// Sales — GET /api/tally/sales
// ---------------------------------------------------------------------------
export async function getSalesForTally(req, res) {
  try {
    const where = getTallyWhere(req);

    const rows = await prisma.sales.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(tallyListResponse(rows, mapSales));
  } catch (error) {
    console.error("Tally sales:", error);
    return res.status(500).json({ message: "Failed to fetch sales invoices" });
  }
}

export async function getSalesForTallyById(req, res) {
  try {
    const where = getTallyWhere(req);

    const row = await prisma.sales.findFirst({
      where: { id: Number(req.params.id), ...where },
      include: { items: true },
    });
    if (!row) return res.status(404).json({ message: "Sales invoice not found" });
    return res.json({ data: [mapSales(row)] });
  } catch (error) {
    console.error("Tally sales invoice:", error);
    return res.status(500).json({ message: "Failed to fetch sales invoice" });
  }
}

// ---------------------------------------------------------------------------
// Company Master — GET /api/tally/companies
// ---------------------------------------------------------------------------
export async function getCompaniesForTally(req, res) {
  try {
    const where = getTallyWhere(req);

    const rows = await prisma.companyDetail.findMany({
      where,
      include: { bank_accounts: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(tallyListResponse(rows, mapCompany));
  } catch (error) {
    console.error("Tally companies:", error);
    return res.status(500).json({ message: "Failed to fetch companies" });
  }
}

export async function getCompanyForTally(req, res) {
  try {
    const where = getTallyWhere(req);

    const row = await prisma.companyDetail.findFirst({
      where: { id: Number(req.params.id), ...where },
      include: { bank_accounts: true },
    });
    if (!row) return res.status(404).json({ message: "Company not found" });
    return res.json({ data: [mapCompany(row)] });
  } catch (error) {
    console.error("Tally company:", error);
    return res.status(500).json({ message: "Failed to fetch company" });
  }
}

// ---------------------------------------------------------------------------
// Mark as pushed — PATCH after Tally successfully imports a record
// ---------------------------------------------------------------------------
function createMarkPushedHandler(modelName, docLabel) {
  return async (req, res) => {
    try {
      const company_id = req.tally_company_id;

      const row = await prisma[modelName].findFirst({
        where: {
          id: Number(req.params.id),
          company_id,
          approval_status: "APPROVED",
          tally_push_status: "PUSHED",
          data_status: DATA_STATUS_APP,
        },
      });

      if (!row) {
        return res.status(404).json({
          message: `${docLabel} not found or not in Tally export queue (must be APPROVED, PUSHED, app-created)`,
        });
      }

      const updated = await prisma[modelName].update({
        where: { id: Number(req.params.id) },
        data: { tally_push_status: "NOT_PUSHED" },
      });

      return res.json({
        message: `${docLabel} synced to Tally — removed from export queue`,
        data: { id: updated.id, tally_push_status: updated.tally_push_status },
      });
    } catch (error) {
      console.error(`Tally mark pushed (${docLabel}):`, error);
      return res.status(500).json({ message: `Failed to mark ${docLabel} as pushed` });
    }
  };
}

export const markCreditNotePushed = createMarkPushedHandler("creditNote", "Credit note");
export const markDebitNotePushed = createMarkPushedHandler("debitNote", "Debit note");
export const markDeliveryChallanPushed = createMarkPushedHandler("deliveryChallan", "Delivery challan");
export const markExpensePushed = createMarkPushedHandler("journalVoucher", "Expense voucher");
export const markPaymentPushed = createMarkPushedHandler("paymentVoucher", "Payment voucher");
export const markPurchasePushed = createMarkPushedHandler("purchase", "Purchase invoice");
export const markSalesPushed = createMarkPushedHandler("sales", "Sales invoice");
export const markCompanyPushed = createMarkPushedHandler("companyDetail", "Company");
