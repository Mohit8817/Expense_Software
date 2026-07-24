import { PrismaClient } from "@prisma/client";
import { getDocumentAmount, getDocumentNo } from "./paymentLinkUtils.js";
import {
  ATTACHMENT_DOCUMENT_TYPES,
  deleteAttachmentsForDocument,
} from "./attachmentUtils.js";

const prisma = new PrismaClient();

const mapEntry = (entry, index) => ({
  sl_no: entry.sl_no ?? index + 1,
  particulars: entry.particulars,
  debit_amount: entry.debit_amount ?? null,
  credit_amount: entry.credit_amount ?? null,
  entry_type: entry.entry_type,
});

const mapAllocation = (row) => ({
  document_type: row.document_type,
  document_id: Number(row.document_id),
  document_no: row.document_no || null,
  document_amount: row.document_amount,
  paid_amount: row.paid_amount,
  allocation_type: row.allocation_type || "PARTIAL",
  remarks: row.remarks || null,
});

const validateEntries = (entries) => {
  if (!Array.isArray(entries) || entries.length === 0) {
    return { status: 400, message: "At least one payment entry is required" };
  }

  let totalDebit = 0;
  let totalCredit = 0;

  for (const entry of entries) {
    if (!entry.particulars) {
      return { status: 400, message: "Each entry must have particulars" };
    }
    if (entry.entry_type === "Dr") totalDebit += Number(entry.debit_amount) || 0;
    else if (entry.entry_type === "Cr") totalCredit += Number(entry.credit_amount) || 0;
    else return { status: 400, message: "Each entry must be Dr or Cr" };
  }

  if (totalDebit <= 0 || totalCredit <= 0) {
    return { status: 400, message: "Debit and credit totals must be greater than zero" };
  }

  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    return { status: 400, message: "Debit and credit totals must be equal" };
  }

  return { totalDebit, totalCredit };
};

const validateAllocations = (allocations, totalAmount, paymentType) => {
  if (!Array.isArray(allocations) || allocations.length === 0) return null;

  let allocSum = 0;
  for (const row of allocations) {
    if (!row.document_type || !row.document_id) {
      return { status: 400, message: "Each allocation must reference a document" };
    }
    const paid = Number(row.paid_amount) || 0;
    const docAmt = Number(row.document_amount) || 0;
    if (paid <= 0) return { status: 400, message: "Allocation paid amount must be greater than zero" };
    if (row.allocation_type === "PARTIAL" && paid > docAmt) {
      return { status: 400, message: "Partial allocation cannot exceed document amount" };
    }
    allocSum += paid;
  }

  if (Math.abs(allocSum - totalAmount) > 0.01 && paymentType !== "ADVANCE") {
    return { status: 400, message: "Sum of allocations must match payment total" };
  }

  return null;
};

async function sendToTally() {
  return true;
}

