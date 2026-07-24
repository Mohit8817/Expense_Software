import React from "react";
import VoucherDocumentPage from "../VoucherDocumentPage";
import PaymentForm from "./PaymentForm";
import PaymentPreview from "./Paymentpreview";
import { ATTACHMENT_DOCUMENT_TYPES } from "../documentAttachmentApi";
import {
  getAllPaymentVouchers,
  getPaymentVoucherById,
  deletePaymentVoucher,
  approvePaymentVoucher,
  pushPaymentVoucherToTally,
  retryPaymentVoucherTallyPush,
  mapPaymentVoucherToList,
  mapPaymentVoucherToForm,
  paymentTypeLabel,
  paymentModeLabel,
} from "../paymentVoucherApi";

const formatMoney = (n) =>
  `\u20b9${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const paymentApi = {
  getAll: getAllPaymentVouchers,
  getById: getPaymentVoucherById,
  remove: deletePaymentVoucher,
  approve: approvePaymentVoucher,
  pushToTally: pushPaymentVoucherToTally,
  retryTallyPush: retryPaymentVoucherTallyPush,
};

const Payment = () => (
  <VoucherDocumentPage
    title="Payment Voucher"
    listTitle="Payment Voucher List"
    newButtonLabel="New Payment"
    exportFileName="Payment_Voucher_List"
    searchPlaceholder="Search payment vouchers..."
    searchKeys={["voucher_no", "from_company_name", "party_name", "party_flow", "narration", "linked_document_no", "payment_type", "status", "tallyLabel"]}
    exportColumns={[
      { label: "Voucher No", key: "voucher_no" },
      { label: "Date", key: "voucher_date" },
      { label: "Type", key: "payment_type" },
      { label: "Mode", key: "payment_mode" },
      { label: "Pay From", key: "from_company_name" },
      { label: "Pay To", key: "party_name" },
      { label: "Reference Doc", key: "linked_document_no" },
      { label: "Amount", key: "amount" },
      { label: "Status", key: "status" },
      { label: "Tally", key: "tallyLabel" },
    ]}
    tableConfig={{
      docNoLabel: "Voucher No",
      docNoKey: "voucher_no",
      docSubKey: "payment_type",
      dateKey: "voucher_date",
      partyLabel: "Pay From → To",
      partyKey: "party_flow",
      refKey: "linked_document_no",
      refLabel: "Against Doc",
      amountKey: "amount",
    }}
    viewConfig={{
      docNoKey: "VoucherNo",
      dateKey: "VoucherDate",
      subTitleKey: "PaymentType",
      approveLabel: "Approve Payment Voucher",
      getSummaryTiles: (data) => [
        { label: "Pay From", value: data?.FromCompanyName, sub: data?.BankName || paymentModeLabel(data?.PaymentMode) },
        { label: "Pay To", value: data?.PartyName, sub: data?.PayeeType === "EMPLOYEE" ? data?.PayeeDesignation || "Employee" : data?.PartyGstin ? `GSTIN: ${data.PartyGstin}` : "" },
        { label: "Against Document", value: data?.LinkedDocumentNo || "General / On account" },
        {
          label: "Amount",
          value: formatMoney(data?.Amount),
          sub: paymentTypeLabel(data?.PaymentType),
        },
      ],
    }}
    FormComponent={PaymentForm}
    PreviewComponent={PaymentPreview}
    api={paymentApi}
    mapToList={mapPaymentVoucherToList}
    mapToForm={mapPaymentVoucherToForm}
    attachmentDocumentType={ATTACHMENT_DOCUMENT_TYPES.PAYMENT_VOUCHER}
  />
);

export default Payment;
