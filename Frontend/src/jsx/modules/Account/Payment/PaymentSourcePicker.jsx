import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  DOCUMENT_TYPES,
  getPaymentLinkOptions,
  getPaymentLinkDocument,
} from "../paymentVoucherApi";
import { formatDate } from "../voucherDocumentApi";
import { formatMoney } from "../accountDashboardApi";

const PaymentSourcePicker = ({ documentType, onDocumentTypeChange, onApply, excludePaymentId, disabled }) => {
  const [options, setOptions] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [balanceInfo, setBalanceInfo] = useState(null);

  useEffect(() => {
    if (!documentType) {
      setOptions([]);
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        const rows = await getPaymentLinkOptions(documentType);
        setOptions(Array.isArray(rows) ? rows : []);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [documentType]);

  const handleApply = async () => {
    if (!documentType || !selectedId) {
      toast.info("Select document type and a posted document");
      return;
    }
    try {
      setLoading(true);
      const data = await getPaymentLinkDocument(documentType, selectedId, excludePaymentId);
      setBalanceInfo(data);
      onApply(data);
      toast.success("Document linked — party and balance loaded");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const labelForRow = (row) => {
    if (documentType === "JOURNAL") {
      return `${row.voucher_no} · ${formatDate(row.voucher_date)} · ${row.company_name} · ${formatMoney(row.total_debit)}`;
    }
    if (documentType === "CREDIT_NOTE") {
      return `${row.credit_note_no} · ${formatDate(row.credit_note_date)} · ${row.buyer_name} · ${formatMoney(row.total_amount)}`;
    }
    if (documentType === "DEBIT_NOTE") {
      return `${row.debit_note_no} · ${formatDate(row.debit_note_date)} · ${row.buyer_name} · ${formatMoney(row.total_amount)}`;
    }
    if (documentType === "DELIVERY_CHALLAN") {
      return `${row.challan_no} · ${formatDate(row.challan_date)} · ${row.buyer_name} · ${formatMoney(row.total_amount)}`;
    }
    if (documentType === "PURCHASE") {
      return `${row.invoice_no} · ${formatDate(row.invoice_date)} · ${row.seller_name} · ${formatMoney(row.total_amount)}`;
    }
    return `${row.invoice_no} · ${formatDate(row.invoice_date)} · ${row.buyer_name} · ${formatMoney(row.total_amount)}`;
  };

  return (
    <div className="border rounded account-muted-surface p-3 mb-3">
      <div className="row g-2 align-items-end">
        <div className="col-md-3">
          <label className="form-label small fw-semibold">Link Document Type</label>
          <select
            className="form-control"
            value={documentType}
            onChange={(e) => {
              onDocumentTypeChange(e.target.value);
              setSelectedId("");
              setBalanceInfo(null);
            }}
            disabled={disabled}
          >
            <option value="">None / General</option>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-7">
          <label className="form-label small fw-semibold">Posted Document</label>
          <select
            className="form-control"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={disabled || !documentType || loading}
          >
            <option value="">{loading ? "Loading..." : "Select posted document"}</option>
            {options.map((row) => (
              <option key={row.id} value={row.id}>
                {labelForRow(row)}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <button type="button" className="btn btn-outline-primary w-100" onClick={handleApply} disabled={disabled || loading || !selectedId}>
            Apply
          </button>
        </div>
      </div>
      {balanceInfo && (
        <div className="small mt-2 text-muted">
          Doc total {formatMoney(balanceInfo.document_amount)} · Paid {formatMoney(balanceInfo.paid_amount)} · Balance{" "}
          <strong className="text-primary">{formatMoney(balanceInfo.balance_amount)}</strong>
        </div>
      )}
    </div>
  );
};

export default PaymentSourcePicker;
