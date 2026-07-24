import {
  createVoucherApi,
  toDate,
  formatDate,
  approvalToStatus,
  tallyToLabel,
} from "./voucherDocumentApi";
import { formatCompanyAddress, getCompanyStateCode } from "./purchaseApi";
import { parseNonNegative } from "./vouchers/shared/numberInputUtils";
import {
  uploadDocumentForScan,
  findCompanyByParty,
  mergeNonEmpty,
  expenseCategoryToLedger,
  paymentModeToLedger,
} from "./aiScanUtils";

const api = createVoucherApi("journalvoucher");

export const getAllJournalVouchers = api.getAll;
export const getJournalVoucherById = api.getById;
export const createJournalVoucher = api.create;
export const updateJournalVoucher = api.update;
export const deleteJournalVoucher = api.remove;
export const approveJournalVoucher = api.approve;
export const rejectJournalVoucher = api.reject;
export const pushJournalVoucherToTally = api.pushToTally;
export const retryJournalVoucherTallyPush = api.retryTallyPush;

export const emptyLedger = () => ({ LedgerName: "", Amount: "" });

export const PAYEE_TYPES = [
  { value: "COMPANY", label: "Company" },
  { value: "EMPLOYEE", label: "Employee" },
];

export const mapCompanyToJournalFields = (company) => ({
  CompanyId: String(company.id),
  CompanyName: company.name || "",
  CompanyAddress: formatCompanyAddress(company),
  CompanyState: company.state || "",
  CompanyStateCode: getCompanyStateCode(company),
  CompanyCIN: company.cin || "",
  CompanyEmail: company.email || "",
});

export const mapCompanyToPayeeFields = (company) => ({
  PayeeCompanyId: String(company.id),
  PayeeName: company.name || "",
  PayeeAddress: formatCompanyAddress(company),
  PayeeState: company.state || "",
  PayeeStateCode: getCompanyStateCode(company),
  PayeeGstin: company.gst || "",
  PayeeEmail: company.email || "",
  PayeeDesignation: "",
});

export const mapEmployeeToPayeeFields = (employee) => ({
  PayeeEmployeeId: String(employee.id),
  PayeeName: employee.username || "",
  PayeeEmail: employee.email || "",
  PayeeDesignation: employee.designation || "",
  PayeeAddress: "",
  PayeeState: "",
  PayeeStateCode: "",
  PayeeGstin: "",
  PayeeCompanyId: "",
});

export const mapJournalVoucherToList = (jv) => ({
  id: jv.id,
  voucher_no: jv.voucher_no,
  voucher_date: formatDate(jv.voucher_date),
  voucher_type: jv.voucher_type || "Journal Voucher",
  company_name: jv.company_name,
  payee_name: jv.payee_name || "",
  payee_type: jv.payee_type || "COMPANY",
  party_flow: jv.payee_name ? `${jv.company_name} → ${jv.payee_name}` : jv.company_name,
  narration: jv.narration || "",
  on_account_of: jv.on_account_of || "",
  amount: Number(jv.total_debit) || 0,
  ItemCount: Array.isArray(jv.entries) ? jv.entries.length : 0,
  status: approvalToStatus(jv.approval_status),
  approval_status: jv.approval_status,
  tally_push_status: jv.tally_push_status,
  tallyLabel: tallyToLabel(jv.tally_push_status),
  raw: jv,
});

const splitEntries = (entries = []) => {
  const debitLedgers = [];
  const creditLedgers = [];

  entries.forEach((entry) => {
    if (entry.entry_type === "Dr") {
      debitLedgers.push({
        LedgerName: entry.particulars || "",
        Amount: entry.debit_amount != null ? String(entry.debit_amount) : "",
      });
    } else if (entry.entry_type === "Cr") {
      creditLedgers.push({
        LedgerName: entry.particulars || "",
        Amount: entry.credit_amount != null ? String(entry.credit_amount) : "",
      });
    }
  });

  return {
    DebitLedgers: debitLedgers.length ? debitLedgers : [emptyLedger()],
    CreditLedgers: creditLedgers.length ? creditLedgers : [emptyLedger()],
  };
};

export const mapJournalVoucherToForm = (jv) => ({
  VoucherNo: jv.voucher_no || "",
  VoucherDate: formatDate(jv.voucher_date),
  VoucherType: jv.voucher_type || "Journal Voucher",
  CompanyId: jv.from_company_id ? String(jv.from_company_id) : "",
  CompanyName: jv.company_name || "",
  CompanyAddress: jv.company_address || "",
  CompanyState: jv.company_state || "",
  CompanyStateCode: jv.company_state_code || "",
  CompanyCIN: jv.company_cin || "",
  CompanyEmail: jv.company_email || "",
  PayeeType: jv.payee_type || "COMPANY",
  PayeeCompanyId: jv.payee_company_id ? String(jv.payee_company_id) : "",
  PayeeEmployeeId: jv.payee_employee_id ? String(jv.payee_employee_id) : "",
  PayeeName: jv.payee_name || "",
  PayeeAddress: jv.payee_address || "",
  PayeeState: jv.payee_state || "",
  PayeeStateCode: jv.payee_state_code || "",
  PayeeGstin: jv.payee_gstin || "",
  PayeeEmail: jv.payee_email || "",
  PayeeDesignation: jv.payee_designation || "",
  Narration: jv.narration || "",
  OnAccountOf: jv.on_account_of || "",
  AuthorisedSignatoryName: jv.authorised_signatory_name || "",
  AuthorisedSignatoryDesignation: jv.authorised_signatory_designation || "",
  TotalDebit: Number(jv.total_debit) || 0,
  TotalCredit: Number(jv.total_credit) || 0,
  ...splitEntries(jv.entries),
  status: approvalToStatus(jv.approval_status),
  approval_status: jv.approval_status,
  tally_push_status: jv.tally_push_status,
  tallyLabel: tallyToLabel(jv.tally_push_status),
});

