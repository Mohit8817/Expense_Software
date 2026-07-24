import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const countByStatus = (rows) => {
  const stats = { total: rows.length, draft: 0, posted: 0, cancelled: 0, amount: 0 };
  rows.forEach((row) => {
    const status = row.approval_status;
    if (status === "APPROVED") stats.posted += 1;
    else if (status === "REJECTED") stats.cancelled += 1;
    else stats.draft += 1;

    const amount =
      Number(row.total_amount) ||
      Number(row.total_debit) ||
      Number(row.BillAmount) ||
      0;
    if (status === "APPROVED") stats.amount += amount;
  });
  return stats;
};

const tallyCounts = (rows) => ({
  notPushed: rows.filter((r) => r.tally_push_status === "NOT_PUSHED" && r.approval_status === "APPROVED").length,
  pushed: rows.filter((r) => r.tally_push_status === "PUSHED").length,
  failed: rows.filter((r) => r.tally_push_status === "FAILED").length,
});

export async function getCompanyScopedRows(company_id) {
  const where = { company_id };

  const [purchases, sales, creditNotes, debitNotes, deliveryChallans, journalVouchers, paymentVouchers, companies, products] =
    await Promise.all([
      prisma.purchase.findMany({ where, select: { id: true, invoice_no: true, invoice_date: true, approval_status: true, tally_push_status: true, total_amount: true, seller_name: true, buyer_name: true, createdAt: true } }),
      prisma.sales.findMany({ where, select: { id: true, invoice_no: true, invoice_date: true, approval_status: true, tally_push_status: true, total_amount: true, seller_name: true, buyer_name: true, createdAt: true } }),
      prisma.creditNote.findMany({ where, select: { id: true, credit_note_no: true, credit_note_date: true, approval_status: true, tally_push_status: true, total_amount: true, original_invoice_no: true, buyer_name: true, createdAt: true } }),
      prisma.debitNote.findMany({ where, select: { id: true, debit_note_no: true, debit_note_date: true, approval_status: true, tally_push_status: true, total_amount: true, original_invoice_no: true, buyer_name: true, createdAt: true } }),
      prisma.deliveryChallan.findMany({ where, select: { id: true, challan_no: true, challan_date: true, approval_status: true, tally_push_status: true, total_amount: true, invoice_no: true, buyer_name: true, createdAt: true } }),
      prisma.journalVoucher.findMany({ where, select: { id: true, voucher_no: true, voucher_date: true, approval_status: true, tally_push_status: true, total_debit: true, company_name: true, payee_name: true, payee_type: true, narration: true, createdAt: true } }),
      prisma.paymentVoucher.findMany({ where, select: { id: true, voucher_no: true, voucher_date: true, approval_status: true, tally_push_status: true, total_amount: true, from_company_name: true, party_name: true, payee_type: true, payment_type: true, linked_document_no: true, createdAt: true } }),
      prisma.companyDetail.count({ where }),
      prisma.productDetail.count({ where }),
    ]);

  return { purchases, sales, creditNotes, debitNotes, deliveryChallans, journalVouchers, paymentVouchers, companies, products };
}

