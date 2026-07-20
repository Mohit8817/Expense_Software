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
 * Renders whatever is currently being typed into ExpenseForm as a
 * live document preview (Journal Voucher style), with company header,
 * debit/credit particulars and running totals. Purely presentational —
 * all state lives in the parent (Expense.js) and is passed in as `data`.
 */
const ExpensePreview = ({ data }) => {
  const debitLedgers = (data?.DebitLedgers || []).filter((l) => l.LedgerName || l.Amount);
  const creditLedgers = (data?.CreditLedgers || []).filter((l) => l.LedgerName || l.Amount);

  const debitTotal = debitLedgers.reduce((sum, l) => sum + (Number(l.Amount) || 0), 0);
  const creditTotal = creditLedgers.reduce((sum, l) => sum + (Number(l.Amount) || 0), 0);
  const difference = debitTotal - creditTotal;
  const isBalanced = debitTotal > 0 && difference === 0;

  const hasContent =
    data?.CompanyName || data?.VoucherNo || data?.Narration || debitLedgers.length > 0 || creditLedgers.length > 0;

  return (
    <Card className="border-0 shadow-sm ev-preview-card">
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
              Start filling the form — the expense voucher preview and totals will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Company Header */}
            {(data?.CompanyName || data?.CompanyAddress) && (
              <div className="text-center mb-3">
                <div className="fw-bold fs-6">{data?.CompanyName || "—"}</div>
                {data?.CompanyAddress && <div className="text-muted small">{data.CompanyAddress}</div>}
                {(data?.CompanyState || data?.CompanyStateCode) && (
                  <div className="text-muted small">
                    State: {data?.CompanyState || "—"} {data?.CompanyStateCode ? `(Code: ${data.CompanyStateCode})` : ""}
                  </div>
                )}
                {data?.CompanyCIN && <div className="text-muted small">CIN: {data.CompanyCIN}</div>}
                {data?.CompanyEmail && <div className="text-muted small">E-Mail: {data.CompanyEmail}</div>}
              </div>
            )}

            <hr />

            <div className="text-center fw-bold text-uppercase mb-3">{data?.VoucherType || "Journal Voucher"}</div>

            <div className="d-flex justify-content-between mb-3">
              <div>
                <div className="text-muted small">Voucher No</div>
                <div className="fw-bold fs-6">{data?.VoucherNo || "—"}</div>
              </div>
              <div className="text-end">
                <div className="text-muted small">Dated</div>
                <div className="fw-medium">{data?.VoucherDate || "—"}</div>
              </div>
            </div>

            {data?.PayeeName && (
              <div className="small mb-3">
                <span className="text-muted">To: </span>
                <span className="fw-medium">{data.PayeeName}</span>
              </div>
            )}

            {debitLedgers.length > 0 && (
              <>
                <hr />
                <div className="text-muted small fw-bold text-uppercase mb-2">Debit (Expenses)</div>
                {debitLedgers.map((l, idx) => (
                  <div key={idx} className="d-flex justify-content-between small mb-1">
                    <span className="text-truncate" style={{ maxWidth: "60%" }}>
                      {l.LedgerName || "Untitled ledger"} <span className="text-muted">Dr</span>
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
                <div className="text-muted small fw-bold text-uppercase mb-2">Credit (Payment Mode)</div>
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

            <div className="ev-preview-total d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <span className="fw-bold">
                {isBalanced ? "Balanced" : "Difference"}
              </span>
              <span className={`fw-bold fs-4 ${isBalanced ? "text-success" : "text-danger"}`}>
                {isBalanced ? formatMoney(debitTotal) : formatMoney(difference)}
              </span>
            </div>

  

    
          </>
        )}
      </Card.Body>

      <style>{`
        .ev-preview-card { border-radius: 14px; }
        .ev-preview-total { background: #f8f9ff; margin: 0 -1rem -1rem; padding: 1rem !important; border-radius: 0 0 14px 14px; }
      `}</style>
    </Card>
  );
};

export default ExpensePreview;