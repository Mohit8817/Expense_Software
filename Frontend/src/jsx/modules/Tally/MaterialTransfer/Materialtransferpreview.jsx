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
 * Renders whatever is currently being typed into MaterialTransferForm as a
 * live document preview, with running totals. Purely presentational —
 * all state lives in the parent (MaterialTransfer.js) and is passed in as `data`.
 */
const MaterialTransferPreview = ({ data }) => {
  const consumption = (data?.Consumption || []).filter((it) => it.ItemName || it.Quantity || it.Rate);
  const production = (data?.Production || []).filter((it) => it.ItemName || it.Quantity || it.Rate);

  const consumptionTotal = consumption.reduce((sum, it) => sum + (Number(it.Amount) || 0), 0);
  const productionTotal = production.reduce((sum, it) => sum + (Number(it.Amount) || 0), 0);
  const grandTotal = consumptionTotal + productionTotal;

  const hasContent = data?.VoucherNo || data?.Narration || consumption.length > 0 || production.length > 0;

  return (
    <Card className="border-0 shadow-sm mt-preview-card">
      <Card.Header className="bg-white d-flex align-items-center justify-content-between">
        <span className="fw-bold small text-uppercase text-muted">Live Preview</span>
        <Badge bg={statusVariant[data?.status] || "secondary"} className="rounded-pill">
          {data?.status || "Draft"}
        </Badge>
      </Card.Header>

      <Card.Body>
        {!hasContent ? (
          <div className="text-center text-muted py-5">
            <i className="fa-solid fa-boxes-packing fa-2x mb-3 d-block opacity-50"></i>
            <p className="mb-0 small">
              Start filling the form — the material transfer preview and totals will appear here.
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

            {consumption.length > 0 && (
              <>
                <hr />
                <div className="text-muted small fw-bold text-uppercase mb-2">Consumption</div>
                {consumption.map((it, idx) => (
                  <div key={idx} className="d-flex justify-content-between small mb-1">
                    <span className="text-truncate" style={{ maxWidth: "60%" }}>
                      {it.ItemName || "Untitled item"}{" "}
                      <span className="text-muted">&times;{it.Quantity || 0}</span>
                    </span>
                    <span className="fw-medium">{formatMoney(it.Amount)}</span>
                  </div>
                ))}
                <div className="d-flex justify-content-between small mt-2">
                  <span className="text-muted">Consumption Subtotal</span>
                  <span className="fw-medium">{formatMoney(consumptionTotal)}</span>
                </div>
              </>
            )}

            {production.length > 0 && (
              <>
                <hr />
                <div className="text-muted small fw-bold text-uppercase mb-2">Production</div>
                {production.map((it, idx) => (
                  <div key={idx} className="d-flex justify-content-between small mb-1">
                    <span className="text-truncate" style={{ maxWidth: "60%" }}>
                      {it.ItemName || "Untitled item"}{" "}
                      <span className="text-muted">&times;{it.Quantity || 0}</span>
                    </span>
                    <span className="fw-medium">{formatMoney(it.Amount)}</span>
                  </div>
                ))}
                <div className="d-flex justify-content-between small mt-2">
                  <span className="text-muted">Production Subtotal</span>
                  <span className="fw-medium">{formatMoney(productionTotal)}</span>
                </div>
              </>
            )}

            <div className="mt-preview-total d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <span className="fw-bold">Grand Total</span>
              <span className="fw-bold fs-4 text-primary">
                {grandTotal.toFixed(2)}
              </span>
            </div>
          </>
        )}
      </Card.Body>

      <style>{`
        .mt-preview-card { border-radius: 14px; }
        .mt-preview-total { background: #f8f9ff; margin: 0 -1rem -1rem; padding: 1rem !important; border-radius: 0 0 14px 14px; }
      `}</style>
    </Card>
  );
};

export default MaterialTransferPreview;