import React from "react";
import { Card, Badge, Table } from "react-bootstrap";

const statusVariant = {
  Posted: "success",
  Draft: "secondary",
  Cancelled: "danger",
};

const formatMoney = (n) =>
  `\u20b9${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Renders whatever is currently being typed into DebitNoteForm as a
 * live document preview, with all fields and running totals. Purely
 * presentational — all state lives in the parent (DebitNote.js) and is
 * passed in as `data`.
 */
const DebitNotePreview = ({ data }) => {
  const purchaseItems = (data?.PurchaseItems || []).filter((it) => it.itemname || it.quantity || it.rate);
  const gstDetails = (data?.GstDetails || []).filter((g) => g.LedgerName || g.rate || g.amount);

  const itemsTotal = purchaseItems.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  const totalQty = purchaseItems.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  const gstTotal = gstDetails.reduce((sum, g) => sum + (Number(g.amount) || 0), 0);
  const grandTotal = itemsTotal + gstTotal;

  const hasContent = data?.DebitNoteNo || data?.CompanyName || purchaseItems.length > 0;

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
            <div className="text-center fw-bold text-uppercase mb-3">Debit Note</div>

            {/* Company (Issuing) */}
            {(data?.CompanyName || data?.CompanyAddress) && (
              <>
                <div className="mb-1 fw-medium">{data?.CompanyName || "—"}</div>
                {data?.CompanyAddress && <div className="small text-muted mb-1">{data.CompanyAddress}</div>}
                <div className="d-flex justify-content-between small mb-3">
                  <span className="text-muted">
                    GSTIN: <span className="fw-medium text-dark">{data?.CompanyGstin || "—"}</span>
                  </span>
                  <span className="text-muted">
                    State: <span className="fw-medium text-dark">{data?.CompanyState || "—"} {data?.CompanyStateCode ? `(${data.CompanyStateCode})` : ""}</span>
                  </span>
                </div>
              </>
            )}

            <div className="d-flex justify-content-between mb-3">
              <div>
                <div className="text-muted small">Debit Note No</div>
                <div className="fw-bold fs-5">{data?.DebitNoteNo || "—"}</div>
              </div>
              <div className="text-end">
                <div className="text-muted small">Dated</div>
                <div className="fw-medium">{data?.DebitNoteDate || "—"}</div>
              </div>
            </div>

            {(data?.OriginalInvoiceNo || data?.OriginalInvoiceDate) && (
              <div className="d-flex justify-content-between mb-2 small">
                <span className="text-muted">Original Invoice No &amp; Date: </span>
                <span className="fw-medium">
                  {data?.OriginalInvoiceNo || "—"} {data?.OriginalInvoiceDate ? `dt. ${data.OriginalInvoiceDate}` : ""}
                </span>
              </div>
            )}
            {data?.OtherReferences && (
              <div className="d-flex justify-content-between mb-3 small">
                <span className="text-muted">Other References: </span>
                <span className="fw-medium">{data.OtherReferences}</span>
              </div>
            )}

            <hr />

            {/* Consignee (Ship to) */}
            {(data?.ConsigneeName || data?.ConsigneeAddress) && (
              <>
                <div className="text-muted small fw-bold text-uppercase mb-2">Consignee (Ship to)</div>
                <div className="mb-1 fw-medium">{data?.ConsigneeName || "—"}</div>
                {data?.ConsigneeAddress && <div className="small text-muted mb-1">{data.ConsigneeAddress}</div>}
                <div className="d-flex justify-content-between small mb-3">
                  <span className="text-muted">
                    GSTIN: <span className="fw-medium text-dark">{data?.ConsigneeGstin || "—"}</span>
                  </span>
                  <span className="text-muted">
                    State: <span className="fw-medium text-dark">{data?.ConsigneeState || "—"} {data?.ConsigneeStateCode ? `(${data.ConsigneeStateCode})` : ""}</span>
                  </span>
                </div>
              </>
            )}

            {/* Buyer (Bill to) */}
            <div className="text-muted small fw-bold text-uppercase mb-2">Buyer (Bill to)</div>
            <div className="mb-1 fw-medium">{data?.CustomerName || "—"}</div>
            {data?.BuyerAddress && <div className="small text-muted mb-1">{data.BuyerAddress}</div>}
            <div className="d-flex justify-content-between small mb-3">
              <span className="text-muted">
                GSTIN: <span className="fw-medium text-dark">{data?.customergstin || "—"}</span>
              </span>
              <span className="text-muted">
                State: <span className="fw-medium text-dark">{data?.BuyerState || "—"} {data?.BuyerStateCode ? `(${data.BuyerStateCode})` : ""}</span>
              </span>
            </div>

            {/* Items */}
            {purchaseItems.length > 0 && (
              <>
                <hr />
                <div className="text-muted small fw-bold text-uppercase mb-2">Description of Goods</div>
                <Table size="sm" borderless className="mb-2 dn-preview-table">
                  <thead>
                    <tr className="text-muted small">
                      <th>Item</th>
                      <th className="text-center">Qty</th>
                      <th className="text-end">Rate</th>
                      <th className="text-end">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseItems.map((it, idx) => (
                      <tr key={idx} className="small">
                        <td className="text-truncate" style={{ maxWidth: 140 }}>
                          {it.itemname || "Untitled item"}
                        </td>
                        <td className="text-center">
                          {it.quantity || 0} {it.unit || ""}
                        </td>
                        <td className="text-end">{formatMoney(it.rate)}</td>
                        <td className="text-end fw-medium">{formatMoney(it.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="small fw-bold border-top">
                      <td>Total</td>
                      <td className="text-center">{totalQty}</td>
                      <td></td>
                      <td className="text-end">{formatMoney(itemsTotal)}</td>
                    </tr>
                  </tfoot>
                </Table>
              </>
            )}

            <hr />
            <div className="d-flex justify-content-between small mb-1">
              <span className="text-muted">Items Subtotal</span>
              <span className="fw-medium">{formatMoney(itemsTotal)}</span>
            </div>

            {gstDetails.length > 0 &&
              gstDetails.map((g, idx) => (
                <div key={idx} className="d-flex justify-content-between small mb-1">
                  <span className="text-muted">
                    {g.LedgerName || "GST"} {g.rate ? `@ ${g.rate}%` : ""}
                  </span>
                  <span className="fw-medium">{formatMoney(g.amount)}</span>
                </div>
              ))}

            <div className="dn-preview-total d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <span className="fw-bold">Grand Total</span>
              <span className="fw-bold fs-4 text-primary">
                {formatMoney(data?.DebitNoteAmount || grandTotal)}
              </span>
            </div>

            {data?.AmountInWords && (
              <div className="small mt-2">
                <span className="text-muted">Amount in words: </span>
                <span className="fw-medium">{data.AmountInWords}</span>
              </div>
            )}

            {(data?.CompanyPAN || data?.AuthorisedSignatoryName) && (
              <>
                <hr />
                <div className="d-flex justify-content-between align-items-end small">
                  {data?.CompanyPAN && (
                    <div>
                      <span className="text-muted">Company's PAN: </span>
                      <span className="fw-medium">{data.CompanyPAN}</span>
                    </div>
                  )}
                  {data?.AuthorisedSignatoryName && (
                    <div className="text-end">
                      <div className="fw-medium">{data.AuthorisedSignatoryName}</div>
                      <div className="text-muted">
                        for {data?.CompanyName || "Company"}
                        <br />
                        Authorised Signatory
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </Card.Body>

      <style>{`
        .dn-preview-card { border-radius: 14px; }
        .dn-preview-total { background: #f8f9ff; margin: 0 -1rem -1rem; padding: 1rem !important; border-radius: 0 0 14px 14px; }
        .dn-preview-table th, .dn-preview-table td { padding: 0.35rem 0.4rem; }
      `}</style>
    </Card>
  );
};

export default DebitNotePreview;