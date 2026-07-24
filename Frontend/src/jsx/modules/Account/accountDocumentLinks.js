import { formatDate } from "./accountDashboardApi";
import {
  mapSellerFromRecord,
  mapConsigneeFromRecord,
  mapBuyerFromRecord,
  mapItemsFromRecord,
  buildGstDetailsFromRecord,
} from "./vouchers/shared/voucherMapperUtils";

/** Apply a posted sales invoice to credit note form state. */
export const mapSalesToCreditNoteLink = (sales) => ({
  formPatch: {
    OriginalInvoiceNo: sales.invoice_no || "",
    OriginalInvoiceDate: formatDate(sales.invoice_date),
    BuyersOrderNo: sales.buyers_order_no || "",
    OtherReferences: sales.other_references || "",
    DispatchDocNo: sales.dispatch_doc_no || "",
    DispatchedThrough: sales.dispatched_through || "",
    Destination: sales.destination || "",
    TermsOfDelivery: sales.terms_of_delivery || "",
    SourceSalesId: String(sales.id),
    ...mapSellerFromRecord(sales),
    ...mapConsigneeFromRecord(sales),
    ...mapBuyerFromRecord(sales),
  },
  items: mapItemsFromRecord(sales.items),
  gstDetails: buildGstDetailsFromRecord(sales),
});

/** Apply a posted sales invoice to delivery challan form state. */
export const mapSalesToDeliveryChallanLink = (sales) => ({
  formPatch: {
    InvoiceNo: sales.invoice_no || "",
    InvoiceDate: formatDate(sales.invoice_date),
    BuyersOrderNo: sales.buyers_order_no || "",
    DispatchDocNo: sales.dispatch_doc_no || "",
    DispatchedThrough: sales.dispatched_through || "",
    Destination: sales.destination || "",
    MotorVehicleNo: sales.motor_vehicle_no || "",
    BillOfLadingNo: sales.bill_of_lading_no || "",
    TermsOfDelivery: sales.terms_of_delivery || "",
    SourceSalesId: String(sales.id),
    ...mapSellerFromRecord(sales),
    ...mapBuyerFromRecord(sales),
  },
  items: mapItemsFromRecord(sales.items),
  gstDetails: buildGstDetailsFromRecord(sales),
});

/** Apply a posted purchase invoice to debit note form state. */
export const mapPurchaseToDebitNoteLink = (purchase) => ({
  formPatch: {
    OriginalInvoiceNo: purchase.invoice_no || "",
    OriginalInvoiceDate: formatDate(purchase.invoice_date),
    OtherReferences: purchase.other_references || "",
    SourcePurchaseId: String(purchase.id),
    ...mapSellerFromRecord(purchase),
    ...mapConsigneeFromRecord(purchase),
    ...mapBuyerFromRecord(purchase),
  },
  items: mapItemsFromRecord(purchase.items),
  gstDetails: buildGstDetailsFromRecord(purchase),
});
