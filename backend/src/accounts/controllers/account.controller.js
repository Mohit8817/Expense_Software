import { PrismaClient } from "@prisma/client";
import {
  getCompanyScopedRows,
  buildDashboardPayload,
  parseDateRange,
  buildDocumentLinkSummary,
} from "../utils/accountAnalytics.js";

const prisma = new PrismaClient();

export const getAccountDashboard = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    if (!company_id) return res.status(401).json({ message: "Unauthorized" });

    const data = await getCompanyScopedRows(company_id);
    return res.json(buildDashboardPayload(data));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const getSalesRegister = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    if (!company_id) return res.status(401).json({ message: "Unauthorized" });

    const dateRange = parseDateRange(req.query.from, req.query.to);
    const rows = await prisma.sales.findMany({
      where: {
        company_id,
        ...(dateRange && { invoice_date: dateRange }),
      },
      include: { items: true },
      orderBy: { invoice_date: "desc" },
    });

    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const getPurchaseRegister = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    if (!company_id) return res.status(401).json({ message: "Unauthorized" });

    const dateRange = parseDateRange(req.query.from, req.query.to);
    const rows = await prisma.purchase.findMany({
      where: {
        company_id,
        ...(dateRange && { invoice_date: dateRange }),
      },
      include: { items: true },
      orderBy: { invoice_date: "desc" },
    });

    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const getVoucherRegister = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    if (!company_id) return res.status(401).json({ message: "Unauthorized" });

    const { type } = req.query;
    const dateRange = parseDateRange(req.query.from, req.query.to);

    const fetchers = {
      credit: () =>
        prisma.creditNote.findMany({
          where: { company_id, ...(dateRange && { credit_note_date: dateRange }) },
          include: { items: true },
          orderBy: { credit_note_date: "desc" },
        }),
      debit: () =>
        prisma.debitNote.findMany({
          where: { company_id, ...(dateRange && { debit_note_date: dateRange }) },
          include: { items: true },
          orderBy: { debit_note_date: "desc" },
        }),
      challan: () =>
        prisma.deliveryChallan.findMany({
          where: { company_id, ...(dateRange && { challan_date: dateRange }) },
          include: { items: true },
          orderBy: { challan_date: "desc" },
        }),
      journal: () =>
        prisma.journalVoucher.findMany({
          where: { company_id, ...(dateRange && { voucher_date: dateRange }) },
          include: { entries: true },
          orderBy: { voucher_date: "desc" },
        }),
      payment: () =>
        prisma.paymentVoucher.findMany({
          where: { company_id, ...(dateRange && { voucher_date: dateRange }) },
          include: { entries: true, allocations: true },
          orderBy: { voucher_date: "desc" },
        }),
    };

    if (!fetchers[type]) {
      return res.status(400).json({ message: "Invalid voucher type. Use credit, debit, challan, journal, or payment." });
    }

    return res.json(await fetchers[type]());
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const getGstSummary = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    if (!company_id) return res.status(401).json({ message: "Unauthorized" });

    const dateRange = parseDateRange(req.query.from, req.query.to);
    const dateFilter = dateRange ? { gte: dateRange.gte, lte: dateRange.lte } : undefined;

    const [sales, purchases, creditNotes] = await Promise.all([
      prisma.sales.findMany({
        where: { company_id, approval_status: "APPROVED", ...(dateFilter && { invoice_date: dateFilter }) },
        select: { taxable_value: true, cgst_amount: true, sgst_amount: true, igst_amount: true, total_tax_amount: true, total_amount: true },
      }),
      prisma.purchase.findMany({
        where: { company_id, approval_status: "APPROVED", ...(dateFilter && { invoice_date: dateFilter }) },
        select: { taxable_value: true, igst_amount: true, total_tax_amount: true, total_amount: true },
      }),
      prisma.creditNote.findMany({
        where: { company_id, approval_status: "APPROVED", ...(dateFilter && { credit_note_date: dateFilter }) },
        select: { taxable_value: true, cgst_amount: true, sgst_amount: true, igst_amount: true, total_tax_amount: true, total_amount: true },
      }),
    ]);

    const sum = (rows, field) => rows.reduce((acc, r) => acc + Number(r[field] || 0), 0);

    return res.json({
      outward: {
        count: sales.length,
        taxableValue: sum(sales, "taxable_value"),
        cgst: sum(sales, "cgst_amount"),
        sgst: sum(sales, "sgst_amount"),
        igst: sum(sales, "igst_amount"),
        totalTax: sum(sales, "total_tax_amount"),
        totalAmount: sum(sales, "total_amount"),
      },
      inward: {
        count: purchases.length,
        taxableValue: sum(purchases, "taxable_value"),
        igst: sum(purchases, "igst_amount"),
        totalTax: sum(purchases, "total_tax_amount"),
        totalAmount: sum(purchases, "total_amount"),
      },
      creditNotes: {
        count: creditNotes.length,
        taxableValue: sum(creditNotes, "taxable_value"),
        cgst: sum(creditNotes, "cgst_amount"),
        sgst: sum(creditNotes, "sgst_amount"),
        igst: sum(creditNotes, "igst_amount"),
        totalTax: sum(creditNotes, "total_tax_amount"),
        totalAmount: sum(creditNotes, "total_amount"),
      },
      netTax: sum(sales, "total_tax_amount") - sum(creditNotes, "total_tax_amount"),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const getDocumentLinksReport = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    if (!company_id) return res.status(401).json({ message: "Unauthorized" });

    const data = await getCompanyScopedRows(company_id);
    const salesByNo = Object.fromEntries(data.sales.map((s) => [s.invoice_no, s]));
    const purchaseByNo = Object.fromEntries(data.purchases.map((p) => [p.invoice_no, p]));

    const creditNotes = await prisma.creditNote.findMany({
      where: { company_id },
      select: { id: true, credit_note_no: true, original_invoice_no: true, total_amount: true, approval_status: true },
      orderBy: { createdAt: "desc" },
    });
    const debitNotes = await prisma.debitNote.findMany({
      where: { company_id },
      select: { id: true, debit_note_no: true, original_invoice_no: true, total_amount: true, approval_status: true },
      orderBy: { createdAt: "desc" },
    });
    const challans = await prisma.deliveryChallan.findMany({
      where: { company_id },
      select: { id: true, challan_no: true, invoice_no: true, total_amount: true, approval_status: true },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      summary: buildDocumentLinkSummary(data.sales, data.purchases, creditNotes, debitNotes, challans),
      creditNotes: creditNotes.map((c) => ({
        ...c,
        linkedSalesId: salesByNo[c.original_invoice_no]?.id || null,
        linkStatus: !c.original_invoice_no ? "missing_ref" : salesByNo[c.original_invoice_no] ? "linked" : "unlinked",
      })),
      debitNotes: debitNotes.map((d) => ({
        ...d,
        linkedPurchaseId: purchaseByNo[d.original_invoice_no]?.id || null,
        linkStatus: !d.original_invoice_no ? "missing_ref" : purchaseByNo[d.original_invoice_no] ? "linked" : "unlinked",
      })),
      deliveryChallans: challans.map((c) => ({
        ...c,
        linkedSalesId: salesByNo[c.invoice_no]?.id || null,
        linkStatus: !c.invoice_no ? "missing_ref" : salesByNo[c.invoice_no] ? "linked" : "unlinked",
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const getSalesInvoiceOptions = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    if (!company_id) return res.status(401).json({ message: "Unauthorized" });

    const rows = await prisma.sales.findMany({
      where: { company_id, approval_status: "APPROVED" },
      select: {
        id: true,
        invoice_no: true,
        invoice_date: true,
        buyer_name: true,
        total_amount: true,
      },
      orderBy: { invoice_date: "desc" },
      take: 200,
    });

    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const getPurchaseInvoiceOptions = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    if (!company_id) return res.status(401).json({ message: "Unauthorized" });

    const rows = await prisma.purchase.findMany({
      where: { company_id, approval_status: "APPROVED" },
      select: {
        id: true,
        invoice_no: true,
        invoice_date: true,
        seller_name: true,
        total_amount: true,
      },
      orderBy: { invoice_date: "desc" },
      take: 200,
    });

    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const getSalesInvoiceForLink = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    const { id } = req.params;
    if (!company_id) return res.status(401).json({ message: "Unauthorized" });

    const record = await prisma.sales.findFirst({
      where: { id: Number(id), company_id, approval_status: "APPROVED" },
      include: { items: true },
    });

    if (!record) return res.status(404).json({ message: "Posted sales invoice not found" });
    return res.json(record);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const getPurchaseInvoiceForLink = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    const { id } = req.params;
    if (!company_id) return res.status(401).json({ message: "Unauthorized" });

    const record = await prisma.purchase.findFirst({
      where: { id: Number(id), company_id, approval_status: "APPROVED" },
      include: { items: true },
    });

    if (!record) return res.status(404).json({ message: "Posted purchase invoice not found" });
    return res.json(record);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};
