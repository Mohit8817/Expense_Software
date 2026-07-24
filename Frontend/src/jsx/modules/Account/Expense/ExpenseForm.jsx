import React, { useEffect, useState } from "react";
import { Table } from "react-bootstrap";
import { toast } from "react-toastify";
import { getAllCompanies } from "../companyApi";
import {
  createJournalVoucher,
  updateJournalVoucher,
  mapFormToPayload,
  mapCompanyToJournalFields,
  mapCompanyToPayeeFields,
  mapEmployeeToPayeeFields,
  PAYEE_TYPES,
  emptyLedger,
  scanAndMapExpenseReceipt,
} from "../journalVoucherApi";
import AiDocumentScanner from "../vouchers/shared/AiDocumentScanner";
import { getAllEmployees } from "../../Employee/employeeApi";
import { NonNegativeNumberInput } from "../vouchers/shared/voucherFormUi";
import { FormSection, FormActions, TextField } from "../vouchers/shared/voucherFormUi";
import { sanitizeNonNegativeInput, finalizeNonNegativeInput } from "../vouchers/shared/numberInputUtils";

const ledgerOptions = [
  "Travelling Expenses",
  "Accomodation Charges",
  "Conveyance",
  "Office Expenses",
  "Cash",
  "Bank",
  "UPI",
  "Credit Card",
  "Sundry Creditors",
  "Sundry Debtors",
  "Purchase Account",
  "Sales Account",
];

