import { PrismaClient } from "@prisma/client";
import {
  attachmentTypeForModel,
  deleteAttachmentsForDocument,
} from "./attachmentUtils.js";

const prisma = new PrismaClient();

export const mapVoucherItem = (item, index) => ({
  sl_no: item.sl_no ?? index + 1,
  description: item.description,
  hsn_sac: item.hsn_sac || null,
  quantity: item.quantity,
  unit: item.unit || null,
  rate: item.rate,
  per: item.per || item.unit || null,
  amount: item.amount,
});

async function sendToTally() {
  return true;
}

export function createVoucherHandlers({
  modelName,
  docNoField,
  docLabel,
  include,
  buildData,
  beforeCreate,
}) {
  const create = async (req, res) => {
    try {
      const { items, tax_breakup, ...rest } = req.body;
      const company_id = req.user?.company_id;
      const user_id = req.user?.id;

      if (!company_id || !user_id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!rest[docNoField]) {
        return res.status(400).json({ message: `${docLabel} number is required` });
      }

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "At least one item is required" });
      }

      const existing = await prisma[modelName].findUnique({
        where: { [docNoField]: rest[docNoField] },
      });
      if (existing) {
        return res.status(409).json({ message: `A ${docLabel} with this number already exists` });
      }

      if (beforeCreate) {
        const err = await beforeCreate(rest, prisma);
        if (err) return res.status(err.status || 400).json({ message: err.message });
      }

      const record = await prisma[modelName].create({
        data: {
          ...buildData(rest),
          company_id,
          user_id,
          items: { create: items.map(mapVoucherItem) },
          ...(Array.isArray(tax_breakup) &&
            tax_breakup.length > 0 &&
            modelName === "creditNote" && {
              tax_breakup: {
                create: tax_breakup.map((row) => ({
                  hsn_sac: row.hsn_sac,
                  taxable_value: row.taxable_value,
                  cgst_rate: row.cgst_rate ?? 0,
                  cgst_amount: row.cgst_amount ?? 0,
                  sgst_rate: row.sgst_rate ?? 0,
                  sgst_amount: row.sgst_amount ?? 0,
                  igst_rate: row.igst_rate ?? 0,
                  igst_amount: row.igst_amount ?? 0,
                  total_tax_amount: row.total_tax_amount ?? 0,
                })),
              },
            }),
        },
        include,
      });

      return res.status(201).json({
        message: `${docLabel} created successfully`,
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
      const list = await prisma[modelName].findMany({
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

      const record = await prisma[modelName].findFirst({
        where: { id: Number(id), company_id },
        include,
      });

      if (!record) {
        return res.status(404).json({ message: `${docLabel} not found` });
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
      const { items, tax_breakup, ...rest } = req.body;

      const existing = await prisma[modelName].findFirst({
        where: { id: Number(id), company_id },
      });

      if (!existing) {
        return res.status(404).json({ message: `${docLabel} not found` });
      }

      if (existing.approval_status !== "PENDING") {
        return res.status(400).json({
          message: `${docLabel} cannot be updated once it is ${existing.approval_status}`,
        });
      }

      const itemFk =
        modelName === "debitNote"
          ? "debit_note_id"
          : modelName === "creditNote"
            ? "credit_note_id"
            : "delivery_challan_id";

      if (Array.isArray(items)) {
        await prisma[
          modelName === "debitNote"
            ? "debitNoteItem"
            : modelName === "creditNote"
              ? "creditNoteItem"
              : "deliveryChallanItem"
        ].deleteMany({ where: { [itemFk]: Number(id) } });
      }

      if (Array.isArray(tax_breakup) && modelName === "creditNote") {
        await prisma.creditNoteTaxBreakup.deleteMany({ where: { credit_note_id: Number(id) } });
      }

      const updated = await prisma[modelName].update({
        where: { id: Number(id) },
        data: {
          ...buildData(rest),
          ...(Array.isArray(items) && {
            items: { create: items.map(mapVoucherItem) },
          }),
          ...(Array.isArray(tax_breakup) &&
            tax_breakup.length > 0 &&
            modelName === "creditNote" && {
              tax_breakup: {
                create: tax_breakup.map((row) => ({
                  hsn_sac: row.hsn_sac,
                  taxable_value: row.taxable_value,
                  cgst_rate: row.cgst_rate ?? 0,
                  cgst_amount: row.cgst_amount ?? 0,
                  sgst_rate: row.sgst_rate ?? 0,
                  sgst_amount: row.sgst_amount ?? 0,
                  igst_rate: row.igst_rate ?? 0,
                  igst_amount: row.igst_amount ?? 0,
                  total_tax_amount: row.total_tax_amount ?? 0,
                })),
              },
            }),
        },
        include,
      });

      return res.json({
        message: `${docLabel} updated successfully`,
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

      const existing = await prisma[modelName].findFirst({
        where: { id: Number(id), company_id },
      });

      if (!existing) {
        return res.status(404).json({ message: `${docLabel} not found` });
      }

      if (existing.approval_status !== "PENDING") {
        return res.status(400).json({
          message: `Cannot delete a ${docLabel} that has already been ${existing.approval_status}`,
        });
      }

      const attachmentType = attachmentTypeForModel(modelName);
      if (attachmentType) {
        await deleteAttachmentsForDocument(company_id, attachmentType, id);
      }

      await prisma[modelName].delete({ where: { id: Number(id) } });

      return res.json({ message: `${docLabel} deleted successfully` });
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

      const existing = await prisma[modelName].findFirst({
        where: { id: Number(id), company_id },
      });

      if (!existing) return res.status(404).json({ message: `${docLabel} not found` });
      if (existing.approval_status !== "PENDING") {
        return res.status(400).json({ message: `${docLabel} is already ${existing.approval_status}` });
      }

      const approved = await prisma[modelName].update({
        where: { id: Number(id) },
        data: {
          approval_status: "APPROVED",
          approval_date: new Date(),
          approval_remarks: remarks || null,
        },
        include,
      });

      return res.json({ message: `${docLabel} approved successfully`, data: approved });
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
        return res.status(400).json({ message: `remarks are required when rejecting a ${docLabel}` });
      }

      const existing = await prisma[modelName].findFirst({
        where: { id: Number(id), company_id },
      });

      if (!existing) return res.status(404).json({ message: `${docLabel} not found` });
      if (existing.approval_status !== "PENDING") {
        return res.status(400).json({ message: `${docLabel} is already ${existing.approval_status}` });
      }

      const rejected = await prisma[modelName].update({
        where: { id: Number(id) },
        data: {
          approval_status: "REJECTED",
          approval_date: new Date(),
          approval_remarks: remarks,
        },
        include,
      });

      return res.json({ message: `${docLabel} rejected successfully`, data: rejected });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: error.message });
    }
  };

  const pushToTally = async (req, res) => {
    try {
      const { id } = req.params;
      const company_id = req.user?.company_id;

      const record = await prisma[modelName].findFirst({
        where: { id: Number(id), company_id },
        include,
      });

      if (!record) return res.status(404).json({ message: `${docLabel} not found` });
      if (record.approval_status !== "APPROVED") {
        return res.status(400).json({ message: `Only approved ${docLabel}s can be pushed to Tally` });
      }
      if (record.tally_push_status === "PUSHED") {
        return res.status(400).json({ message: `${docLabel} has already been pushed to Tally` });
      }

      try {
        await sendToTally(record);
        const updated = await prisma[modelName].update({
          where: { id: Number(id) },
          data: { tally_push_status: "PUSHED" },
          include,
        });
        return res.json({ message: `${docLabel} pushed to Tally successfully`, data: updated });
      } catch (tallyError) {
        await prisma[modelName].update({
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

      const record = await prisma[modelName].findFirst({
        where: { id: Number(id), company_id },
        include,
      });

      if (!record) return res.status(404).json({ message: `${docLabel} not found` });
      if (record.approval_status !== "APPROVED") {
        return res.status(400).json({ message: `Only approved ${docLabel}s can be pushed to Tally` });
      }
      if (record.tally_push_status !== "FAILED") {
        return res.status(400).json({
          message: `Retry is only allowed for FAILED pushes. Current status: ${record.tally_push_status}`,
        });
      }

      try {
        await sendToTally(record);
        const updated = await prisma[modelName].update({
          where: { id: Number(id) },
          data: { tally_push_status: "PUSHED" },
          include,
        });
        return res.json({ message: `${docLabel} pushed to Tally successfully`, data: updated });
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
