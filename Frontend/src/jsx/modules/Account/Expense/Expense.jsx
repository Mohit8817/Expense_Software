import React from "react";
import VoucherDocumentPage from "../VoucherDocumentPage";
import ExpenseForm from "./ExpenseForm";
import ExpensePreview from "./ExpensePreview";
import { ATTACHMENT_DOCUMENT_TYPES } from "../documentAttachmentApi";
import {
  getAllJournalVouchers,
  getJournalVoucherById,
  deleteJournalVoucher,
  approveJournalVoucher,
  pushJournalVoucherToTally,
  retryJournalVoucherTallyPush,
  mapJournalVoucherToList,
  mapJournalVoucherToForm,
} from "../journalVoucherApi";

const formatMoney = (n) =>
  `\u20b9${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const journalApi = {
  getAll: getAllJournalVouchers,
  getById: getJournalVoucherById,
  remove: deleteJournalVoucher,
  approve: approveJournalVoucher,
  pushToTally: pushJournalVoucherToTally,
  retryTallyPush: retryJournalVoucherTallyPush,
};

const Expense = () => (
  <VoucherDocumentPage
    title="Journal Voucher"
    listTitle="Journal Voucher List"
    newButtonLabel="New Journal Voucher"
    exportFileName="Journal_Voucher_List"
    searchPlaceholder="Search journal vouchers..."
    searchKeys={["voucher_no", "company_name", "payee_name", "party_flow", "narration", "on_account_of", "status", "tallyLabel"]}
    exportColumns={[
      { label: "Voucher No", key: "voucher_no" },
      { label: "Date", key: "voucher_date" },
      { label: "Type", key: "voucher_type" },
      { label: "Pay From", key: "company_name" },
      { label: "Pay To", key: "payee_name" },
      { label: "Narration", key: "narration" },
      { label: "Entries", key: "ItemCount" },
      { label: "Amount", key: "amount" },
      { label: "Status", key: "status" },
      { label: "Tally", key: "tallyLabel" },
    ]}
    tableConfig={{
      docNoLabel: "Voucher No",
      docNoKey: "voucher_no",
      docSubKey: "voucher_type",
      dateKey: "voucher_date",
      partyLabel: "Pay From → To",
      partyKey: "party_flow",
      refKey: "narration",
      refLabel: "Narration",
      amountKey: "amount",
    }}
    viewConfig={{
      docNoKey: "VoucherNo",
      dateKey: "VoucherDate",
      subTitleKey: "VoucherType",
      approveLabel: "Approve Journal Voucher",
      getSummaryTiles: (data) => [
        { label: "Pay From", value: data?.CompanyName, sub: data?.CompanyStateCode ? `State Code: ${data.CompanyStateCode}` : "" },
        { label: "Pay To", value: data?.PayeeName || "—", sub: data?.PayeeType === "EMPLOYEE" ? data?.PayeeDesignation || "Employee" : data?.PayeeGstin ? `GSTIN: ${data.PayeeGstin}` : "" },
        { label: "Narration", value: data?.Narration || "—" },
        { label: "On Account Of", value: data?.OnAccountOf || "—" },
        {
          label: "Total Amount",
          value: formatMoney(data?.TotalDebit || data?.TotalCredit),
          sub: `${(data?.DebitLedgers || []).filter((l) => l.LedgerName).length} debit · ${(data?.CreditLedgers || []).filter((l) => l.LedgerName).length} credit entries`,
        },
      ],
    }}
    FormComponent={ExpenseForm}
    PreviewComponent={ExpensePreview}
    api={journalApi}
    mapToList={mapJournalVoucherToList}
    mapToForm={mapJournalVoucherToForm}
    attachmentDocumentType={ATTACHMENT_DOCUMENT_TYPES.JOURNAL_VOUCHER}
  />
);

export default Expense;
