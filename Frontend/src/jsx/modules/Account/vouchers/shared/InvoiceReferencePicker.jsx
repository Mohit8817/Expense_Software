import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getSalesInvoiceOptions,
  getPurchaseInvoiceOptions,
  getSalesInvoiceForLink,
  getPurchaseInvoiceForLink,
  formatDate,
  formatMoney,
} from "../../accountDashboardApi";

const InvoiceReferencePicker = ({ type = "sales", label, onApply, disabled = false }) => {
  const [options, setOptions] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const rows =
          type === "purchase" ? await getPurchaseInvoiceOptions() : await getSalesInvoiceOptions();
        setOptions(Array.isArray(rows) ? rows : []);
      } catch (error) {
        toast.error(error.message || "Failed to load invoice options");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [type]);

  const handleApply = async () => {
    if (!selectedId) {
      toast.info(`Select a posted ${type === "purchase" ? "purchase" : "sales"} invoice first`);
      return;
    }
    try {
      setLoading(true);
      const record =
        type === "purchase"
          ? await getPurchaseInvoiceForLink(selectedId)
          : await getSalesInvoiceForLink(selectedId);
      onApply(record);
      toast.success("Invoice details applied to form");
    } catch (error) {
      toast.error(error.message || "Failed to load invoice details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded account-muted-surface p-3 mb-3">
      <div className="d-flex flex-wrap align-items-end gap-2">
        <div className="flex-grow-1" style={{ minWidth: 240 }}>
          <label className="form-label small fw-semibold mb-1">
            {label || (type === "purchase" ? "Link Purchase Invoice" : "Link Sales Invoice")}
          </label>
          <select
            className="form-control"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={disabled || loading}
          >
            <option value="">
              {loading ? "Loading posted invoices..." : "Select posted invoice to auto-fill"}
            </option>
            {options.map((row) => (
              <option key={row.id} value={row.id}>
                {row.invoice_no} · {formatDate(row.invoice_date)} ·{" "}
                {type === "purchase" ? row.seller_name : row.buyer_name} · {formatMoney(row.total_amount)}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={handleApply}
          disabled={disabled || loading || !selectedId}
        >
          <i className="fa fa-link me-1"></i>
          Apply
        </button>
      </div>
      <small className="text-muted d-block mt-2">
        Only posted (approved) invoices are listed. Applying will fill party, reference, items, and GST details.
      </small>
    </div>
  );
};

export default InvoiceReferencePicker;