const ExpenseForm = ({ documentId, voucherId, initialData, onDataChange, onClose, onSaved }) => {
  const editId = documentId ?? voucherId;
  const [submitting, setSubmitting] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [formData, setFormData] = useState({
    VoucherNo: initialData?.VoucherNo || "",
    VoucherDate: initialData?.VoucherDate || "",
    VoucherType: initialData?.VoucherType || "Journal Voucher",
    CompanyId: initialData?.CompanyId || "",
    CompanyName: initialData?.CompanyName || "",
    CompanyAddress: initialData?.CompanyAddress || "",
    CompanyState: initialData?.CompanyState || "",
    CompanyStateCode: initialData?.CompanyStateCode || "",
    CompanyCIN: initialData?.CompanyCIN || "",
    CompanyEmail: initialData?.CompanyEmail || "",
    PayeeType: initialData?.PayeeType || "COMPANY",
    PayeeCompanyId: initialData?.PayeeCompanyId || "",
    PayeeEmployeeId: initialData?.PayeeEmployeeId || "",
    PayeeName: initialData?.PayeeName || "",
    PayeeAddress: initialData?.PayeeAddress || "",
    PayeeState: initialData?.PayeeState || "",
    PayeeStateCode: initialData?.PayeeStateCode || "",
    PayeeGstin: initialData?.PayeeGstin || "",
    PayeeEmail: initialData?.PayeeEmail || "",
    PayeeDesignation: initialData?.PayeeDesignation || "",
    Narration: initialData?.Narration || "",
    OnAccountOf: initialData?.OnAccountOf || "",
    AuthorisedSignatoryName: initialData?.AuthorisedSignatoryName || "",
    AuthorisedSignatoryDesignation: initialData?.AuthorisedSignatoryDesignation || "",
  });

  const [debitLedgers, setDebitLedgers] = useState(
    initialData?.DebitLedgers?.length ? initialData.DebitLedgers : [emptyLedger()]
  );
  const [creditLedgers, setCreditLedgers] = useState(
    initialData?.CreditLedgers?.length ? initialData.CreditLedgers : [emptyLedger()]
  );

  useEffect(() => {
    getAllCompanies()
      .then((list) => setCompanies(Array.isArray(list) ? list : []))
      .catch(() => toast.error("Failed to load companies"));
    getAllEmployees()
      .then((list) => setEmployees(Array.isArray(list) ? list : []))
      .catch(() => toast.error("Failed to load employees"));
  }, []);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCompanySelect = (companyId) => {
    if (!companyId) {
      setFormData((prev) => ({
        ...prev,
        CompanyId: "",
        CompanyName: "",
        CompanyAddress: "",
        CompanyState: "",
        CompanyStateCode: "",
        CompanyCIN: "",
        CompanyEmail: "",
      }));
      return;
    }
    const company = companies.find((c) => String(c.id) === String(companyId));
    if (!company) return;
    setFormData((prev) => ({ ...prev, ...mapCompanyToJournalFields(company) }));
  };

  const clearPayeeFields = () => ({
    PayeeCompanyId: "",
    PayeeEmployeeId: "",
    PayeeName: "",
    PayeeAddress: "",
    PayeeState: "",
    PayeeStateCode: "",
    PayeeGstin: "",
    PayeeEmail: "",
    PayeeDesignation: "",
  });

  const handlePayeeTypeChange = (payeeType) => {
    setFormData((prev) => ({ ...prev, PayeeType: payeeType, ...clearPayeeFields() }));
  };

  const handlePayeeCompanySelect = (companyId) => {
    if (!companyId) {
      setFormData((prev) => ({ ...prev, ...clearPayeeFields() }));
      return;
    }
    const company = companies.find((c) => String(c.id) === String(companyId));
    if (!company) return;
    setFormData((prev) => ({ ...prev, PayeeType: "COMPANY", ...mapCompanyToPayeeFields(company) }));
  };

  const handlePayeeEmployeeSelect = (employeeId) => {
    if (!employeeId) {
      setFormData((prev) => ({ ...prev, ...clearPayeeFields() }));
      return;
    }
    const employee = employees.find((e) => String(e.id) === String(employeeId));
    if (!employee) return;
    setFormData((prev) => ({ ...prev, PayeeType: "EMPLOYEE", ...mapEmployeeToPayeeFields(employee) }));
  };

  const handleDebitChange = (index, field, value) => {
    setDebitLedgers((prev) => {
      const updated = [...prev];
      const nextValue = field === "Amount" ? sanitizeNonNegativeInput(value) : value;
      updated[index] = { ...updated[index], [field]: nextValue };
      return updated;
    });
  };

  const handleDebitBlur = (index) => {
    setDebitLedgers((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        Amount: finalizeNonNegativeInput(updated[index].Amount),
      };
      return updated;
    });
  };

  const handleCreditChange = (index, field, value) => {
    setCreditLedgers((prev) => {
      const updated = [...prev];
      const nextValue = field === "Amount" ? sanitizeNonNegativeInput(value) : value;
      updated[index] = { ...updated[index], [field]: nextValue };
      return updated;
    });
  };

  const handleCreditBlur = (index) => {
    setCreditLedgers((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        Amount: finalizeNonNegativeInput(updated[index].Amount),
      };
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
      DebitLedgers: debitLedgers,
      CreditLedgers: creditLedgers,
      TotalDebit: debitTotal,
      TotalCredit: creditTotal,
      status: initialData?.status || "Draft",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, debitLedgers, creditLedgers, debitTotal, creditTotal]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.VoucherNo) {
      toast.error("Voucher No is required");
      return;
    }
    if (!formData.CompanyName) {
      toast.error("Please select pay-from company");
      return;
    }
    if (!formData.PayeeName) {
      toast.error("Please select pay-to company or employee");
      return;
    }
    if (!isBalanced) {
      toast.error("Debit and credit totals must be equal before saving");
      return;
    }

    try {
      setSubmitting(true);
      const payload = mapFormToPayload(formData, debitLedgers, creditLedgers);
      const result = editId
        ? await updateJournalVoucher(editId, payload)
        : await createJournalVoucher(payload);
      toast.success(editId ? "Journal voucher updated successfully" : "Journal voucher created successfully");
      if (onSaved) onSaved(editId || result?.data?.id);
    } catch (error) {
      toast.error(error.message || "Failed to save journal voucher");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyScan = (scanned) => {
    setFormData((prev) => ({ ...prev, ...scanned.formFields }));
    setDebitLedgers(scanned.debitLedgers);
    setCreditLedgers(scanned.creditLedgers);
  };

  return (
    <form onSubmit={handleSubmit}>
      <AiDocumentScanner
        title="AI Expense Receipt Scan"
        badge="Petty cash & expense bills"
        description="Upload an expense receipt or bill — AI fills date, payee, narration, and suggested debit/credit ledger lines."
        scanFile={(file) => scanAndMapExpenseReceipt(file, companies)}
        onApply={handleApplyScan}
        disabled={submitting}
        renderPreview={(preview) => (
          <div className="row g-2 small">
            <div className="col-md-3">
              <span className="text-muted">Vendor</span>
              <div className="fw-medium text-truncate">{preview.summary?.vendor || "—"}</div>
            </div>
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
              <span className="text-muted">Category</span>
              <div className="fw-medium">{preview.summary?.category || "—"}</div>
            </div>
          </div>
        )}
      />

      <FormSection title="Voucher Details" icon="fa fa-file-invoice">
        <div className="row">
          <TextField label="Voucher No" name="VoucherNo" value={formData.VoucherNo} onChange={handleFieldChange} />
          <TextField label="Voucher Date" name="VoucherDate" type="date" value={formData.VoucherDate} onChange={handleFieldChange} />
          <div className="col-md-4 mb-3">
            <label className="form-label">Voucher Type</label>
            <select name="VoucherType" className="form-control" value={formData.VoucherType} onChange={handleFieldChange}>
              <option value="Journal Voucher">Journal Voucher</option>
              <option value="Expense Voucher">Expense Voucher</option>
            </select>
          </div>
          <TextField label="Narration" name="Narration" value={formData.Narration} onChange={handleFieldChange} />
          <TextField label="On Account Of" name="OnAccountOf" value={formData.OnAccountOf} onChange={handleFieldChange} />
        </div>
      </FormSection>

      <FormSection title="Pay From (Company)" icon="fa fa-building">
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Company</label>
            <select className="form-control" value={formData.CompanyId} onChange={(e) => handleCompanySelect(e.target.value)}>
              <option value="">Select Company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.short_name ? `(${c.short_name})` : ""}
                </option>
              ))}
            </select>
          </div>
          <TextField label="State Code" name="CompanyStateCode" value={formData.CompanyStateCode} onChange={handleFieldChange} />
        </div>
        {formData.CompanyName && (
          <div className="border rounded account-muted-surface p-3 small">
            <div className="fw-bold">{formData.CompanyName}</div>
            <div className="text-muted">{formData.CompanyAddress || "—"}</div>
            <div className="text-muted">
              {formData.CompanyState}
              {formData.CompanyEmail ? ` · ${formData.CompanyEmail}` : ""}
            </div>
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
              <select className="form-control" value={formData.PayeeCompanyId} onChange={(e) => handlePayeeCompanySelect(e.target.value)}>
                <option value="">Select Company</option>
                {companies
                  .filter((c) => String(c.id) !== String(formData.CompanyId))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.short_name ? `(${c.short_name})` : ""}
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <div className="col-md-8 mb-3">
              <label className="form-label">Pay To Employee</label>
              <select className="form-control" value={formData.PayeeEmployeeId} onChange={(e) => handlePayeeEmployeeSelect(e.target.value)}>
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
        {formData.PayeeName && (
          <div className="border rounded account-muted-surface p-3 small">
            <div className="fw-bold">{formData.PayeeName}</div>
            {formData.PayeeType === "COMPANY" ? (
              <>
                <div className="text-muted">{formData.PayeeAddress || "—"}</div>
                <div className="text-muted">
                  {formData.PayeeState}
                  {formData.PayeeGstin ? ` · GSTIN: ${formData.PayeeGstin}` : ""}
                </div>
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

      <FormSection title="Debit Ledgers" icon="fa fa-arrow-down">
        <Table bordered responsive className="align-middle mb-2">
          <thead>
            <tr>
              <th width="5%">#</th>
              <th>Ledger Name</th>
              <th width="25%">Amount</th>
              <th width="6%"></th>
            </tr>
          </thead>
          <tbody>
            {debitLedgers.map((l, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
                  <select
                    className="form-control"
                    value={l.LedgerName}
                    onChange={(e) => handleDebitChange(index, "LedgerName", e.target.value)}
                  >
                    <option value="">Select Ledger</option>
                    {ledgerOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <NonNegativeNumberInput
                    value={l.Amount}
                    onChange={(v) => handleDebitChange(index, "Amount", v)}
                    onBlur={() => handleDebitBlur(index)}
                    placeholder="Amount"
                  />
                </td>
                <td className="text-center">
                  {debitLedgers.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-light btn-sm text-danger"
                      onClick={() => setDebitLedgers((prev) => prev.filter((_, i) => i !== index))}
                      title="Remove"
                    >
                      <i className="fa fa-trash"></i>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="2" className="text-end fw-bold">
                Debit Total
              </td>
              <td className="fw-bold">{debitTotal.toFixed(2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </Table>
        <button type="button" className="btn btn-outline-primary btn-sm mb-0" onClick={() => setDebitLedgers((prev) => [...prev, emptyLedger()])}>
          + Add Debit Ledger
        </button>
      </FormSection>

      <FormSection title="Credit Ledgers" icon="fa fa-arrow-up">
        <Table bordered responsive className="align-middle mb-2">
          <thead>
            <tr>
              <th width="5%">#</th>
              <th>Ledger Name</th>
              <th width="25%">Amount</th>
              <th width="6%"></th>
            </tr>
          </thead>
          <tbody>
            {creditLedgers.map((l, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
                  <select
                    className="form-control"
                    value={l.LedgerName}
                    onChange={(e) => handleCreditChange(index, "LedgerName", e.target.value)}
                  >
                    <option value="">Select Ledger</option>
                    {ledgerOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <NonNegativeNumberInput
                    value={l.Amount}
                    onChange={(v) => handleCreditChange(index, "Amount", v)}
                    onBlur={() => handleCreditBlur(index)}
                    placeholder="Amount"
                  />
                </td>
                <td className="text-center">
                  {creditLedgers.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-light btn-sm text-danger"
                      onClick={() => setCreditLedgers((prev) => prev.filter((_, i) => i !== index))}
                      title="Remove"
                    >
                      <i className="fa fa-trash"></i>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="2" className="text-end fw-bold">
                Credit Total
              </td>
              <td className="fw-bold">{creditTotal.toFixed(2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </Table>
        <button type="button" className="btn btn-outline-primary btn-sm mb-0" onClick={() => setCreditLedgers((prev) => [...prev, emptyLedger()])}>
          + Add Credit Ledger
        </button>
      </FormSection>

      <FormSection title="Signatory" icon="fa fa-signature">
        <div className="row">
          <TextField
            label="Authorised Signatory Name"
            name="AuthorisedSignatoryName"
            value={formData.AuthorisedSignatoryName}
            onChange={handleFieldChange}
          />
          <TextField
            label="Designation"
            name="AuthorisedSignatoryDesignation"
            value={formData.AuthorisedSignatoryDesignation}
            onChange={handleFieldChange}
          />
        </div>
      </FormSection>

      <div className="text-end mb-3">
        <h6 className="mb-1">
          Debit Total: <span>{debitTotal.toFixed(2)}</span>
        </h6>
        <h6 className="mb-1">
          Credit Total: <span>{creditTotal.toFixed(2)}</span>
        </h6>
        <h5 className={isBalanced ? "text-success" : "text-danger"}>
          {isBalanced ? "Balanced" : `Difference: ${difference.toFixed(2)}`}
        </h5>
      </div>

      <FormActions submitting={submitting} editId={editId} saveLabel="Journal Voucher" onClose={onClose} />
    </form>
  );
};

export default ExpenseForm;
