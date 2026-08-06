import { PrismaClient } from "@prisma/client";
import { createVoucherHandlers, mapVoucherItem } from "../utils/voucherBase.js";
import { DATA_STATUS_TALLY, resolveDataStatus } from "../constants/dataStatus.js";
import {
  normalizeDebitNotePayload,
  extractTallyDebitNoteRecords,
  isTallyDebitNoteBatchRequest,
  describeTallyDebitNoteBodyIssue,
} from "../utils/tallyPayloadUtils.js";

const prisma = new PrismaClient();

const include = { items: true };

const buildDebitNoteData = (body) => ({
  debit_note_no: body.debit_note_no,
  debit_note_date: body.debit_note_date,
  original_invoice_no: body.original_invoice_no || null,
  original_invoice_date: body.original_invoice_date || null,
  other_references: body.other_references || null,
  seller_company_id: body.seller_company_id ? Number(body.seller_company_id) : null,
  consignee_company_id: body.consignee_company_id ? Number(body.consignee_company_id) : null,
  buyer_company_id: body.buyer_company_id ? Number(body.buyer_company_id) : null,
  seller_name: body.seller_name,
  seller_address: body.seller_address,
  seller_gstin: body.seller_gstin,
  seller_state: body.seller_state,
  seller_state_code: body.seller_state_code,
  seller_cin: body.seller_cin || null,
  seller_email: body.seller_email || null,
  seller_pan: body.seller_pan || null,
  consignee_name: body.consignee_name || null,
  consignee_address: body.consignee_address || null,
  consignee_gstin: body.consignee_gstin || null,
  consignee_state: body.consignee_state || null,
  consignee_state_code: body.consignee_state_code || null,
  consignee_email: body.consignee_email || null,
  buyer_name: body.buyer_name,
  buyer_address: body.buyer_address,
  buyer_gstin: body.buyer_gstin,
  buyer_state: body.buyer_state,
  buyer_state_code: body.buyer_state_code,
  buyer_pan: body.buyer_pan || null,
  buyer_email: body.buyer_email || null,
  total_quantity: body.total_quantity,
  taxable_value: body.taxable_value,
  igst_rate: body.igst_rate ?? 0,
  igst_amount: body.igst_amount ?? 0,
  cgst_rate: body.cgst_rate ?? 0,
  cgst_amount: body.cgst_amount ?? 0,
  sgst_rate: body.sgst_rate ?? 0,
  sgst_amount: body.sgst_amount ?? 0,
  total_tax_amount: body.total_tax_amount,
  total_amount: body.total_amount,
  amount_in_words: body.amount_in_words || null,
  authorised_signatory_name: body.authorised_signatory_name || null,
  authorised_signatory_designation: body.authorised_signatory_designation || null,
});

async function createDebitNoteRecord(req, rawRecord) {
  const company_id = req.user?.company_id;
  const user_id = req.user?.id;
  const fromTally = resolveDataStatus(req) === DATA_STATUS_TALLY;

  const { items, PurchaseItems, GstDetails, gst_details, ...rest } = rawRecord || {};

  const normalized = normalizeDebitNotePayload(
    rest,
    items ?? PurchaseItems ?? [],
    gst_details ?? GstDetails ?? [],
    company_id
  );
  const payload = normalized.body;

  if (!payload.debit_note_no) {
    throw new Error("debit_note_no / DebitNoteNo is required");
  }

  if (!normalized.items.length) {
    throw new Error("At least one item is required in items / PurchaseItems");
  }

  const existing = await prisma.debitNote.findUnique({
    where: { debit_note_no: payload.debit_note_no },
  });
  if (existing) {
    const err = new Error("A debit note with this number already exists");
    err.status = 409;
    throw err;
  }

  return prisma.debitNote.create({
    data: {
      ...buildDebitNoteData(payload),
      company_id,
      user_id,
      data_status: resolveDataStatus(req),
      ...(fromTally && {
        approval_status: "APPROVED",
        approval_date: new Date(),
        tally_push_status: "PUSHED",
      }),
      items: { create: normalized.items.map(mapVoucherItem) },
    },
    include,
  });
}

export const createDebitNote = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    const user_id = req.user?.id;

    if (!company_id || !user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const records = extractTallyDebitNoteRecords(req.body);
    const isBatch = isTallyDebitNoteBatchRequest(req.body);

    if (!records.length) {
      return res.status(400).json({
        message: "No debit note records found in request body",
        hint: describeTallyDebitNoteBodyIssue(req.body),
        example: {
          data: [
            {
              company_id: "KLKURJA",
              DebitNoteNo: "Pur0991",
              DebitNoteDate: "02/Jul/2026",
              PurchaseNo: "PO908",
              VendorName: "XYZ Pvt Ltd",
              DebitNoteAmount: 120000,
              Vendorgstin: "",
              PurchaseItems: [{ itemname: "Item A", quantity: 1, rate: 100, amount: 100 }],
              GstDetails: [{ LedgerName: "CGST", amount: 9 }, { LedgerName: "SGST", amount: 9 }],
            },
          ],
        },
      });
    }

    if (isBatch || records.length > 1) {
      const created = [];
      const errors = [];

      for (const record of records) {
        const debitNoteRef = record.DebitNoteNo || record.debit_note_no || "unknown";
        try {
          const debitNote = await createDebitNoteRecord(req, record);
          created.push(debitNote);
        } catch (error) {
          errors.push({
            DebitNoteNo: debitNoteRef,
            message: error.message,
          });
        }
      }

      if (!created.length) {
        return res.status(400).json({
          message: "No debit notes were created",
          data: [],
          errors,
        });
      }

      return res.status(201).json({
        message: `${created.length} debit note(s) created successfully`,
        data: created,
        ...(errors.length > 0 && { errors }),
      });
    }

    const debitNote = await createDebitNoteRecord(req, records[0]);

    return res.status(201).json({
      message: "Debit note created successfully",
      data: debitNote,
    });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({ message: error.message });
  }
};

const handlers = createVoucherHandlers({
  modelName: "debitNote",
  docNoField: "debit_note_no",
  docLabel: "Debit note",
  include,
  buildData: buildDebitNoteData,
});

export const {
  getAll: getAllDebitNotes,
  getById: getDebitNoteById,
  update: updateDebitNote,
  remove: deleteDebitNote,
  approve: approveDebitNote,
  reject: rejectDebitNote,
  pushToTally: pushDebitNoteToTally,
  retryTallyPush: retryDebitNoteTallyPush,
} = handlers;
