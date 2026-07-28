import { PrismaClient } from "@prisma/client";
import { chatCompletion } from "./openaiClient.js";
import {
  getCompanyScopedRows,
  buildDashboardPayload,
  parseDateRange,
  buildDocumentLinkSummary,
} from "./accountAnalytics.js";

const prisma = new PrismaClient();

function inDateRange(dateValue, range) {
  if (!range || !dateValue) return true;
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return false;
  if (range.gte && d < range.gte) return false;
  if (range.lte && d > range.lte) return false;
  return true;
}

function sumField(rows, field) {
  return rows.reduce((acc, r) => acc + Number(r[field] || 0), 0);
}

function topParties(rows, nameField, amountField, limit = 5) {
  const map = {};
  rows.forEach((r) => {
    const name = r[nameField] || "Unknown";
    map[name] = (map[name] || 0) + Number(r[amountField] || 0);
  });
  return Object.entries(map)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

function filterByDate(rows, dateField, range) {
  if (!range) return rows;
  return rows.filter((r) => inDateRange(r[dateField], range));
}

function statusBreakdown(rows) {
  return {
    pending: rows.filter((r) => r.approval_status === "PENDING").length,
    approved: rows.filter((r) => r.approval_status === "APPROVED").length,
    rejected: rows.filter((r) => r.approval_status === "REJECTED").length,
  };
}

/**
 * Build sanitized accounting context for AI — always scoped to company_id from JWT.
 */
export async function buildAiReportContext(company_id, { from, to } = {}) {
  const dateRange = parseDateRange(from, to);
  const data = await getCompanyScopedRows(company_id);
  const dashboard = buildDashboardPayload(data);

  const sales = filterByDate(data.sales, "invoice_date", dateRange);
  const purchases = filterByDate(data.purchases, "invoice_date", dateRange);
  const creditNotes = filterByDate(data.creditNotes, "credit_note_date", dateRange);
  const debitNotes = filterByDate(data.debitNotes, "debit_note_date", dateRange);
  const journalVouchers = filterByDate(data.journalVouchers, "voucher_date", dateRange);
  const paymentVouchers = filterByDate(data.paymentVouchers, "voucher_date", dateRange);

  const approvedSales = sales.filter((r) => r.approval_status === "APPROVED");
  const approvedPurchases = purchases.filter((r) => r.approval_status === "APPROVED");

  const gstSales = await prisma.sales.findMany({
    where: {
      company_id,
      approval_status: "APPROVED",
      ...(dateRange && { invoice_date: dateRange }),
    },
    select: {
      taxable_value: true,
      cgst_amount: true,
      sgst_amount: true,
      igst_amount: true,
      total_tax_amount: true,
      total_amount: true,
    },
  });

  const gstPurchases = await prisma.purchase.findMany({
    where: {
      company_id,
      approval_status: "APPROVED",
      ...(dateRange && { invoice_date: dateRange }),
    },
    select: {
      taxable_value: true,
      igst_amount: true,
      total_tax_amount: true,
      total_amount: true,
    },
  });

  const pendingTallyPush = [
    ...data.sales,
    ...data.purchases,
    ...data.creditNotes,
    ...data.debitNotes,
    ...data.deliveryChallans,
    ...data.journalVouchers,
    ...data.paymentVouchers,
  ].filter((r) => r.approval_status === "APPROVED" && r.tally_push_status === "NOT_PUSHED");

  return {
    company_id,
    date_range: from || to ? { from: from || null, to: to || null } : { from: null, to: null, note: "All time" },
    masters: {
      company_parties: data.companies,
      products: data.products,
    },
    totals: {
      sales: {
        count: sales.length,
        approved_amount: sumField(approvedSales, "total_amount"),
        ...statusBreakdown(sales),
      },
      purchases: {
        count: purchases.length,
        approved_amount: sumField(approvedPurchases, "total_amount"),
        ...statusBreakdown(purchases),
      },
      credit_notes: { count: creditNotes.length, ...statusBreakdown(creditNotes) },
      debit_notes: { count: debitNotes.length, ...statusBreakdown(debitNotes) },
      journal_vouchers: { count: journalVouchers.length, ...statusBreakdown(journalVouchers) },
      payment_vouchers: { count: paymentVouchers.length, ...statusBreakdown(paymentVouchers) },
    },
    gst_summary: {
      outward_tax: sumField(gstSales, "total_tax_amount"),
      outward_taxable: sumField(gstSales, "taxable_value"),
      inward_tax: sumField(gstPurchases, "total_tax_amount"),
      inward_taxable: sumField(gstPurchases, "taxable_value"),
      net_tax: sumField(gstSales, "total_tax_amount") - sumField(gstPurchases, "total_tax_amount"),
    },
    tally: dashboard.tally,
    document_links: buildDocumentLinkSummary(data.sales, data.purchases, data.creditNotes, data.debitNotes, data.deliveryChallans),
    top_customers: topParties(approvedSales, "buyer_name", "total_amount"),
    top_vendors: topParties(approvedPurchases, "seller_name", "total_amount"),
    pending_tally_push_count: pendingTallyPush.length,
    pending_tally_push_samples: pendingTallyPush.slice(0, 15).map((r) => ({
      doc_no: r.invoice_no || r.voucher_no || r.credit_note_no || r.debit_note_no || r.challan_no,
      amount: Number(r.total_amount || r.total_debit || 0),
      tally_push_status: r.tally_push_status,
    })),
    recent_activity: dashboard.recent.slice(0, 10),
    monthly_trend: dashboard.monthly,
  };
}

export async function generateAiReportAnswer(question, context) {
  const systemPrompt = `You are an accounting report assistant for KLK Expense software.

Rules:
- Answer ONLY using the JSON company data provided. Never invent figures.
- All amounts are in INR (₹). Format large numbers with commas.
- The data belongs to company_id "${context.company_id}" only — never reference other companies.
- If the question cannot be answered from the data, say what is missing and suggest which report to check.
- Be concise, professional, and helpful for management reporting.
- Use bullet points or short paragraphs. Highlight key numbers clearly.
- For GST, sales vs purchase, Tally push, pending approvals, and party-wise analysis — use the matching sections in the JSON.`;

  const userMessage = `Company accounting data (JSON):
${JSON.stringify(context, null, 2)}

User question:
${question}`;

  return chatCompletion({ systemPrompt, userMessage });
}
