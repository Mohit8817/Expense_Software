import React, { useState } from "react";
import { Card, Col, Table } from "react-bootstrap";

const emptyLedger = { LedgerName: "", Amount: "" };

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

const ExpenseForm = ({onSaved }) => {
  const [formData, setFormData] = useState({
    VoucherNo: "",
    VoucherDate: "",
    Narration: "",
  });

  const [debitLedgers, setDebitLedgers] = useState([{ ...emptyLedger }]);
  const [creditLedgers, setCreditLedgers] = useState([{ ...emptyLedger }]);

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

  const addDebitRow = () => {
    setDebitLedgers((prev) => [...prev, { ...emptyLedger }]);
  };

  const removeDebitRow = (index) => {
    setDebitLedgers((prev) => prev.filter((_, i) => i !== index));
  };

  // ---- Credit Ledger handlers ----
  const handleCreditChange = (index, field, value) => {
    setCreditLedgers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addCreditRow = () => {
    setCreditLedgers((prev) => [...prev, { ...emptyLedger }]);
  };

  const removeCreditRow = (index) => {
    setCreditLedgers((prev) => prev.filter((_, i) => i !== index));
  };

  // ---- Totals ----
  const debitTotal = debitLedgers.reduce(
    (sum, l) => sum + (parseFloat(l.Amount) || 0),
    0
  );
  const creditTotal = creditLedgers.reduce(
    (sum, l) => sum + (parseFloat(l.Amount) || 0),
    0
  );
  const difference = debitTotal - creditTotal;
  const isBalanced = debitTotal > 0 && difference === 0;

  // ---- Submit ----
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isBalanced) {
      alert("Debit and Credit totals must be equal before saving.");
      return;
    }
    const payload = {
      ...formData,
      DebitLedgers: debitLedgers,
      CreditLedgers: creditLedgers,
    };
    console.log("Expense Voucher payload:", payload);
    // TODO: call your save/update API here
    if (onSaved) onSaved();
  };

  const handleReset = () => {
    setFormData({
      VoucherNo: "",
      VoucherDate: "",
      Narration: "",
    });
    setDebitLedgers([{ ...emptyLedger }]);
    setCreditLedgers([{ ...emptyLedger }]);
  };

  return (
    <>
      <Col lg={12}>
        <Card>
          <Card.Body>
            <form onSubmit={handleSubmit}>
              <div className="row">
                {/* Voucher No */}
                <div className="col-md-4 mb-3">
                  <label>Voucher No</label>
                  <input
                    type="text"
                    name="VoucherNo"
                    className="form-control"
                    placeholder="Enter Voucher No"
                    value={formData.VoucherNo}
                    onChange={handleFieldChange}
                  />
                </div>

                {/* Voucher Date */}
                <div className="col-md-4 mb-3">
                  <label>Voucher Date</label>
                  <input
                    type="date"
                    name="VoucherDate"
                    className="form-control"
                    value={formData.VoucherDate}
                    onChange={handleFieldChange}
                  />
                </div>

                {/* Narration */}
                <div className="col-md-4 mb-3">
                  <label>Narration</label>
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
              <h5 className="mt-4 mb-3">Debit Ledgers (Expenses)</h5>

              <Table bordered responsive>
                <thead>
                  <tr>
                    <th width="5%">#</th>
                    <th>Ledger Name</th>
                    <th width="25%">Amount</th>
                    <th width="5%"></th>
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
                          onChange={(e) =>
                            handleDebitChange(index, "LedgerName", e.target.value)
                          }
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
                          onChange={(e) =>
                            handleDebitChange(index, "Amount", e.target.value)
                          }
                        />
                      </td>
                      <td className="text-center">
                        {debitLedgers.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-danger btn-xs sharp"
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

              <button
                type="button"
                className="btn btn-outline-primary btn-sm mb-4"
                onClick={addDebitRow}
              >
                + Add Debit Ledger
              </button>

              {/* Credit Ledgers */}
              <h5 className="mb-3">Credit Ledgers (Payment Mode)</h5>

              <Table bordered responsive>
                <thead>
                  <tr>
                    <th width="5%">#</th>
                    <th>Ledger Name</th>
                    <th width="25%">Amount</th>
                    <th width="5%"></th>
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
                          onChange={(e) =>
                            handleCreditChange(index, "LedgerName", e.target.value)
                          }
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
                          onChange={(e) =>
                            handleCreditChange(index, "Amount", e.target.value)
                          }
                        />
                      </td>
                      <td className="text-center">
                        {creditLedgers.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-danger btn-xs sharp"
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

              <button
                type="button"
                className="btn btn-outline-primary btn-sm mb-4"
                onClick={addCreditRow}
              >
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
                  {isBalanced
                    ? "Balanced"
                    : `Difference: ${difference.toFixed(2)}`}
                </h5>
              </div>

              {/* Buttons */}
              <div className="text-end">
                <button
                  type="button"
                  className="btn btn-secondary me-2"
                  onClick={handleReset}
                >
                  Reset
                </button>

                <button type="submit" className="btn btn-primary">
                  Save Expense Voucher
                </button>
              </div>
            </form>
          </Card.Body>
        </Card>
      </Col>
    </>
  );
};

export default ExpenseForm;