import React from "react";
import VoucherDocumentPage from "../VoucherDocumentPage";
import DebitNoteForm from "./DebitNoteForm";
import DebitNotePreview from "./DebitNotePreview";
import { ATTACHMENT_DOCUMENT_TYPES } from "../documentAttachmentApi";
import {
  getAllDebitNotes,
  getDebitNoteById,
  deleteDebitNote,
  approveDebitNote,
  pushDebitNoteToTally,
  retryDebitNoteTallyPush,
  mapDebitNoteToList,
  mapDebitNoteToForm,
} from "../debitNoteApi";

const formatMoney = (n) =>
  `\u20b9${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const debitApi = {
  getAll: getAllDebitNotes,
  getById: getDebitNoteById,
  remove: deleteDebitNote,
  approve: approveDebitNote,
  pushToTally: pushDebitNoteToTally,
  retryTallyPush: retryDebitNoteTallyPush,
};

const DebitNote = () => (
  <VoucherDocumentPage
    title="Debit Note"
    listTitle="Debit Note List"
    newButtonLabel="New Debit Note"
    exportFileName="Debit_Note_List"
    searchPlaceholder="Search debit notes..."
    searchKeys={[
      "DebitNoteNo",
      "VendorName",
      "BuyerName",
      "PurchaseNo",
      "Vendorgstin",
      "status",
      "tallyLabel",
    ]}
    exportColumns={[
      { label: "Debit Note No", key: "DebitNoteNo" },
      { label: "Date", key: "DebitNoteDate" },
      { label: "Vendor", key: "VendorName" },
      { label: "Buyer", key: "BuyerName" },
      { label: "Purchase No", key: "PurchaseNo" },
      { label: "Items", key: "ItemCount" },
      { label: "Amount", key: "DebitNoteAmount" },
      { label: "Status", key: "status" },
      { label: "Tally", key: "tallyLabel" },
    ]}
    tableConfig={{
      docNoLabel: "Debit Note No",
      docNoKey: "DebitNoteNo",
      dateKey: "DebitNoteDate",
      partyLabel: "Vendor",
      partyKey: "VendorName",
      partyGstinKey: "Vendorgstin",
      secondaryPartyKey: "BuyerName",
      secondaryPartyLabel: "Buyer",
      refKey: "PurchaseNo",
      refLabel: "Purchase No",
      amountKey: "DebitNoteAmount",
    }}
    viewConfig={{
      docNoKey: "DebitNoteNo",
      dateKey: "DebitNoteDate",
      approveLabel: "Approve Debit Note",
      getSummaryTiles: (data) => [
        { label: "Vendor", value: data?.SellerName, sub: data?.SellerGstin ? `GSTIN: ${data.SellerGstin}` : "" },
        { label: "Buyer", value: data?.BuyerName, sub: data?.BuyerGstin ? `GSTIN: ${data.BuyerGstin}` : "" },
        { label: "Consignee", value: data?.ConsigneeName || "Same as buyer" },
        {
          label: "Grand Total",
          value: formatMoney(data?.TotalAmount),
          sub: data?.OriginalInvoiceNo ? `Purchase: ${data.OriginalInvoiceNo}` : "",
        },
      ],
    }}
    FormComponent={DebitNoteForm}
    PreviewComponent={DebitNotePreview}
    api={debitApi}
    mapToList={mapDebitNoteToList}
    mapToForm={mapDebitNoteToForm}
    attachmentDocumentType={ATTACHMENT_DOCUMENT_TYPES.DEBIT_NOTE}
  />
);

export default DebitNote;
