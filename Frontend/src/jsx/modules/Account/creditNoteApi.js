import {
  createVoucherApi,
  toDate,
  formatDate,
  extractTaxFromGstRows,
  mapItemsToApi,
  approvalToStatus,
  tallyToLabel,
} from "./voucherDocumentApi";
import {
  mapSellerFromRecord,
  mapConsigneeFromRecord,
  mapBuyerFromRecord,
  mapSellerToPayload,
  mapConsigneeToPayload,
  mapBuyerToPayload,
  mapItemsFromRecord,
  buildGstDetailsFromRecord,
  mapTaxBreakupFromRecord,
  mapTaxBreakupToPayload,
  computeLineTotals,
} from "./vouchers/shared/voucherMapperUtils";

const api = createVoucherApi("creditnote");

export const getAllCreditNotes = api.getAll;
export const getCreditNoteById = api.getById;
export const createCreditNote = api.create;
export const updateCreditNote = api.update;
export const deleteCreditNote = api.remove;
export const approveCreditNote = api.approve;
export const rejectCreditNote = api.reject;
export const pushCreditNoteToTally = api.pushToTally;
export const retryCreditNoteTallyPush = api.retryTallyPush;

export const mapCreditNoteToList = (c) => ({
  id: c.id,
  credit_no: c.credit_note_no,
  credit_date: formatDate(c.credit_note_date),
  InvoiceType: c.invoice_type || "Credit Note",
  customer_name: c.buyer_name,
  customer_gstin: c.buyer_gstin || "",
  seller_name: c.seller_name || "",
  invoice_no: c.original_invoice_no || "",
  amount: Number(c.total_amount) || 0,
  ItemCount: Array.isArray(c.items) ? c.items.length : 0,
  status: approvalToStatus(c.approval_status),
  approval_status: c.approval_status,
  tally_push_status: c.tally_push_status,
  tallyLabel: tallyToLabel(c.tally_push_status),
  raw: c,
});

export const mapCreditNoteToForm = (c) => ({
  InvoiceType: c.invoice_type || "Credit Note",
  IRN: c.irn || "",
  AckNo: c.ack_no || "",
  AckDate: formatDate(c.ack_date),
  CreditNoteNo: c.credit_note_no || "",
  CreditNoteDate: formatDate(c.credit_note_date),
  EWayBillNo: c.eway_bill_no || "",
  OriginalInvoiceNo: c.original_invoice_no || "",
  OriginalInvoiceDate: formatDate(c.original_invoice_date),
  BuyersOrderNo: c.buyers_order_no || "",
  OtherReferences: c.other_references || "",
  DispatchDocNo: c.dispatch_doc_no || "",
  DispatchedThrough: c.dispatched_through || "",
  Destination: c.destination || "",
  TermsOfDelivery: c.terms_of_delivery || "",
  ...mapSellerFromRecord(c),
  ...mapConsigneeFromRecord(c),
  ...mapBuyerFromRecord(c),
  TotalAmount: Number(c.total_amount) || "",
  AmountInWords: c.amount_in_words || "",
  TaxAmountInWords: c.tax_amount_in_words || "",
  AuthorisedSignatoryName: c.authorised_signatory_name || "",
  AuthorisedSignatoryDesignation: c.authorised_signatory_designation || "",
  Items: mapItemsFromRecord(c.items),
  GstDetails: buildGstDetailsFromRecord(c),
  TaxBreakup: mapTaxBreakupFromRecord(c.tax_breakup),
  status: approvalToStatus(c.approval_status),
  approval_status: c.approval_status,
  tally_push_status: c.tally_push_status,
  tallyLabel: tallyToLabel(c.tally_push_status),
});

export const mapFormToPayload = (formData, items, gstDetails, taxBreakup = []) => {
  const mappedItems = mapItemsToApi(items);
  const { totalQty, itemsTotal, gstTotal, grandTotal } = computeLineTotals(items, gstDetails);
  const tax = extractTaxFromGstRows(gstDetails);

  return {
    invoice_type: formData.InvoiceType || "Credit Note",
    irn: formData.IRN || null,
    ack_no: formData.AckNo || null,
    ack_date: formData.AckDate ? toDate(formData.AckDate) : null,
    credit_note_no: formData.CreditNoteNo || `CN-${Date.now()}`,
    credit_note_date: toDate(formData.CreditNoteDate),
    eway_bill_no: formData.EWayBillNo || null,
    original_invoice_no: formData.OriginalInvoiceNo || null,
    original_invoice_date: formData.OriginalInvoiceDate ? toDate(formData.OriginalInvoiceDate) : null,
    buyers_order_no: formData.BuyersOrderNo || null,
    other_references: formData.OtherReferences || null,
    dispatch_doc_no: formData.DispatchDocNo || null,
    dispatched_through: formData.DispatchedThrough || null,
    destination: formData.Destination || null,
    terms_of_delivery: formData.TermsOfDelivery || null,
    ...mapSellerToPayload(formData),
    ...mapConsigneeToPayload(formData),
    ...mapBuyerToPayload(formData),
    total_quantity: totalQty,
    taxable_value: itemsTotal,
    ...tax,
    total_tax_amount: gstTotal,
    total_amount: grandTotal,
    amount_in_words: formData.AmountInWords || null,
    tax_amount_in_words: formData.TaxAmountInWords || null,
    authorised_signatory_name: formData.AuthorisedSignatoryName || null,
    authorised_signatory_designation: formData.AuthorisedSignatoryDesignation || null,
    tax_breakup: mapTaxBreakupToPayload(taxBreakup),
    items: mappedItems,
  };
};
