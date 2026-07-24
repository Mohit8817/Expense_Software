import React from "react";
import { Card, Badge, Row, Col } from "react-bootstrap";
import SalesInvoicePreview from "./Salesinvoicepreview";
import DocumentAttachments from "../vouchers/shared/DocumentAttachments";
import { ATTACHMENT_DOCUMENT_TYPES } from "../documentAttachmentApi";

const statusVariant = {
  Posted: "success",
  Draft: "warning",
  Cancelled: "danger",
};

const tallyVariant = {
  PUSHED: "success",
  FAILED: "danger",
  NOT_PUSHED: "secondary",
};

const formatMoney = (n) =>
  `\u20b9${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const SummaryTile = ({ label, value, sub }) => (
  <Card className="border-0 shadow-sm h-100">
    <Card.Body className="py-3">
      <small className="text-muted text-uppercase fw-semibold d-block mb-1">{label}</small>
      <div className="fw-bold text-truncate" title={value}>{value || "—"}</div>
      {sub && <small className="text-muted">{sub}</small>}
    </Card.Body>
  </Card>
);

const SalesInvoiceView = ({
  data,
  onBack,
  onEdit,
  onDelete,
  onApprove,
  onTallyPush,
  onRetryTally,
  canEdit,
  actionBusy,
  recordId,
}) => {
  const canApprove = data?.status === "Draft";
  const canTallyPush = data?.status === "Posted" && data?.tally_push_status === "NOT_PUSHED";
  const canRetryTally = data?.status === "Posted" && data?.tally_push_status === "FAILED";

  return (
    <>
      <Card className="border-0 shadow-sm mb-3">
        <Card.Header className="d-flex flex-wrap align-items-center justify-content-between gap-3 py-3">
          <div className="d-flex align-items-center gap-3">
            <button type="button" className="btn btn-light rounded-circle pi-action-btn" onClick={onBack} title="Back">
              <i className="fa fa-arrow-left"></i>
            </button>
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <h5 className="mb-0 fw-bold">{data?.InvoiceNo || "Sales Invoice"}</h5>
                <Badge bg={statusVariant[data?.status] || "secondary"} className="rounded-pill">
                  {data?.status || "Draft"}
                </Badge>
                <Badge bg={tallyVariant[data?.tally_push_status] || "secondary"} className="rounded-pill">
                  Tally: {data?.tallyLabel || "Not Pushed"}
                </Badge>
              </div>
              <small className="text-muted">
                {data?.InvoiceType || "Tax Invoice"} · {data?.InvoiceDate || "—"}
              </small>
            </div>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            {canApprove && (
              <button type="button" className="btn btn-success btn-sm" onClick={onApprove} disabled={actionBusy}>
                <i className="fa fa-check me-1"></i>
                {actionBusy ? "Approving..." : "Approve Sales"}
              </button>
            )}
            {canTallyPush && (
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={onTallyPush} disabled={actionBusy}>
                <i className="fa fa-upload me-1"></i>
                {actionBusy ? "Pushing..." : "Tally Push"}
              </button>
            )}
            {canRetryTally && (
              <button type="button" className="btn btn-outline-warning btn-sm" onClick={onRetryTally} disabled={actionBusy}>
                <i className="fa fa-rotate-right me-1"></i>
                Retry Tally
              </button>
            )}
            {canEdit && (
              <>
                <button type="button" className="btn btn-primary btn-sm" onClick={onEdit}>
                  <i className="fa fa-pencil-alt me-1"></i> Edit Invoice
                </button>
                <button type="button" className="btn btn-outline-danger btn-sm" onClick={onDelete}>
                  <i className="fa fa-trash me-1"></i> Delete
                </button>
              </>
            )}
          </div>
        </Card.Header>
      </Card>

      <Row className="g-3 mb-3">
        <Col xl={3} md={6}>
          <SummaryTile label="Seller" value={data?.CompanyName} sub={data?.CompanyGstin ? `GSTIN: ${data.CompanyGstin}` : ""} />
        </Col>
        <Col xl={3} md={6}>
          <SummaryTile label="Customer" value={data?.CustomerName} sub={data?.customergstin ? `GSTIN: ${data.customergstin}` : ""} />
        </Col>
        <Col xl={3} md={6}>
          <SummaryTile label="Consignee" value={data?.ConsigneeName || "Same as customer"} />
        </Col>
        <Col xl={3} md={6}>
          <SummaryTile
            label="Grand Total"
            value={formatMoney(data?.BillAmount)}
            sub={data?.BuyersOrderNo ? `Order: ${data.BuyersOrderNo}` : ""}
          />
        </Col>
      </Row>

      <SalesInvoicePreview data={data} />

      {recordId && (
        <DocumentAttachments
          documentType={ATTACHMENT_DOCUMENT_TYPES.SALES}
          documentId={recordId}
          readOnly={!canEdit}
        />
      )}
    </>
  );
};

export default SalesInvoiceView;
