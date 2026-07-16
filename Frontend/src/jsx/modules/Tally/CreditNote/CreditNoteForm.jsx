import React, { useEffect, useState } from "react";
import { Table } from "react-bootstrap";

let rowId = 0;
const nextId = () => `row-${++rowId}-${Date.now()}`;

const emptyItem = () => ({ id: nextId(), name: "", qty: "", rate: "" });
const emptyGstRow = () => ({ id: nextId(), ledger: "", amount: "" });

const CreditNoteForm = ({ creditNoteId, initialData, onDataChange, onClose, onSaved }) => {
  const [fields, setFields] = useState({
    creditNo: initialData?.creditNo || "",
    creditDate: initialData?.creditDate || "",
    invoiceNo: "",
    customerName: initialData?.customerName || "",
    gstin: "",
  });

  const [items, setItems] = useState(
    initialData?.items?.length ? initialData.items : [emptyItem()]
  );
  const [gstRows, setGstRows] = useState(
    initialData?.gstRows?.length ? initialData.gstRows : [emptyGstRow()]
  );

  const handleFieldChange = (key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleItemChange = (id, key, value) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [key]: value } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (id) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));

  const handleGstChange = (id, key, value) => {
    setGstRows((prev) => prev.map((g) => (g.id === id ? { ...g, [key]: value } : g)));
  };

  const addGstRow = () => setGstRows((prev) => [...prev, emptyGstRow()]);
  const removeGstRow = (id) =>
    setGstRows((prev) => (prev.length > 1 ? prev.filter((g) => g.id !== id) : prev));

  // Push the current form state up to the parent on every change so the
  // col-4 preview panel can render totals live, without this component
  // knowing or caring how (or whether) that panel is displayed.
  useEffect(() => {
    if (!onDataChange) return;
    onDataChange({
      ...fields,
      items,
      gstRows,
      status: initialData?.status || "Draft",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, items, gstRows]);

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(
      creditNoteId
        ? `(Static demo) Credit note ${creditNoteId} would be updated here.`
        : "(Static demo) Credit note would be created here."
    );
    if (onSaved) onSaved();
  };

  const handleReset = () => {
    setFields({ creditNo: "", creditDate: "", invoiceNo: "", customerName: "", gstin: "" });
    setItems([emptyItem()]);
    setGstRows([emptyGstRow()]);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Credit Note Details */}
      <h6 className="text-uppercase text-muted small fw-bold mb-3">Credit Note Details</h6>
      <div className="row">
        <div className="col-md-4 mb-3">
          <label className="form-label">Credit Note No</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Credit Note No"
            value={fields.creditNo}
            onChange={(e) => handleFieldChange("creditNo", e.target.value)}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Credit Note Date</label>
          <input
            type="date"
            className="form-control"
            value={fields.creditDate}
            onChange={(e) => handleFieldChange("creditDate", e.target.value)}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Invoice No</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Invoice No"
            value={fields.invoiceNo}
            onChange={(e) => handleFieldChange("invoiceNo", e.target.value)}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Customer Name</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Customer Name"
            value={fields.customerName}
            onChange={(e) => handleFieldChange("customerName", e.target.value)}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Customer GSTIN</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter GSTIN"
            value={fields.gstin}
            onChange={(e) => handleFieldChange("gstin", e.target.value)}
          />
        </div>
      </div>

      {/* Bill Items */}
      <div className="d-flex align-items-center justify-content-between mt-4 mb-3">
        <h6 className="text-uppercase text-muted small fw-bold mb-0">Bill Items</h6>
      </div>

      <Table bordered responsive className="align-middle">
        <thead>
          <tr>
            <th width="5%">#</th>
            <th>Item Name</th>
            <th width="15%">Quantity</th>
            <th width="18%">Rate</th>
            <th width="18%">Amount</th>
            <th width="6%"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const amount = (Number(item.qty) || 0) * (Number(item.rate) || 0);
            return (
              <tr key={item.id}>
                <td>{idx + 1}</td>
                <td>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Item Name"
                    value={item.name}
                    onChange={(e) => handleItemChange(item.id, "name", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Qty"
                    value={item.qty}
                    onChange={(e) => handleItemChange(item.id, "qty", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Rate"
                    value={item.rate}
                    onChange={(e) => handleItemChange(item.id, "rate", e.target.value)}
                  />
                </td>
                <td>
                  <input type="number" className="form-control" value={amount || ""} placeholder="0" readOnly />
                </td>
                <td className="text-center">
                  <button
                    type="button"
                    className="btn btn-light btn-sm text-danger"
                    onClick={() => removeItem(item.id)}
                    title="Remove item"
                  >
                    <i className="fa fa-trash"></i>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      <button type="button" className="btn btn-outline-primary btn-sm mb-4" onClick={addItem}>
        + Add Item
      </button>

      {/* GST Details */}
      <h6 className="text-uppercase text-muted small fw-bold mb-3">GST Details</h6>

      <Table bordered responsive className="align-middle">
        <thead>
          <tr>
            <th width="55%">Ledger Name</th>
            <th>Amount</th>
            <th width="6%"></th>
          </tr>
        </thead>
        <tbody>
          {gstRows.map((g) => (
            <tr key={g.id}>
              <td>
                <select
                  className="form-control"
                  value={g.ledger}
                  onChange={(e) => handleGstChange(g.id, "ledger", e.target.value)}
                >
                  <option value="">Select Ledger</option>
                  <option value="CGST">CGST</option>
                  <option value="SGST">SGST</option>
                  <option value="IGST">IGST</option>
                </select>
              </td>
              <td>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Amount"
                  value={g.amount}
                  onChange={(e) => handleGstChange(g.id, "amount", e.target.value)}
                />
              </td>
              <td className="text-center">
                <button
                  type="button"
                  className="btn btn-light btn-sm text-danger"
                  onClick={() => removeGstRow(g.id)}
                  title="Remove row"
                >
                  <i className="fa fa-trash"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <button type="button" className="btn btn-outline-primary btn-sm mb-4" onClick={addGstRow}>
        + Add GST
      </button>

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
          Save Credit Note
        </button>
      </div>
    </form>
  );
};

export default CreditNoteForm;