export function buildDashboardPayload(data) {
  const { purchases, sales, creditNotes, debitNotes, deliveryChallans, journalVouchers, paymentVouchers, companies, products } = data;

  const recent = [
    ...purchases.map((r) => ({ type: "Purchase", docNo: r.invoice_no, date: r.invoice_date, amount: Number(r.total_amount), status: r.approval_status, party: r.seller_name, id: r.id, route: "/account/Purchase-Invoice" })),
    ...sales.map((r) => ({ type: "Sales", docNo: r.invoice_no, date: r.invoice_date, amount: Number(r.total_amount), status: r.approval_status, party: r.buyer_name, id: r.id, route: "/account/Sales-Invoice" })),
    ...creditNotes.map((r) => ({ type: "Credit Note", docNo: r.credit_note_no, date: r.credit_note_date, amount: Number(r.total_amount), status: r.approval_status, party: r.buyer_name, id: r.id, route: "/account/credit-note" })),
    ...debitNotes.map((r) => ({ type: "Debit Note", docNo: r.debit_note_no, date: r.debit_note_date, amount: Number(r.total_amount), status: r.approval_status, party: r.buyer_name, id: r.id, route: "/account/debit-note" })),
    ...deliveryChallans.map((r) => ({ type: "Delivery Challan", docNo: r.challan_no, date: r.challan_date, amount: Number(r.total_amount), status: r.approval_status, party: r.buyer_name, id: r.id, route: "/account/Delivery-Challan" })),
    ...journalVouchers.map((r) => ({ type: "Journal Voucher", docNo: r.voucher_no, date: r.voucher_date, amount: Number(r.total_debit), status: r.approval_status, party: r.payee_name ? `${r.company_name} → ${r.payee_name}` : r.company_name, id: r.id, route: "/account/Expense" })),
    ...paymentVouchers.map((r) => ({ type: "Payment Voucher", docNo: r.voucher_no, date: r.voucher_date, amount: Number(r.total_amount), status: r.approval_status, party: r.from_company_name && r.party_name ? `${r.from_company_name} → ${r.party_name}` : r.party_name || r.from_company_name, id: r.id, route: "/account/Payment" })),
  ]
    .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
    .slice(0, 12);

  const monthlyMap = {};
  const addMonthly = (rows, key) => {
    rows
      .filter((r) => r.approval_status === "APPROVED")
      .forEach((r) => {
        const d = new Date(r.invoice_date || r.credit_note_date || r.debit_note_date || r.challan_date || r.voucher_date);
        if (Number.isNaN(d.getTime())) return;
        const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!monthlyMap[label]) monthlyMap[label] = { month: label, sales: 0, purchase: 0 };
        monthlyMap[label][key] += Number(r.total_amount || r.total_debit || 0);
      });
  };
  addMonthly(sales, "sales");
  addMonthly(purchases, "purchase");

  const monthly = Object.values(monthlyMap)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6);

  const allApprovedDocs = [...purchases, ...sales, ...creditNotes, ...debitNotes, ...deliveryChallans, ...journalVouchers, ...paymentVouchers];

  return {
    summary: {
      purchase: countByStatus(purchases),
      sales: countByStatus(sales),
      creditNote: countByStatus(creditNotes),
      debitNote: countByStatus(debitNotes),
      deliveryChallan: countByStatus(deliveryChallans),
      journalVoucher: countByStatus(journalVouchers),
      paymentVoucher: countByStatus(paymentVouchers),
      masters: { companies, products },
    },
    tally: tallyCounts(allApprovedDocs),
    monthly,
    recent,
    links: buildDocumentLinkSummary(sales, purchases, creditNotes, debitNotes, deliveryChallans),
  };
}

export function buildDocumentLinkSummary(sales, purchases, creditNotes, debitNotes, deliveryChallans) {
  const salesNos = new Set(sales.map((s) => s.invoice_no));
  const purchaseNos = new Set(purchases.map((p) => p.invoice_no));

  const creditLinked = creditNotes.filter((c) => c.original_invoice_no && salesNos.has(c.original_invoice_no)).length;
  const creditUnlinked = creditNotes.filter((c) => c.original_invoice_no && !salesNos.has(c.original_invoice_no)).length;
  const debitLinked = debitNotes.filter((d) => d.original_invoice_no && purchaseNos.has(d.original_invoice_no)).length;
  const debitUnlinked = debitNotes.filter((d) => d.original_invoice_no && !purchaseNos.has(d.original_invoice_no)).length;
  const challanLinked = deliveryChallans.filter((d) => d.invoice_no && salesNos.has(d.invoice_no)).length;
  const challanUnlinked = deliveryChallans.filter((d) => d.invoice_no && !salesNos.has(d.invoice_no)).length;

  return {
    creditNote: { linked: creditLinked, unlinked: creditUnlinked, missingRef: creditNotes.filter((c) => !c.original_invoice_no).length },
    debitNote: { linked: debitLinked, unlinked: debitUnlinked, missingRef: debitNotes.filter((d) => !d.original_invoice_no).length },
    deliveryChallan: { linked: challanLinked, unlinked: challanUnlinked, missingRef: deliveryChallans.filter((d) => !d.invoice_no).length },
  };
}

export const parseDateRange = (from, to) => {
  const range = {};
  if (from) {
    const start = new Date(from);
    if (!Number.isNaN(start.getTime())) range.gte = start;
  }
  if (to) {
    const end = new Date(to);
    if (!Number.isNaN(end.getTime())) {
      end.setHours(23, 59, 59, 999);
      range.lte = end;
    }
  }
  return Object.keys(range).length ? range : null;
};
