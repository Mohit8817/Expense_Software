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
  paymentModeToLedger,
} from "./aiScanUtils";

const api = createVoucherApi("paymentvoucher");

export const getAllPaymentVouchers = api.getAll;
export const getPaymentVoucherById = api.getById;
export const createPaymentVoucher = api.create;
export const updatePaymentVoucher = api.update;
export const deletePaymentVoucher = api.remove;
export const approvePaymentVoucher = api.approve;
export const rejectPaymentVoucher = api.reject;
export const pushPaymentVoucherToTally = api.pushToTally;
export const retryPaymentVoucherTallyPush = api.retryTallyPush;

export const PAYMENT_TYPES = [
  { value: "GENERAL", label: "General Payment" },
  { value: "FULL", label: "Full Payment" },
  { value: "PARTIAL", label: "Partial Payment" },
  { value: "ADVANCE", label: "Advance Payment" },
  { value: "ON_ACCOUNT", label: "On Account" },
  { value: "JOURNAL_SETTLEMENT", label: "Journal Voucher Settlement" },
];

export const PAYMENT_MODES = [
  { value: "CASH", label: "Cash" },
  { value: "BANK", label: "Bank Transfer" },
  { value: "UPI", label: "UPI" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "NEFT", label: "NEFT" },
  { value: "RTGS", label: "RTGS" },
];

export const DOCUMENT_TYPES = [
  { value: "SALES", label: "Sales Invoice" },
  { value: "PURCHASE", label: "Purchase Invoice" },
  { value: "JOURNAL", label: "Journal Voucher" },
  { value: "CREDIT_NOTE", label: "Credit Note" },
  { value: "DEBIT_NOTE", label: "Debit Note" },
  { value: "DELIVERY_CHALLAN", label: "Delivery Challan" },
];

export const emptyLedger = () => ({ LedgerName: "", Amount: "" });

export const emptyAllocation = () => ({
  documentType: "",
  documentId: "",
  documentNo: "",
  documentAmount: "",
  paidAmount: "",
  allocationType: "PARTIAL",
  remarks: "",
});

const BASE_URL = import.meta.env.VITE_BACKEND_API_URL;
const getToken = () => localStorage.getItem("token");
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

