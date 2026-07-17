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
 * Renders whatever is currently being typed into SalesInvoiceForm as a
 * live document preview, with running totals. Purely presentational —
 * all state lives in the parent (SalesInvoice.js) and is passed in as `data`.
 */
const SalesInvoicePreview = ({ data }) => {
  const billItems = (data?.BillItems || []).filter((it) => it.itemname || it.quantity || it.rate);
  const gstDetails = (data?.GstDetails || []).filter((g) => g.LedgerName || g.amount);

  const itemsTotal = billItems.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  const gstTotal = gstDetails.reduce((sum, g) => sum + (Number(g.amount) || 0), 0);
  const grandTotal = itemsTotal + gstTotal;

  const hasContent = data?.InvoiceNo || data?.CustomerName || billItems.length > 0;

  return (
    <Card className="border-0 shadow-sm si-preview-card">
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
              Start filling the form — the sales invoice preview and totals will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <div className="text-muted small">Invoice No</div>
              <div className="fw-bold fs-5">{data?.InvoiceNo || "—"}</div>
            </div>

            <div className="d-flex justify-content-between mb-3">
              <div>
                <div className="text-muted small">Date</div>
                <div className="fw-medium">{data?.InvoiceDate || "—"}</div>
              </div>
              <div className="text-end">
                <div className="text-muted small">Challan No</div>
                <div className="fw-medium">{data?.Challanno || "—"}</div>
              </div>
            </div>

            <div className="d-flex justify-content-between mb-3">
              <div>
                <div className="text-muted small">Customer</div>
                <div className="fw-medium">{data?.CustomerName || "—"}</div>
              </div>
              <div className="text-end">
                <div className="text-muted small">Customer GSTIN</div>
                <div className="fw-medium">{data?.customergstin || "—"}</div>
              </div>
            </div>

            {billItems.length > 0 && (
              <>
                <hr />
                <div className="text-muted small fw-bold text-uppercase mb-2">Bill Items</div>
                {billItems.map((it, idx) => (
                  <div key={idx} className="d-flex justify-content-between small mb-1">
                    <span className="text-truncate" style={{ maxWidth: "60%" }}>
                      {it.itemname || "Untitled item"}{" "}
                      <span className="text-muted">&times;{it.quantity || 0}</span>
                    </span>
                    <span className="fw-medium">{formatMoney(it.amount)}</span>
                  </div>
                ))}
              </>
            )}

            <hr />
            <div className="d-flex justify-content-between small mb-1">
              <span className="text-muted">Items Subtotal</span>
              <span className="fw-medium">{formatMoney(itemsTotal)}</span>
            </div>

            {gstDetails.length > 0 && (
              <>
                {gstDetails.map((g, idx) => (
                  <div key={idx} className="d-flex justify-content-between small mb-1">
                    <span className="text-muted">{g.LedgerName || "GST"}</span>
                    <span className="fw-medium">{formatMoney(g.amount)}</span>
                  </div>
                ))}
              </>
            )}

            <div className="si-preview-total d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <span className="fw-bold">Grand Total</span>
              <span className="fw-bold fs-4 text-primary">
           {grandTotal.toFixed(2)}
              </span>
            </div>
          </>
        )}
      </Card.Body>

      <style>{`
        .si-preview-card { border-radius: 14px; }
        .si-preview-total { background: #f8f9ff; margin: 0 -1rem -1rem; padding: 1rem !important; border-radius: 0 0 14px 14px; }
      `}</style>
    </Card>
  );
};

export default SalesInvoicePreview;