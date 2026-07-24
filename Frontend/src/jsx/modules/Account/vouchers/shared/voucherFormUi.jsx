import React from "react";
import { Table } from "react-bootstrap";
import { getUnitSelectOptions } from "../../constants/measurementUnits";
import { blockNegativeNumberKeys, finalizeNonNegativeInput } from "./numberInputUtils";

export const NonNegativeNumberInput = ({
  value,
  onChange,
  onBlur,
  className = "form-control",
  step = "0.01",
  placeholder,
  readOnly = false,
  disabled = false,
  min = 0,
}) => (
  <input
    type="number"
    min={min}
    step={step}
    className={className}
    placeholder={placeholder}
    value={value ?? ""}
    readOnly={readOnly}
    disabled={disabled}
    onKeyDown={readOnly ? undefined : blockNegativeNumberKeys}
    onChange={(e) => onChange(e.target.value)}
    onBlur={(e) => {
      const finalized = finalizeNonNegativeInput(e.target.value, false);
      if (finalized !== e.target.value) onChange(finalized);
      onBlur?.(e);
    }}
  />
);

export const DetailRow = ({ label, value }) => (
  <div className="d-flex gap-2 small mb-1">
    <span className="text-muted flex-shrink-0">{label}</span>
    <span className="fw-medium">{value || "—"}</span>
  </div>
);

export const PartyInfoCard = ({ hasData, children }) =>
  hasData ? (
    <div className="pi-party-card border rounded account-muted-surface p-3 mt-2">{children}</div>
  ) : (
    <div className="pi-party-empty text-muted small p-3 border rounded account-surface mt-2">
      Select a company to view details
    </div>
  );

export const FormSection = ({ title, icon, children, className = "" }) => (
  <div className={`pi-form-section card border-0 shadow-sm mb-3 ${className}`.trim()}>
    <div className="card-header border-bottom py-3">
      <h6 className="mb-0 fw-bold">
        {icon && <i className={`${icon} me-2 text-primary`}></i>}
        {title}
      </h6>
    </div>
    <div className="card-body">{children}</div>
  </div>
);

export const PartySection = ({
  title,
  companyId,
  companies,
  fieldConfig,
  formData,
  onCompanyChange,
}) => (
  <div className="mb-4">
    <h6 className="text-uppercase small fw-bold mb-2">{title}</h6>
    <select className="form-control" value={companyId} onChange={(e) => onCompanyChange(e.target.value)}>
      <option value="">Select Company</option>
      {companies.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name} {c.short_name ? `(${c.short_name})` : ""}
        </option>
      ))}
    </select>
    <PartyInfoCard hasData={Boolean(companyId)}>
      {fieldConfig.map(({ label, key }) => (
        <DetailRow key={key} label={label} value={formData[key]} />
      ))}
    </PartyInfoCard>
  </div>
);

