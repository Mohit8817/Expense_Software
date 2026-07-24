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
 * Renders whatever is currently being typed into PurchaseInvoiceForm as a
 * live document preview, with all fields and running totals. Purely
 * presentational — all state lives in the parent (PurchaseInvoice.js) and
 * is passed in as `data`.
 */
const PurchaseInvoicePreview = ({ data }) => {
  const purchaseItems = (data?.PurchaseItems || []).filter(
    (it) => it.itemname || it.hsnSac || it.quantity || it.rate
  );
  const gstDetails = (data?.GstDetails || []).filter((g) => g.LedgerName || g.rate || g.amount);

  const itemsTotal = purchaseItems.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  const totalQty = purchaseItems.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  const gstTotal = gstDetails.reduce((sum, g) => sum + (Number(g.amount) || 0), 0);
  const grandTotal = itemsTotal + gstTotal;

  const hasContent = data?.PurchaseNo || data?.VendorName || purchaseItems.length > 0;

  return (
    <Card className="border-0 shadow-sm pi-preview-card">
      <Card.Header className="d-flex align-items-center justify-content-between">
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
              Start filling the form — the purchase invoice preview and totals will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Invoice Type / e-Invoice */}
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <div className="text-muted small">Invoice Type</div>
                <div className="fw-bold fs-6">{data?.InvoiceType || "—"}</div>
              </div>
              {data?.IRN && (
                <div className="text-end">
                  <div className="text-muted small">IRN</div>
                  <div className="fw-medium text-break" style={{ maxWidth: 220, fontSize: 11 }}>
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

            <div className="mb-3">
              <div className="text-muted small">Purchase / Invoice No</div>
              <div className="fw-bold fs-5">{data?.PurchaseNo || "—"}</div>
            </div>

            <div className="d-flex justify-content-between mb-3">
              <div>
                <div className="text-muted small">Invoice Date</div>
                <div className="fw-medium">{data?.PurchaseDate || "—"}</div>
              </div>
              <div className="text-end">
                <div className="text-muted small">e-Way Bill No</div>
                <div className="fw-medium">{data?.EWayBillNo || "—"}</div>
              </div>
            </div>

            <hr />

            {/* Vendor (Seller) */}
            <div className="text-muted small fw-bold text-uppercase mb-2">Vendor (Seller)</div>
            <div className="mb-1 fw-medium">{data?.VendorName || "—"}</div>
            {data?.VendorAddress && <div className="small text-muted mb-1">{data.VendorAddress}</div>}
            <div className="d-flex justify-content-between small mb-1">
              <span className="text-muted">
                GSTIN: <span className="fw-medium text-dark">{data?.Vendorgstin || "—"}</span>
              </span>
              <span className="text-muted">
                State: <span className="fw-medium text-dark">{data?.VendorState || "—"}</span>
              </span>
            </div>
            <div className="d-flex justify-content-between small mb-1">
              <span className="text-muted">
                State Code: <span className="fw-medium text-dark">{data?.VendorStateCode || "—"}</span>
              </span>
              <span className="text-muted">
                CIN: <span className="fw-medium text-dark">{data?.VendorCIN || "—"}</span>
              </span>
            </div>
            <div className="small text-muted mb-3">
              Email: <span className="fw-medium text-dark">{data?.VendorEmail || "—"}</span>
            </div>
            {(data?.BankName || data?.BankAccountNo || data?.BankBranch || data?.BankIfsc) && (
              <>
                <div className="text-muted small fw-bold text-uppercase mb-2">Vendor Bank Details</div>
                <div className="small text-muted mb-1">
                  Bank: <span className="fw-medium text-dark">{data?.BankName || "—"}</span>
                </div>
                <div className="small text-muted mb-1">
                  A/C No: <span className="fw-medium text-dark">{data?.BankAccountNo || "—"}</span>
                </div>
                <div className="small text-muted mb-1">
                  Branch: <span className="fw-medium text-dark">{data?.BankBranch || "—"}</span>
                </div>
                <div className="small text-muted mb-3">
                  IFSC: <span className="fw-medium text-dark">{data?.BankIfsc || "—"}</span>
                </div>
              </>
            )}

            {/* Consignee (Ship to) */}
            {(data?.ConsigneeName || data?.ConsigneeAddress) && (
              <>
                <div className="text-muted small fw-bold text-uppercase mb-2">Consignee (Ship to)</div>
                <div className="mb-1 fw-medium">{data?.ConsigneeName || "—"}</div>
                {data?.ConsigneeAddress && <div className="small text-muted mb-1">{data.ConsigneeAddress}</div>}
                <div className="d-flex justify-content-between small mb-1">
                  <span className="text-muted">
                    GSTIN: <span className="fw-medium text-dark">{data?.ConsigneeGstin || "—"}</span>
                  </span>
                  <span className="text-muted">
                    State: <span className="fw-medium text-dark">{data?.ConsigneeState || "—"}</span>
                  </span>
                </div>
                <div className="d-flex justify-content-between small mb-1">
                  <span className="text-muted">
                    State Code: <span className="fw-medium text-dark">{data?.ConsigneeStateCode || "—"}</span>
                  </span>
                </div>
                <div className="small text-muted mb-3">
                  Email: <span className="fw-medium text-dark">{data?.ConsigneeEmail || "—"}</span>
                </div>
              </>
            )}

            {/* Buyer (Company / Bill to) */}
            <div className="text-muted small fw-bold text-uppercase mb-2">Buyer (Bill to)</div>
            <div className="mb-1 fw-medium">{data?.CompanyName || "—"}</div>
            {data?.CompanyAddress && <div className="small text-muted mb-1">{data.CompanyAddress}</div>}
            <div className="d-flex justify-content-between small mb-1">
              <span className="text-muted">
                GSTIN: <span className="fw-medium text-dark">{data?.CompanyGstin || "—"}</span>
              </span>
              <span className="text-muted">
                State: <span className="fw-medium text-dark">{data?.CompanyState || "—"}</span>
              </span>
            </div>
            <div className="d-flex justify-content-between small mb-1">
              <span className="text-muted">
                State Code: <span className="fw-medium text-dark">{data?.CompanyStateCode || "—"}</span>
              </span>
              <span className="text-muted">
                PAN: <span className="fw-medium text-dark">{data?.CompanyPAN || "—"}</span>
              </span>
            </div>
            <div className="small text-muted mb-3">
              Email: <span className="fw-medium text-dark">{data?.CompanyEmail || "—"}</span>
            </div>

            <hr />

            {/* Dispatch / Delivery Details */}
            <div className="text-muted small fw-bold text-uppercase mb-2">Dispatch &amp; Delivery</div>
            <div className="row small mb-3">
              <div className="col-6 mb-1">
                <span className="text-muted">Delivery Note: </span>
                <span className="fw-medium">{data?.DeliveryNote || "—"}</span>
              </div>
              <div className="col-6 mb-1">
                <span className="text-muted">Mode/Terms of Payment: </span>
                <span className="fw-medium">{data?.ModeTermsOfPayment || "—"}</span>
              </div>
              <div className="col-6 mb-1">
                <span className="text-muted">Reference No &amp; Date: </span>
                <span className="fw-medium">{data?.ReferenceNoDate || "—"}</span>
              </div>
              <div className="col-6 mb-1">
                <span className="text-muted">Other References: </span>
                <span className="fw-medium">{data?.OtherReferences || "—"}</span>
              </div>
              <div className="col-6 mb-1">
                <span className="text-muted">Buyer's Order No: </span>
                <span className="fw-medium">{data?.PONo || "—"}</span>
              </div>
              <div className="col-6 mb-1">
                <span className="text-muted">Dated: </span>
                <span className="fw-medium">{data?.PODate || "—"}</span>
              </div>
              <div className="col-6 mb-1">
                <span className="text-muted">Dispatch Doc No: </span>
                <span className="fw-medium">{data?.DispatchDocNo || "—"}</span>
              </div>
              <div className="col-6 mb-1">
                <span className="text-muted">Delivery Note Date: </span>
                <span className="fw-medium">{data?.DeliveryNoteDate || "—"}</span>
              </div>
              <div className="col-6 mb-1">
                <span className="text-muted">Dispatched Through: </span>
                <span className="fw-medium">{data?.DispatchedThrough || "—"}</span>
              </div>
              <div className="col-6 mb-1">
                <span className="text-muted">Destination: </span>
                <span className="fw-medium">{data?.Destination || "—"}</span>
              </div>
              <div className="col-6 mb-1">
                <span className="text-muted">Bill of Lading/LR-RR No: </span>
                <span className="fw-medium">{data?.BillOfLadingNo || "—"}</span>
              </div>
              <div className="col-6 mb-1">
                <span className="text-muted">Motor Vehicle No: </span>
                <span className="fw-medium">{data?.MotorVehicleNo || "—"}</span>
              </div>
              <div className="col-12 mb-1">
                <span className="text-muted">Terms of Delivery: </span>
                <span className="fw-medium">{data?.TermsOfDelivery || "—"}</span>
              </div>
            </div>

            {/* Items */}
            {purchaseItems.length > 0 && (
              <>
                <hr />
                <div className="text-muted small fw-bold text-uppercase mb-2">Description of Goods</div>
                <div className="table-responsive">
                <Table size="sm" borderless className="mb-2 pi-preview-table">
                  <thead>
                    <tr className="text-muted small">
                      <th>Item</th>
                      <th className="text-center">HSN/SAC</th>
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
                        <td className="text-center text-muted">{it.hsnSac || "—"}</td>
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
                      <td colSpan={2}>Total</td>
                      <td className="text-center">{totalQty}</td>
                      <td></td>
                      <td className="text-end">{formatMoney(itemsTotal)}</td>
                    </tr>
                  </tfoot>
                </Table>
                </div>
              </>
            )}

            <hr />
            <div className="d-flex justify-content-between small mb-1">
              <span className="text-muted">Taxable Value</span>
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

            <div className="pi-preview-total d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <span className="fw-bold">Grand Total</span>
              <span className="fw-bold fs-4 text-primary">{formatMoney(grandTotal)}</span>
            </div>

            {data?.AmountInWords && (
              <div className="small mt-2">
                <span className="text-muted">Amount in words: </span>
                <span className="fw-medium">{data.AmountInWords}</span>
              </div>
            )}
            {data?.TaxAmountInWords && (
              <div className="small mt-1">
                <span className="text-muted">Tax amount in words: </span>
                <span className="fw-medium">{data.TaxAmountInWords}</span>
              </div>
            )}

            {/* Declaration / Signatory */}
            {(data?.CompanyPAN || data?.Declaration || data?.AuthorisedSignatoryName || data?.IssuingSignatoryName) && (
              <>
                <hr />
                <div className="text-muted small fw-bold text-uppercase mb-2">Declaration &amp; Signatory</div>
                {data?.CompanyPAN && (
                  <div className="small mb-1">
                    <span className="text-muted">Company's PAN: </span>
                    <span className="fw-medium">{data.CompanyPAN}</span>
                  </div>
                )}
                {data?.Declaration && <div className="small text-muted fst-italic mb-2">{data.Declaration}</div>}
                <div className="row small">
                  {(data?.AuthorisedSignatoryName || data?.AuthorisedSignatoryDesignation) && (
                    <div className="col-6 mb-1">
                      <div className="text-muted">Authorised Signatory</div>
                      <div className="fw-medium">
                        {data?.AuthorisedSignatoryName || "—"}
                        {data?.AuthorisedSignatoryDesignation ? `, ${data.AuthorisedSignatoryDesignation}` : ""}
                      </div>
                    </div>
                  )}
                  {(data?.IssuingSignatoryName || data?.IssuingSignatoryDesignation) && (
                    <div className="col-6 mb-1">
                      <div className="text-muted">Issuing Signatory</div>
                      <div className="fw-medium">
                        {data?.IssuingSignatoryName || "—"}
                        {data?.IssuingSignatoryDesignation ? `, ${data.IssuingSignatoryDesignation}` : ""}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default PurchaseInvoicePreview;