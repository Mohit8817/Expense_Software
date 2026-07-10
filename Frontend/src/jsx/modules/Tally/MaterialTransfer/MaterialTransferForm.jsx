import React, { useState } from "react";
import { Card, Col, Table } from "react-bootstrap";

const emptyItem = { ItemName: "", Quantity: "", Rate: "", Amount: "" };

const MaterialTransferForm = ({  onSaved }) => {
  const [formData, setFormData] = useState({
    VoucherNo: "",
    VoucherDate: "",
    Narration: "",
  });

  const [consumption, setConsumption] = useState([{ ...emptyItem }]);
  const [production, setProduction] = useState([{ ...emptyItem }]);

  // ---- Header field handlers ----
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ---- Consumption handlers ----
  const handleConsumptionChange = (index, field, value) => {
    setConsumption((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      if (field === "Quantity" || field === "Rate") {
        const qty = parseFloat(updated[index].Quantity) || 0;
        const rate = parseFloat(updated[index].Rate) || 0;
        updated[index].Amount = qty * rate;
      }
      return updated;
    });
  };

  const addConsumptionRow = () => {
    setConsumption((prev) => [...prev, { ...emptyItem }]);
  };

  const removeConsumptionRow = (index) => {
    setConsumption((prev) => prev.filter((_, i) => i !== index));
  };

  // ---- Production handlers ----
  const handleProductionChange = (index, field, value) => {
    setProduction((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      if (field === "Quantity" || field === "Rate") {
        const qty = parseFloat(updated[index].Quantity) || 0;
        const rate = parseFloat(updated[index].Rate) || 0;
        updated[index].Amount = qty * rate;
      }
      return updated;
    });
  };

  const addProductionRow = () => {
    setProduction((prev) => [...prev, { ...emptyItem }]);
  };

  const removeProductionRow = (index) => {
    setProduction((prev) => prev.filter((_, i) => i !== index));
  };

  // ---- Totals ----
  const consumptionTotal = consumption.reduce(
    (sum, item) => sum + (parseFloat(item.Amount) || 0),
    0
  );
  const productionTotal = production.reduce(
    (sum, item) => sum + (parseFloat(item.Amount) || 0),
    0
  );

  // ---- Submit ----
  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      Consumption: consumption,
      Production: production,
    };
    console.log("Material Transfer payload:", payload);
    // TODO: call your save/update API here
    if (onSaved) onSaved();
  };

  const handleReset = () => {
    setFormData({
      VoucherNo: "",
      VoucherDate: "",
      Narration: "",
    });
    setConsumption([{ ...emptyItem }]);
    setProduction([{ ...emptyItem }]);
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

              {/* Consumption */}
              <h5 className="mt-4 mb-3">Consumption</h5>

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
                  {consumption.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Item Name"
                          value={item.ItemName}
                          onChange={(e) =>
                            handleConsumptionChange(index, "ItemName", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Qty"
                          value={item.Quantity}
                          onChange={(e) =>
                            handleConsumptionChange(index, "Quantity", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Rate"
                          value={item.Rate}
                          onChange={(e) =>
                            handleConsumptionChange(index, "Rate", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Amount"
                          value={item.Amount}
                          readOnly
                        />
                      </td>
                      <td className="text-center">
                        {consumption.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-danger btn-xs sharp"
                            onClick={() => removeConsumptionRow(index)}
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
                    <td colSpan="4" className="text-end fw-bold">
                      Consumption Total
                    </td>
                    <td className="fw-bold">{consumptionTotal.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </Table>

              <button
                type="button"
                className="btn btn-outline-primary btn-sm mb-4"
                onClick={addConsumptionRow}
              >
                + Add Consumption Item
              </button>

              {/* Production */}
              <h5 className="mb-3">Production</h5>

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
                  {production.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Item Name"
                          value={item.ItemName}
                          onChange={(e) =>
                            handleProductionChange(index, "ItemName", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Qty"
                          value={item.Quantity}
                          onChange={(e) =>
                            handleProductionChange(index, "Quantity", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Rate"
                          value={item.Rate}
                          onChange={(e) =>
                            handleProductionChange(index, "Rate", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Amount"
                          value={item.Amount}
                          readOnly
                        />
                      </td>
                      <td className="text-center">
                        {production.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-danger btn-xs sharp"
                            onClick={() => removeProductionRow(index)}
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
                    <td colSpan="4" className="text-end fw-bold">
                      Production Total
                    </td>
                    <td className="fw-bold">{productionTotal.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </Table>

              <button
                type="button"
                className="btn btn-outline-primary btn-sm mb-4"
                onClick={addProductionRow}
              >
                + Add Production Item
              </button>

              {/* Summary */}
              <div className="text-end mb-3">
                <h6 className="mb-1">
                  Consumption Total: <span>{consumptionTotal.toFixed(2)}</span>
                </h6>
                <h6 className="mb-1">
                  Production Total: <span>{productionTotal.toFixed(2)}</span>
                </h6>
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
                  Save Material Transfer
                </button>
              </div>
            </form>
          </Card.Body>
        </Card>
      </Col>
    </>
  );
};

export default MaterialTransferForm;