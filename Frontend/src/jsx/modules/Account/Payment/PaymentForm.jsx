import React, { useEffect, useState } from "react";
import { Table } from "react-bootstrap";
import { toast } from "react-toastify";
import { getAllCompanies } from "../companyApi";
import { getCompanyById } from "../companyApi";
import {
  createPaymentVoucher,
  updatePaymentVoucher,
  mapFormToPayload,
  mapCompanyToPartyFields,
  mapCompanyToFromFields,
  mapEmployeeToPartyFields,
  PAYEE_TYPES,
  emptyLedger,
  emptyAllocation,
  PAYMENT_TYPES,
  PAYMENT_MODES,
  DOCUMENT_TYPES,
  paymentModeLabel,
  scanAndMapPaymentReceipt,
} from "../paymentVoucherApi";
import AiDocumentScanner from "../vouchers/shared/AiDocumentScanner";
import { getAllEmployees } from "../../Employee/employeeApi";
import { mapJournalVoucherToForm } from "../journalVoucherApi";
import PaymentSourcePicker from "./PaymentSourcePicker";
import BankAccountSelect from "../BankAccountSelect";
import { NonNegativeNumberInput } from "../vouchers/shared/voucherFormUi";
import { FormSection, FormActions, TextField } from "../vouchers/shared/voucherFormUi";
import { sanitizeNonNegativeInput, finalizeNonNegativeInput } from "../vouchers/shared/numberInputUtils";
import { formatMoney } from "../accountDashboardApi";

const ledgerOptions = [
  "Sundry Creditors",
  "Sundry Debtors",
  "Salary Payable",
  "Rent Payable",
  "Purchase Account",
  "Sales Account",
  "Advance to Supplier",
  "Advance from Customer",
  "HDFC Bank",
  "ICICI Bank",
  "Cash",
  "UPI",
];

