import React, { useState, useEffect, useCallback, useRef } from "react";
import { Col, Row, Card, Table, Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import PageTitle from "../../../layouts/PageTitle";
import TableExportActions from "../../../components/Common/TableExportActions";
import Pagination from "../../../components/Common/Pagination";
import { useSearchFilter, SearchInput } from "../../../components/Common/useSearchFilter";
import CompanyDetailForm from "./CompanyDetailForm";
import DocumentAttachments from "../vouchers/shared/DocumentAttachments";
import SourceBadge from "../SourceBadge";
import { ATTACHMENT_DOCUMENT_TYPES } from "../documentAttachmentApi";
import {
  getAllCompanies,
  getCompanyById,
  deleteCompany,
  approveCompany,
  pushCompanyToTally,
  retryCompanyTallyPush,
} from "../companyApi";

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

const CompanyDetail = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [view, setView] = useState("list");
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(null);
  const attachmentRef = useRef(null);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const companies = await getAllCompanies();
      setData(companies);
    } catch (error) {
      toast.error(error.message || "Failed to load companies");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const {
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    totalItems,
    paginatedData,
    indexOfFirst,
  } = useSearchFilter(data, {
    keys: ["name", "ledger_name", "short_name", "gst", "city", "state", "code", "ledger_group", "contact_person", "status", "tallyLabel", "sourceLabel"],
    itemsPerPage: 100,
  });

  const filteredRows = paginatedData.filter((row) => {
    const matchesStatus = statusFilter ? row.status === statusFilter : true;
    const matchesSource = sourceFilter ? row.sourceLabel === sourceFilter : true;
    return matchesStatus && matchesSource;
  });

  const totalCount = data.length;
  const draftCount = data.filter((r) => r.status === "Draft").length;
  const postedCount = data.filter((r) => r.status === "Posted").length;
  const cancelledCount = data.filter((r) => r.status === "Cancelled").length;

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this company?")) return;
    try {
      await deleteCompany(id);
      toast.success("Company deleted successfully");
      fetchCompanies();
    } catch (error) {
      toast.error(error.message || "Delete failed");
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this company master record?")) return;
    try {
      setActionId(id);
      await approveCompany(id);
      toast.success("Company approved successfully");
      fetchCompanies();
    } catch (error) {
      toast.error(error.message || "Approve failed");
    } finally {
      setActionId(null);
    }
  };

  const handleTallyPush = async (id, isRetry = false) => {
    const msg = isRetry
      ? "Retry pushing this company to Tally?"
      : "Push this approved company to Tally?";
    if (!window.confirm(msg)) return;
    try {
      setActionId(id);
      if (isRetry) await retryCompanyTallyPush(id);
      else await pushCompanyToTally(id);
      toast.success(isRetry ? "Tally push retry successful" : "Pushed to Tally successfully");
      fetchCompanies();
    } catch (error) {
      toast.error(error.message || "Tally push failed");
      fetchCompanies();
    } finally {
      setActionId(null);
    }
  };

  const openAddForm = () => {
    setEditId(null);
    setFormData(null);
    setView("form");
  };

  const openEditForm = async (id) => {
    try {
      setLoading(true);
      const company = await getCompanyById(id);
      if (company.approval_status !== "PENDING") {
        toast.info("Only draft companies can be edited.");
        return;
      }
      setEditId(id);
      setFormData({
        name: company.name,
        ledger_name: company.ledger_name || "",
        short_name: company.short_name,
        gst: company.gst || "",
        pan: company.pan || "",
        tan: company.tan || "",
        cin: company.cin || "",
        email: company.email || "",
        state_code: company.state_code || "",
        add_line1: company.add_line1 || company.address || "",
        add_line2: company.add_line2 || "",
        add_line3: company.add_line3 || "",
        address: company.address,
        city: company.city,
        state: company.state,
        country: company.country || "India",
        zipcode: company.zipcode,
        contact_person: company.contact_person || "",
        contact_number: company.contact_number || "",
        ledger_group: company.ledger_group || "",
        code: company.code,
        bank_accounts: company.bank_accounts || [],
        status: String(company.status ?? 1),
      });
      setView("form");
    } catch (error) {
      toast.error(error.message || "Failed to load company");
    } finally {
      setLoading(false);
    }
  };

  const closeForm = () => {
    setView("list");
    setEditId(null);
    setFormData(null);
  };

  const handleSaved = async (savedId) => {
    const id = savedId || editId;
    if (id && attachmentRef.current?.hasPending?.()) {
      try {
        await attachmentRef.current.uploadPending(id);
      } catch (error) {
        toast.error(error.message || "Record saved but attachment upload failed");
      }
    }
    toast.success(editId ? "Company updated successfully" : "Company created successfully");
    closeForm();
    fetchCompanies();
  };

  return (
    <>
      <PageTitle activeMenu="Company Master" motherMenu="Account" />

      {view === "list" && (
        <>
          <Row>
            <Col xl={3} lg={6} md={6} sm={6}>
              <Card>
                <Card.Header className="border-0 pb-0">
                  <h6 className="mb-0">Total</h6>
                </Card.Header>
                <Card.Body className="pt-2">
                  <h2 className="card-title mb-0">{totalCount}</h2>
                  <span><small className="text-muted">All Companies</small></span>
                </Card.Body>
              </Card>
            </Col>
            <Col xl={3} lg={6} md={6} sm={6}>
              <Card>
                <Card.Header className="border-0 pb-0">
                  <h6 className="mb-0">Draft</h6>
                </Card.Header>
                <Card.Body className="pt-2">
                  <h2 className="card-title mb-0 text-warning">{draftCount}</h2>
                  <span><small className="text-muted">Pending approval</small></span>
                </Card.Body>
              </Card>
            </Col>
            <Col xl={3} lg={6} md={6} sm={6}>
              <Card>
                <Card.Header className="border-0 pb-0">
                  <h6 className="mb-0">Posted</h6>
                </Card.Header>
                <Card.Body className="pt-2">
                  <h2 className="card-title mb-0 text-success">{postedCount}</h2>
                  <span><small className="text-muted">Approved</small></span>
                </Card.Body>
              </Card>
            </Col>
            <Col xl={3} lg={6} md={6} sm={6}>
              <Card>
                <Card.Header className="border-0 pb-0">
                  <h6 className="mb-0">Cancelled</h6>
                </Card.Header>
                <Card.Body className="pt-2">
                  <h2 className="card-title mb-0 text-danger">{cancelledCount}</h2>
                  <span><small className="text-muted">Rejected</small></span>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col lg={12}>
              <Card className="border-0 shadow-sm rounded">
                <Card.Body>
                  <Card.Header className="d-flex align-items-center justify-content-between flex-wrap gap-3 bg-white">
                    <Card.Title className="mb-0 flex-shrink-0 fw-bold">Company List</Card.Title>

                    <div className="d-flex align-items-center gap-2 flex-wrap flex-lg-nowrap ms-auto">
                      <select
                        className="form-control form-control-sm"
                        style={{ minWidth: 130 }}
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value)}
                      >
                        <option value="">All Source</option>
                        <option value="Software">Software</option>
                        <option value="Tally">Tally</option>
                      </select>
                      <select
                        className="form-control form-control-sm"
                        style={{ minWidth: 130 }}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="">All Status</option>
                        <option value="Draft">Draft</option>
                        <option value="Posted">Posted</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>

                      <div style={{ minWidth: 150 }}>
                        <SearchInput
                          value={search}
                          onChange={setSearch}
                          placeholder="Search companies..."
                        />
                      </div>

                      <TableExportActions
                        data={data}
                        columns={[
                          { label: "Company Name", key: "name" },
                          { label: "Ledger Name", key: "ledger_name" },
                          { label: "Ledger Code", key: "code" },
                          { label: "Ledger Group", key: "ledger_group" },
                          { label: "GST Number", key: "gst" },
                          { label: "City", key: "city" },
                          { label: "State", key: "state" },
                          { label: "Status", key: "status" },
                          { label: "Tally", key: "tallyLabel" },
                          { label: "Source", key: "sourceLabel" },
                        ]}
                        fileName="Company_List"
                      />

                      <button
                        className="btn btn-primary text-nowrap flex-shrink-0 d-flex align-items-center gap-2"
                        onClick={openAddForm}
                      >
                        <i className="fa fa-plus"></i> New Company
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
                    <p className="text-center text-muted py-5">Loading...</p>
                  ) : (
                    <Table responsive className="text-nowrap align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Sno</th>
                          <th>Company Name</th>
                          <th>Ledger Code</th>
                          <th>Ledger Group</th>
                          <th>GST</th>
                          <th>City</th>
                          <th>Source</th>
                          <th>Status</th>
                          <th>Tally</th>
                          <th className="text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.length > 0 ? (
                          filteredRows.map((item, index) => {
                            const isDraft = item.status === "Draft";
                            const isPosted = item.status === "Posted";
                            const busy = actionId === item.id;

                            return (
                              <tr key={item.id}>
                                <td className="text-muted">{indexOfFirst + index + 1}</td>
                                <td>
                                  <div className="fw-semibold">{item.name}</div>
                                  {item.ledger_name && item.ledger_name !== item.name && (
                                    <small className="text-muted">{item.ledger_name}</small>
                                  )}
                                </td>
                                <td>{item.code}</td>
                                <td>{item.ledger_group || "—"}</td>
                                <td>{item.gst || "—"}</td>
                                <td>{item.city || "—"}</td>
                                <td>
                                  <SourceBadge
                                    dataStatus={item.data_status}
                                    label={item.sourceLabel}
                                    variant={item.sourceVariant}
                                  />
                                </td>
                                <td>
                                  <Badge bg={statusVariant[item.status] || "secondary"} className="rounded-pill">
                                    {item.status}
                                  </Badge>
                                </td>
                                <td>
                                  <Badge bg={tallyVariant[item.tally_push_status] || "secondary"} className="rounded-pill">
                                    {item.tallyLabel}
                                  </Badge>
                                </td>
                                <td className="text-end">
                                  {isDraft && (
                                    <button
                                      className="btn btn-success shadow btn-xs sharp me-1"
                                      onClick={() => handleApprove(item.id)}
                                      disabled={busy}
                                      title="Approve"
                                    >
                                      <i className="fa fa-check"></i>
                                    </button>
                                  )}
                                  {isPosted && item.tally_push_status === "NOT_PUSHED" && (
                                    <button
                                      className="btn btn-info shadow btn-xs sharp me-1"
                                      onClick={() => handleTallyPush(item.id)}
                                      disabled={busy}
                                      title="Push to Tally"
                                    >
                                      <i className="fa fa-upload"></i>
                                    </button>
                                  )}
                                  {isPosted && item.tally_push_status === "FAILED" && (
                                    <button
                                      className="btn btn-warning shadow btn-xs sharp me-1"
                                      onClick={() => handleTallyPush(item.id, true)}
                                      disabled={busy}
                                      title="Retry Tally Push"
                                    >
                                      <i className="fa fa-rotate-right"></i>
                                    </button>
                                  )}
                                  <button
                                    className="btn btn-primary shadow btn-xs sharp me-1"
                                    onClick={() => openEditForm(item.id)}
                                    disabled={!isDraft}
                                    title={isDraft ? "Edit" : "Only draft records can be edited"}
                                  >
                                    <i className="fas fa-pencil-alt"></i>
                                  </button>
                                  <button
                                    className="btn btn-danger shadow btn-xs sharp"
                                    onClick={() => handleDelete(item.id)}
                                    disabled={!isDraft}
                                    title={isDraft ? "Delete" : "Only draft records can be deleted"}
                                  >
                                    <i className="fa fa-trash"></i>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="10" className="text-center text-muted py-5">
                              No companies found
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

      {view === "form" && (
        <Row>
          <Col lg={12}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="d-flex align-items-center gap-2 bg-white">
                <button className="btn btn-light" onClick={closeForm} title="Back to list">
                  <i className="fa fa-arrow-left"></i>
                </button>
                <Card.Title className="mb-0 fw-bold">
                  {editId ? "Edit Company" : "New Company"}
                </Card.Title>
              </Card.Header>
              <Card.Body>
                <CompanyDetailForm
                  companyId={editId}
                  initialData={formData}
                  onClose={closeForm}
                  onSaved={handleSaved}
                />
                <DocumentAttachments
                  ref={attachmentRef}
                  documentType={ATTACHMENT_DOCUMENT_TYPES.COMPANY}
                  documentId={editId}
                  inline
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </>
  );
};

export default CompanyDetail;