const mapLedgersToEntries = (debitLedgers = [], creditLedgers = []) => {
  const entries = [];
  let sl = 1;

  debitLedgers
    .filter((row) => row.LedgerName && parseNonNegative(row.Amount) > 0)
    .forEach((row) => {
      entries.push({
        sl_no: sl++,
        particulars: row.LedgerName,
        entry_type: "Dr",
        debit_amount: parseNonNegative(row.Amount),
        credit_amount: null,
      });
    });

  creditLedgers
    .filter((row) => row.LedgerName && parseNonNegative(row.Amount) > 0)
    .forEach((row) => {
      entries.push({
        sl_no: sl++,
        particulars: row.LedgerName,
        entry_type: "Cr",
        debit_amount: null,
        credit_amount: parseNonNegative(row.Amount),
      });
    });

  return entries;
};

export const mapFormToPayload = (formData, debitLedgers, creditLedgers) => {
  const debitTotal = debitLedgers.reduce((sum, row) => sum + parseNonNegative(row.Amount), 0);
  const creditTotal = creditLedgers.reduce((sum, row) => sum + parseNonNegative(row.Amount), 0);

  return {
    voucher_no: formData.VoucherNo || `JV-${Date.now()}`,
    voucher_date: toDate(formData.VoucherDate),
    voucher_type: formData.VoucherType || "Journal Voucher",
    from_company_id: formData.CompanyId ? Number(formData.CompanyId) : null,
    company_name: formData.CompanyName,
    company_address: formData.CompanyAddress,
    company_state: formData.CompanyState,
    company_state_code: formData.CompanyStateCode,
    company_cin: formData.CompanyCIN || null,
    company_email: formData.CompanyEmail || null,
    payee_type: formData.PayeeType || "COMPANY",
    payee_company_id:
      formData.PayeeType === "COMPANY" && formData.PayeeCompanyId
        ? Number(formData.PayeeCompanyId)
        : null,
    payee_employee_id:
      formData.PayeeType === "EMPLOYEE" && formData.PayeeEmployeeId
        ? Number(formData.PayeeEmployeeId)
        : null,
    payee_name: formData.PayeeName || null,
    payee_address: formData.PayeeAddress || null,
    payee_state: formData.PayeeState || null,
    payee_state_code: formData.PayeeStateCode || null,
    payee_gstin: formData.PayeeGstin || null,
    payee_email: formData.PayeeEmail || null,
    payee_designation: formData.PayeeDesignation || null,
    narration: formData.Narration || null,
    on_account_of: formData.OnAccountOf || null,
    total_debit: debitTotal,
    total_credit: creditTotal,
    authorised_signatory_name: formData.AuthorisedSignatoryName || null,
    authorised_signatory_designation: formData.AuthorisedSignatoryDesignation || null,
    entries: mapLedgersToEntries(debitLedgers, creditLedgers),
  };
};

export const scanExpenseReceipt = async (file) =>
  uploadDocumentForScan("journalvoucher/scan-receipt", file);

export const mapScannedReceiptToJournalForm = (scan, companies = []) => {
  const payeeCo = findCompanyByParty(companies, {
    name: scan.vendor_name,
    gstin: scan.vendor_gstin,
  });
  const amount = scan.amount != null ? String(scan.amount) : "";
  const debitLedger = expenseCategoryToLedger(scan.category_hint);
  const creditLedger = paymentModeToLedger(
    (scan.payment_mode || "Cash").toUpperCase() === "CASH" ? "CASH" : "BANK"
  );

  const formFields = {
    VoucherDate: scan.receipt_date || "",
    Narration: scan.narration || scan.description || "",
    OnAccountOf: scan.description || scan.invoice_no || "",
    ...(payeeCo
      ? mergeNonEmpty(mapCompanyToPayeeFields(payeeCo), {
          PayeeName: scan.vendor_name || payeeCo.name,
          PayeeGstin: scan.vendor_gstin || payeeCo.gst,
        })
      : {
          PayeeType: "COMPANY",
          PayeeName: scan.vendor_name || "",
          PayeeAddress: scan.vendor_address || "",
          PayeeGstin: scan.vendor_gstin || "",
        }),
  };

  return {
    formFields,
    debitLedgers: amount ? [{ LedgerName: debitLedger, Amount: amount }] : [emptyLedger()],
    creditLedgers: amount ? [{ LedgerName: creditLedger, Amount: amount }] : [emptyLedger()],
    summary: {
      amount: scan.amount,
      date: scan.receipt_date,
      vendor: scan.vendor_name,
      category: scan.category_hint,
    },
  };
};

export const scanAndMapExpenseReceipt = async (file, companies) => {
  const extracted = await scanExpenseReceipt(file);
  return mapScannedReceiptToJournalForm(extracted, companies);
};
