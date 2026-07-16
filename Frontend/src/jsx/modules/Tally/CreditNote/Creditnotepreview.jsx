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
 * Renders whatever is currently being typed into CreditNoteForm as a
 * live document preview, with running totals. Purely presentational —
 * all state lives in the parent (CreditNote.js) and is passed in as `data`.
 */
const CreditNotePreview = ({ data }) => {
  const items = (data?.items || []).filter((it) => it.name || it.qty || it.rate);
  const gstRows = (data?.gstRows || []).filter((g) => g.ledger || g.amount);

  const itemsTotal = items.reduce(
    (sum, it) => sum + (Number(it.qty) || 0) * (Number(it.rate) || 0),
    0
  );
  const gstTotal = gstRows.reduce((sum, g) => sum + (Number(g.amount) || 0), 0);
  const grandTotal = itemsTotal + gstTotal;

  const hasContent = data?.creditNo || data?.customerName || items.length > 0;

  return (
    <Card className="border-0 shadow-sm cn-preview-card">
      <Card.Header className="bg-white d-flex align-items-center justify-content-between">
        <span className="fw-bold small text-uppercase text-muted">Live Preview</span>
        <Badge bg={statusVariant[data?.status] || "secondary"} className="rounded-pill">
          {data?.status || "Draft"}
        </Badge>
      </Card.Header>

      <Card.Body>
        {!hasContent ? (
          <div className="text-center text-muted py-5">
            <i className="fa-solid fa-file-invoice fa-2x mb-3 d-block opacity-50"></i>
            <p className="mb-0 small">
              Start filling the form — the credit note preview and totals will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <div className="text-muted small">Credit Note No</div>
              <div className="fw-bold fs-5">{data?.creditNo || "—"}</div>
            </div>

            <div className="d-flex justify-content-between mb-3">
              <div>
                <div className="text-muted small">Date</div>
                <div className="fw-medium">{data?.creditDate || "—"}</div>
              </div>
              <div className="text-end">
                <div className="text-muted small">Customer</div>
                <div className="fw-medium">{data?.customerName || "—"}</div>
              </div>
            </div>

            {items.length > 0 && (
              <>
                <hr />
                <div className="text-muted small fw-bold text-uppercase mb-2">Items</div>
                {items.map((it) => {
                  const amt = (Number(it.qty) || 0) * (Number(it.rate) || 0);
                  return (
                    <div key={it.id} className="d-flex justify-content-between small mb-1">
                      <span className="text-truncate" style={{ maxWidth: "60%" }}>
                        {it.name || "Untitled item"}{" "}
                        <span className="text-muted">
                          &times;{it.qty || 0}
                        </span>
                      </span>
                      <span className="fw-medium">{formatMoney(amt)}</span>
                    </div>
                  );
                })}
              </>
            )}

            <hr />
            <div className="d-flex justify-content-between small mb-1">
              <span className="text-muted">Items Subtotal</span>
              <span className="fw-medium">{formatMoney(itemsTotal)}</span>
            </div>

            {gstRows.length > 0 && (
              <>
                {gstRows.map((g) => (
                  <div key={g.id} className="d-flex justify-content-between small mb-1">
                    <span className="text-muted">{g.ledger || "GST"}</span>
                    <span className="fw-medium">{formatMoney(g.amount)}</span>
                  </div>
                ))}
              </>
            )}

            <div className="cn-preview-total d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <span className="fw-bold">Grand Total</span>
              <span className="fw-bold fs-4 text-primary">{formatMoney(grandTotal)}</span>
            </div>
          </>
        )}
      </Card.Body>

      <style>{`
        .cn-preview-card { border-radius: 14px; }
        .cn-preview-total { background: #f8f9ff; margin: 0 -1rem -1rem; padding: 1rem !important; border-radius: 0 0 14px 14px; }
      `}</style>
    </Card>
  );
};

export default CreditNotePreview;