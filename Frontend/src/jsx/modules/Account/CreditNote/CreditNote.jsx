import React from "react";
import VoucherDocumentPage from "../VoucherDocumentPage";
import CreditNoteForm from "./CreditNoteForm";
import CreditNotePreview from "./Creditnotepreview";
import { ATTACHMENT_DOCUMENT_TYPES } from "../documentAttachmentApi";
import {
  getAllCreditNotes,
  getCreditNoteById,
  deleteCreditNote,
  approveCreditNote,
  pushCreditNoteToTally,
  retryCreditNoteTallyPush,
  mapCreditNoteToList,
  mapCreditNoteToForm,
} from "../creditNoteApi";

const formatMoney = (n) =>
  `\u20b9${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const creditApi = {
  getAll: getAllCreditNotes,
  getById: getCreditNoteById,
  remove: deleteCreditNote,
  approve: approveCreditNote,
  pushToTally: pushCreditNoteToTally,
  retryTallyPush: retryCreditNoteTallyPush,
};

const CreditNote = () => (
  <VoucherDocumentPage
    title="Credit Note"
    listTitle="Credit Note List"
    newButtonLabel="New Credit Note"
    exportFileName="Credit_Note_List"
    searchPlaceholder="Search credit notes..."
    searchKeys={[
      "credit_no",
      "customer_name",
      "seller_name",
      "invoice_no",
      "InvoiceType",
      "status",
      "tallyLabel",
    ]}
    exportColumns={[
      { label: "Credit Note No", key: "credit_no" },
      { label: "Date", key: "credit_date" },
      { label: "Type", key: "InvoiceType" },
      { label: "Customer", key: "customer_name" },
      { label: "Seller", key: "seller_name" },
      { label: "Invoice No", key: "invoice_no" },
      { label: "Items", key: "ItemCount" },
      { label: "Amount", key: "amount" },
      { label: "Status", key: "status" },
      { label: "Tally", key: "tallyLabel" },
    ]}
    tableConfig={{
      docNoLabel: "Credit Note No",
      docNoKey: "credit_no",
      docSubKey: "InvoiceType",
      dateKey: "credit_date",
      partyLabel: "Customer",
      partyKey: "customer_name",
      partyGstinKey: "customer_gstin",
      secondaryPartyKey: "seller_name",
      secondaryPartyLabel: "Seller",
      refKey: "invoice_no",
      refLabel: "Invoice No",
      amountKey: "amount",
    }}
    viewConfig={{
      docNoKey: "CreditNoteNo",
      dateKey: "CreditNoteDate",
      subTitleKey: "InvoiceType",
      approveLabel: "Approve Credit Note",
      getSummaryTiles: (data) => [
        { label: "Seller", value: data?.SellerName, sub: data?.SellerGstin ? `GSTIN: ${data.SellerGstin}` : "" },
        { label: "Buyer", value: data?.BuyerName, sub: data?.BuyerGstin ? `GSTIN: ${data.BuyerGstin}` : "" },
        { label: "Consignee", value: data?.ConsigneeName || "Same as buyer" },
        {
          label: "Grand Total",
          value: formatMoney(data?.TotalAmount),
          sub: data?.OriginalInvoiceNo ? `Ref Invoice: ${data.OriginalInvoiceNo}` : "",
        },
      ],
    }}
    FormComponent={CreditNoteForm}
    PreviewComponent={CreditNotePreview}
    api={creditApi}
    mapToList={mapCreditNoteToList}
    mapToForm={mapCreditNoteToForm}
    attachmentDocumentType={ATTACHMENT_DOCUMENT_TYPES.CREDIT_NOTE}
  />
);

export default CreditNote;
