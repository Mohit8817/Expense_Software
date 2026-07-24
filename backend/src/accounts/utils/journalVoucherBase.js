import { PrismaClient } from "@prisma/client";
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

const validateEntries = (entries) => {
  if (!Array.isArray(entries) || entries.length === 0) {
    return { status: 400, message: "At least one journal entry is required" };
  }

  let totalDebit = 0;
  let totalCredit = 0;

  for (const entry of entries) {
    if (!entry.particulars) {
      return { status: 400, message: "Each entry must have particulars" };
    }
    if (entry.entry_type === "Dr") {
      totalDebit += Number(entry.debit_amount) || 0;
    } else if (entry.entry_type === "Cr") {
      totalCredit += Number(entry.credit_amount) || 0;
    } else {
      return { status: 400, message: "Each entry must be Dr or Cr" };
    }
  }

  if (totalDebit <= 0 || totalCredit <= 0) {
    return { status: 400, message: "Debit and credit totals must be greater than zero" };
  }

  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    return { status: 400, message: "Debit and credit totals must be equal" };
  }

  return null;
};

async function sendToTally() {
  return true;
}

export function createJournalVoucherHandlers({ buildData }) {
  const include = { entries: { orderBy: { sl_no: "asc" } } };

  const create = async (req, res) => {
    try {
      const { entries, ...rest } = req.body;
      const company_id = req.user?.company_id;
      const user_id = req.user?.id;

      if (!company_id || !user_id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!rest.voucher_no) {
        return res.status(400).json({ message: "Voucher number is required" });
      }

      const entryError = validateEntries(entries);
      if (entryError) return res.status(entryError.status).json({ message: entryError.message });

      const existing = await prisma.journalVoucher.findUnique({
        where: { voucher_no: rest.voucher_no },
      });
      if (existing) {
        return res.status(409).json({ message: "A journal voucher with this number already exists" });
      }

      const record = await prisma.journalVoucher.create({
        data: {
          ...buildData(rest),
          company_id,
          user_id,
          entries: { create: entries.map(mapEntry) },
        },
        include,
      });

      return res.status(201).json({
        message: "Journal voucher created successfully",
        data: record,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: error.message });
    }
  };

  const getAll = async (req, res) => {
    try {
      const company_id = req.user?.company_id;
      if (!company_id) return res.status(401).json({ message: "Unauthorized" });

      const { approval_status, tally_push_status } = req.query;
      const list = await prisma.journalVoucher.findMany({
        where: {
          company_id,
          ...(approval_status && { approval_status }),
          ...(tally_push_status && { tally_push_status }),
        },
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

      const record = await prisma.journalVoucher.findFirst({
        where: { id: Number(id), company_id },
        include,
      });

      if (!record) {
        return res.status(404).json({ message: "Journal voucher not found" });
      }

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
      const { entries, ...rest } = req.body;

      const existing = await prisma.journalVoucher.findFirst({
        where: { id: Number(id), company_id },
      });

      if (!existing) {
        return res.status(404).json({ message: "Journal voucher not found" });
      }

      if (existing.approval_status !== "PENDING") {
        return res.status(400).json({
          message: `Journal voucher cannot be updated once it is ${existing.approval_status}`,
        });
      }

      if (Array.isArray(entries)) {
        const entryError = validateEntries(entries);
        if (entryError) return res.status(entryError.status).json({ message: entryError.message });
        await prisma.journalVoucherEntry.deleteMany({ where: { journal_voucher_id: Number(id) } });
      }

      const updated = await prisma.journalVoucher.update({
        where: { id: Number(id) },
        data: {
          ...buildData(rest),
          ...(Array.isArray(entries) && {
            entries: { create: entries.map(mapEntry) },
          }),
        },
        include,
      });

      return res.json({
        message: "Journal voucher updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: error.message });
    }
  };

  const remove = async (req, res) => {
    try {
      const { id } = req.params;
      const company_id = req.user?.company_id;

      const existing = await prisma.journalVoucher.findFirst({
        where: { id: Number(id), company_id },
      });

      if (!existing) {
        return res.status(404).json({ message: "Journal voucher not found" });
      }

      if (existing.approval_status !== "PENDING") {
        return res.status(400).json({
          message: `Cannot delete a journal voucher that has already been ${existing.approval_status}`,
        });
      }

      await deleteAttachmentsForDocument(
        company_id,
        ATTACHMENT_DOCUMENT_TYPES.JOURNAL_VOUCHER,
        id
      );

      await prisma.journalVoucher.delete({ where: { id: Number(id) } });

      return res.json({ message: "Journal voucher deleted successfully" });
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

      const existing = await prisma.journalVoucher.findFirst({
        where: { id: Number(id), company_id },
      });

      if (!existing) return res.status(404).json({ message: "Journal voucher not found" });
      if (existing.approval_status !== "PENDING") {
        return res.status(400).json({ message: `Journal voucher is already ${existing.approval_status}` });
      }

      const approved = await prisma.journalVoucher.update({
        where: { id: Number(id) },
        data: {
          approval_status: "APPROVED",
          approval_date: new Date(),
          approval_remarks: remarks || null,
        },
        include,
      });

      return res.json({ message: "Journal voucher approved successfully", data: approved });
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

      if (!remarks) {
        return res.status(400).json({ message: "remarks are required when rejecting a journal voucher" });
      }

      const existing = await prisma.journalVoucher.findFirst({
        where: { id: Number(id), company_id },
      });

      if (!existing) return res.status(404).json({ message: "Journal voucher not found" });
      if (existing.approval_status !== "PENDING") {
        return res.status(400).json({ message: `Journal voucher is already ${existing.approval_status}` });
      }

      const rejected = await prisma.journalVoucher.update({
        where: { id: Number(id) },
        data: {
          approval_status: "REJECTED",
          approval_date: new Date(),
          approval_remarks: remarks,
        },
        include,
      });

      return res.json({ message: "Journal voucher rejected successfully", data: rejected });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: error.message });
    }
  };

  const pushToTally = async (req, res) => {
    try {
      const { id } = req.params;
      const company_id = req.user?.company_id;

      const record = await prisma.journalVoucher.findFirst({
        where: { id: Number(id), company_id },
        include,
      });

      if (!record) return res.status(404).json({ message: "Journal voucher not found" });
      if (record.approval_status !== "APPROVED") {
        return res.status(400).json({ message: "Only approved journal vouchers can be pushed to Tally" });
      }
      if (record.tally_push_status === "PUSHED") {
        return res.status(400).json({ message: "Journal voucher has already been pushed to Tally" });
      }

      try {
        await sendToTally(record);
        const updated = await prisma.journalVoucher.update({
          where: { id: Number(id) },
          data: { tally_push_status: "PUSHED" },
          include,
        });
        return res.json({ message: "Journal voucher pushed to Tally successfully", data: updated });
      } catch (tallyError) {
        await prisma.journalVoucher.update({
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

      const record = await prisma.journalVoucher.findFirst({
        where: { id: Number(id), company_id },
        include,
      });

      if (!record) return res.status(404).json({ message: "Journal voucher not found" });
      if (record.approval_status !== "APPROVED") {
        return res.status(400).json({ message: "Only approved journal vouchers can be pushed to Tally" });
      }
      if (record.tally_push_status !== "FAILED") {
        return res.status(400).json({
          message: `Retry is only allowed for FAILED pushes. Current status: ${record.tally_push_status}`,
        });
      }

      try {
        await sendToTally(record);
        const updated = await prisma.journalVoucher.update({
          where: { id: Number(id) },
          data: { tally_push_status: "PUSHED" },
          include,
        });
        return res.json({ message: "Journal voucher pushed to Tally successfully", data: updated });
      } catch (tallyError) {
        return res.status(502).json({ message: "Tally retry push failed", error: tallyError.message });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: error.message });
    }
  };

  return {
    create,
    getAll,
    getById,
    update,
    remove,
    approve,
    reject,
    pushToTally,
    retryTallyPush,
  };
}
