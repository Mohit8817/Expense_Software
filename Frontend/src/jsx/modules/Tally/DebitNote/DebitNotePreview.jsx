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
 * Renders whatever is currently being typed into DebitNoteForm as a
 * live document preview, with running totals. Purely presentational —
 * all state lives in the parent (DebitNote.js) and is passed in as `data`.
 */
const DebitNotePreview = ({ data }) => {
  const purchaseItems = (data?.PurchaseItems || []).filter((it) => it.itemname || it.quantity || it.rate);
  const gstDetails = (data?.GstDetails || []).filter((g) => g.LedgerName || g.amount);

  const itemsTotal = purchaseItems.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  const gstTotal = gstDetails.reduce((sum, g) => sum + (Number(g.amount) || 0), 0);
  const grandTotal = itemsTotal + gstTotal;

  const hasContent = data?.DebitNoteNo || data?.VendorName || purchaseItems.length > 0;

  return (
    <Card className="border-0 shadow-sm dn-preview-card">
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
              Start filling the form — the debit note preview and totals will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <div className="text-muted small">Debit Note No</div>
              <div className="fw-bold fs-5">{data?.DebitNoteNo || "—"}</div>
            </div>

            <div className="d-flex justify-content-between mb-3">
              <div>
                <div className="text-muted small">Date</div>
                <div className="fw-medium">{data?.DebitNoteDate || "—"}</div>
              </div>
              <div className="text-end">
                <div className="text-muted small">Purchase No</div>
                <div className="fw-medium">{data?.PurchaseNo || "—"}</div>
              </div>
            </div>

            <div className="d-flex justify-content-between mb-3">
              <div>
                <div className="text-muted small">Vendor</div>
                <div className="fw-medium">{data?.VendorName || "—"}</div>
              </div>
              <div className="text-end">
                <div className="text-muted small">Vendor GSTIN</div>
                <div className="fw-medium">{data?.Vendorgstin || "—"}</div>
              </div>
            </div>

            {purchaseItems.length > 0 && (
              <>
                <hr />
                <div className="text-muted small fw-bold text-uppercase mb-2">Purchase Items</div>
                {purchaseItems.map((it, idx) => (
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

            <div className="dn-preview-total d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <span className="fw-bold">Grand Total</span>
              <span className="fw-bold fs-4 text-primary">
                {formatMoney(data?.DebitNoteAmount || grandTotal)}
              </span>
            </div>
          </>
        )}
      </Card.Body>

      <style>{`
        .dn-preview-card { border-radius: 14px; }
        .dn-preview-total { background: #f8f9ff; margin: 0 -1rem -1rem; padding: 1rem !important; border-radius: 0 0 14px 14px; }
      `}</style>
    </Card>
  );
};

export default DebitNotePreview;