const PaymentForm = ({ documentId, voucherId, initialData, onDataChange, onClose, onSaved }) => {
  const editId = documentId ?? voucherId;
  const [submitting, setSubmitting] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [docBalance, setDocBalance] = useState(null);

  const [formData, setFormData] = useState({
    VoucherNo: initialData?.VoucherNo || "",
    VoucherDate: initialData?.VoucherDate || "",
    PaymentType: initialData?.PaymentType || "GENERAL",
    PaymentMode: initialData?.PaymentMode || "BANK",
    Narration: initialData?.Narration || "",
    OnAccountOf: initialData?.OnAccountOf || "",
    FromCompanyId: initialData?.FromCompanyId || "",
    FromCompanyName: initialData?.FromCompanyName || "",
    FromCompanyAddress: initialData?.FromCompanyAddress || "",
    FromCompanyGstin: initialData?.FromCompanyGstin || "",
    PayeeType: initialData?.PayeeType || "COMPANY",
    PayeeEmployeeId: initialData?.PayeeEmployeeId || "",
    PayeeDesignation: initialData?.PayeeDesignation || "",
    PayeeEmail: initialData?.PayeeEmail || "",
    PartyCompanyId: initialData?.PartyCompanyId || "",
    PartyName: initialData?.PartyName || "",
    PartyGstin: initialData?.PartyGstin || "",
    PartyAddress: initialData?.PartyAddress || "",
    LinkedDocumentType: initialData?.LinkedDocumentType || "",
    LinkedDocumentId: initialData?.LinkedDocumentId || "",
    LinkedDocumentNo: initialData?.LinkedDocumentNo || "",
    LinkedDocumentAmount: initialData?.LinkedDocumentAmount || "",
    JournalVoucherId: initialData?.JournalVoucherId || "",
    BankAccountId: initialData?.BankAccountId || "",
    BankName: initialData?.BankName || "",
    BankAccountNo: initialData?.BankAccountNo || "",
    BankIfsc: initialData?.BankIfsc || "",
    ReferenceNo: initialData?.ReferenceNo || "",
    ChequeNo: initialData?.ChequeNo || "",
    ChequeDate: initialData?.ChequeDate || "",
    AuthorisedSignatoryName: initialData?.AuthorisedSignatoryName || "",
    AuthorisedSignatoryDesignation: initialData?.AuthorisedSignatoryDesignation || "",
  });

  const [debitLedgers, setDebitLedgers] = useState(
    initialData?.DebitLedgers?.length ? initialData.DebitLedgers : [emptyLedger()]
  );
  const [creditLedgers, setCreditLedgers] = useState(
    initialData?.CreditLedgers?.length ? initialData.CreditLedgers : [emptyLedger()]
  );
  const [allocations, setAllocations] = useState(
    initialData?.Allocations?.length ? initialData.Allocations : [emptyAllocation()]
  );

  useEffect(() => {
    getAllCompanies()
      .then((list) => setCompanies(Array.isArray(list) ? list : []))
      .catch(() => toast.error("Failed to load companies"));
    getAllEmployees()
      .then((list) => setEmployees(Array.isArray(list) ? list : []))
      .catch(() => toast.error("Failed to load employees"));
  }, []);

  const loadBanks = async (companyId) => {
    if (!companyId) {
      setBankAccounts([]);
      return;
    }
    try {
      const company = await getCompanyById(companyId);
      setBankAccounts(Array.isArray(company?.bank_accounts) ? company.bank_accounts : []);
    } catch {
      setBankAccounts([]);
    }
  };

  useEffect(() => {
    if (formData.FromCompanyId) loadBanks(formData.FromCompanyId);
  }, [formData.FromCompanyId]);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFromCompanySelect = (companyId) => {
    if (!companyId) {
      setFormData((prev) => ({
        ...prev,
        FromCompanyId: "",
        FromCompanyName: "",
        FromCompanyAddress: "",
        FromCompanyGstin: "",
        BankAccountId: "",
        BankName: "",
        BankAccountNo: "",
        BankIfsc: "",
      }));
      setBankAccounts([]);
      return;
    }
    const company = companies.find((c) => String(c.id) === String(companyId));
    if (!company) return;
    setFormData((prev) => ({ ...prev, ...mapCompanyToFromFields(company) }));
    loadBanks(companyId);
  };

  const clearPartyFields = () => ({
    PartyCompanyId: "",
    PartyName: "",
    PartyGstin: "",
    PartyAddress: "",
    PayeeEmployeeId: "",
    PayeeDesignation: "",
    PayeeEmail: "",
  });

  const handlePayeeTypeChange = (payeeType) => {
    setFormData((prev) => ({ ...prev, PayeeType: payeeType, ...clearPartyFields() }));
  };

  const handlePartySelect = (companyId) => {
    if (!companyId) {
      setFormData((prev) => ({ ...prev, ...clearPartyFields() }));
      return;
    }
    const company = companies.find((c) => String(c.id) === String(companyId));
    if (!company) return;
    setFormData((prev) => ({ ...prev, PayeeType: "COMPANY", ...mapCompanyToPartyFields(company) }));
  };

  const handleEmployeeSelect = (employeeId) => {
    if (!employeeId) {
      setFormData((prev) => ({ ...prev, ...clearPartyFields() }));
      return;
    }
    const employee = employees.find((e) => String(e.id) === String(employeeId));
    if (!employee) return;
    setFormData((prev) => ({ ...prev, ...mapEmployeeToPartyFields(employee) }));
  };

  const handleBankSelect = (bankId) => {
    const bank = bankAccounts.find((b) => String(b.id) === String(bankId));
    if (!bank) {
      setFormData((prev) => ({
        ...prev,
        BankAccountId: "",
        BankName: "",
        BankAccountNo: "",
        BankIfsc: "",
      }));
      return;
    }
    const label = `${bank.bank_name} - ${bank.ac_no}`;
    setFormData((prev) => ({
      ...prev,
      BankAccountId: String(bank.id),
      BankName: bank.bank_name || "",
      BankAccountNo: bank.ac_no || "",
      BankIfsc: bank.ifsc_code || "",
    }));
    setCreditLedgers((prev) => {
      const debitSum = debitLedgers.reduce((s, l) => s + (parseFloat(l.Amount) || 0), 0);
      const updated = [...prev];
      updated[0] = {
        ...updated[0],
        LedgerName: label,
        Amount: updated[0].Amount || (debitSum > 0 ? String(debitSum) : ""),
      };
      return updated;
    });
  };

  const handleSourceApply = (linkData) => {
    setDocBalance(linkData);
    const party = linkData.party || {};
    const payType =
      linkData.document_type === "JOURNAL"
        ? "JOURNAL_SETTLEMENT"
        : linkData.balance_amount < linkData.document_amount
          ? "PARTIAL"
          : "FULL";

    setFormData((prev) => ({
      ...prev,
      PaymentType: payType,
      LinkedDocumentType: linkData.document_type,
      LinkedDocumentId: String(linkData.document_id),
      LinkedDocumentNo: linkData.document_no,
      LinkedDocumentAmount: String(linkData.document_amount),
      JournalVoucherId: linkData.document_type === "JOURNAL" ? String(linkData.document_id) : prev.JournalVoucherId,
      PartyCompanyId: party.companyId ? String(party.companyId) : prev.PartyCompanyId,
      PartyName: party.name || prev.PartyName,
      PartyGstin: party.gstin || prev.PartyGstin,
      PartyAddress: party.address || prev.PartyAddress,
      PayeeType: party.employeeId ? "EMPLOYEE" : "COMPANY",
      PayeeEmployeeId: party.employeeId ? String(party.employeeId) : "",
      Narration: prev.Narration || `Payment against ${linkData.document_no}`,
    }));

    const payAmount = linkData.balance_amount > 0 ? linkData.balance_amount : linkData.document_amount;
    const partyLedger = party.name || linkData.document_no;

    setDebitLedgers([{ LedgerName: partyLedger, Amount: String(payAmount) }]);
    setCreditLedgers([{
      LedgerName: formData.BankName || paymentModeLabel(formData.PaymentMode),
      Amount: String(payAmount),
    }]);

    setAllocations([
      {
        documentType: linkData.document_type,
        documentId: String(linkData.document_id),
        documentNo: linkData.document_no,
        documentAmount: String(linkData.document_amount),
        paidAmount: String(payAmount),
        allocationType: payType === "FULL" ? "FULL" : payType === "ADVANCE" ? "ADVANCE" : "PARTIAL",
        remarks: "",
      },
    ]);

    if (linkData.document_type === "JOURNAL" && linkData.raw) {
      const jv = mapJournalVoucherToForm(linkData.raw);
      if (jv.DebitLedgers?.length) setDebitLedgers(jv.DebitLedgers);
      if (jv.CreditLedgers?.length) setCreditLedgers(jv.CreditLedgers);
    }
  };

  const handleDebitChange = (index, field, value) => {
    setDebitLedgers((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: field === "Amount" ? sanitizeNonNegativeInput(value) : value,
      };
      return updated;
    });
  };

  const handleCreditChange = (index, field, value) => {
    setCreditLedgers((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: field === "Amount" ? sanitizeNonNegativeInput(value) : value,
      };
      return updated;
    });
  };

  const handleAllocationChange = (index, field, value) => {
    setAllocations((prev) => {
      const updated = [...prev];
      const nextValue =
        field === "documentAmount" || field === "paidAmount"
          ? sanitizeNonNegativeInput(value)
          : value;
      updated[index] = { ...updated[index], [field]: nextValue };
      return updated;
    });
  };

  const debitTotal = debitLedgers.reduce((sum, l) => sum + (parseFloat(l.Amount) || 0), 0);
  const creditTotal = creditLedgers.reduce((sum, l) => sum + (parseFloat(l.Amount) || 0), 0);
  const difference = debitTotal - creditTotal;
  const isBalanced = debitTotal > 0 && Math.abs(difference) < 0.001;

  useEffect(() => {
    if (!onDataChange) return;
    onDataChange({
      ...formData,
      Amount: debitTotal,
      DebitLedgers: debitLedgers,
      CreditLedgers: creditLedgers,
      Allocations: allocations,
      DocBalance: docBalance,
      isBalanced,
      status: initialData?.status || "Draft",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, debitLedgers, creditLedgers, allocations, debitTotal, docBalance, isBalanced]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.VoucherNo) {
      toast.error("Voucher No is required");
      return;
    }
    if (!formData.FromCompanyName) {
      toast.error("Please select pay-from company");
      return;
    }
    if (!formData.PartyName) {
      toast.error("Please select pay-to company or employee");
      return;
    }
    if (!isBalanced) {
      toast.error("Debit and credit totals must be equal");
      return;
    }

    try {
      setSubmitting(true);
      const payload = mapFormToPayload(formData, debitLedgers, creditLedgers, allocations);
      const result = editId
        ? await updatePaymentVoucher(editId, payload)
        : await createPaymentVoucher(payload);
      toast.success(editId ? "Payment voucher updated" : "Payment voucher created");
      if (onSaved) onSaved(editId || result?.data?.id);
    } catch (error) {
      toast.error(error.message || "Failed to save payment voucher");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyScan = (scanned) => {
    setFormData((prev) => ({ ...prev, ...scanned.formFields }));
    setDebitLedgers(scanned.debitLedgers);
    setCreditLedgers(scanned.creditLedgers);
    if (scanned.formFields.FromCompanyId) {
      loadBanks(scanned.formFields.FromCompanyId);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <AiDocumentScanner
        title="AI Payment Receipt Scan"
        badge="UPI / bank / cheque proof"
        description="Upload a payment receipt, UPI screenshot, or bank confirmation — AI fills amount, date, reference, and ledger entries."
        scanFile={(file) => scanAndMapPaymentReceipt(file, companies)}
        onApply={handleApplyScan}
        disabled={submitting}
        renderPreview={(preview) => (
          <div className="row g-2 small">
            <div className="col-md-3">
              <span className="text-muted">Amount</span>
              <div className="fw-medium">
                {preview.summary?.amount != null
                  ? `\u20b9${Number(preview.summary.amount).toLocaleString("en-IN")}`
                  : "—"}
              </div>
            </div>
            <div className="col-md-3">
              <span className="text-muted">Date</span>
              <div className="fw-medium">{preview.summary?.date || "—"}</div>
            </div>
            <div className="col-md-3">
              <span className="text-muted">Reference</span>
              <div className="fw-medium text-truncate">{preview.summary?.reference || "—"}</div>
            </div>
            <div className="col-md-3">
              <span className="text-muted">Mode</span>
              <div className="fw-medium">{preview.summary?.mode || "—"}</div>
            </div>
          </div>
        )}
      />

      <FormSection title="Payment Details" icon="fa fa-money-bill-transfer">
        <div className="row">
          <TextField label="Voucher No" name="VoucherNo" value={formData.VoucherNo} onChange={handleFieldChange} />
          <TextField label="Voucher Date" name="VoucherDate" type="date" value={formData.VoucherDate} onChange={handleFieldChange} />
          <div className="col-md-4 mb-3">
            <label className="form-label">Payment Type</label>
            <select name="PaymentType" className="form-control" value={formData.PaymentType} onChange={handleFieldChange}>
              {PAYMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">Payment Mode</label>
            <select name="PaymentMode" className="form-control" value={formData.PaymentMode} onChange={handleFieldChange}>
              {PAYMENT_MODES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <TextField label="Narration" name="Narration" value={formData.Narration} onChange={handleFieldChange} />
          <TextField label="On Account Of" name="OnAccountOf" value={formData.OnAccountOf} onChange={handleFieldChange} />
          <TextField label="Reference No" name="ReferenceNo" value={formData.ReferenceNo} onChange={handleFieldChange} />
          {formData.PaymentMode === "CHEQUE" && (
            <>
              <TextField label="Cheque No" name="ChequeNo" value={formData.ChequeNo} onChange={handleFieldChange} />
              <TextField label="Cheque Date" name="ChequeDate" type="date" value={formData.ChequeDate} onChange={handleFieldChange} />
            </>
          )}
        </div>
      </FormSection>

      <FormSection title="Link Source Document" icon="fa fa-link">
        <PaymentSourcePicker
          documentType={formData.LinkedDocumentType}
          onDocumentTypeChange={(type) => setFormData((prev) => ({ ...prev, LinkedDocumentType: type }))}
          onApply={handleSourceApply}
          excludePaymentId={editId}
        />
        {formData.LinkedDocumentNo && (
          <div className="small text-muted">
            Linked: <strong>{formData.LinkedDocumentNo}</strong>
            {formData.LinkedDocumentAmount ? ` · ${formatMoney(formData.LinkedDocumentAmount)}` : ""}
          </div>
        )}
      </FormSection>

      <FormSection title="Pay From (Company & Bank)" icon="fa fa-building-columns">
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Pay From Company</label>
            <select className="form-control" value={formData.FromCompanyId} onChange={(e) => handleFromCompanySelect(e.target.value)}>
              <option value="">Select Company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-6 mb-3">
            <BankAccountSelect
              label="Pay From Bank Account"
              accounts={bankAccounts}
              value={formData.BankAccountId}
              onChange={handleBankSelect}
            />
          </div>
        </div>
        {formData.FromCompanyName && (
          <div className="border rounded account-muted-surface p-3 small">
            <div className="fw-bold">{formData.FromCompanyName}</div>
            <div className="text-muted">{formData.FromCompanyAddress}</div>
            {formData.FromCompanyGstin && <div className="text-muted">GSTIN: {formData.FromCompanyGstin}</div>}
          </div>
        )}
      </FormSection>

      <FormSection title="Pay To (Company or Employee)" icon="fa fa-user-group">
        <div className="row">
          <div className="col-md-4 mb-3">
            <label className="form-label">Payee Type</label>
            <select className="form-control" value={formData.PayeeType} onChange={(e) => handlePayeeTypeChange(e.target.value)}>
              {PAYEE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          {formData.PayeeType === "COMPANY" ? (
            <div className="col-md-8 mb-3">
              <label className="form-label">Pay To Company</label>
              <select className="form-control" value={formData.PartyCompanyId} onChange={(e) => handlePartySelect(e.target.value)}>
                <option value="">Select Company</option>
                {companies
                  .filter((c) => String(c.id) !== String(formData.FromCompanyId))
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>
          ) : (
            <div className="col-md-8 mb-3">
              <label className="form-label">Pay To Employee</label>
              <select className="form-control" value={formData.PayeeEmployeeId} onChange={(e) => handleEmployeeSelect(e.target.value)}>
                <option value="">Select Employee</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.username} {e.designation ? `(${e.designation})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {formData.PartyName && (
          <div className="border rounded account-muted-surface p-3 small">
            <div className="fw-bold">{formData.PartyName}</div>
            {formData.PayeeType === "COMPANY" ? (
              <>
                <div className="text-muted">{formData.PartyAddress}</div>
                {formData.PartyGstin && <div className="text-muted">GSTIN: {formData.PartyGstin}</div>}
              </>
            ) : (
              <div className="text-muted">
                {formData.PayeeDesignation || "Employee"}
                {formData.PayeeEmail ? ` · ${formData.PayeeEmail}` : ""}
              </div>
            )}
          </div>
        )}
      </FormSection>

      <FormSection title="Payment Allocations" icon="fa fa-list-check">
        <p className="small text-muted">Use for partial, advance, or multi-document payments.</p>
        <Table bordered responsive size="sm">
          <thead>
            <tr>
              <th>Doc Type</th>
              <th>Doc No</th>
              <th>Doc Amount</th>
              <th>Paid Now</th>
              <th>Type</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {allocations.map((row, index) => (
              <tr key={index}>
                <td>
                  <select className="form-control form-control-sm" value={row.documentType} onChange={(e) => handleAllocationChange(index, "documentType", e.target.value)}>
                    <option value="">—</option>
                    {DOCUMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </td>
                <td><input className="form-control form-control-sm" value={row.documentNo} onChange={(e) => handleAllocationChange(index, "documentNo", e.target.value)} /></td>
                <td><NonNegativeNumberInput value={row.documentAmount} onChange={(v) => handleAllocationChange(index, "documentAmount", v)} /></td>
                <td><NonNegativeNumberInput value={row.paidAmount} onChange={(v) => handleAllocationChange(index, "paidAmount", v)} /></td>
                <td>
                  <select className="form-control form-control-sm" value={row.allocationType} onChange={(e) => handleAllocationChange(index, "allocationType", e.target.value)}>
                    <option value="FULL">Full</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="ADVANCE">Advance</option>
                    <option value="ON_ACCOUNT">On Account</option>
                  </select>
                </td>
                <td>
                  {allocations.length > 1 && (
                    <button type="button" className="btn btn-sm btn-light text-danger" onClick={() => setAllocations((p) => p.filter((_, i) => i !== index))}>
                      <i className="fa fa-trash"></i>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setAllocations((p) => [...p, emptyAllocation()])}>
          + Add Allocation
        </button>
      </FormSection>

      <FormSection title="Debit (Paid To)" icon="fa fa-arrow-down">
        <Table bordered responsive className="mb-2">
          <thead><tr><th>#</th><th>Ledger</th><th>Amount</th><th></th></tr></thead>
          <tbody>
            {debitLedgers.map((l, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
                  <select className="form-control" value={l.LedgerName} onChange={(e) => handleDebitChange(index, "LedgerName", e.target.value)}>
                    <option value="">Select</option>
                    {ledgerOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
                <td><NonNegativeNumberInput value={l.Amount} onChange={(v) => handleDebitChange(index, "Amount", v)} onBlur={() => handleDebitChange(index, "Amount", finalizeNonNegativeInput(l.Amount))} /></td>
                <td>{debitLedgers.length > 1 && <button type="button" className="btn btn-sm btn-light text-danger" onClick={() => setDebitLedgers((p) => p.filter((_, i) => i !== index))}><i className="fa fa-trash"></i></button>}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <button type="button" className="btn btn-outline-primary btn-sm mb-0" onClick={() => setDebitLedgers((p) => [...p, emptyLedger()])}>+ Add Debit</button>
      </FormSection>

      <FormSection title="Credit (Paid From)" icon="fa fa-arrow-up">
        <Table bordered responsive className="mb-2">
          <thead><tr><th>#</th><th>Ledger</th><th>Amount</th><th></th></tr></thead>
          <tbody>
            {creditLedgers.map((l, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
                  <select className="form-control" value={l.LedgerName} onChange={(e) => handleCreditChange(index, "LedgerName", e.target.value)}>
                    <option value="">Select</option>
                    {ledgerOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
                <td><NonNegativeNumberInput value={l.Amount} onChange={(v) => handleCreditChange(index, "Amount", v)} /></td>
                <td>{creditLedgers.length > 1 && <button type="button" className="btn btn-sm btn-light text-danger" onClick={() => setCreditLedgers((p) => p.filter((_, i) => i !== index))}><i className="fa fa-trash"></i></button>}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <button type="button" className="btn btn-outline-primary btn-sm mb-0" onClick={() => setCreditLedgers((p) => [...p, emptyLedger()])}>+ Add Credit</button>
      </FormSection>

      <FormSection title="Signatory" icon="fa fa-signature">
        <div className="row">
          <TextField label="Authorised Signatory" name="AuthorisedSignatoryName" value={formData.AuthorisedSignatoryName} onChange={handleFieldChange} />
          <TextField label="Designation" name="AuthorisedSignatoryDesignation" value={formData.AuthorisedSignatoryDesignation} onChange={handleFieldChange} />
        </div>
      </FormSection>

      <div className="text-end mb-3">
        <h6>Debit: {debitTotal.toFixed(2)} · Credit: {creditTotal.toFixed(2)}</h6>
        <h5 className={isBalanced ? "text-success" : "text-danger"}>
          {isBalanced ? `Balanced · ${formatMoney(debitTotal)}` : `Difference: ${difference.toFixed(2)}`}
        </h5>
      </div>

      <FormActions submitting={submitting} editId={editId} saveLabel="Payment Voucher" onClose={onClose} />
    </form>
  );
};

export default PaymentForm;
