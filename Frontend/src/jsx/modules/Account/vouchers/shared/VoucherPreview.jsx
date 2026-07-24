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
 * Generic live preview for Credit Note, Debit Note, and Delivery Challan.
 * Expects unified form field names from useVoucherForm.
 */
const VoucherPreview = ({
  data,
  docNoLabel,
  docNoKey,
  dateKey,
  partyLabel,
  partyKey,
  icon = "fa-file-invoice",
  emptyMessage,
}) => {
  const items = (data?.Items || []).filter((it) => it.itemname || it.quantity || it.rate);
  const gstDetails = (data?.GstDetails || []).filter((g) => g.LedgerName || g.amount);

  const itemsTotal = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  const gstTotal = gstDetails.reduce((sum, g) => sum + (Number(g.amount) || 0), 0);
  const grandTotal = Number(data?.TotalAmount) || itemsTotal + gstTotal;

  const hasContent = data?.[docNoKey] || data?.[partyKey] || items.length > 0;

  return (
    <Card className="border-0 shadow-sm voucher-preview-card">
      <Card.Header className="bg-white d-flex align-items-center justify-content-between">
        <span className="fw-bold small text-uppercase text-muted">Live Preview</span>
        <Badge bg={statusVariant[data?.status] || "secondary"} className="rounded-pill">
          {data?.status || "Draft"}
        </Badge>
      </Card.Header>
      <Card.Body>
        {!hasContent ? (
          <div className="text-center text-muted py-5">
            <i className={`fa-solid ${icon} fa-2x mb-3 d-block opacity-50`}></i>
            <p className="mb-0 small">{emptyMessage}</p>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <div className="text-muted small">{docNoLabel}</div>
              <div className="fw-bold fs-5">{data?.[docNoKey] || "—"}</div>
            </div>

            <div className="d-flex justify-content-between mb-3">
              <div>
                <div className="text-muted small">Date</div>
                <div className="fw-medium">{data?.[dateKey] || "—"}</div>
              </div>
              <div className="text-end">
                <div className="text-muted small">{partyLabel}</div>
                <div className="fw-medium">{data?.[partyKey] || "—"}</div>
              </div>
            </div>

            {data?.SellerName && (
              <div className="small mb-2">
                <span className="text-muted">Seller: </span>
                <span className="fw-medium">{data.SellerName}</span>
              </div>
            )}

            {items.length > 0 && (
              <>
                <hr />
                <div className="text-muted small fw-bold text-uppercase mb-2">Items</div>
                {items.map((it, idx) => (
                  <div key={idx} className="d-flex justify-content-between small mb-1">
                    <span className="text-truncate" style={{ maxWidth: "60%" }}>
                      {it.itemname || "Item"}{" "}
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

            {gstDetails.map((g, idx) => (
              <div key={idx} className="d-flex justify-content-between small mb-1">
                <span className="text-muted">{g.LedgerName || "GST"}</span>
                <span className="fw-medium">{formatMoney(g.amount)}</span>
              </div>
            ))}

            <div className="voucher-preview-total d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <span className="fw-bold">Grand Total</span>
              <span className="fw-bold fs-4 text-primary">{formatMoney(grandTotal)}</span>
            </div>
          </>
        )}
      </Card.Body>
      <style>{`
        .voucher-preview-card { border-radius: 14px; }
        .voucher-preview-total { background: #f8f9ff; margin: 0 -1rem -1rem; padding: 1rem !important; border-radius: 0 0 14px 14px; }
      `}</style>
    </Card>
  );
};

export default VoucherPreview;
