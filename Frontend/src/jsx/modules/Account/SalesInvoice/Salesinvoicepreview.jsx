import React from "react";
import { Card, Badge, Table } from "react-bootstrap";

const statusVariant = {
  Posted: "success",
  Draft: "warning",
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
  const billItems = (data?.BillItems || []).filter(
    (it) => it.itemname || it.quantity || it.rate || it.hsnSac
  );
  const gstDetails = (data?.GstDetails || []).filter((g) => g.LedgerName || g.amount);

  const itemsTotal = billItems.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  const totalQty = billItems.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  const gstTotal = gstDetails.reduce((sum, g) => sum + (Number(g.amount) || 0), 0);
  const grandTotal = itemsTotal + gstTotal;

  const hasContent = data?.InvoiceNo || data?.CustomerName || billItems.length > 0;

  return (
    <Card className="border-0 shadow-sm si-preview-card">
      <Card.Header className="d-flex align-items-center justify-content-between">
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
            {/* Invoice Type / e-Invoice */}
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <div className="text-muted small">{data?.InvoiceType || "Tax Invoice"}</div>
                <div className="fw-bold fs-5">{data?.InvoiceNo || "—"}</div>
              </div>
              {data?.IRN && (
                <div className="text-end">
                  <div className="text-muted small">IRN</div>
                  <div className="fw-medium small text-break" style={{ maxWidth: 160 }}>
                    {data.IRN}
                  </div>
                </div>
              )}
            </div>

            {(data?.AckNo || data?.AckDate) && (
              <div className="d-flex justify-content-between mb-3 small">
                <div>
                  <span className="text-muted">Ack No: </span>
                  <span className="fw-medium">{data?.AckNo || "—"}</span>
                </div>
                <div>
                  <span className="text-muted">Ack Date: </span>
                  <span className="fw-medium">{data?.AckDate || "—"}</span>
                </div>
              </div>
            )}

            <hr />

            {/* Seller */}
            {(data?.CompanyName || data?.CompanyGstin) && (
              <div className="mb-3">
                <div className="small fw-bold text-uppercase mb-1">Seller</div>
                <div className="fw-medium">{data?.CompanyName || "—"}</div>
                <div className="small text-muted">{data?.CompanyAddress || ""}</div>
                <div className="small">GSTIN: {data?.CompanyGstin || "—"}</div>
                <div className="small">
                  {data?.CompanyState || ""} {data?.CompanyStateCode ? `(Code: ${data.CompanyStateCode})` : ""}
                </div>
                {data?.CompanyCIN && <div className="small">CIN: {data.CompanyCIN}</div>}
              </div>
            )}

            {/* Consignee */}
            {(data?.ConsigneeName || data?.ConsigneeGstin) && (
              <div className="mb-3">
                <div className="small fw-bold text-uppercase mb-1">Consignee (Ship to)</div>
                <div className="fw-medium">{data?.ConsigneeName || "—"}</div>
                <div className="small text-muted">{data?.ConsigneeAddress || ""}</div>
                <div className="small">GSTIN: {data?.ConsigneeGstin || "—"}</div>
                <div className="small">
                  {data?.ConsigneeState || ""} {data?.ConsigneeStateCode ? `(Code: ${data.ConsigneeStateCode})` : ""}
                </div>
              </div>
            )}

            {/* Buyer */}
            <div className="mb-3">
              <div className=" small fw-bold text-uppercase mb-1">Buyer (Bill to)</div>
              <div className="fw-medium">{data?.CustomerName || "—"}</div>
              <div className="small text-muted">{data?.BuyerAddress || ""}</div>
              <div className="small">GSTIN: {data?.customergstin || "—"}</div>
              <div className="small">
                {data?.BuyerState || ""} {data?.BuyerStateCode ? `(Code: ${data.BuyerStateCode})` : ""}
              </div>
            </div>

            <hr />

            {/* Invoice / Dispatch Details */}
            <div className="row g-2 small mb-3">
              <div className="col-6">
                <div className="text-muted">Invoice Date</div>
                <div className="fw-medium">{data?.InvoiceDate || "—"}</div>
              </div>
              <div className="col-6">
                <div className="text-muted">e-Way Bill No</div>
                <div className="fw-medium">{data?.EWayBillNo || "—"}</div>
              </div>
              <div className="col-6">
                <div className="text-muted">Delivery Note</div>
                <div className="fw-medium">{data?.DeliveryNote || "—"}</div>
              </div>
              <div className="col-6">
                <div className="text-muted">Mode/Terms of Payment</div>
                <div className="fw-medium">{data?.ModeTermsOfPayment || "—"}</div>
              </div>
              <div className="col-6">
                <div className="text-muted">Reference No &amp; Date</div>
                <div className="fw-medium">{data?.ReferenceNoDate || "—"}</div>
              </div>
              <div className="col-6">
                <div className="text-muted">Other References</div>
                <div className="fw-medium">{data?.OtherReferences || "—"}</div>
              </div>
              <div className="col-6">
                <div className="text-muted">Buyer's Order No</div>
                <div className="fw-medium">{data?.BuyersOrderNo || "—"}</div>
              </div>
              <div className="col-6">
                <div className="text-muted">Dated</div>
                <div className="fw-medium">{data?.BuyersOrderDate || "—"}</div>
              </div>
              <div className="col-6">
                <div className="text-muted">Dispatch Doc No</div>
                <div className="fw-medium">{data?.DispatchDocNo || "—"}</div>
              </div>
              <div className="col-6">
                <div className="text-muted">Delivery Note Date</div>
                <div className="fw-medium">{data?.DeliveryNoteDate || "—"}</div>
              </div>
              <div className="col-6">
                <div className="text-muted">Dispatched Through</div>
                <div className="fw-medium">{data?.DispatchedThrough || "—"}</div>
              </div>
              <div className="col-6">
                <div className="text-muted">Destination</div>
                <div className="fw-medium">{data?.Destination || "—"}</div>
              </div>
              <div className="col-6">
                <div className="text-muted">Bill of Lading/LR-RR No</div>
                <div className="fw-medium">{data?.BillOfLadingNo || "—"}</div>
              </div>
              <div className="col-6">
                <div className="text-muted">Motor Vehicle No</div>
                <div className="fw-medium">{data?.MotorVehicleNo || "—"}</div>
              </div>
              <div className="col-12">
                <div className="text-muted">Terms of Delivery</div>
                <div className="fw-medium">{data?.TermsOfDelivery || "—"}</div>
              </div>
            </div>

            {/* Description of Goods table */}
            {billItems.length > 0 && (
              <>
                <hr />
                <div className="small fw-bold text-uppercase mb-2">Description of Goods</div>
                <div className="table-responsive">
                  <Table size="sm" bordered className="si-preview-table small mb-2">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Item</th>
                        <th>HSN/SAC</th>
                        <th className="text-end">Qty</th>
                        <th className="text-end">Rate</th>
                        <th className="text-end">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billItems.map((it, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>{it.itemname || "—"}</td>
                          <td>{it.hsnSac || "—"}</td>
                          <td className="text-end">
                            {it.quantity || 0} {it.unit || ""}
                          </td>
                          <td className="text-end">{formatMoney(it.rate)}</td>
                          <td className="text-end fw-medium">{formatMoney(it.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} className="text-end fw-bold">
                          Total
                        </td>
                        <td className="text-end fw-bold">{totalQty}</td>
                        <td></td>
                        <td className="text-end fw-bold">{formatMoney(itemsTotal)}</td>
                      </tr>
                    </tfoot>
                  </Table>
                </div>
              </>
            )}

            {/* Tax Details table */}
            {gstDetails.length > 0 && (
              <>
                <div className="text-muted small fw-bold text-uppercase mb-2">Tax Details</div>
                <div className="table-responsive">
                  <Table size="sm" bordered className="si-preview-table small mb-2">
                    <thead>
                      <tr>
                        <th>Ledger</th>
                        <th className="text-end">Rate</th>
                        <th className="text-end">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gstDetails.map((g, idx) => (
                        <tr key={idx}>
                          <td>{g.LedgerName || "GST"}</td>
                          <td className="text-end">{g.rate ? `${g.rate}%` : "—"}</td>
                          <td className="text-end fw-medium">{formatMoney(g.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </>
            )}

            <div className="si-preview-total d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <span className="fw-bold">Grand Total</span>
              <span className="fw-bold fs-4 text-primary">{formatMoney(grandTotal)}</span>
            </div>

            {/* Amount / Tax in words */}
            {(data?.AmountInWords || data?.TaxAmountInWords) && (
              <div className="mt-3 small">
                {data?.AmountInWords && (
                  <div className="mb-1">
                    <span className="text-muted">Amount Chargeable: </span>
                    <span className="fw-medium">{data.AmountInWords}</span>
                  </div>
                )}
                {data?.TaxAmountInWords && (
                  <div>
                    <span className="text-muted">Tax Amount: </span>
                    <span className="fw-medium">{data.TaxAmountInWords}</span>
                  </div>
                )}
              </div>
            )}

            {/* Declaration / Signatory */}
            {(data?.CompanyPAN ||
              data?.Declaration ||
              data?.AuthorisedSignatoryName ||
              data?.IssuingSignatoryName ||
              data?.Jurisdiction) && (
              <>
                <hr />
                <div className="small">
                  {data?.CompanyPAN && (
                    <div className="mb-1">
                      <span className="text-muted">Company's PAN: </span>
                      <span className="fw-medium">{data.CompanyPAN}</span>
                    </div>
                  )}
                  {data?.Declaration && (
                    <div className="text-muted mb-2 fst-italic">{data.Declaration}</div>
                  )}
                  <div className="d-flex justify-content-between">
                    <div>
                      {data?.AuthorisedSignatoryName && (
                        <div className="fw-medium">{data.AuthorisedSignatoryName}</div>
                      )}
                      {data?.AuthorisedSignatoryDesignation && (
                        <div className="text-muted">{data.AuthorisedSignatoryDesignation}</div>
                      )}
                    </div>
                    <div className="text-end">
                      {data?.IssuingSignatoryName && (
                        <div className="fw-medium">{data.IssuingSignatoryName}</div>
                      )}
                      {data?.IssuingSignatoryDesignation && (
                        <div className="text-muted">{data.IssuingSignatoryDesignation}</div>
                      )}
                    </div>
                  </div>
                  {data?.Jurisdiction && (
                    <div className="text-center text-muted mt-2">{data.Jurisdiction}</div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </Card.Body>

      <style>{`
        .si-preview-card { border-radius: 14px; }
        .si-preview-total { background: #f8f9ff; margin: 0 -1rem -1rem; padding: 1rem !important; border-radius: 0 0 14px 14px; }
        .si-preview-table th, .si-preview-table td { padding: 0.35rem 0.5rem; vertical-align: middle; }
      `}</style>
    </Card>
  );
};

export default SalesInvoicePreview;