export function createPaymentVoucherHandlers({ buildData }) {
  const include = {
    entries: { orderBy: { sl_no: "asc" } },
    allocations: true,
    journalVoucher: { select: { id: true, voucher_no: true, narration: true } },
  };

  const create = async (req, res) => {
    try {
      const { entries, allocations, ...rest } = req.body;
      const company_id = req.user?.company_id;
      const user_id = req.user?.id;

      if (!company_id || !user_id) return res.status(401).json({ message: "Unauthorized" });
      if (!rest.voucher_no) return res.status(400).json({ message: "Voucher number is required" });

      const entryResult = validateEntries(entries);
      if (entryResult?.status) return res.status(entryResult.status).json({ message: entryResult.message });

      const allocError = validateAllocations(allocations, entryResult.totalDebit, rest.payment_type);
      if (allocError) return res.status(allocError.status).json({ message: allocError.message });

      const existing = await prisma.paymentVoucher.findUnique({ where: { voucher_no: rest.voucher_no } });
      if (existing) return res.status(409).json({ message: "A payment voucher with this number already exists" });

      const record = await prisma.paymentVoucher.create({
        data: {
          ...buildData(rest, entryResult.totalDebit, entryResult.totalCredit),
          company_id,
          user_id,
          entries: { create: entries.map(mapEntry) },
          ...(Array.isArray(allocations) &&
            allocations.length > 0 && {
              allocations: { create: allocations.map(mapAllocation) },
            }),
        },
        include,
      });

      return res.status(201).json({ message: "Payment voucher created successfully", data: record });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: error.message });
    }
  };

  const getAll = async (req, res) => {
    try {
      const company_id = req.user?.company_id;
      if (!company_id) return res.status(401).json({ message: "Unauthorized" });

      const list = await prisma.paymentVoucher.findMany({
        where: { company_id },
        include,
        orderBy: { createdAt: "desc" },
      });
      return res.json(list);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: error.message });
    }
  };

  const getById = async (req, res) => {
    try {
      const { id } = req.params;
      const company_id = req.user?.company_id;

      const record = await prisma.paymentVoucher.findFirst({
        where: { id: Number(id), company_id },
        include,
      });
      if (!record) return res.status(404).json({ message: "Payment voucher not found" });
      return res.json(record);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: error.message });
    }
  };

  const update = async (req, res) => {
    try {
      const { id } = req.params;
      const company_id = req.user?.company_id;
      const { entries, allocations, ...rest } = req.body;

      const existing = await prisma.paymentVoucher.findFirst({
        where: { id: Number(id), company_id },
      });
      if (!existing) return res.status(404).json({ message: "Payment voucher not found" });
      if (existing.approval_status !== "PENDING") {
        return res.status(400).json({ message: `Payment voucher cannot be updated once it is ${existing.approval_status}` });
      }

      const entryResult = validateEntries(entries);
      if (entryResult?.status) return res.status(entryResult.status).json({ message: entryResult.message });

      const allocError = validateAllocations(allocations, entryResult.totalDebit, rest.payment_type);
      if (allocError) return res.status(allocError.status).json({ message: allocError.message });

      await prisma.paymentVoucherEntry.deleteMany({ where: { payment_voucher_id: Number(id) } });
      await prisma.paymentVoucherAllocation.deleteMany({ where: { payment_voucher_id: Number(id) } });

      const updated = await prisma.paymentVoucher.update({
        where: { id: Number(id) },
        data: {
          ...buildData(rest, entryResult.totalDebit, entryResult.totalCredit),
          entries: { create: entries.map(mapEntry) },
          ...(Array.isArray(allocations) &&
            allocations.length > 0 && {
              allocations: { create: allocations.map(mapAllocation) },
            }),
        },
        include,
      });

      return res.json({ message: "Payment voucher updated successfully", data: updated });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: error.message });
    }
  };

  const remove = async (req, res) => {
    try {
      const { id } = req.params;
      const company_id = req.user?.company_id;

      const existing = await prisma.paymentVoucher.findFirst({
        where: { id: Number(id), company_id },
      });
      if (!existing) return res.status(404).json({ message: "Payment voucher not found" });
      if (existing.approval_status !== "PENDING") {
        return res.status(400).json({ message: `Cannot delete a payment voucher that has already been ${existing.approval_status}` });
      }

      await deleteAttachmentsForDocument(
        company_id,
        ATTACHMENT_DOCUMENT_TYPES.PAYMENT_VOUCHER,
        id
      );

      await prisma.paymentVoucher.delete({ where: { id: Number(id) } });
      return res.json({ message: "Payment voucher deleted successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: error.message });
    }
  };

  const approve = async (req, res) => {
    try {
      const { id } = req.params;
      const company_id = req.user?.company_id;
      const { remarks } = req.body;

      const existing = await prisma.paymentVoucher.findFirst({
        where: { id: Number(id), company_id },
        include: { allocations: true },
      });
      if (!existing) return res.status(404).json({ message: "Payment voucher not found" });
      if (existing.approval_status !== "PENDING") {
        return res.status(400).json({ message: `Payment voucher is already ${existing.approval_status}` });
      }

      const approved = await prisma.paymentVoucher.update({
        where: { id: Number(id) },
        data: {
          approval_status: "APPROVED",
          approval_date: new Date(),
          approval_remarks: remarks || null,
        },
        include,
      });

      return res.json({ message: "Payment voucher approved successfully", data: approved });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: error.message });
    }
  };

  const reject = async (req, res) => {
    try {
      const { id } = req.params;
      const company_id = req.user?.company_id;
      const { remarks } = req.body;

      if (!remarks) return res.status(400).json({ message: "remarks are required when rejecting a payment voucher" });

      const existing = await prisma.paymentVoucher.findFirst({ where: { id: Number(id), company_id } });
      if (!existing) return res.status(404).json({ message: "Payment voucher not found" });
      if (existing.approval_status !== "PENDING") {
        return res.status(400).json({ message: `Payment voucher is already ${existing.approval_status}` });
      }

      const rejected = await prisma.paymentVoucher.update({
        where: { id: Number(id) },
        data: {
          approval_status: "REJECTED",
          approval_date: new Date(),
          approval_remarks: remarks,
        },
        include,
      });

      return res.json({ message: "Payment voucher rejected successfully", data: rejected });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: error.message });
    }
  };

  const pushToTally = async (req, res) => {
    try {
      const { id } = req.params;
      const company_id = req.user?.company_id;

      const record = await prisma.paymentVoucher.findFirst({ where: { id: Number(id), company_id }, include });
      if (!record) return res.status(404).json({ message: "Payment voucher not found" });
      if (record.approval_status !== "APPROVED") {
        return res.status(400).json({ message: "Only approved payment vouchers can be pushed to Tally" });
      }
      if (record.tally_push_status === "PUSHED") {
        return res.status(400).json({ message: "Payment voucher has already been pushed to Tally" });
      }

      try {
        await sendToTally(record);
        const updated = await prisma.paymentVoucher.update({
          where: { id: Number(id) },
          data: { tally_push_status: "PUSHED" },
          include,
        });
        return res.json({ message: "Payment voucher pushed to Tally successfully", data: updated });
      } catch (tallyError) {
        await prisma.paymentVoucher.update({
          where: { id: Number(id) },
          data: { tally_push_status: "FAILED" },
        });
        return res.status(502).json({ message: "Tally push failed", error: tallyError.message });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: error.message });
    }
  };

  const retryTallyPush = async (req, res) => {
    try {
      const { id } = req.params;
      const company_id = req.user?.company_id;

      const record = await prisma.paymentVoucher.findFirst({ where: { id: Number(id), company_id }, include });
      if (!record) return res.status(404).json({ message: "Payment voucher not found" });
      if (record.approval_status !== "APPROVED") {
        return res.status(400).json({ message: "Only approved payment vouchers can be pushed to Tally" });
      }
      if (record.tally_push_status !== "FAILED") {
        return res.status(400).json({ message: `Retry is only allowed for FAILED pushes. Current status: ${record.tally_push_status}` });
      }

      try {
        await sendToTally(record);
        const updated = await prisma.paymentVoucher.update({
          where: { id: Number(id) },
          data: { tally_push_status: "PUSHED" },
          include,
        });
        return res.json({ message: "Payment voucher pushed to Tally successfully", data: updated });
      } catch (tallyError) {
        return res.status(502).json({ message: "Tally retry push failed", error: tallyError.message });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: error.message });
    }
  };

  return { create, getAll, getById, update, remove, approve, reject, pushToTally, retryTallyPush };
}

export { getDocumentNo, getDocumentAmount };
