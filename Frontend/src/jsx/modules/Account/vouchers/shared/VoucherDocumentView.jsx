import React from "react";
import { Card, Badge, Row, Col } from "react-bootstrap";
import DocumentAttachments from "./DocumentAttachments";

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
  <Card className="border-0 shadow-sm h-100 pi-summary-tile">
    <Card.Body className="py-3">
      <small className="text-muted text-uppercase fw-semibold d-block mb-1">{label}</small>
      <div className="fw-bold text-truncate" title={value}>
        {value || "—"}
      </div>
      {sub && <small className="text-muted">{sub}</small>}
    </Card.Body>
  </Card>
);

const VoucherDocumentView = ({
  title,
  docNoKey,
  dateKey,
  subTitleKey,
  summaryTiles = [],
  PreviewComponent,
  data,
  approveLabel,
  onBack,
  onEdit,
  onDelete,
  onApprove,
  onTallyPush,
  onRetryTally,
  canEdit,
  actionBusy,
  attachmentDocumentType,
  attachmentDocumentId,
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
                <h5 className="mb-0 fw-bold">{data?.[docNoKey] || title}</h5>
                <Badge bg={statusVariant[data?.status] || "secondary"} className="rounded-pill">
                  {data?.status || "Draft"}
                </Badge>
                <Badge bg={tallyVariant[data?.tally_push_status] || "secondary"} className="rounded-pill">
                  Tally: {data?.tallyLabel || "Not Pushed"}
                </Badge>
              </div>
              <small className="text-muted">
                {subTitleKey && data?.[subTitleKey] ? `${data[subTitleKey]} · ` : ""}
                {data?.[dateKey] || "—"}
              </small>
            </div>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            {canApprove && (
              <button type="button" className="btn btn-success btn-sm" onClick={onApprove} disabled={actionBusy}>
                <i className="fa fa-check me-1"></i>
                {actionBusy ? "Approving..." : approveLabel || "Approve"}
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
                  <i className="fa fa-pencil-alt me-1"></i> Edit
                </button>
                <button type="button" className="btn btn-outline-danger btn-sm" onClick={onDelete}>
                  <i className="fa fa-trash me-1"></i> Delete
                </button>
              </>
            )}
          </div>
        </Card.Header>
      </Card>

      {summaryTiles.length > 0 && (
        <Row className="g-3 mb-3">
          {summaryTiles.map((tile) => (
            <Col xl={3} md={6} key={tile.label}>
              <SummaryTile label={tile.label} value={tile.value} sub={tile.sub} />
            </Col>
          ))}
        </Row>
      )}

      {PreviewComponent && <PreviewComponent data={data} />}

      {attachmentDocumentType && attachmentDocumentId && (
        <DocumentAttachments
          documentType={attachmentDocumentType}
          documentId={attachmentDocumentId}
          readOnly={!canEdit}
        />
      )}
    </>
  );
};

export { formatMoney };
export default VoucherDocumentView;
