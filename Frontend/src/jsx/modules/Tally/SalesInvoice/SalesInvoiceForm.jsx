import React, { useEffect, useState } from "react";
import { Table } from "react-bootstrap";

const emptyItem = () => ({
  itemname: "",
  hsnSac: "",
  quantity: "",
  unit: "no",
  rate: "",
  amount: "",
});

const emptyGst = () => ({ LedgerName: "", rate: "", amount: "" });

const SalesInvoiceForm = ({ invoiceId, initialData, onDataChange, onClose, onSaved }) => {
  const [formData, setFormData] = useState({
    // ---- Invoice Type / e-Invoice ----
    InvoiceType: initialData?.InvoiceType || "Tax Invoice",
    IRN: initialData?.IRN || "",
    AckNo: initialData?.AckNo || "",
    AckDate: initialData?.AckDate || "",

    // ---- Seller (Company) Details ----
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

    // ---- Invoice / Dispatch Details ----
    InvoiceNo: initialData?.InvoiceNo || "",
    EWayBillNo: initialData?.EWayBillNo || "",
    InvoiceDate: initialData?.InvoiceDate || "",
    DeliveryNote: initialData?.DeliveryNote || "",
    ModeTermsOfPayment: initialData?.ModeTermsOfPayment || "",
    ReferenceNoDate: initialData?.ReferenceNoDate || "",
    OtherReferences: initialData?.OtherReferences || "",
    BuyersOrderNo: initialData?.BuyersOrderNo || "",
    BuyersOrderDate: initialData?.BuyersOrderDate || "",
    DispatchDocNo: initialData?.DispatchDocNo || "",
    DeliveryNoteDate: initialData?.DeliveryNoteDate || "",
    DispatchedThrough: initialData?.DispatchedThrough || "",
    Destination: initialData?.Destination || "",
    BillOfLadingNo: initialData?.BillOfLadingNo || "",
    MotorVehicleNo: initialData?.MotorVehicleNo || "",
    TermsOfDelivery: initialData?.TermsOfDelivery || "",

    // ---- Amounts ----
    BillAmount: initialData?.BillAmount || "",

    // ---- Footer / Declaration ----
    AmountInWords: initialData?.AmountInWords || "",
    TaxAmountInWords: initialData?.TaxAmountInWords || "",
    CompanyPAN: initialData?.CompanyPAN || "",
    Declaration: initialData?.Declaration || "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.",
    AuthorisedSignatoryName: initialData?.AuthorisedSignatoryName || "",
    AuthorisedSignatoryDesignation: initialData?.AuthorisedSignatoryDesignation || "",
    IssuingSignatoryName: initialData?.IssuingSignatoryName || "",
    IssuingSignatoryDesignation: initialData?.IssuingSignatoryDesignation || "",
    Jurisdiction: initialData?.Jurisdiction || "",
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

      // auto-calc amount = taxable value(items total) * rate% when rate changes
      if (field === "rate") {
        const rate = parseFloat(value) || 0;
        const taxable = billItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        updated[index].amount = ((taxable * rate) / 100).toFixed(2);
      }
      return updated;
    });
  };

  const addGstRow = () => setGstDetails((prev) => [...prev, emptyGst()]);
  const removeGstRow = (index) =>
    setGstDetails((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  // ---- Totals ----
  const itemsTotal = billItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const totalQty = billItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
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
      InvoiceType: "Tax Invoice",
      IRN: "",
      AckNo: "",
      AckDate: "",
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
      InvoiceNo: "",
      EWayBillNo: "",
      InvoiceDate: "",
      DeliveryNote: "",
      ModeTermsOfPayment: "",
      ReferenceNoDate: "",
      OtherReferences: "",
      BuyersOrderNo: "",
      BuyersOrderDate: "",
      DispatchDocNo: "",
      DeliveryNoteDate: "",
      DispatchedThrough: "",
      Destination: "",
      BillOfLadingNo: "",
      MotorVehicleNo: "",
      TermsOfDelivery: "",
      BillAmount: "",
      AmountInWords: "",
      TaxAmountInWords: "",
      CompanyPAN: "",
      Declaration:
        "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.",
      AuthorisedSignatoryName: "",
      AuthorisedSignatoryDesignation: "",
      IssuingSignatoryName: "",
      IssuingSignatoryDesignation: "",
      Jurisdiction: "",
    });
    setBillItems([emptyItem()]);
    setGstDetails([emptyGst()]);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Invoice Type / e-Invoice Details */}
      <h6 className="text-uppercase  small fw-bold mb-3">Invoice Type / e-Invoice</h6>
      <div className="row">
        <div className="col-md-3 mb-3">
          <label className="form-label">Invoice Type</label>
          <select
            name="InvoiceType"
            className="form-control"
            value={formData.InvoiceType}
            onChange={handleFieldChange}
          >
            <option value="Tax Invoice">Tax Invoice</option>
            <option value="Sale">Sale</option>
            <option value="Bill of Supply">Bill of Supply</option>
          </select>
        </div>
        <div className="col-md-5 mb-3">
          <label className="form-label">IRN</label>
          <input
            type="text"
            name="IRN"
            className="form-control"
            placeholder="Enter IRN"
            value={formData.IRN}
            onChange={handleFieldChange}
          />
        </div>
        <div className="col-md-2 mb-3">
          <label className="form-label">Ack No.</label>
          <input
            type="text"
            name="AckNo"
            className="form-control"
            placeholder="Ack No"
            value={formData.AckNo}
            onChange={handleFieldChange}
          />
        </div>
        <div className="col-md-2 mb-3">
          <label className="form-label">Ack Date</label>
          <input
            type="date"
            name="AckDate"
            className="form-control"
            value={formData.AckDate}
            onChange={handleFieldChange}
          />
        </div>
      </div>

      {/* Seller (Company) Details */}
      <h6 className="text-uppercase small fw-bold mb-3">Seller (Company) Details</h6>
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
      <h6 className="text-uppercas small fw-bold mb-3">Buyer (Bill to)</h6>
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

      {/* Invoice / Dispatch Details */}
      <h6 className="text-uppercase  small fw-bold mb-3">Invoice Details</h6>
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
          <label className="form-label">e-Way Bill No.</label>
          <input
            type="text"
            name="EWayBillNo"
            className="form-control"
            placeholder="Enter e-Way Bill No"
            value={formData.EWayBillNo}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Invoice Date (Dated)</label>
          <input
            type="date"
            name="InvoiceDate"
            className="form-control"
            value={formData.InvoiceDate}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Delivery Note</label>
          <input
            type="text"
            name="DeliveryNote"
            className="form-control"
            placeholder="Enter Delivery Note"
            value={formData.DeliveryNote}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Mode/Terms of Payment</label>
          <input
            type="text"
            name="ModeTermsOfPayment"
            className="form-control"
            placeholder="Enter Mode/Terms of Payment"
            value={formData.ModeTermsOfPayment}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Reference No. &amp; Date.</label>
          <input
            type="text"
            name="ReferenceNoDate"
            className="form-control"
            placeholder="Enter Reference No & Date"
            value={formData.ReferenceNoDate}
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
          <label className="form-label">Buyer's Order No.</label>
          <input
            type="text"
            name="BuyersOrderNo"
            className="form-control"
            placeholder="Enter Buyer's Order No"
            value={formData.BuyersOrderNo}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Dated</label>
          <input
            type="date"
            name="BuyersOrderDate"
            className="form-control"
            value={formData.BuyersOrderDate}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Dispatch Doc No.</label>
          <input
            type="text"
            name="DispatchDocNo"
            className="form-control"
            placeholder="Enter Dispatch Doc No"
            value={formData.DispatchDocNo}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Delivery Note Date</label>
          <input
            type="date"
            name="DeliveryNoteDate"
            className="form-control"
            value={formData.DeliveryNoteDate}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Dispatched through</label>
          <input
            type="text"
            name="DispatchedThrough"
            className="form-control"
            placeholder="Enter Dispatched Through"
            value={formData.DispatchedThrough}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Destination</label>
          <input
            type="text"
            name="Destination"
            className="form-control"
            placeholder="Enter Destination"
            value={formData.Destination}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Bill of Lading/LR-RR No.</label>
          <input
            type="text"
            name="BillOfLadingNo"
            className="form-control"
            placeholder="Enter Bill of Lading/LR-RR No"
            value={formData.BillOfLadingNo}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Motor Vehicle No.</label>
          <input
            type="text"
            name="MotorVehicleNo"
            className="form-control"
            placeholder="Enter Motor Vehicle No"
            value={formData.MotorVehicleNo}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label className="form-label">Terms of Delivery</label>
          <input
            type="text"
            name="TermsOfDelivery"
            className="form-control"
            placeholder="Enter Terms of Delivery"
            value={formData.TermsOfDelivery}
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

      {/* Bill Items / Description of Goods */}
      <div className="d-flex align-items-center justify-content-between mt-4 mb-3">
        <h6 className="text-uppercase small fw-bold mb-0">Description of Goods</h6>
      </div>

      <Table bordered responsive className="align-middle">
        <thead>
          <tr>
            <th width="5%">Sl No</th>
            <th>Item Name</th>
            <th width="12%">HSN/SAC</th>
            <th width="10%">Quantity</th>
            <th width="8%">Per</th>
            <th width="12%">Rate</th>
            <th width="14%">Amount</th>
            <th width="5%"></th>
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
                  type="text"
                  className="form-control"
                  placeholder="HSN/SAC"
                  value={item.hsnSac}
                  onChange={(e) => handleItemChange(index, "hsnSac", e.target.value)}
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
        <tfoot>
          <tr>
            <td colSpan="3" className="text-end fw-bold">
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

      {/* GST / Tax Details */}
      <h6 className="text-uppercase  small fw-bold mb-3">Tax Details</h6>

      <Table bordered responsive className="align-middle">
        <thead>
          <tr>
            <th width="45%">Ledger Name (Tax Type)</th>
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
                  <option value="CGST">CGST</option>
                  <option value="SGST">SGST</option>
                  <option value="IGST">IGST</option>
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
          Taxable Value: <span>{itemsTotal.toFixed(2)}</span>
        </h6>
        <h6 className="mb-1">
          Total Tax Amount: <span>{gstTotal.toFixed(2)}</span>
        </h6>
        <h5>
          Grand Total: <strong>{grandTotal.toFixed(2)}</strong>
        </h5>
      </div>

      {/* Amount / Tax in Words */}
      <div className="row">
        <div className="col-md-6 mb-3">
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
        <div className="col-md-6 mb-3">
          <label className="form-label">Tax Amount (in words)</label>
          <input
            type="text"
            name="TaxAmountInWords"
            className="form-control"
            placeholder="Indian Rupees ... Only"
            value={formData.TaxAmountInWords}
            onChange={handleFieldChange}
          />
        </div>
      </div>

      {/* Declaration / Signatory */}
      <h6 className="text-uppercase text-muted small fw-bold mb-3">Declaration &amp; Signatory</h6>
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

        <div className="col-md-8 mb-3">
          <label className="form-label">Declaration</label>
          <input
            type="text"
            name="Declaration"
            className="form-control"
            placeholder="Enter Declaration Text"
            value={formData.Declaration}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-3 mb-3">
          <label className="form-label">Authorised Signatory Name</label>
          <input
            type="text"
            name="AuthorisedSignatoryName"
            className="form-control"
            placeholder="Enter Name"
            value={formData.AuthorisedSignatoryName}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-3 mb-3">
          <label className="form-label">Authorised Signatory Designation</label>
          <input
            type="text"
            name="AuthorisedSignatoryDesignation"
            className="form-control"
            placeholder="Enter Designation"
            value={formData.AuthorisedSignatoryDesignation}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-3 mb-3">
          <label className="form-label">Issuing Signatory Name</label>
          <input
            type="text"
            name="IssuingSignatoryName"
            className="form-control"
            placeholder="Enter Name"
            value={formData.IssuingSignatoryName}
            onChange={handleFieldChange}
          />
        </div>

        <div className="col-md-3 mb-3">
          <label className="form-label">Issuing Signatory Designation</label>
          <input
            type="text"
            name="IssuingSignatoryDesignation"
            className="form-control"
            placeholder="Enter Designation"
            value={formData.IssuingSignatoryDesignation}
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
          Save Sales Invoice
        </button>
      </div>
    </form>
  );
};

export default SalesInvoiceForm;