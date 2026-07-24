import React from "react";
import { Card, Badge } from "react-bootstrap";
import { paymentTypeLabel, paymentModeLabel } from "../paymentVoucherApi";

const statusVariant = {
  Posted: "success",
  Draft: "warning",
  Cancelled: "danger",
};

const formatMoney = (n) =>
  `\u20b9${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PaymentPreview = ({ data }) => {
  const debitLedgers = (data?.DebitLedgers || []).filter((l) => l.LedgerName || l.Amount);
  const creditLedgers = (data?.CreditLedgers || []).filter((l) => l.LedgerName || l.Amount);
  const allocations = (data?.Allocations || []).filter((a) => a.documentNo || a.paidAmount);

  const debitTotal = debitLedgers.reduce((sum, l) => sum + (Number(l.Amount) || 0), 0);
  const creditTotal = creditLedgers.reduce((sum, l) => sum + (Number(l.Amount) || 0), 0);
  const isBalanced = debitTotal > 0 && Math.abs(debitTotal - creditTotal) < 0.001;

  const hasContent =
    data?.VoucherNo || data?.PartyName || debitLedgers.length > 0 || creditLedgers.length > 0;

  return (
    <Card className="border-0 shadow-sm pv-preview-card pi-preview-card">
      <Card.Header className="bg-white d-flex align-items-center justify-content-between">
        <span className="fw-bold small text-uppercase text-muted">Live Preview</span>
        <Badge bg={statusVariant[data?.status] || "secondary"} className="rounded-pill">
          {data?.status || "Draft"}
        </Badge>
      </Card.Header>

      <Card.Body>
        {!hasContent ? (
          <div className="text-center text-muted py-5">
            <i className="fa-solid fa-money-bill-transfer fa-2x mb-3 d-block opacity-50"></i>
            <p className="mb-0 small">Fill the form — payment preview and balance will appear here.</p>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <div className="text-muted small">{paymentTypeLabel(data?.PaymentType)} · {paymentModeLabel(data?.PaymentMode)}</div>
              <div className="fw-bold fs-5">{data?.VoucherNo || "—"}</div>
            </div>

            <div className="d-flex justify-content-between mb-3 small">
              <div>
                <div className="text-muted">Date</div>
                <div className="fw-medium">{data?.VoucherDate || "—"}</div>
              </div>
              <div className="text-end">
                <div className="text-muted">Pay To</div>
                <div className="fw-medium">{data?.PartyName || "—"}</div>
              </div>
            </div>

            {data?.FromCompanyName && (
              <div className="small mb-2 border rounded p-2 account-muted-surface">
                From: <strong>{data.FromCompanyName}</strong>
                {data.BankName ? ` · ${data.BankName}` : ""}
              </div>
            )}

            {data?.LinkedDocumentNo && (
              <div className="small mb-2 border rounded p-2 account-muted-surface">
                Against: <strong>{data.LinkedDocumentNo}</strong>
                {data.DocBalance && (
                  <div className="text-muted mt-1">
                    Balance {formatMoney(data.DocBalance.balance_amount)} of {formatMoney(data.DocBalance.document_amount)}
                  </div>
                )}
              </div>
            )}

            {allocations.length > 0 && (
              <>
                <hr />
                <div className="text-muted small fw-bold text-uppercase mb-2">Allocations</div>
                {allocations.map((a, idx) => (
                  <div key={idx} className="d-flex justify-content-between small mb-1">
                    <span>{a.documentNo || a.documentType}</span>
                    <span>{formatMoney(a.paidAmount)}</span>
                  </div>
                ))}
              </>
            )}

            {debitLedgers.length > 0 && (
              <>
                <hr />
                <div className="text-muted small fw-bold text-uppercase mb-2">Debit (Paid To)</div>
                {debitLedgers.map((l, idx) => (
                  <div key={idx} className="d-flex justify-content-between small mb-1">
                    <span className="text-truncate" style={{ maxWidth: "60%" }}>{l.LedgerName || "—"}</span>
                    <span>{formatMoney(l.Amount)}</span>
                  </div>
                ))}
              </>
            )}

            {creditLedgers.length > 0 && (
              <>
                <hr />
                <div className="text-muted small fw-bold text-uppercase mb-2">Credit (Paid From)</div>
                {creditLedgers.map((l, idx) => (
                  <div key={idx} className="d-flex justify-content-between small mb-1">
                    <span className="text-truncate" style={{ maxWidth: "60%" }}>{l.LedgerName || "—"}</span>
                    <span>{formatMoney(l.Amount)}</span>
                  </div>
                ))}
              </>
            )}

            <div className="pi-preview-total d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <span className="fw-bold">{isBalanced ? "Balanced" : "Difference"}</span>
              <span className={`fw-bold fs-4 ${isBalanced ? "text-success" : "text-danger"}`}>
                {isBalanced ? formatMoney(debitTotal) : formatMoney(debitTotal - creditTotal)}
              </span>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default PaymentPreview;
