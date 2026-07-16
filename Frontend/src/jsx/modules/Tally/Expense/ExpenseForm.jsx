import React, { useEffect, useState } from "react";
import { Table } from "react-bootstrap";

const emptyLedger = () => ({ LedgerName: "", Amount: "" });

const ledgerOptions = [
  "Travelling Expenses",
  "Accomodation Charges",
  "Conveyance",
  "Office Expenses",
  "Cash",
  "Bank",
  "UPI",
  "Credit Card",
];

const ExpenseForm = ({ voucherId, initialData, onDataChange, onClose, onSaved }) => {
  const [formData, setFormData] = useState({
    VoucherNo: initialData?.VoucherNo || "",
    VoucherDate: initialData?.VoucherDate || "",
    Narration: initialData?.Narration || "",
  });

  const [debitLedgers, setDebitLedgers] = useState(
    initialData?.DebitLedgers?.length ? initialData.DebitLedgers : [emptyLedger()]
  );
  const [creditLedgers, setCreditLedgers] = useState(
    initialData?.CreditLedgers?.length ? initialData.CreditLedgers : [emptyLedger()]
  );

  // ---- Header field handlers ----
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ---- Debit Ledger handlers ----
  const handleDebitChange = (index, field, value) => {
    setDebitLedgers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addDebitRow = () => setDebitLedgers((prev) => [...prev, emptyLedger()]);
  const removeDebitRow = (index) =>
    setDebitLedgers((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  // ---- Credit Ledger handlers ----
  const handleCreditChange = (index, field, value) => {
    setCreditLedgers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addCreditRow = () => setCreditLedgers((prev) => [...prev, emptyLedger()]);
  const removeCreditRow = (index) =>
    setCreditLedgers((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  // ---- Totals ----
  const debitTotal = debitLedgers.reduce((sum, l) => sum + (parseFloat(l.Amount) || 0), 0);
  const creditTotal = creditLedgers.reduce((sum, l) => sum + (parseFloat(l.Amount) || 0), 0);
  const difference = debitTotal - creditTotal;
  const isBalanced = debitTotal > 0 && difference === 0;

  // Push the current form state up to the parent on every change so the
  // col-4 preview panel can render totals live, without this component
  // knowing or caring how (or whether) that panel is displayed.
  useEffect(() => {
    if (!onDataChange) return;
    onDataChange({
      ...formData,
      DebitLedgers: debitLedgers,
      CreditLedgers: creditLedgers,
      status: initialData?.status || "Draft",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, debitLedgers, creditLedgers]);

  // ---- Submit ----
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isBalanced) {
      alert("Debit and Credit totals must be equal before saving.");
      return;
    }
    alert(
      voucherId
        ? `(Static demo) Expense voucher ${voucherId} would be updated here.`
        : "(Static demo) Expense voucher would be created here."
    );
    if (onSaved) onSaved();
  };

  const handleReset = () => {
    setFormData({ VoucherNo: "", VoucherDate: "", Narration: "" });
    setDebitLedgers([emptyLedger()]);
    setCreditLedgers([emptyLedger()]);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Voucher Details */}
      <h6 className="text-uppercase text-muted small fw-bold mb-3">Voucher Details</h6>
      <div className="row">
        <div className="col-md-4 mb-3">
          <label className="form-label">Voucher No</label>
          <input
            type="text"
            name="VoucherNo"
            className="form-control"
            placeholder="Enter Voucher No"
            value={formData.VoucherNo}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Voucher Date</label>
          <input
            type="date"
            name="VoucherDate"
            className="form-control"
            value={formData.VoucherDate}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Narration</label>
          <input
            type="text"
            name="Narration"
            className="form-control"
            placeholder="Enter Narration"
            value={formData.Narration}
            onChange={handleFieldChange}
          />
        </div>
      </div>

      {/* Debit Ledgers */}
      <div className="d-flex align-items-center justify-content-between mt-4 mb-3">
        <h6 className="text-uppercase text-muted small fw-bold mb-0">Debit Ledgers (Expenses)</h6>
      </div>

      <Table bordered responsive className="align-middle">
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
                <input
                  type="number"
                  className="form-control"
                  placeholder="Amount"
                  value={l.Amount}
                  onChange={(e) => handleDebitChange(index, "Amount", e.target.value)}
                />
              </td>
              <td className="text-center">
                {debitLedgers.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-light btn-sm text-danger"
                    onClick={() => removeDebitRow(index)}
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

      <button type="button" className="btn btn-outline-primary btn-sm mb-4" onClick={addDebitRow}>
        + Add Debit Ledger
      </button>

      {/* Credit Ledgers */}
      <h6 className="text-uppercase text-muted small fw-bold mb-3">Credit Ledgers (Payment Mode)</h6>

      <Table bordered responsive className="align-middle">
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
                <input
                  type="number"
                  className="form-control"
                  placeholder="Amount"
                  value={l.Amount}
                  onChange={(e) => handleCreditChange(index, "Amount", e.target.value)}
                />
              </td>
              <td className="text-center">
                {creditLedgers.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-light btn-sm text-danger"
                    onClick={() => removeCreditRow(index)}
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

      <button type="button" className="btn btn-outline-primary btn-sm mb-4" onClick={addCreditRow}>
        + Add Credit Ledger
      </button>

      {/* Balance Summary */}
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

      {/* Buttons */}
      <div className="text-end border-top pt-3">
        <button type="button" className="btn btn-secondary me-2" onClick={handleReset}>
          Reset
        </button>
        {onClose && (
          <button type="button" className="btn btn-outline-secondary me-2" onClick={onClose}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary">
          Save Expense Voucher
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;