import { PrismaClient } from "@prisma/client";
import { createVoucherHandlers, mapVoucherItem } from "../utils/voucherBase.js";
import { DATA_STATUS_TALLY, resolveDataStatus } from "../constants/dataStatus.js";
import {
  normalizeCreditNotePayload,
  extractTallyCreditNoteRecords,
  isTallyCreditNoteBatchRequest,
  describeTallyCreditNoteBodyIssue,
} from "../utils/tallyPayloadUtils.js";

const prisma = new PrismaClient();

const include = { items: true, tax_breakup: true };

const buildCreditNoteData = (body) => ({
  invoice_type: body.invoice_type || "Credit Note",
  irn: body.irn || null,
  ack_no: body.ack_no || null,
  ack_date: body.ack_date || null,
  credit_note_no: body.credit_note_no,
  credit_note_date: body.credit_note_date,
  eway_bill_no: body.eway_bill_no || null,
  original_invoice_no: body.original_invoice_no || null,
  original_invoice_date: body.original_invoice_date || null,
  buyers_order_no: body.buyers_order_no || null,
  other_references: body.other_references || null,
  dispatch_doc_no: body.dispatch_doc_no || null,
  dispatched_through: body.dispatched_through || null,
  destination: body.destination || null,
  terms_of_delivery: body.terms_of_delivery || null,
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
  tax_amount_in_words: body.tax_amount_in_words || null,
  authorised_signatory_name: body.authorised_signatory_name || null,
  authorised_signatory_designation: body.authorised_signatory_designation || null,
});

async function createCreditNoteRecord(req, rawRecord) {
  const company_id = req.user?.company_id;
  const user_id = req.user?.id;
  const fromTally = resolveDataStatus(req) === DATA_STATUS_TALLY;

  const { items, BillItems, GstDetails, gst_details, tax_breakup, ...rest } = rawRecord || {};

  const normalized = normalizeCreditNotePayload(
    rest,
    items ?? BillItems ?? [],
    gst_details ?? GstDetails ?? [],
    company_id
  );
  const payload = normalized.body;

  if (!payload.credit_note_no) {
    throw new Error("credit_note_no / CreditNoteNo is required");
  }

  if (!normalized.items.length) {
    throw new Error("At least one item is required in items / BillItems");
  }

  const existing = await prisma.creditNote.findUnique({
    where: { credit_note_no: payload.credit_note_no },
  });
  if (existing) {
    const err = new Error("A credit note with this number already exists");
    err.status = 409;
    throw err;
  }

  if (payload.irn) {
    const existingIrn = await prisma.creditNote.findUnique({ where: { irn: payload.irn } });
    if (existingIrn) {
      const err = new Error("A credit note with this IRN already exists");
      err.status = 409;
      throw err;
    }
  }

  return prisma.creditNote.create({
    data: {
      ...buildCreditNoteData(payload),
      company_id,
      user_id,
      data_status: resolveDataStatus(req),
      ...(fromTally && {
        approval_status: "APPROVED",
        approval_date: new Date(),
        tally_push_status: "PUSHED",
      }),
      items: { create: normalized.items.map(mapVoucherItem) },
      ...(Array.isArray(tax_breakup) &&
        tax_breakup.length > 0 && {
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
}

export const createCreditNote = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    const user_id = req.user?.id;

    if (!company_id || !user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const records = extractTallyCreditNoteRecords(req.body);
    const isBatch = isTallyCreditNoteBatchRequest(req.body);

    if (!records.length) {
      return res.status(400).json({
        message: "No credit note records found in request body",
        hint: describeTallyCreditNoteBodyIssue(req.body),
        example: {
          data: [
            {
              company_id: "KLKURJA",
              CreditNoteNo: "Inv0991",
              CreditNoteDate: "02/Jul/2026",
              InvoiceNo: "DL0991",
              CustomerName: "ABC Pvt Ltd",
              BillAmount: 120000,
              customergstin: "",
              BillItems: [{ itemname: "Item A", quantity: 1, rate: 100, amount: 100 }],
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
        const creditNoteRef = record.CreditNoteNo || record.credit_note_no || "unknown";
        try {
          const creditNote = await createCreditNoteRecord(req, record);
          created.push(creditNote);
        } catch (error) {
          errors.push({
            CreditNoteNo: creditNoteRef,
            message: error.message,
          });
        }
      }

      if (!created.length) {
        return res.status(400).json({
          message: "No credit notes were created",
          data: [],
          errors,
        });
      }

      return res.status(201).json({
        message: `${created.length} credit note(s) created successfully`,
        data: created,
        ...(errors.length > 0 && { errors }),
      });
    }

    const creditNote = await createCreditNoteRecord(req, records[0]);

    return res.status(201).json({
      message: "Credit note created successfully",
      data: creditNote,
    });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({ message: error.message });
  }
};

const handlers = createVoucherHandlers({
  modelName: "creditNote",
  docNoField: "credit_note_no",
  docLabel: "Credit note",
  include,
  buildData: buildCreditNoteData,
  beforeCreate: async (rest, prismaClient) => {
    if (!rest.irn) return null;
    const existing = await prismaClient.creditNote.findUnique({ where: { irn: rest.irn } });
    if (existing) return { message: "A credit note with this IRN already exists" };
    return null;
  },
});

export const {
  getAll: getAllCreditNotes,
  getById: getCreditNoteById,
  update: updateCreditNote,
  remove: deleteCreditNote,
  approve: approveCreditNote,
  reject: rejectCreditNote,
  pushToTally: pushCreditNoteToTally,
  retryTallyPush: retryCreditNoteTallyPush,
} = handlers;
