import React from "react";
import { Card, Badge } from "react-bootstrap";

const statusVariant = {
  Posted: "success",
  Draft: "warning",
  Cancelled: "danger",
};

const formatMoney = (n) =>
  `\u20b9${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ExpensePreview = ({ data }) => {
  const debitLedgers = (data?.DebitLedgers || []).filter((l) => l.LedgerName || l.Amount);
  const creditLedgers = (data?.CreditLedgers || []).filter((l) => l.LedgerName || l.Amount);

  const debitTotal = debitLedgers.reduce((sum, l) => sum + (Number(l.Amount) || 0), 0);
  const creditTotal = creditLedgers.reduce((sum, l) => sum + (Number(l.Amount) || 0), 0);
  const difference = debitTotal - creditTotal;
  const isBalanced = debitTotal > 0 && Math.abs(difference) < 0.001;

  const hasContent =
    data?.VoucherNo ||
    data?.CompanyName ||
    data?.Narration ||
    debitLedgers.length > 0 ||
    creditLedgers.length > 0;

  return (
    <Card className="border-0 shadow-sm ev-preview-card pi-preview-card">
      <Card.Header className="bg-white d-flex align-items-center justify-content-between">
        <span className="fw-bold small text-uppercase text-muted">Live Preview</span>
        <Badge bg={statusVariant[data?.status] || "secondary"} className="rounded-pill">
          {data?.status || "Draft"}
        </Badge>
      </Card.Header>

      <Card.Body>
        {!hasContent ? (
          <div className="text-center text-muted py-5">
            <i className="fa-solid fa-file-invoice-dollar fa-2x mb-3 d-block opacity-50"></i>
            <p className="mb-0 small">
              Start filling the form — the journal voucher preview and totals will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <div className="text-muted small">{data?.VoucherType || "Journal Voucher"}</div>
              <div className="fw-bold fs-5">{data?.VoucherNo || "—"}</div>
            </div>

            <div className="d-flex justify-content-between mb-3">
              <div>
                <div className="text-muted small">Date</div>
                <div className="fw-medium">{data?.VoucherDate || "—"}</div>
              </div>
              <div className="text-end">
                <div className="text-muted small">Narration</div>
                <div className="fw-medium text-truncate" style={{ maxWidth: 160 }}>
                  {data?.Narration || "—"}
                </div>
              </div>
            </div>

            {data?.CompanyName && (
              <>
                <hr />
                <div className="text-muted small fw-bold text-uppercase mb-2">Pay From</div>
                <div className="small mb-1 fw-semibold">{data.CompanyName}</div>
                <div className="small text-muted mb-1">{data.CompanyAddress || "—"}</div>
              </>
            )}

            {data?.PayeeName && (
              <>
                <hr />
                <div className="text-muted small fw-bold text-uppercase mb-2">
                  Pay To ({data.PayeeType === "EMPLOYEE" ? "Employee" : "Company"})
                </div>
                <div className="small mb-1 fw-semibold">{data.PayeeName}</div>
                {data.PayeeType === "COMPANY" ? (
                  <div className="small text-muted mb-1">{data.PayeeAddress || "—"}</div>
                ) : (
                  <div className="small text-muted mb-1">
                    {data.PayeeDesignation || "Employee"}
                    {data.PayeeEmail ? ` · ${data.PayeeEmail}` : ""}
                  </div>
                )}
              </>
            )}

            {(data?.CompanyName || data?.PayeeName) && data?.OnAccountOf && (
              <div className="small mt-2">
                <span className="text-muted">On account of: </span>
                {data.OnAccountOf}
              </div>
            )}

            {debitLedgers.length > 0 && (
              <>
                <hr />
                <div className="text-muted small fw-bold text-uppercase mb-2">Debit</div>
                {debitLedgers.map((l, idx) => (
                  <div key={idx} className="d-flex justify-content-between small mb-1">
                    <span className="text-truncate" style={{ maxWidth: "60%" }}>
                      {l.LedgerName || "Untitled ledger"}
                    </span>
                    <span className="fw-medium">{formatMoney(l.Amount)}</span>
                  </div>
                ))}
                <div className="d-flex justify-content-between small mb-1 mt-2">
                  <span className="text-muted">Debit Subtotal</span>
                  <span className="fw-medium">{formatMoney(debitTotal)}</span>
                </div>
              </>
            )}

            {creditLedgers.length > 0 && (
              <>
                <hr />
                <div className="text-muted small fw-bold text-uppercase mb-2">Credit</div>
                {creditLedgers.map((l, idx) => (
                  <div key={idx} className="d-flex justify-content-between small mb-1">
                    <span className="text-truncate" style={{ maxWidth: "60%" }}>
                      {l.LedgerName || "Untitled ledger"}
                    </span>
                    <span className="fw-medium">{formatMoney(l.Amount)}</span>
                  </div>
                ))}
                <div className="d-flex justify-content-between small mb-1 mt-2">
                  <span className="text-muted">Credit Subtotal</span>
                  <span className="fw-medium">{formatMoney(creditTotal)}</span>
                </div>
              </>
            )}

            <div className="pi-preview-total d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <span className="fw-bold">{isBalanced ? "Balanced" : "Difference"}</span>
              <span className={`fw-bold fs-4 ${isBalanced ? "text-success" : "text-danger"}`}>
                {isBalanced ? formatMoney(debitTotal) : formatMoney(difference)}
              </span>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default ExpensePreview;
