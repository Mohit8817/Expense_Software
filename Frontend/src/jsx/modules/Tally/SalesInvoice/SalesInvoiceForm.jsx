import React, { useState } from "react";
import { Card, Col, Table } from "react-bootstrap";

const emptyItem = { itemname: "", quantity: "", rate: "", amount: "" };
const emptyGst = { LedgerName: "", amount: "" };

const SalesInvoiceForm = ({ onSaved }) => {
  const [formData, setFormData] = useState({
    InvoiceNo: "",
    InvoiceDate: "",
    Challanno: "",
    CustomerName: "",
    BillAmount: "",
    customergstin: "",
  });

  const [billItems, setBillItems] = useState([{ ...emptyItem }]);
  const [gstDetails, setGstDetails] = useState([{ ...emptyGst }]);

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

  const addItemRow = () => {
    setBillItems((prev) => [...prev, { ...emptyItem }]);
  };

  const removeItemRow = (index) => {
    setBillItems((prev) => prev.filter((_, i) => i !== index));
  };

  // ---- GST Details handlers ----
  const handleGstChange = (index, field, value) => {
    setGstDetails((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addGstRow = () => {
    setGstDetails((prev) => [...prev, { ...emptyGst }]);
  };

  const removeGstRow = (index) => {
    setGstDetails((prev) => prev.filter((_, i) => i !== index));
  };

  // ---- Totals ----
  const itemsTotal = billItems.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0
  );
  const gstTotal = gstDetails.reduce(
    (sum, g) => sum + (parseFloat(g.amount) || 0),
    0
  );
  const grandTotal = itemsTotal + gstTotal;

  // ---- Submit ----
  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      BillAmount: formData.BillAmount || grandTotal,
      BillItems: billItems,
      GstDetails: gstDetails,
    };
    console.log("Sales Invoice payload:", payload);
    // TODO: call your save/update API here
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
    setBillItems([{ ...emptyItem }]);
    setGstDetails([{ ...emptyGst }]);
  };

  return (
    <>
      <Col lg={12}>
        <Card>
          <Card.Body>
            <form onSubmit={handleSubmit}>
              <div className="row">
                {/* Invoice No */}
                <div className="col-md-4 mb-3">
                  <label>Invoice No</label>
                  <input
                    type="text"
                    name="InvoiceNo"
                    className="form-control"
                    placeholder="Enter Invoice No"
                    value={formData.InvoiceNo}
                    onChange={handleFieldChange}
                  />
                </div>

                {/* Invoice Date */}
                <div className="col-md-4 mb-3">
                  <label>Invoice Date</label>
                  <input
                    type="date"
                    name="InvoiceDate"
                    className="form-control"
                    value={formData.InvoiceDate}
                    onChange={handleFieldChange}
                  />
                </div>

                {/* Challan No */}
                <div className="col-md-4 mb-3">
                  <label>Challan No</label>
                  <input
                    type="text"
                    name="Challanno"
                    className="form-control"
                    placeholder="Enter Challan No"
                    value={formData.Challanno}
                    onChange={handleFieldChange}
                  />
                </div>

                {/* Customer Name */}
                <div className="col-md-4 mb-3">
                  <label>Customer Name</label>
                  <input
                    type="text"
                    name="CustomerName"
                    className="form-control"
                    placeholder="Enter Customer Name"
                    value={formData.CustomerName}
                    onChange={handleFieldChange}
                  />
                </div>

                {/* Customer GSTIN */}
                <div className="col-md-4 mb-3">
                  <label>Customer GSTIN</label>
                  <input
                    type="text"
                    name="customergstin"
                    className="form-control"
                    placeholder="Enter Customer GSTIN"
                    value={formData.customergstin}
                    onChange={handleFieldChange}
                  />
                </div>

                {/* Bill Amount */}
                <div className="col-md-4 mb-3">
                  <label>Bill Amount</label>
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
              <h5 className="mt-4 mb-3">Bill Items</h5>

              <Table bordered responsive>
                <thead>
                  <tr>
                    <th width="5%">#</th>
                    <th>Item Name</th>
                    <th width="15%">Quantity</th>
                    <th width="20%">Rate</th>
                    <th width="20%">Amount</th>
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
                          onChange={(e) =>
                            handleItemChange(index, "itemname", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, "quantity", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Rate"
                          value={item.rate}
                          onChange={(e) =>
                            handleItemChange(index, "rate", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Amount"
                          value={item.amount}
                          readOnly
                        />
                      </td>
                      <td className="text-center">
                        {billItems.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-danger btn-xs sharp"
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

              <button
                type="button"
                className="btn btn-outline-primary btn-sm mb-4"
                onClick={addItemRow}
              >
                + Add Item
              </button>

              {/* GST Details */}
              <h5 className="mb-3">GST Details</h5>

              <Table bordered responsive>
                <thead>
                  <tr>
                    <th width="55%">Ledger Name</th>
                    <th>Amount</th>
                    <th width="5%"></th>
                  </tr>
                </thead>

                <tbody>
                  {gstDetails.map((g, index) => (
                    <tr key={index}>
                      <td>
                        <select
                          className="form-control"
                          value={g.LedgerName}
                          onChange={(e) =>
                            handleGstChange(index, "LedgerName", e.target.value)
                          }
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
                          onChange={(e) =>
                            handleGstChange(index, "amount", e.target.value)
                          }
                        />
                      </td>
                      <td className="text-center">
                        {gstDetails.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-danger btn-xs sharp"
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

              <button
                type="button"
                className="btn btn-outline-primary btn-sm mb-4"
                onClick={addGstRow}
              >
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
              <div className="text-end">
                <button
                  type="button"
                  className="btn btn-secondary me-2"
                  onClick={handleReset}
                >
                  Reset
                </button>

                <button type="submit" className="btn btn-primary">
                  Save Sales Invoice
                </button>
              </div>
            </form>
          </Card.Body>
        </Card>
      </Col>
    </>
  );
};

export default SalesInvoiceForm;