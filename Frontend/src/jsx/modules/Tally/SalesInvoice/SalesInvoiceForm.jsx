import React, { useEffect, useState } from "react";
import { Table } from "react-bootstrap";

const emptyItem = () => ({ itemname: "", quantity: "", rate: "", amount: "" });
const emptyGst = () => ({ LedgerName: "", amount: "" });

const SalesInvoiceForm = ({ invoiceId, initialData, onDataChange, onClose, onSaved }) => {
  const [formData, setFormData] = useState({
    InvoiceNo: initialData?.InvoiceNo || "",
    InvoiceDate: initialData?.InvoiceDate || "",
    Challanno: initialData?.Challanno || "",
    CustomerName: initialData?.CustomerName || "",
    BillAmount: initialData?.BillAmount || "",
    customergstin: initialData?.customergstin || "",
  });

  const [billItems, setBillItems] = useState(
    initialData?.BillItems?.length ? initialData.BillItems : [emptyItem()]
  );
  const [gstDetails, setGstDetails] = useState(
    initialData?.GstDetails?.length ? initialData.GstDetails : [emptyGst()]
  );

  // ---- Header field handlers ----
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ---- Bill Items handlers ----
  const handleItemChange = (index, field, value) => {
    setBillItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // auto-calc amount = quantity * rate
      if (field === "quantity" || field === "rate") {
        const qty = parseFloat(updated[index].quantity) || 0;
        const rate = parseFloat(updated[index].rate) || 0;
        updated[index].amount = qty * rate;
      }
      return updated;
    });
  };

  const addItemRow = () => setBillItems((prev) => [...prev, emptyItem()]);
  const removeItemRow = (index) =>
    setBillItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  // ---- GST Details handlers ----
  const handleGstChange = (index, field, value) => {
    setGstDetails((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addGstRow = () => setGstDetails((prev) => [...prev, emptyGst()]);
  const removeGstRow = (index) =>
    setGstDetails((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  // ---- Totals ----
  const itemsTotal = billItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const gstTotal = gstDetails.reduce((sum, g) => sum + (parseFloat(g.amount) || 0), 0);
  const grandTotal = itemsTotal + gstTotal;

  // Push the current form state up to the parent on every change so the
  // col-4 preview panel can render totals live, without this component
  // knowing or caring how (or whether) that panel is displayed.
  useEffect(() => {
    if (!onDataChange) return;
    onDataChange({
      ...formData,
      BillAmount: formData.BillAmount || grandTotal,
      GstAmount: gstTotal,
      BillItems: billItems,
      GstDetails: gstDetails,
      status: initialData?.status || "Draft",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, billItems, gstDetails]);

  // ---- Submit ----
  const handleSubmit = (e) => {
    e.preventDefault();
    alert(
      invoiceId
        ? `(Static demo) Sales invoice ${invoiceId} would be updated here.`
        : "(Static demo) Sales invoice would be created here."
    );
    if (onSaved) onSaved();
  };

  const handleReset = () => {
    setFormData({
      InvoiceNo: "",
      InvoiceDate: "",
      Challanno: "",
      CustomerName: "",
      BillAmount: "",
      customergstin: "",
    });
    setBillItems([emptyItem()]);
    setGstDetails([emptyGst()]);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Invoice Details */}
      <h6 className="text-uppercase text-muted small fw-bold mb-3">Invoice Details</h6>
      <div className="row">
        <div className="col-md-4 mb-3">
          <label className="form-label">Invoice No</label>
          <input
            type="text"
            name="InvoiceNo"
            className="form-control"
            placeholder="Enter Invoice No"
            value={formData.InvoiceNo}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Invoice Date</label>
          <input
            type="date"
            name="InvoiceDate"
            className="form-control"
            value={formData.InvoiceDate}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Challan No</label>
          <input
            type="text"
            name="Challanno"
            className="form-control"
            placeholder="Enter Challan No"
            value={formData.Challanno}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Customer Name</label>
          <input
            type="text"
            name="CustomerName"
            className="form-control"
            placeholder="Enter Customer Name"
            value={formData.CustomerName}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Customer GSTIN</label>
          <input
            type="text"
            name="customergstin"
            className="form-control"
            placeholder="Enter Customer GSTIN"
            value={formData.customergstin}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Bill Amount</label>
          <input
            type="number"
            name="BillAmount"
            className="form-control"
            placeholder="Enter Bill Amount"
            value={formData.BillAmount}
            onChange={handleFieldChange}
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
          {billItems.map((item, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Item Name"
                  value={item.itemname}
                  onChange={(e) => handleItemChange(index, "itemname", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Rate"
                  value={item.rate}
                  onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                />
              </td>
              <td>
                <input type="number" className="form-control" placeholder="0" value={item.amount} readOnly />
              </td>
              <td className="text-center">
                {billItems.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-light btn-sm text-danger"
                    onClick={() => removeItemRow(index)}
                    title="Remove"
                  >
                    <i className="fa fa-trash"></i>
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <button type="button" className="btn btn-outline-primary btn-sm mb-4" onClick={addItemRow}>
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
          {gstDetails.map((g, index) => (
            <tr key={index}>
              <td>
                <select
                  className="form-control"
                  value={g.LedgerName}
                  onChange={(e) => handleGstChange(index, "LedgerName", e.target.value)}
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
                  onChange={(e) => handleGstChange(index, "amount", e.target.value)}
                />
              </td>
              <td className="text-center">
                {gstDetails.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-light btn-sm text-danger"
                    onClick={() => removeGstRow(index)}
                    title="Remove"
                  >
                    <i className="fa fa-trash"></i>
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <button type="button" className="btn btn-outline-primary btn-sm mb-4" onClick={addGstRow}>
        + Add GST
      </button>

      {/* Totals */}
      <div className="text-end mb-3">
        <h6 className="mb-1">
          Items Total: <span>{itemsTotal.toFixed(2)}</span>
        </h6>
        <h6 className="mb-1">
          GST Total: <span>{gstTotal.toFixed(2)}</span>
        </h6>
        <h5>
          Grand Total: <strong>{grandTotal.toFixed(2)}</strong>
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
          Save Sales Invoice
        </button>
      </div>
    </form>
  );
};

export default SalesInvoiceForm;