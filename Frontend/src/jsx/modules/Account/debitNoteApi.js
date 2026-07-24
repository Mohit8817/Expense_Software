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
  computeLineTotals,
} from "./vouchers/shared/voucherMapperUtils";

const api = createVoucherApi("debitnote");

export const getAllDebitNotes = api.getAll;
export const getDebitNoteById = api.getById;
export const createDebitNote = api.create;
export const updateDebitNote = api.update;
export const deleteDebitNote = api.remove;
export const approveDebitNote = api.approve;
export const rejectDebitNote = api.reject;
export const pushDebitNoteToTally = api.pushToTally;
export const retryDebitNoteTallyPush = api.retryTallyPush;

export const mapDebitNoteToList = (d) => ({
  id: d.id,
  DebitNoteNo: d.debit_note_no,
  DebitNoteDate: formatDate(d.debit_note_date),
  PurchaseNo: d.original_invoice_no || "",
  VendorName: d.seller_name,
  Vendorgstin: d.seller_gstin || "",
  BuyerName: d.buyer_name || "",
  DebitNoteAmount: Number(d.total_amount) || 0,
  ItemCount: Array.isArray(d.items) ? d.items.length : 0,
  status: approvalToStatus(d.approval_status),
  approval_status: d.approval_status,
  tally_push_status: d.tally_push_status,
  tallyLabel: tallyToLabel(d.tally_push_status),
  raw: d,
});

export const mapDebitNoteToForm = (d) => ({
  DebitNoteNo: d.debit_note_no || "",
  DebitNoteDate: formatDate(d.debit_note_date),
  OriginalInvoiceNo: d.original_invoice_no || "",
  OriginalInvoiceDate: formatDate(d.original_invoice_date),
  OtherReferences: d.other_references || "",
  ...mapSellerFromRecord(d),
  ...mapConsigneeFromRecord(d),
  ...mapBuyerFromRecord(d),
  TotalAmount: Number(d.total_amount) || "",
  AmountInWords: d.amount_in_words || "",
  AuthorisedSignatoryName: d.authorised_signatory_name || "",
  AuthorisedSignatoryDesignation: d.authorised_signatory_designation || "",
  Items: mapItemsFromRecord(d.items),
  GstDetails: buildGstDetailsFromRecord(d),
  status: approvalToStatus(d.approval_status),
  approval_status: d.approval_status,
  tally_push_status: d.tally_push_status,
  tallyLabel: tallyToLabel(d.tally_push_status),
});

export const mapFormToPayload = (formData, items, gstDetails) => {
  const mappedItems = mapItemsToApi(items);
  const { totalQty, itemsTotal, gstTotal, grandTotal } = computeLineTotals(items, gstDetails);
  const tax = extractTaxFromGstRows(gstDetails);

  return {
    debit_note_no: formData.DebitNoteNo || `DN-${Date.now()}`,
    debit_note_date: toDate(formData.DebitNoteDate),
    original_invoice_no: formData.OriginalInvoiceNo || null,
    original_invoice_date: formData.OriginalInvoiceDate ? toDate(formData.OriginalInvoiceDate) : null,
    other_references: formData.OtherReferences || null,
    ...mapSellerToPayload(formData),
    ...mapConsigneeToPayload(formData),
    ...mapBuyerToPayload(formData),
    total_quantity: totalQty,
    taxable_value: itemsTotal,
    ...tax,
    total_tax_amount: gstTotal,
    total_amount: grandTotal,
    amount_in_words: formData.AmountInWords || null,
    authorised_signatory_name: formData.AuthorisedSignatoryName || null,
    authorised_signatory_designation: formData.AuthorisedSignatoryDesignation || null,
    items: mappedItems,
  };
};
