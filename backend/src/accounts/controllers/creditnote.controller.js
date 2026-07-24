import { createVoucherHandlers } from "../utils/voucherBase.js";

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

const handlers = createVoucherHandlers({
  modelName: "creditNote",
  docNoField: "credit_note_no",
  docLabel: "Credit note",
  include,
  buildData: buildCreditNoteData,
  beforeCreate: async (rest, prisma) => {
    if (!rest.irn) return null;
    const existing = await prisma.creditNote.findUnique({ where: { irn: rest.irn } });
    if (existing) return { message: "A credit note with this IRN already exists" };
    return null;
  },
});

export const {
  create: createCreditNote,
  getAll: getAllCreditNotes,
  getById: getCreditNoteById,
  update: updateCreditNote,
  remove: deleteCreditNote,
  approve: approveCreditNote,
  reject: rejectCreditNote,
  pushToTally: pushCreditNoteToTally,
  retryTallyPush: retryCreditNoteTallyPush,
} = handlers;
