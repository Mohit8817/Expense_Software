import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DOC_FETCHERS = {
  SALES: (id, company_id) =>
    prisma.sales.findFirst({ where: { id: Number(id), company_id, approval_status: "APPROVED" } }),
  PURCHASE: (id, company_id) =>
    prisma.purchase.findFirst({ where: { id: Number(id), company_id, approval_status: "APPROVED" } }),
  JOURNAL: (id, company_id) =>
    prisma.journalVoucher.findFirst({ where: { id: Number(id), company_id, approval_status: "APPROVED" } }),
  CREDIT_NOTE: (id, company_id) =>
    prisma.creditNote.findFirst({ where: { id: Number(id), company_id, approval_status: "APPROVED" } }),
  DEBIT_NOTE: (id, company_id) =>
    prisma.debitNote.findFirst({ where: { id: Number(id), company_id, approval_status: "APPROVED" } }),
  DELIVERY_CHALLAN: (id, company_id) =>
    prisma.deliveryChallan.findFirst({ where: { id: Number(id), company_id, approval_status: "APPROVED" } }),
};

export const getDocumentNo = (type, doc) => {
  if (!doc) return "";
  const map = {
    SALES: doc.invoice_no,
    PURCHASE: doc.invoice_no,
    JOURNAL: doc.voucher_no,
    CREDIT_NOTE: doc.credit_note_no,
    DEBIT_NOTE: doc.debit_note_no,
    DELIVERY_CHALLAN: doc.challan_no,
  };
  return map[type] || "";
};

export const getDocumentAmount = (type, doc) => {
  if (!doc) return 0;
  if (type === "JOURNAL") return Number(doc.total_debit) || 0;
  return Number(doc.total_amount) || 0;
};

export const getDocumentParty = (type, doc) => {
  if (!doc) return { name: "", gstin: "", address: "", companyId: null };
  if (type === "SALES") {
    return {
      name: doc.buyer_name || "",
      gstin: doc.buyer_gstin || "",
      address: doc.buyer_address || "",
      companyId: doc.buyer_company_id || null,
    };
  }
  if (type === "PURCHASE") {
    return {
      name: doc.seller_name || "",
      gstin: doc.seller_gstin || "",
      address: doc.seller_address || "",
      companyId: doc.seller_company_id || null,
    };
  }
  if (type === "JOURNAL") {
    return {
      name: doc.company_name || "",
      gstin: "",
      address: doc.company_address || "",
      companyId: null,
    };
  }
  return {
    name: doc.buyer_name || doc.seller_name || "",
    gstin: doc.buyer_gstin || doc.seller_gstin || "",
    address: doc.buyer_address || doc.seller_address || "",
    companyId: doc.buyer_company_id || doc.seller_company_id || null,
  };
};

export async function getPaidAmountForDocument(company_id, document_type, document_id, excludePaymentId = null) {
  const rows = await prisma.paymentVoucherAllocation.findMany({
    where: {
      document_type,
      document_id: Number(document_id),
      paymentVoucher: {
        company_id,
        approval_status: "APPROVED",
        ...(excludePaymentId ? { id: { not: Number(excludePaymentId) } } : {}),
      },
    },
    select: { paid_amount: true },
  });
  return rows.reduce((sum, r) => sum + Number(r.paid_amount || 0), 0);
}

export async function getDocumentBalance(company_id, document_type, document_id, excludePaymentId = null) {
  const fetcher = DOC_FETCHERS[document_type];
  if (!fetcher) return null;

  const doc = await fetcher(document_id, company_id);
  if (!doc) return null;

  const documentTotal = getDocumentAmount(document_type, doc);
  const paidAmount = await getPaidAmountForDocument(company_id, document_type, document_id, excludePaymentId);

  return {
    document_type,
    document_id: doc.id,
    document_no: getDocumentNo(document_type, doc),
    document_amount: documentTotal,
    paid_amount: paidAmount,
    balance_amount: Math.max(0, documentTotal - paidAmount),
    party: getDocumentParty(document_type, doc),
    raw: doc,
  };
}

export async function listLinkOptions(company_id, document_type) {
  const where = { company_id, approval_status: "APPROVED" };

  switch (document_type) {
    case "SALES":
      return prisma.sales.findMany({
        where,
        select: { id: true, invoice_no: true, invoice_date: true, buyer_name: true, total_amount: true },
        orderBy: { invoice_date: "desc" },
        take: 200,
      });
    case "PURCHASE":
      return prisma.purchase.findMany({
        where,
        select: { id: true, invoice_no: true, invoice_date: true, seller_name: true, total_amount: true },
        orderBy: { invoice_date: "desc" },
        take: 200,
      });
    case "JOURNAL":
      return prisma.journalVoucher.findMany({
        where,
        select: { id: true, voucher_no: true, voucher_date: true, company_name: true, total_debit: true, narration: true },
        orderBy: { voucher_date: "desc" },
        take: 200,
      });
    case "CREDIT_NOTE":
      return prisma.creditNote.findMany({
        where,
        select: { id: true, credit_note_no: true, credit_note_date: true, buyer_name: true, total_amount: true },
        orderBy: { credit_note_date: "desc" },
        take: 200,
      });
    case "DEBIT_NOTE":
      return prisma.debitNote.findMany({
        where,
        select: { id: true, debit_note_no: true, debit_note_date: true, buyer_name: true, total_amount: true },
        orderBy: { debit_note_date: "desc" },
        take: 200,
      });
    case "DELIVERY_CHALLAN":
      return prisma.deliveryChallan.findMany({
        where,
        select: { id: true, challan_no: true, challan_date: true, buyer_name: true, total_amount: true },
        orderBy: { challan_date: "desc" },
        take: 200,
      });
    default:
      return [];
  }
}

export async function fetchLinkDocument(company_id, document_type, document_id) {
  const fetcher = DOC_FETCHERS[document_type];
  if (!fetcher) return null;
  const doc = await fetcher(document_id, company_id);
  if (!doc) return null;

  const balance = await getDocumentBalance(company_id, document_type, document_id);
  return { ...balance, raw: doc };
}

export { DOC_FETCHERS };
