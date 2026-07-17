import React from "react";
import { Card, Badge } from "react-bootstrap";

const statusVariant = {
  Posted: "success",
  Draft: "secondary",
  Cancelled: "danger",
};

const formatMoney = (n) =>
  `\u20b9${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Renders whatever is currently being typed into PaymentForm as a live
 * document preview, with running Debit/Credit totals. Purely presentational —
 * all state lives in the parent (Payment.js) and is passed in as `data`.
 */
const PaymentPreview = ({ data }) => {
  const debitLedgers = (data?.DebitLedgers || []).filter((l) => l.LedgerName || l.Amount);
  const creditLedgers = (data?.CreditLedgers || []).filter((l) => l.LedgerName || l.Amount);

  const debitTotal = debitLedgers.reduce((sum, l) => sum + (Number(l.Amount) || 0), 0);
  const creditTotal = creditLedgers.reduce((sum, l) => sum + (Number(l.Amount) || 0), 0);
  const isBalanced = debitTotal > 0 && debitTotal === creditTotal;

  const hasContent = data?.VoucherNo || data?.Narration || debitLedgers.length > 0 || creditLedgers.length > 0;

  return (
    <Card className="border-0 shadow-sm pv-preview-card">
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
            <p className="mb-0 small">
              Start filling the form — the payment voucher preview and totals will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <div className="text-muted small">Voucher No</div>
              <div className="fw-bold fs-5">{data?.VoucherNo || "—"}</div>
            </div>

            <div className="d-flex justify-content-between mb-3">
              <div>
                <div className="text-muted small">Date</div>
                <div className="fw-medium">{data?.VoucherDate || "—"}</div>
              </div>
              <div className="text-end">
                <div className="text-muted small">Narration</div>
                <div className="fw-medium text-truncate" style={{ maxWidth: 180 }}>
                  {data?.Narration || "—"}
                </div>
              </div>
            </div>

            {debitLedgers.length > 0 && (
              <>
                <hr />
                <div className="text-muted small fw-bold text-uppercase mb-2">Debit (Paid To)</div>
                {debitLedgers.map((l, idx) => (
                  <div key={idx} className="d-flex justify-content-between small mb-1">
                    <span className="text-truncate" style={{ maxWidth: "60%" }}>
                      {l.LedgerName || "Untitled ledger"}
                    </span>
                    <span className="fw-medium">{formatMoney(l.Amount)}</span>
                  </div>
                ))}
                <div className="d-flex justify-content-between small mt-2">
                  <span className="text-muted">Debit Total</span>
                  <span className="fw-medium">{formatMoney(debitTotal)}</span>
                </div>
              </>
            )}

            {creditLedgers.length > 0 && (
              <>
                <hr />
                <div className="text-muted small fw-bold text-uppercase mb-2">Credit (Paid From)</div>
                {creditLedgers.map((l, idx) => (
                  <div key={idx} className="d-flex justify-content-between small mb-1">
                    <span className="text-truncate" style={{ maxWidth: "60%" }}>
                      {l.LedgerName || "Untitled ledger"}
                    </span>
                    <span className="fw-medium">{formatMoney(l.Amount)}</span>
                  </div>
                ))}
                <div className="d-flex justify-content-between small mt-2">
                  <span className="text-muted">Credit Total</span>
                  <span className="fw-medium">{formatMoney(creditTotal)}</span>
                </div>
              </>
            )}

            <div className="pv-preview-total d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <span className="fw-bold">
                {isBalanced ? "Balanced Amount" : "Grand Total"}
              </span>
              <span className={`fw-bold fs-4 ${isBalanced ? "text-primary" : "text-danger"}`}>
                {formatMoney(debitTotal)}
              </span>
            </div>
            {!isBalanced && debitLedgers.length > 0 && creditLedgers.length > 0 && (
              <div className="text-end small text-danger mt-1">
                Debit and Credit do not match — difference {formatMoney(debitTotal - creditTotal)}
              </div>
            )}
          </>
        )}
      </Card.Body>

      <style>{`
        .pv-preview-card { border-radius: 14px; }
        .pv-preview-total { background: #f8f9ff; margin: 0 -1rem -1rem; padding: 1rem !important; border-radius: 0 0 14px 14px; }
      `}</style>
    </Card>
  );
};

export default PaymentPreview;