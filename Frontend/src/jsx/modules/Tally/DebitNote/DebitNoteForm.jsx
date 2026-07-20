import React, { useEffect, useState } from "react";
import { Table } from "react-bootstrap";

const emptyItem = () => ({ itemname: "", quantity: "", unit: "no", rate: "", amount: "" });
const emptyGst = () => ({ LedgerName: "", rate: "", amount: "" });

const DebitNoteForm = ({ debitNoteId, initialData, onDataChange, onClose, onSaved }) => {
  const [formData, setFormData] = useState({
    // ---- Company (Issuing) Details ----
    CompanyName: initialData?.CompanyName || "",
    CompanyAddress: initialData?.CompanyAddress || "",
    CompanyGstin: initialData?.CompanyGstin || "",
    CompanyState: initialData?.CompanyState || "",
    CompanyStateCode: initialData?.CompanyStateCode || "",
    CompanyCIN: initialData?.CompanyCIN || "",
    CompanyEmail: initialData?.CompanyEmail || "",

    // ---- Consignee (Ship to) ----
    ConsigneeName: initialData?.ConsigneeName || "",
    ConsigneeAddress: initialData?.ConsigneeAddress || "",
    ConsigneeGstin: initialData?.ConsigneeGstin || "",
    ConsigneeState: initialData?.ConsigneeState || "",
    ConsigneeStateCode: initialData?.ConsigneeStateCode || "",

    // ---- Buyer (Bill to) ----
    CustomerName: initialData?.CustomerName || "",
    BuyerAddress: initialData?.BuyerAddress || "",
    customergstin: initialData?.customergstin || "",
    BuyerState: initialData?.BuyerState || "",
    BuyerStateCode: initialData?.BuyerStateCode || "",

    // ---- Debit Note Details ----
    DebitNoteNo: initialData?.DebitNoteNo || "",
    DebitNoteDate: initialData?.DebitNoteDate || "",
    OriginalInvoiceNo: initialData?.OriginalInvoiceNo || "",
    OriginalInvoiceDate: initialData?.OriginalInvoiceDate || "",
    OtherReferences: initialData?.OtherReferences || "",

    // ---- Amounts ----
    DebitNoteAmount: initialData?.DebitNoteAmount || "",

    // ---- Footer ----
    AmountInWords: initialData?.AmountInWords || "",
    CompanyPAN: initialData?.CompanyPAN || "",
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

      // auto-calc amount = taxable value (items total) * rate% when rate changes
      if (field === "rate") {
        const rate = parseFloat(value) || 0;
        const taxable = purchaseItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        updated[index].amount = ((taxable * rate) / 100).toFixed(2);
      }
      return updated;
    });
  };

  const addGstRow = () => setGstDetails((prev) => [...prev, emptyGst()]);
  const removeGstRow = (index) =>
    setGstDetails((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  // ---- Totals ----
  const itemsTotal = purchaseItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const totalQty = purchaseItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
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
      GstAmount: gstTotal,
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
      CompanyName: "",
      CompanyAddress: "",
      CompanyGstin: "",
      CompanyState: "",
      CompanyStateCode: "",
      CompanyCIN: "",
      CompanyEmail: "",
      ConsigneeName: "",
      ConsigneeAddress: "",
      ConsigneeGstin: "",
      ConsigneeState: "",
      ConsigneeStateCode: "",
      CustomerName: "",
      BuyerAddress: "",
      customergstin: "",
      BuyerState: "",
      BuyerStateCode: "",
      DebitNoteNo: "",
      DebitNoteDate: "",
      OriginalInvoiceNo: "",
      OriginalInvoiceDate: "",
      OtherReferences: "",
      DebitNoteAmount: "",
      AmountInWords: "",
      CompanyPAN: "",
      
    });
    setPurchaseItems([emptyItem()]);
    setGstDetails([emptyGst()]);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Company (Issuing) Details */}
      <h6 className="text-uppercase small fw-bold mb-3">Company Details</h6>
      <div className="row">
        <div className="col-md-4 mb-3">
          <label className="form-label">Company Name</label>
          <input
            type="text"
            name="CompanyName"
            className="form-control"
            placeholder="Enter Company Name"
            value={formData.CompanyName}
            onChange={handleFieldChange}
          />
        </div>
        <div className="col-md-8 mb-3">
          <label className="form-label">Company Address</label>
          <input
            type="text"
            name="CompanyAddress"
            className="form-control"
            placeholder="Enter Company Address"
            value={formData.CompanyAddress}
            onChange={handleFieldChange}
          />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">Company GSTIN/UIN</label>
          <input
            type="text"
            name="CompanyGstin"
            className="form-control"
            placeholder="Enter GSTIN/UIN"
            value={formData.CompanyGstin}
            onChange={handleFieldChange}
          />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">State Name</label>
          <input
            type="text"
            name="CompanyState"
            className="form-control"
            placeholder="Enter State Name"
            value={formData.CompanyState}
            onChange={handleFieldChange}
          />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">State Code</label>
          <input
            type="text"
            name="CompanyStateCode"
            className="form-control"
            placeholder="Enter State Code"
            value={formData.CompanyStateCode}
            onChange={handleFieldChange}
          />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">CIN</label>
          <input
            type="text"
            name="CompanyCIN"
            className="form-control"
            placeholder="Enter CIN"
            value={formData.CompanyCIN}
            onChange={handleFieldChange}
          />
        </div>
        <div className="col-md-8 mb-3">
          <label className="form-label">E-Mail</label>
          <input
            type="email"
            name="CompanyEmail"
            className="form-control"
            placeholder="Enter Email"
            value={formData.CompanyEmail}
            onChange={handleFieldChange}
          />
        </div>
      </div>

      {/* Consignee (Ship to) */}
      <h6 className="text-uppercase small fw-bold mb-3">Consignee (Ship to)</h6>
      <div className="row">
        <div className="col-md-4 mb-3">
          <label className="form-label">Consignee Name</label>
          <input
            type="text"
            name="ConsigneeName"
            className="form-control"
            placeholder="Enter Consignee Name"
            value={formData.ConsigneeName}
            onChange={handleFieldChange}
          />
        </div>
        <div className="col-md-8 mb-3">
          <label className="form-label">Consignee Address</label>
          <input
            type="text"
            name="ConsigneeAddress"
            className="form-control"
            placeholder="Enter Consignee Address"
            value={formData.ConsigneeAddress}
            onChange={handleFieldChange}
          />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">Consignee GSTIN/UIN</label>
          <input
            type="text"
            name="ConsigneeGstin"
            className="form-control"
            placeholder="Enter GSTIN/UIN"
            value={formData.ConsigneeGstin}
            onChange={handleFieldChange}
          />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">State Name</label>
          <input
            type="text"
            name="ConsigneeState"
            className="form-control"
            placeholder="Enter State Name"
            value={formData.ConsigneeState}
            onChange={handleFieldChange}
          />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">State Code</label>
          <input
            type="text"
            name="ConsigneeStateCode"
            className="form-control"
            placeholder="Enter State Code"
            value={formData.ConsigneeStateCode}
            onChange={handleFieldChange}
          />
        </div>
      </div>

      {/* Buyer (Bill to) */}
      <h6 className="text-uppercase small fw-bold mb-3">Buyer (Bill to)</h6>
      <div className="row">
        <div className="col-md-4 mb-3">
          <label className="form-label">Buyer / Customer Name</label>
          <input
            type="text"
            name="CustomerName"
            className="form-control"
            placeholder="Enter Customer Name"
            value={formData.CustomerName}
            onChange={handleFieldChange}
          />
        </div>
        <div className="col-md-8 mb-3">
          <label className="form-label">Buyer Address</label>
          <input
            type="text"
            name="BuyerAddress"
            className="form-control"
            placeholder="Enter Buyer Address"
            value={formData.BuyerAddress}
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
          <label className="form-label">State Name</label>
          <input
            type="text"
            name="BuyerState"
            className="form-control"
            placeholder="Enter State Name"
            value={formData.BuyerState}
            onChange={handleFieldChange}
          />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">State Code</label>
          <input
            type="text"
            name="BuyerStateCode"
            className="form-control"
            placeholder="Enter State Code"
            value={formData.BuyerStateCode}
            onChange={handleFieldChange}
          />
        </div>
      </div>

      {/* Debit Note Details */}
      <h6 className="text-uppercase  small fw-bold mb-3">Debit Note Details</h6>
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
          <label className="form-label">Dated</label>
          <input
            type="date"
            name="DebitNoteDate"
            className="form-control"
            value={formData.DebitNoteDate}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Other References</label>
          <input
            type="text"
            name="OtherReferences"
            className="form-control"
            placeholder="Enter Other References"
            value={formData.OtherReferences}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Original Invoice No</label>
          <input
            type="text"
            name="OriginalInvoiceNo"
            className="form-control"
            placeholder="Enter Original Invoice No"
            value={formData.OriginalInvoiceNo}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Original Invoice Date</label>
          <input
            type="date"
            name="OriginalInvoiceDate"
            className="form-control"
            value={formData.OriginalInvoiceDate}
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

      {/* Description of Goods */}
      <div className="d-flex align-items-center justify-content-between mt-4 mb-3">
        <h6 className="text-uppercase  small fw-bold mb-0">Description of Goods</h6>
      </div>

      <Table bordered responsive className="align-middle">
        <thead>
          <tr>
            <th width="5%">Sl No</th>
            <th>Item Name</th>
            <th width="12%">Quantity</th>
            <th width="8%">Per</th>
            <th width="15%">Rate</th>
            <th width="15%">Amount</th>
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
                  type="text"
                  className="form-control"
                  placeholder="no"
                  value={item.unit}
                  onChange={(e) => handleItemChange(index, "unit", e.target.value)}
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
        <tfoot>
          <tr>
            <td colSpan="2" className="text-end fw-bold">
              Total
            </td>
            <td className="fw-bold">{totalQty}</td>
            <td colSpan="2"></td>
            <td className="fw-bold">{itemsTotal.toFixed(2)}</td>
            <td></td>
          </tr>
        </tfoot>
      </Table>

      <button type="button" className="btn btn-outline-primary btn-sm mb-4" onClick={addItemRow}>
        + Add Item
      </button>

      {/* GST Details */}
      <h6 className="text-uppercase  small fw-bold mb-3">GST Details</h6>

      <Table bordered responsive className="align-middle">
        <thead>
          <tr>
            <th width="45%">Ledger Name</th>
            <th width="20%">Rate (%)</th>
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
                  <option value="Input CGST">Input CGST</option>
                  <option value="Input SGST">Input SGST</option>
                  <option value="Input IGST">Input IGST</option>
                </select>
              </td>
              <td>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Rate %"
                  value={g.rate}
                  onChange={(e) => handleGstChange(index, "rate", e.target.value)}
                />
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

      {/* Amount in Words */}
      <div className="row">
        <div className="col-md-12 mb-3">
          <label className="form-label">Amount Chargeable (in words)</label>
          <input
            type="text"
            name="AmountInWords"
            className="form-control"
            placeholder="Indian Rupees ... Only"
            value={formData.AmountInWords}
            onChange={handleFieldChange}
          />
        </div>
      </div>

      {/* Signatory */}
      <h6 className="text-uppercase small fw-bold mb-3">PAN Details</h6>
      <div className="row">
        <div className="col-md-4 mb-3">
          <label className="form-label">Company's PAN</label>
          <input
            type="text"
            name="CompanyPAN"
            className="form-control"
            placeholder="Enter Company PAN"
            value={formData.CompanyPAN}
            onChange={handleFieldChange}
          />
        </div>

     
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