export const LineItemsTable = ({ items, products, onProductSelect, onItemChange, onItemBlur, onAdd, onRemove }) => (
  <>
    <Table bordered responsive className="align-middle">
      <thead>
        <tr>
          <th width="4%">#</th>
          <th width="22%">Product</th>
          <th>Description</th>
          <th width="10%">HSN/SAC</th>
          <th width="8%">Qty</th>
          <th width="8%">Unit</th>
          <th width="10%">Rate</th>
          <th width="10%">Amount</th>
          <th width="4%"></th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={index}>
            <td>{index + 1}</td>
            <td>
              <select
                className="form-control form-control-sm"
                value={item.productId}
                onChange={(e) => onProductSelect(index, e.target.value)}
              >
                <option value="">Select Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </td>
            <td>
              <input
                type="text"
                className="form-control form-control-sm"
                value={item.itemname}
                onChange={(e) => onItemChange(index, "itemname", e.target.value)}
              />
            </td>
            <td>
              <input
                type="text"
                className="form-control form-control-sm"
                value={item.hsnSac}
                onChange={(e) => onItemChange(index, "hsnSac", e.target.value)}
              />
            </td>
            <td>
              <NonNegativeNumberInput
                className="form-control form-control-sm"
                step="0.001"
                placeholder="Qty"
                value={item.quantity}
                onChange={(value) => onItemChange(index, "quantity", value)}
                onBlur={() => onItemBlur?.(index, "quantity")}
              />
            </td>
            <td>
              <select
                className="form-control form-control-sm"
                value={item.unit}
                onChange={(e) => onItemChange(index, "unit", e.target.value)}
              >
                {getUnitSelectOptions(item.unit).map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </td>
            <td>
              <NonNegativeNumberInput
                className="form-control form-control-sm"
                step="0.01"
                placeholder="Rate"
                value={item.rate}
                onChange={(value) => onItemChange(index, "rate", value)}
                onBlur={() => onItemBlur?.(index, "rate")}
              />
            </td>
            <td>
              <NonNegativeNumberInput
                className="form-control form-control-sm"
                value={item.amount ?? ""}
                readOnly
              />
            </td>
            <td className="text-center">
              {items.length > 1 && (
                <button type="button" className="btn btn-light btn-sm text-danger" onClick={() => onRemove(index)}>
                  <i className="fa fa-trash"></i>
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
    <button type="button" className="btn btn-outline-primary btn-sm mb-3" onClick={onAdd}>
      + Add Item
    </button>
  </>
);

export const GstDetailsTable = ({ gstDetails, itemsTotal, onChange, onBlur, onAdd, onRemove }) => (
  <>
    <Table bordered responsive className="align-middle">
      <thead>
        <tr>
          <th width="40%">Ledger</th>
          <th width="20%">Rate (%)</th>
          <th>Amount</th>
          <th width="4%"></th>
        </tr>
      </thead>
      <tbody>
        {gstDetails.map((g, index) => (
          <tr key={index}>
            <td>
              <select
                className="form-control"
                value={g.LedgerName}
                onChange={(e) => onChange(index, "LedgerName", e.target.value)}
              >
                <option value="">Select Ledger</option>
                <option value="CGST">CGST</option>
                <option value="SGST">SGST</option>
                <option value="IGST">IGST</option>
              </select>
            </td>
            <td>
              <NonNegativeNumberInput
                step="0.01"
                placeholder="Rate %"
                value={g.rate}
                onChange={(value) => onChange(index, "rate", value, itemsTotal)}
                onBlur={() => onBlur?.(index, "rate", itemsTotal)}
              />
            </td>
            <td>
              <NonNegativeNumberInput
                step="0.01"
                placeholder="Amount"
                value={g.amount}
                onChange={(value) => onChange(index, "amount", value, itemsTotal)}
                onBlur={() => onBlur?.(index, "amount", itemsTotal)}
              />
            </td>
            <td className="text-center">
              {gstDetails.length > 1 && (
                <button type="button" className="btn btn-light btn-sm text-danger" onClick={() => onRemove(index)}>
                  <i className="fa fa-trash"></i>
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
    <button type="button" className="btn btn-outline-primary btn-sm mb-3" onClick={onAdd}>
      + Add GST Row
    </button>
  </>
);

export const TaxBreakupTable = ({ rows, onChange, onBlur, onAdd, onRemove }) => (
  <>
    <Table bordered responsive className="align-middle small">
      <thead>
        <tr>
          <th>HSN/SAC</th>
          <th>Taxable Value</th>
          <th>CGST %</th>
          <th>CGST Amt</th>
          <th>SGST %</th>
          <th>SGST Amt</th>
          <th>IGST %</th>
          <th>IGST Amt</th>
          <th>Total Tax</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            {[
              "hsnSac",
              "taxableValue",
              "cgstRate",
              "cgstAmount",
              "sgstRate",
              "sgstAmount",
              "igstRate",
              "igstAmount",
              "totalTaxAmount",
            ].map((field) => (
              <td key={field}>
                {field === "hsnSac" ? (
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={row[field]}
                    onChange={(e) => onChange(index, field, e.target.value)}
                  />
                ) : (
                  <NonNegativeNumberInput
                    className="form-control form-control-sm"
                    step="0.01"
                    value={row[field]}
                    onChange={(value) => onChange(index, field, value)}
                    onBlur={() => onBlur?.(index, field)}
                  />
                )}
              </td>
            ))}
            <td className="text-center">
              {rows.length > 1 && (
                <button type="button" className="btn btn-light btn-sm text-danger" onClick={() => onRemove(index)}>
                  <i className="fa fa-trash"></i>
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
    <button type="button" className="btn btn-outline-primary btn-sm mb-3" onClick={onAdd}>
      + Add HSN Tax Row
    </button>
  </>
);

export const DeclarationSection = ({ formData, onFieldChange }) => (
  <div className="row">
    <div className="col-md-6 mb-3">
      <label className="form-label">Amount in Words</label>
      <textarea
        name="AmountInWords"
        className="form-control"
        rows={2}
        value={formData.AmountInWords || ""}
        onChange={onFieldChange}
      />
    </div>
    <div className="col-md-6 mb-3">
      <label className="form-label">Tax Amount in Words</label>
      <textarea
        name="TaxAmountInWords"
        className="form-control"
        rows={2}
        value={formData.TaxAmountInWords || ""}
        onChange={onFieldChange}
      />
    </div>
    <div className="col-md-6 mb-3">
      <label className="form-label">Authorised Signatory Name</label>
      <input
        type="text"
        name="AuthorisedSignatoryName"
        className="form-control"
        value={formData.AuthorisedSignatoryName || ""}
        onChange={onFieldChange}
      />
    </div>
    <div className="col-md-6 mb-3">
      <label className="form-label">Authorised Signatory Designation</label>
      <input
        type="text"
        name="AuthorisedSignatoryDesignation"
        className="form-control"
        value={formData.AuthorisedSignatoryDesignation || ""}
        onChange={onFieldChange}
      />
    </div>
  </div>
);

export const TotalsBar = ({ itemsTotal, gstTotal, grandTotal }) => (
  <div className="text-end mb-3">
    <h6 className="mb-1">Items Total: ₹{itemsTotal.toFixed(2)}</h6>
    <h6 className="mb-1">GST Total: ₹{gstTotal.toFixed(2)}</h6>
    <h5>
      Grand Total: <strong>₹{grandTotal.toFixed(2)}</strong>
    </h5>
  </div>
);

export const FormActions = ({ submitting, editId, saveLabel, onClose }) => (
  <div className="text-end border-top pt-3">
    {onClose && (
      <button type="button" className="btn btn-outline-secondary me-2" onClick={onClose}>
        Cancel
      </button>
    )}
    <button type="submit" className="btn btn-primary" disabled={submitting}>
      {submitting ? "Saving..." : editId ? `Update ${saveLabel}` : `Save ${saveLabel}`}
    </button>
  </div>
);

export const TextField = ({ label, name, value, onChange, type = "text", placeholder = "" }) => (
  <div className="col-md-4 mb-3">
    <label className="form-label">{label}</label>
    <input
      type={type}
      name={name}
      className="form-control"
      placeholder={placeholder || label}
      value={value || ""}
      onChange={onChange}
    />
  </div>
);