export const getPaymentLinkOptions = async (type) => {
  const res = await fetch(`${BASE_URL}paymentvoucher/links/options?type=${type}`, {
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to load documents");
  return data;
};

export const getPaymentLinkDocument = async (type, id, excludePaymentId) => {
  const params = excludePaymentId ? `?excludePaymentId=${excludePaymentId}` : "";
  const res = await fetch(`${BASE_URL}paymentvoucher/links/${type}/${id}${params}`, {
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Document not found");
  return data;
};

export const mapCompanyToPartyFields = (company) => ({
  PartyCompanyId: String(company.id),
  PartyName: company.name || "",
  PartyAddress: formatCompanyAddress(company),
  PartyGstin: company.gst || "",
});

export const mapCompanyToFromFields = (company) => ({
  FromCompanyId: String(company.id),
  FromCompanyName: company.name || "",
  FromCompanyAddress: formatCompanyAddress(company),
  FromCompanyGstin: company.gst || "",
});

export const mapEmployeeToPartyFields = (employee) => ({
  PayeeType: "EMPLOYEE",
  PartyCompanyId: "",
  PartyName: employee.username || "",
  PartyAddress: "",
  PartyGstin: "",
  PayeeEmployeeId: String(employee.id),
  PayeeDesignation: employee.designation || "",
  PayeeEmail: employee.email || "",
});

export const PAYEE_TYPES = [
  { value: "COMPANY", label: "Company" },
  { value: "EMPLOYEE", label: "Employee" },
];

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

export const mapPaymentVoucherToList = (pv) => ({
  id: pv.id,
  voucher_no: pv.voucher_no,
  voucher_date: formatDate(pv.voucher_date),
  payment_type: pv.payment_type,
  payment_mode: pv.payment_mode,
  from_company_name: pv.from_company_name || "",
  party_name: pv.party_name || "",
  payee_type: pv.payee_type || "COMPANY",
  party_flow:
    pv.from_company_name && pv.party_name
      ? `${pv.from_company_name} → ${pv.party_name}`
      : pv.party_name || pv.from_company_name,
  narration: pv.narration || "",
  linked_document_no: pv.linked_document_no || "",
  amount: Number(pv.total_amount) || 0,
  ItemCount: (Array.isArray(pv.entries) ? pv.entries.length : 0) + (Array.isArray(pv.allocations) ? pv.allocations.length : 0),
  status: approvalToStatus(pv.approval_status),
  approval_status: pv.approval_status,
  tally_push_status: pv.tally_push_status,
  tallyLabel: tallyToLabel(pv.tally_push_status),
  raw: pv,
});

export const mapPaymentVoucherToForm = (pv) => ({
  VoucherNo: pv.voucher_no || "",
  VoucherDate: formatDate(pv.voucher_date),
  PaymentType: pv.payment_type || "GENERAL",
  PaymentMode: pv.payment_mode || "BANK",
  Narration: pv.narration || "",
  OnAccountOf: pv.on_account_of || "",
  FromCompanyId: pv.from_company_id ? String(pv.from_company_id) : "",
  FromCompanyName: pv.from_company_name || "",
  FromCompanyAddress: pv.from_company_address || "",
  FromCompanyGstin: pv.from_company_gstin || "",
  PayeeType: pv.payee_type || "COMPANY",
  PayeeEmployeeId: pv.payee_employee_id ? String(pv.payee_employee_id) : "",
  PayeeDesignation: "",
  PayeeEmail: "",
  PartyCompanyId: pv.party_company_id ? String(pv.party_company_id) : "",
  PartyName: pv.party_name || "",
  PartyGstin: pv.party_gstin || "",
  PartyAddress: pv.party_address || "",
  JournalVoucherId: pv.journal_voucher_id ? String(pv.journal_voucher_id) : "",
  LinkedDocumentType: pv.linked_document_type || "",
  LinkedDocumentId: pv.linked_document_id ? String(pv.linked_document_id) : "",
  LinkedDocumentNo: pv.linked_document_no || "",
  LinkedDocumentAmount: pv.linked_document_amount != null ? String(pv.linked_document_amount) : "",
  BankAccountId: pv.bank_account_id ? String(pv.bank_account_id) : "",
  BankName: pv.bank_name || "",
  BankAccountNo: pv.bank_account_no || "",
  BankIfsc: pv.bank_ifsc || "",
  ReferenceNo: pv.reference_no || "",
  ChequeNo: pv.cheque_no || "",
  ChequeDate: formatDate(pv.cheque_date),
  AuthorisedSignatoryName: pv.authorised_signatory_name || "",
  AuthorisedSignatoryDesignation: pv.authorised_signatory_designation || "",
  Allocations: (pv.allocations || []).map((a) => ({
    documentType: a.document_type,
    documentId: String(a.document_id),
    documentNo: a.document_no || "",
    documentAmount: a.document_amount != null ? String(a.document_amount) : "",
    paidAmount: a.paid_amount != null ? String(a.paid_amount) : "",
    allocationType: a.allocation_type || "PARTIAL",
    remarks: a.remarks || "",
  })),
  ...splitEntries(pv.entries),
  status: approvalToStatus(pv.approval_status),
  approval_status: pv.approval_status,
  tally_push_status: pv.tally_push_status,
  tallyLabel: tallyToLabel(pv.tally_push_status),
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

export const mapFormToPayload = (formData, debitLedgers, creditLedgers, allocations = []) => {
  const debitTotal = debitLedgers.reduce((sum, row) => sum + parseNonNegative(row.Amount), 0);

  return {
    voucher_no: formData.VoucherNo || `PV-${Date.now()}`,
    voucher_date: toDate(formData.VoucherDate),
    payment_type: formData.PaymentType || "GENERAL",
    payment_mode: formData.PaymentMode || "BANK",
    narration: formData.Narration || null,
    on_account_of: formData.OnAccountOf || null,
    from_company_id: formData.FromCompanyId ? Number(formData.FromCompanyId) : null,
    from_company_name: formData.FromCompanyName || null,
    from_company_address: formData.FromCompanyAddress || null,
    from_company_gstin: formData.FromCompanyGstin || null,
    payee_type: formData.PayeeType || "COMPANY",
    payee_employee_id:
      formData.PayeeType === "EMPLOYEE" && formData.PayeeEmployeeId
        ? Number(formData.PayeeEmployeeId)
        : null,
    party_company_id:
      formData.PayeeType === "COMPANY" && formData.PartyCompanyId
        ? Number(formData.PartyCompanyId)
        : null,
    party_name: formData.PartyName || null,
    party_gstin: formData.PartyGstin || null,
    party_address: formData.PartyAddress || null,
    journal_voucher_id: formData.JournalVoucherId ? Number(formData.JournalVoucherId) : null,
    linked_document_type: formData.LinkedDocumentType || null,
    linked_document_id: formData.LinkedDocumentId ? Number(formData.LinkedDocumentId) : null,
    linked_document_no: formData.LinkedDocumentNo || null,
    linked_document_amount: formData.LinkedDocumentAmount ? parseNonNegative(formData.LinkedDocumentAmount) : null,
    bank_account_id: formData.BankAccountId ? Number(formData.BankAccountId) : null,
    bank_name: formData.BankName || null,
    bank_account_no: formData.BankAccountNo || null,
    bank_ifsc: formData.BankIfsc || null,
    reference_no: formData.ReferenceNo || null,
    cheque_no: formData.ChequeNo || null,
    cheque_date: formData.ChequeDate ? toDate(formData.ChequeDate) : null,
    authorised_signatory_name: formData.AuthorisedSignatoryName || null,
    authorised_signatory_designation: formData.AuthorisedSignatoryDesignation || null,
    entries: mapLedgersToEntries(debitLedgers, creditLedgers),
    allocations: allocations
      .filter((a) => a.documentType && a.documentId && parseNonNegative(a.paidAmount) > 0)
      .map((a) => ({
        document_type: a.documentType,
        document_id: Number(a.documentId),
        document_no: a.documentNo || null,
        document_amount: parseNonNegative(a.documentAmount),
        paid_amount: parseNonNegative(a.paidAmount),
        allocation_type: a.allocationType || "PARTIAL",
        remarks: a.remarks || null,
      })),
    total_debit: debitTotal,
    total_credit: debitTotal,
    total_amount: debitTotal,
  };
};

export const paymentTypeLabel = (value) =>
  PAYMENT_TYPES.find((t) => t.value === value)?.label || value;

export const paymentModeLabel = (value) =>
  PAYMENT_MODES.find((m) => m.value === value)?.label || value;

export const scanPaymentReceipt = async (file) =>
  uploadDocumentForScan("paymentvoucher/scan-receipt", file);

export const mapScannedReceiptToPaymentForm = (scan, companies = []) => {
  const payeeCo = findCompanyByParty(companies, { name: scan.payee_name, gstin: scan.payee_gstin });
  const payerCo = findCompanyByParty(companies, { name: scan.payer_name });
  const amount = scan.amount != null ? String(scan.amount) : "";

  const formFields = {
    VoucherDate: scan.payment_date || "",
    PaymentMode: scan.payment_mode || "BANK",
    ReferenceNo: scan.reference_no || "",
    ChequeNo: scan.cheque_no || "",
    ChequeDate: scan.cheque_date || "",
    Narration: scan.narration || "",
    OnAccountOf: scan.on_account_of || scan.invoice_reference || "",
    BankName: scan.bank_name || "",
    BankAccountNo: scan.account_no || "",
    BankIfsc: scan.ifsc || "",
    PartyName: scan.payee_name || "",
    ...(payerCo ? mapCompanyToFromFields(payerCo) : {}),
    ...(payeeCo
      ? mergeNonEmpty(mapCompanyToPartyFields(payeeCo), { PartyName: scan.payee_name || "" })
      : { PartyName: scan.payee_name || "" }),
  };

  const creditLedger = paymentModeToLedger(scan.payment_mode);
  const debitLedger = scan.payee_name || "Sundry Creditors";

  return {
    formFields,
    debitLedgers: amount ? [{ LedgerName: debitLedger, Amount: amount }] : [emptyLedger()],
    creditLedgers: amount ? [{ LedgerName: creditLedger, Amount: amount }] : [emptyLedger()],
    summary: {
      amount: scan.amount,
      date: scan.payment_date,
      reference: scan.reference_no,
      mode: scan.payment_mode,
    },
  };
};

export const scanAndMapPaymentReceipt = async (file, companies) => {
  const extracted = await scanPaymentReceipt(file);
  return mapScannedReceiptToPaymentForm(extracted, companies);
};
