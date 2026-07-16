import React, { useEffect, useState } from "react";
import { Table } from "react-bootstrap";

const emptyItem = () => ({ itemname: "", quantity: "", rate: "", amount: "" });
const emptyGst = () => ({ LedgerName: "", amount: "" });

const DebitNoteForm = ({ debitNoteId, initialData, onDataChange, onClose, onSaved }) => {
  const [formData, setFormData] = useState({
    DebitNoteNo: initialData?.DebitNoteNo || "",
    DebitNoteDate: initialData?.DebitNoteDate || "",
    PurchaseNo: initialData?.PurchaseNo || "",
    VendorName: initialData?.VendorName || "",
    DebitNoteAmount: initialData?.DebitNoteAmount || "",
    Vendorgstin: initialData?.Vendorgstin || "",
  });

  const [purchaseItems, setPurchaseItems] = useState(
    initialData?.PurchaseItems?.length ? initialData.PurchaseItems : [emptyItem()]
  );
  const [gstDetails, setGstDetails] = useState(
    initialData?.GstDetails?.length ? initialData.GstDetails : [emptyGst()]
  );

  // ---- Header field handlers ----
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ---- Purchase Items handlers ----
  const handleItemChange = (index, field, value) => {
    setPurchaseItems((prev) => {
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

  const addItemRow = () => setPurchaseItems((prev) => [...prev, emptyItem()]);
  const removeItemRow = (index) =>
    setPurchaseItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

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
  const itemsTotal = purchaseItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const gstTotal = gstDetails.reduce((sum, g) => sum + (parseFloat(g.amount) || 0), 0);
  const grandTotal = itemsTotal + gstTotal;

  // Push the current form state up to the parent on every change so the
  // col-4 preview panel can render totals live, without this component
  // knowing or caring how (or whether) that panel is displayed.
  useEffect(() => {
    if (!onDataChange) return;
    onDataChange({
      ...formData,
      DebitNoteAmount: formData.DebitNoteAmount || grandTotal,
      PurchaseItems: purchaseItems,
      GstDetails: gstDetails,
      status: initialData?.status || "Draft",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, purchaseItems, gstDetails]);

  // ---- Submit ----
  const handleSubmit = (e) => {
    e.preventDefault();
    alert(
      debitNoteId
        ? `(Static demo) Debit note ${debitNoteId} would be updated here.`
        : "(Static demo) Debit note would be created here."
    );
    if (onSaved) onSaved();
  };

  const handleReset = () => {
    setFormData({
      DebitNoteNo: "",
      DebitNoteDate: "",
      PurchaseNo: "",
      VendorName: "",
      DebitNoteAmount: "",
      Vendorgstin: "",
    });
    setPurchaseItems([emptyItem()]);
    setGstDetails([emptyGst()]);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Debit Note Details */}
      <h6 className="text-uppercase text-muted small fw-bold mb-3">Debit Note Details</h6>
      <div className="row">
        <div className="col-md-4 mb-3">
          <label className="form-label">Debit Note No</label>
          <input
            type="text"
            name="DebitNoteNo"
            className="form-control"
            placeholder="Enter Debit Note No"
            value={formData.DebitNoteNo}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Debit Note Date</label>
          <input
            type="date"
            name="DebitNoteDate"
            className="form-control"
            value={formData.DebitNoteDate}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Purchase No</label>
          <input
            type="text"
            name="PurchaseNo"
            className="form-control"
            placeholder="Enter Purchase No"
            value={formData.PurchaseNo}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Vendor Name</label>
          <input
            type="text"
            name="VendorName"
            className="form-control"
            placeholder="Enter Vendor Name"
            value={formData.VendorName}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Vendor GSTIN</label>
          <input
            type="text"
            name="Vendorgstin"
            className="form-control"
            placeholder="Enter Vendor GSTIN"
            value={formData.Vendorgstin}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Debit Note Amount</label>
          <input
            type="number"
            name="DebitNoteAmount"
            className="form-control"
            placeholder="Enter Debit Note Amount"
            value={formData.DebitNoteAmount}
            onChange={handleFieldChange}
          />
        </div>
      </div>

      {/* Purchase Items */}
      <div className="d-flex align-items-center justify-content-between mt-4 mb-3">
        <h6 className="text-uppercase text-muted small fw-bold mb-0">Purchase Items</h6>
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
          {purchaseItems.map((item, index) => (
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
                {purchaseItems.length > 1 && (
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
          Save Debit Note
        </button>
      </div>
    </form>
  );
};

export default DebitNoteForm;