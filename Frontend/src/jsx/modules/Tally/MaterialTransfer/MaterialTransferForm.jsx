import React, { useEffect, useState } from "react";
import { Table } from "react-bootstrap";

const emptyItem = () => ({ ItemName: "", Quantity: "", Rate: "", Amount: "" });

const MaterialTransferForm = ({ transferId, initialData, onDataChange, onClose, onSaved }) => {
  const [formData, setFormData] = useState({
    VoucherNo: initialData?.VoucherNo || "",
    VoucherDate: initialData?.VoucherDate || "",
    Narration: initialData?.Narration || "",
    Amount: initialData?.Amount || "",
  });

  const [consumption, setConsumption] = useState(
    initialData?.Consumption?.length ? initialData.Consumption : [emptyItem()]
  );
  const [production, setProduction] = useState(
    initialData?.Production?.length ? initialData.Production : [emptyItem()]
  );

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

  const addConsumptionRow = () => setConsumption((prev) => [...prev, emptyItem()]);
  const removeConsumptionRow = (index) =>
    setConsumption((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

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

  const addProductionRow = () => setProduction((prev) => [...prev, emptyItem()]);
  const removeProductionRow = (index) =>
    setProduction((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  // ---- Totals ----
  const consumptionTotal = consumption.reduce((sum, item) => sum + (parseFloat(item.Amount) || 0), 0);
  const productionTotal = production.reduce((sum, item) => sum + (parseFloat(item.Amount) || 0), 0);
  const grandTotal = consumptionTotal + productionTotal;

  // Push the current form state up to the parent on every change so the
  // col-4 preview panel can render totals live, without this component
  // knowing or caring how (or whether) that panel is displayed.
  useEffect(() => {
    if (!onDataChange) return;
    onDataChange({
      ...formData,
      Amount: formData.Amount || grandTotal,
      Consumption: consumption,
      Production: production,
      status: initialData?.status || "Draft",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, consumption, production]);

  // ---- Submit ----
  const handleSubmit = (e) => {
    e.preventDefault();
    alert(
      transferId
        ? `(Static demo) Material transfer ${transferId} would be updated here.`
        : "(Static demo) Material transfer would be created here."
    );
    if (onSaved) onSaved();
  };

  const handleReset = () => {
    setFormData({
      VoucherNo: "",
      VoucherDate: "",
      Narration: "",
      Amount: "",
    });
    setConsumption([emptyItem()]);
    setProduction([emptyItem()]);
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

        <div className="col-md-4 mb-3">
          <label className="form-label">Amount</label>
          <input
            type="number"
            name="Amount"
            className="form-control"
            placeholder="Enter Amount"
            value={formData.Amount}
            onChange={handleFieldChange}
          />
        </div>
      </div>

      {/* Consumption */}
      <div className="d-flex align-items-center justify-content-between mt-4 mb-3">
        <h6 className="text-uppercase text-muted small fw-bold mb-0">Consumption</h6>
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
          {consumption.map((item, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Item Name"
                  value={item.ItemName}
                  onChange={(e) => handleConsumptionChange(index, "ItemName", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Qty"
                  value={item.Quantity}
                  onChange={(e) => handleConsumptionChange(index, "Quantity", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Rate"
                  value={item.Rate}
                  onChange={(e) => handleConsumptionChange(index, "Rate", e.target.value)}
                />
              </td>
              <td>
                <input type="number" className="form-control" placeholder="0" value={item.Amount} readOnly />
              </td>
              <td className="text-center">
                {consumption.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-light btn-sm text-danger"
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
      </Table>

      <button type="button" className="btn btn-outline-primary btn-sm mb-4" onClick={addConsumptionRow}>
        + Add Consumption Item
      </button>

      {/* Production */}
      <h6 className="text-uppercase text-muted small fw-bold mb-3">Production</h6>

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
          {production.map((item, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Item Name"
                  value={item.ItemName}
                  onChange={(e) => handleProductionChange(index, "ItemName", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Qty"
                  value={item.Quantity}
                  onChange={(e) => handleProductionChange(index, "Quantity", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Rate"
                  value={item.Rate}
                  onChange={(e) => handleProductionChange(index, "Rate", e.target.value)}
                />
              </td>
              <td>
                <input type="number" className="form-control" placeholder="0" value={item.Amount} readOnly />
              </td>
              <td className="text-center">
                {production.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-light btn-sm text-danger"
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
      </Table>

      <button type="button" className="btn btn-outline-primary btn-sm mb-4" onClick={addProductionRow}>
        + Add Production Item
      </button>

      {/* Totals */}
      <div className="text-end mb-3">
        <h6 className="mb-1">
          Consumption Total: <span>{consumptionTotal.toFixed(2)}</span>
        </h6>
        <h6 className="mb-1">
          Production Total: <span>{productionTotal.toFixed(2)}</span>
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
          Save Material Transfer
        </button>
      </div>
    </form>
  );
};

export default MaterialTransferForm;