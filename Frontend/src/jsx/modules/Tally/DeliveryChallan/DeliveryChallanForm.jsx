import React, { useEffect, useState } from "react";
import { Table } from "react-bootstrap";

const emptyItem = () => ({ itemname: "", quantity: "", rate: "", amount: "" });
const emptyGst = () => ({ LedgerName: "", amount: "" });

const DeliveryChallanForm = ({ challanId, initialData, onDataChange, onClose, onSaved }) => {
  const [formData, setFormData] = useState({
    Challanno: initialData?.Challanno || "",
    Challandate: initialData?.Challandate || "",
    CustomerName: initialData?.CustomerName || "",
    Challanamount: initialData?.Challanamount || "",
    customergstin: initialData?.customergstin || "",
  });

  const [challanItems, setChallanItems] = useState(
    initialData?.challanitems?.length ? initialData.challanitems : [emptyItem()]
  );
  const [gstDetails, setGstDetails] = useState(
    initialData?.GstDetails?.length ? initialData.GstDetails : [emptyGst()]
  );

  // ---- Header field handlers ----
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ---- Challan Items handlers ----
  const handleItemChange = (index, field, value) => {
    setChallanItems((prev) => {
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

  const addItemRow = () => setChallanItems((prev) => [...prev, emptyItem()]);
  const removeItemRow = (index) =>
    setChallanItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

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
  const itemsTotal = challanItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const gstTotal = gstDetails.reduce((sum, g) => sum + (parseFloat(g.amount) || 0), 0);
  const grandTotal = itemsTotal + gstTotal;

  // Push the current form state up to the parent on every change so the
  // col-4 preview panel can render totals live, without this component
  // knowing or caring how (or whether) that panel is displayed.
  useEffect(() => {
    if (!onDataChange) return;
    onDataChange({
      ...formData,
      Challanamount: formData.Challanamount || grandTotal,
      challanitems: challanItems,
      GstDetails: gstDetails,
      status: initialData?.status || "Draft",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, challanItems, gstDetails]);

  // ---- Submit ----
  const handleSubmit = (e) => {
    e.preventDefault();
    alert(
      challanId
        ? `(Static demo) Delivery challan ${challanId} would be updated here.`
        : "(Static demo) Delivery challan would be created here."
    );
    if (onSaved) onSaved();
  };

  const handleReset = () => {
    setFormData({
      Challanno: "",
      Challandate: "",
      CustomerName: "",
      Challanamount: "",
      customergstin: "",
    });
    setChallanItems([emptyItem()]);
    setGstDetails([emptyGst()]);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Challan Details */}
      <h6 className="text-uppercase text-muted small fw-bold mb-3">Challan Details</h6>
      <div className="row">
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
          <label className="form-label">Challan Date</label>
          <input
            type="date"
            name="Challandate"
            className="form-control"
            value={formData.Challandate}
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
          <label className="form-label">Challan Amount</label>
          <input
            type="number"
            name="Challanamount"
            className="form-control"
            placeholder="Enter Challan Amount"
            value={formData.Challanamount}
            onChange={handleFieldChange}
          />
        </div>
      </div>

      {/* Challan Items */}
      <div className="d-flex align-items-center justify-content-between mt-4 mb-3">
        <h6 className="text-uppercase text-muted small fw-bold mb-0">Challan Items</h6>
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
          {challanItems.map((item, index) => (
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
                {challanItems.length > 1 && (
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
          Save Delivery Challan
        </button>
      </div>
    </form>
  );
};

export default DeliveryChallanForm;