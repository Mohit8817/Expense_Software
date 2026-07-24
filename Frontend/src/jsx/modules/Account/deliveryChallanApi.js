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
  mapBuyerFromRecord,
  mapSellerToPayload,
  mapBuyerToPayload,
  mapItemsFromRecord,
  buildGstDetailsFromRecord,
  computeLineTotals,
} from "./vouchers/shared/voucherMapperUtils";

const api = createVoucherApi("deliverychallan");

export const getAllDeliveryChallans = api.getAll;
export const getDeliveryChallanById = api.getById;
export const createDeliveryChallan = api.create;
export const updateDeliveryChallan = api.update;
export const deleteDeliveryChallan = api.remove;
export const approveDeliveryChallan = api.approve;
export const rejectDeliveryChallan = api.reject;
export const pushDeliveryChallanToTally = api.pushToTally;
export const retryDeliveryChallanTallyPush = api.retryTallyPush;

export const mapDeliveryChallanToList = (c) => ({
  id: c.id,
  Challanno: c.challan_no,
  Challandate: formatDate(c.challan_date),
  CustomerName: c.buyer_name,
  customergstin: c.buyer_gstin || "",
  seller_name: c.seller_name || "",
  invoice_no: c.invoice_no || "",
  Challanamount: Number(c.total_amount) || 0,
  ItemCount: Array.isArray(c.items) ? c.items.length : 0,
  status: approvalToStatus(c.approval_status),
  approval_status: c.approval_status,
  tally_push_status: c.tally_push_status,
  tallyLabel: tallyToLabel(c.tally_push_status),
  raw: c,
});

export const mapDeliveryChallanToForm = (c) => ({
  ChallanNo: c.challan_no || "",
  ChallanDate: formatDate(c.challan_date),
  ReferenceNo: c.reference_no || "",
  ReferenceDate: formatDate(c.reference_date),
  InvoiceNo: c.invoice_no || "",
  InvoiceDate: formatDate(c.invoice_date),
  BuyersOrderNo: c.buyers_order_no || "",
  BuyersOrderDate: formatDate(c.buyers_order_date),
  DispatchDocNo: c.dispatch_doc_no || "",
  DispatchedThrough: c.dispatched_through || "",
  Destination: c.destination || "",
  MotorVehicleNo: c.motor_vehicle_no || "",
  BillOfLadingNo: c.bill_of_lading_no || "",
  TermsOfDelivery: c.terms_of_delivery || "",
  PolicyNo: c.policy_no || "",
  PlaceOfSupply: c.place_of_supply || "",
  ...mapSellerFromRecord(c),
  ...mapBuyerFromRecord(c),
  TotalAmount: Number(c.total_amount) || "",
  AmountInWords: c.amount_in_words || "",
  AuthorisedSignatoryName: c.authorised_signatory_name || "",
  AuthorisedSignatoryDesignation: c.authorised_signatory_designation || "",
  Items: mapItemsFromRecord(c.items),
  GstDetails: buildGstDetailsFromRecord(c),
  status: approvalToStatus(c.approval_status),
  approval_status: c.approval_status,
  tally_push_status: c.tally_push_status,
  tallyLabel: tallyToLabel(c.tally_push_status),
});

export const mapFormToPayload = (formData, items, gstDetails) => {
  const mappedItems = mapItemsToApi(items);
  const { totalQty, itemsTotal, gstTotal, grandTotal } = computeLineTotals(items, gstDetails);
  const tax = extractTaxFromGstRows(gstDetails);

  return {
    challan_no: formData.ChallanNo || `DC-${Date.now()}`,
    challan_date: toDate(formData.ChallanDate),
    reference_no: formData.ReferenceNo || null,
    reference_date: formData.ReferenceDate ? toDate(formData.ReferenceDate) : null,
    invoice_no: formData.InvoiceNo || null,
    invoice_date: formData.InvoiceDate ? toDate(formData.InvoiceDate) : null,
    buyers_order_no: formData.BuyersOrderNo || null,
    buyers_order_date: formData.BuyersOrderDate ? toDate(formData.BuyersOrderDate) : null,
    dispatch_doc_no: formData.DispatchDocNo || null,
    dispatched_through: formData.DispatchedThrough || null,
    destination: formData.Destination || null,
    motor_vehicle_no: formData.MotorVehicleNo || null,
    bill_of_lading_no: formData.BillOfLadingNo || null,
    terms_of_delivery: formData.TermsOfDelivery || null,
    policy_no: formData.PolicyNo || null,
    place_of_supply: formData.PlaceOfSupply || null,
    ...mapSellerToPayload(formData),
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
