import React from "react";
import { formatBankAccountLabel } from "./companyBankUtils";

const BankAccountSelect = ({
  label = "Select Bank Account",
  placeholder = "Choose bank account",
  accounts = [],
  value,
  onChange,
  required = false,
  emptyMessage = "No bank accounts found. Add bank accounts in Company Master.",
}) => (
  <div className="mt-2">
    <label className="form-label small fw-semibold mb-1">
      {label}
      {required && accounts.length > 0 ? " *" : ""}
    </label>
    {accounts.length > 0 ? (
      <select
        className="form-control"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={required && accounts.length > 0}
      >
        <option value="">{placeholder}</option>
        {accounts.map((b) => (
          <option key={b.id} value={b.id}>
            {formatBankAccountLabel(b)}
            {b.is_primary ? " (Primary)" : ""}
          </option>
        ))}
      </select>
    ) : (
      <div className="form-control bg-light text-muted small py-2">{emptyMessage}</div>
    )}
  </div>
);

export default BankAccountSelect;
