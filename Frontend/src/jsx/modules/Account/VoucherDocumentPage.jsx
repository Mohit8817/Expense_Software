import React, { useState, useEffect, useCallback, useRef } from "react";
import { Col, Row, Card, Table, Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import PageTitle from "../../layouts/PageTitle";
import TableExportActions from "../../components/Common/TableExportActions";
import Pagination from "../../components/Common/Pagination";
import { useSearchFilter, SearchInput } from "../../components/Common/useSearchFilter";
import VoucherDocumentView from "./vouchers/shared/VoucherDocumentView";
import DocumentAttachments from "./vouchers/shared/DocumentAttachments";

const statusVariant = {
  Posted: "success",
  Draft: "warning",
  Cancelled: "danger",
};

const statusIcon = {
  Posted: "fa-circle-check",
  Draft: "fa-file-lines",
  Cancelled: "fa-circle-xmark",
};

const tallyVariant = {
  PUSHED: "success",
  FAILED: "danger",
  NOT_PUSHED: "secondary",
};

const formatMoney = (n) =>
  `\u20b9${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const truncate = (text, len = 20) => {
  if (!text) return "—";
  return text.length > len ? `${text.slice(0, len)}…` : text;
};

const VoucherDocumentPage = ({
  title,
  listTitle,
  newButtonLabel,
  exportFileName,
  searchPlaceholder,
  searchKeys,
  exportColumns,
  tableConfig = {},
  FormComponent,
  PreviewComponent,
  previewDataMapper,
  viewConfig = {},
  api,
  mapToList,
  mapToForm,
  attachmentDocumentType,
}) => {
  const attachmentRef = useRef(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [pageMode, setPageMode] = useState("list");
  const [recordId, setRecordId] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [formInitialData, setFormInitialData] = useState(null);
  const [showPreview, setShowPreview] = useState(true);

  const {
    docNoKey,
    docSubKey,
    dateKey,
    partyKey,
    partyGstinKey,
    secondaryPartyKey,
    refKey,
    amountKey,
  } = tableConfig;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await api.getAll();
      setData(Array.isArray(rows) ? rows.map(mapToList) : []);
    } catch (error) {
      toast.error(error.message || `Failed to load ${title}`);
    } finally {
      setLoading(false);
    }
  }, [api, mapToList, title]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const {
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    totalItems,
    paginatedData,
    indexOfFirst,
  } = useSearchFilter(data, { keys: searchKeys, itemsPerPage: 100 });

  const loadRecord = async (id) => {
    setLoading(true);
    try {
      const record = await api.getById(id);
      if (!record || typeof record !== "object") {
        throw new Error("Record not found");
      }
      const mapped = mapToForm(record);
      setRecordId(id);
      setFormInitialData(mapped);
      setLiveData(mapped);
      return mapped;
    } catch (error) {
      toast.error(error.message || "Failed to load record");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const closePage = () => {
    setPageMode("list");
    setRecordId(null);
    setLiveData(null);
    setFormInitialData(null);
    setShowPreview(true);
  };

  const openCreate = () => {
    setRecordId(null);
    setLiveData(null);
    setFormInitialData({});
    setShowPreview(true);
    setPageMode("create");
  };

  const openView = async (id) => {
    const record = await loadRecord(id);
    if (record) setPageMode("view");
  };

  const openEdit = async (id) => {
    const record = await loadRecord(id);
    if (record) {
      if (record.status !== "Draft") {
        toast.info("Only draft records can be edited. Opening read-only view.");
        setPageMode("view");
        return;
      }
      setShowPreview(true);
      setPageMode("edit");
    }
  };

  const switchToEdit = () => {
    if (liveData?.status === "Draft") {
      setShowPreview(true);
      setPageMode("edit");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this ${title.toLowerCase()}?`)) return;
    try {
      await api.remove(id);
      toast.success("Deleted successfully");
      if (pageMode !== "list") closePage();
      fetchData();
    } catch (error) {
      toast.error(error.message || "Delete failed");
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm(`Approve this ${title.toLowerCase()}?`)) return;
    try {
      setActionId(id);
      await api.approve(id);
      toast.success("Approved successfully");
      if (pageMode === "view" && recordId === id) await loadRecord(id);
      fetchData();
    } catch (error) {
      toast.error(error.message || "Approve failed");
    } finally {
      setActionId(null);
    }
  };

  const handleTallyPush = async (id, isRetry = false) => {
    const msg = isRetry
      ? `Retry pushing this ${title.toLowerCase()} to Tally?`
      : `Push this approved ${title.toLowerCase()} to Tally?`;
    if (!window.confirm(msg)) return;
    try {
      setActionId(id);
      if (isRetry) await api.retryTallyPush(id);
      else await api.pushToTally(id);
      toast.success(isRetry ? "Tally push retry successful" : "Pushed to Tally successfully");
      if (pageMode === "view" && recordId === id) await loadRecord(id);
      fetchData();
    } catch (error) {
      toast.error(error.message || "Tally push failed");
      if (pageMode === "view" && recordId === id) await loadRecord(id);
      fetchData();
    } finally {
      setActionId(null);
    }
  };

  const handleSaved = async (savedId) => {
    const id = savedId || recordId;
    if (id && attachmentRef.current?.hasPending?.()) {
      try {
        await attachmentRef.current.uploadPending(id);
        toast.success("Attachments uploaded");
      } catch (error) {
        toast.error(error.message || "Record saved but attachment upload failed");
      }
    }
    closePage();
    fetchData();
  };

  const totalCount = data.length;
  const draftCount = data.filter((r) => r.status === "Draft").length;
  const postedCount = data.filter((r) => r.status === "Posted").length;
  const cancelledCount = data.filter((r) => r.status === "Cancelled").length;

  const filteredData = paginatedData.filter((row) => {
    const matchesStatus = statusFilter ? row.status === statusFilter : true;
    const matchesDate = dateFilter ? row[dateKey] === dateFilter : true;
    return matchesStatus && matchesDate;
  });

  const pageTitle =
    pageMode === "create"
      ? `New ${title}`
      : pageMode === "edit"
        ? `Edit ${title}`
        : pageMode === "view"
          ? `View ${title}`
          : `${title} Management`;

  const previewData = previewDataMapper ? previewDataMapper(liveData) : liveData;

  return (
    <>
      <PageTitle activeMenu={pageTitle} motherMenu="Account" />

      {pageMode === "list" && (
        <>
          <Row>
            <Col xl={3} lg={6} md={6} sm={6}>
              <Card>
                <Card.Header className="border-0 pb-0"><h6 className="mb-0">Total</h6></Card.Header>
                <Card.Body className="pt-2">
                  <h2 className="card-title mb-0">{totalCount}</h2>
                  <span><small className="text-muted">All Entries</small></span>
                  <div className="progress mt-3" style={{ height: "6px" }}>
                    <div className="progress-bar bg-primary" style={{ width: "100%" }}></div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xl={3} lg={6} md={6} sm={6}>
              <Card>
                <Card.Header className="border-0 pb-0"><h6 className="mb-0">Draft</h6></Card.Header>
                <Card.Body className="pt-2">
                  <h2 className="card-title mb-0">{draftCount}</h2>
                  <span><small className="text-warning font-w600">{totalCount ? Math.round((draftCount / totalCount) * 100) : 0}%</small> of total</span>
                  <div className="progress mt-3" style={{ height: "6px" }}>
                    <div className="progress-bar bg-warning" style={{ width: `${totalCount ? (draftCount / totalCount) * 100 : 0}%` }}></div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xl={3} lg={6} md={6} sm={6}>
              <Card>
                <Card.Header className="border-0 pb-0"><h6 className="mb-0">Posted</h6></Card.Header>
                <Card.Body className="pt-2">
                  <h2 className="card-title mb-0">{postedCount}</h2>
                  <span><small className="text-success font-w600">{totalCount ? Math.round((postedCount / totalCount) * 100) : 0}%</small> of total</span>
                  <div className="progress mt-3" style={{ height: "6px" }}>
                    <div className="progress-bar bg-success" style={{ width: `${totalCount ? (postedCount / totalCount) * 100 : 0}%` }}></div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xl={3} lg={6} md={6} sm={6}>
              <Card>
                <Card.Header className="border-0 pb-0"><h6 className="mb-0">Cancelled</h6></Card.Header>
                <Card.Body className="pt-2">
                  <h2 className="card-title mb-0">{cancelledCount}</h2>
                  <span><small className="text-danger font-w600">{totalCount ? Math.round((cancelledCount / totalCount) * 100) : 0}%</small> of total</span>
                  <div className="progress mt-3" style={{ height: "6px" }}>
                    <div className="progress-bar bg-danger" style={{ width: `${totalCount ? (cancelledCount / totalCount) * 100 : 0}%` }}></div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col lg={12}>
              <Card className="border-0 shadow-sm rounded">
                <Card.Body>
                  <Card.Header className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <Card.Title className="mb-0 flex-shrink-0 fw-bold">{listTitle}</Card.Title>
                    <div className="d-flex align-items-center gap-2 flex-wrap flex-lg-nowrap ms-auto">
                      <div style={{ minWidth: 180 }}>
                        <SearchInput value={search} onChange={setSearch} placeholder={searchPlaceholder} />
                      </div>
                      <input
                        type="date"
                        className="form-control"
                        style={{ minWidth: 150, maxWidth: 150 }}
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                      />
                      <select
                        className="form-control"
                        style={{ minWidth: 140, maxWidth: 140 }}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="">All Status</option>
                        <option value="Draft">Draft</option>
                        <option value="Posted">Posted</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <div className="flex-shrink-0">
                        <TableExportActions data={data} columns={exportColumns} fileName={exportFileName} />
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary text-nowrap flex-shrink-0 d-flex align-items-center gap-2"
                        onClick={openCreate}
                      >
                        <i className="fa fa-plus"></i> {newButtonLabel}
                      </button>
                    </div>
                  </Card.Header>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="pt-0">
                  {loading ? (
                    <p className="text-center text-muted py-5 mb-0">Loading...</p>
                  ) : (
                    <Table responsive className="text-nowrap align-middle mb-0 table-hover">
                      <thead>
                        <tr>
                          <th>Sno</th>
                          <th>{tableConfig.docNoLabel || "Document No"}</th>
                          <th>Date</th>
                          <th>{tableConfig.partyLabel || "Party"}</th>
                          {secondaryPartyKey && <th>{tableConfig.secondaryPartyLabel || "Party 2"}</th>}
                          {refKey && <th>{tableConfig.refLabel || "Reference"}</th>}
                          <th className="text-center">Items</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Tally</th>
                          <th className="text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.length > 0 ? (
                          filteredData.map((row, index) => {
                            const busy = actionId === row.id;
                            const canApprove = row.status === "Draft";
                            const canTallyPush =
                              row.status === "Posted" && row.tally_push_status === "NOT_PUSHED";
                            const canRetryTally =
                              row.status === "Posted" && row.tally_push_status === "FAILED";

                            return (
                              <tr key={row.id}>
                                <td className="text-muted">{indexOfFirst + index + 1}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-link p-0 fw-semibold pi-invoice-link"
                                    onClick={() => openView(row.id)}
                                  >
                                    {row[docNoKey] || "—"}
                                  </button>
                                  {docSubKey && row[docSubKey] && (
                                    <div><small className="text-muted">{row[docSubKey]}</small></div>
                                  )}
                                </td>
                                <td>{row[dateKey] || "—"}</td>
                                <td>
                                  <div className="fw-semibold">{row[partyKey] || "—"}</div>
                                  {partyGstinKey && (
                                    <small className="text-muted">{truncate(row[partyGstinKey], 20)}</small>
                                  )}
                                </td>
                                {secondaryPartyKey && <td>{row[secondaryPartyKey] || "—"}</td>}
                                {refKey && <td>{row[refKey] || "—"}</td>}
                                <td className="text-center fw-semibold">{row.ItemCount ?? 0}</td>
                                <td className="fw-bold">{formatMoney(row[amountKey])}</td>
                                <td>
                                  <Badge bg={statusVariant[row.status] || "secondary"} className="rounded-pill">
                                    <i className={`fa-solid ${statusIcon[row.status] || "fa-circle"} me-1`}></i>
                                    {row.status}
                                  </Badge>
                                </td>
                                <td>
                                  <Badge bg={tallyVariant[row.tally_push_status] || "secondary"} className="rounded-pill">
                                    {row.tallyLabel}
                                  </Badge>
                                </td>
                                <td className="text-end">
                                  <div className="d-inline-flex align-items-center pi-table-actions">
                                    {canApprove && (
                                      <button
                                        type="button"
                                        className="btn btn-success shadow btn-xs sharp me-1"
                                        onClick={() => handleApprove(row.id)}
                                        disabled={busy}
                                        title={`Approve ${title}`}
                                      >
                                        <i className="fa fa-check"></i>
                                      </button>
                                    )}
                                    {canTallyPush && (
                                      <button
                                        type="button"
                                        className="btn btn-primary shadow btn-xs sharp me-1"
                                        onClick={() => handleTallyPush(row.id, false)}
                                        disabled={busy}
                                        title="Tally Push"
                                      >
                                        <i className="fa fa-upload"></i>
                                      </button>
                                    )}
                                    {canRetryTally && (
                                      <button
                                        type="button"
                                        className="btn btn-warning shadow btn-xs sharp me-1"
                                        onClick={() => handleTallyPush(row.id, true)}
                                        disabled={busy}
                                        title="Retry Tally Push"
                                      >
                                        <i className="fa fa-rotate-right"></i>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      className="btn btn-info shadow btn-xs sharp me-1"
                                      onClick={() => openView(row.id)}
                                      title="View"
                                    >
                                      <i className="fa fa-eye"></i>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-primary shadow btn-xs sharp me-1"
                                      onClick={() => openEdit(row.id)}
                                      title="Edit"
                                      disabled={row.status !== "Draft"}
                                    >
                                      <i className="fas fa-pencil-alt"></i>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-danger shadow btn-xs sharp"
                                      onClick={() => handleDelete(row.id)}
                                      title="Delete"
                                      disabled={row.status !== "Draft"}
                                    >
                                      <i className="fa fa-trash"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td
                              colSpan={
                                7 +
                                (secondaryPartyKey ? 1 : 0) +
                                (refKey ? 1 : 0) +
                                3
                              }
                              className="text-center text-muted py-5"
                            >
                              No records found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  )}
                  <Pagination
                    totalItems={totalItems}
                    itemsPerPage={100}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {pageMode === "view" && liveData && (
        <VoucherDocumentView
          title={title}
          docNoKey={viewConfig.docNoKey}
          dateKey={viewConfig.dateKey}
          subTitleKey={viewConfig.subTitleKey}
          summaryTiles={viewConfig.getSummaryTiles?.(liveData) || []}
          PreviewComponent={PreviewComponent}
          data={liveData}
          approveLabel={viewConfig.approveLabel}
          onBack={closePage}
          onEdit={switchToEdit}
          onDelete={() => handleDelete(recordId)}
          onApprove={() => handleApprove(recordId)}
          onTallyPush={() => handleTallyPush(recordId, false)}
          onRetryTally={() => handleTallyPush(recordId, true)}
          canEdit={liveData.status === "Draft"}
          actionBusy={actionId === recordId}
          attachmentDocumentType={attachmentDocumentType}
          attachmentDocumentId={recordId}
        />
      )}

      {(pageMode === "create" || pageMode === "edit") && (
        <Row className="g-3">
          <Col lg={showPreview && PreviewComponent ? 8 : 12}>
            <Card className="border-0 shadow-sm pi-form-shell">
              <Card.Header className="d-flex flex-wrap align-items-center justify-content-between gap-2 py-3">
                <div className="d-flex align-items-center gap-2">
                  <button type="button" className="btn btn-light rounded-circle pi-action-btn" onClick={closePage} title="Back">
                    <i className="fa fa-arrow-left"></i>
                  </button>
                  <div>
                    <Card.Title className="mb-0 fw-bold">
                      {pageMode === "edit" ? `Edit ${title}` : `New ${title}`}
                    </Card.Title>
                    <small className="text-muted">Fill details below — preview updates live</small>
                  </div>
                </div>
                {PreviewComponent && (
                  <button
                    type="button"
                    className={`btn btn-sm ${showPreview ? "btn-outline-primary" : "btn-primary"}`}
                    onClick={() => setShowPreview((v) => !v)}
                  >
                    <i className={`fa ${showPreview ? "fa-compress" : "fa-expand"} me-1`}></i>
                    {showPreview ? "Hide Preview" : "Show Preview"}
                  </button>
                )}
              </Card.Header>
              <Card.Body className="pi-form-body">
                <FormComponent
                  key={recordId ?? "new"}
                  documentId={pageMode === "edit" ? recordId : null}
                  initialData={formInitialData}
                  onDataChange={setLiveData}
                  onClose={closePage}
                  onSaved={handleSaved}
                />
                {attachmentDocumentType && (
                  <DocumentAttachments
                    ref={attachmentRef}
                    documentType={attachmentDocumentType}
                    documentId={pageMode === "edit" ? recordId : null}
                    inline
                  />
                )}
              </Card.Body>
            </Card>
          </Col>
          {showPreview && PreviewComponent && (
            <Col lg={4}>
              <div className="pi-sticky-panel">
                <PreviewComponent data={previewData} />
              </div>
            </Col>
          )}
        </Row>
      )}
    </>
  );
};

export default VoucherDocumentPage;
