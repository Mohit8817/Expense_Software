import React, { useState } from "react";
import { Col, Row, Card, Table, Badge } from "react-bootstrap";
import PageTitle from "../../../layouts/PageTitle";
import TableExportActions from "../../../components/Common/TableExportActions";
import Pagination from "../../../components/Common/Pagination";
import { useSearchFilter, SearchInput } from "../../../components/Common/useSearchFilter";
import CreditNoteForm from "./CreditNoteForm";
import CreditNotePreview from "./CreditNotePreview";

const statusVariant = {
  Posted: "success",
  Draft: "secondary",
  Cancelled: "danger",
};

const statusIcon = {
  Posted: "fa-circle-check",
  Draft: "fa-file-lines",
  Cancelled: "fa-circle-xmark",
};

const staticData = [
  {
    id: 1,
    credit_no: "CN001",
    credit_date: "2025-07-02",
    customer_name: "ABC Pvt",
    amount: 12000,
    status: "Posted",
  },
  {
    id: 2,
    credit_no: "CN002",
    credit_date: "2025-07-05",
    customer_name: "XYZ Ltd",
    amount: 25500,
    status: "Draft",
  },
  {
    id: 3,
    credit_no: "CN003",
    credit_date: "2025-07-06",
    customer_name: "Global Traders",
    amount: 8700,
    status: "Posted",
  },
  {
    id: 4,
    credit_no: "CN004",
    credit_date: "2025-07-07",
    customer_name: "Sunrise Enterprises",
    amount: 15300,
    status: "Cancelled",
  },
];

// Config for the summary cards row — keeps the JSX below free of repetition
// and makes it trivial to re-order / add a new card later.
const SUMMARY_CARDS = [
  { key: "total", label: "Total", icon: "fa-file-invoice-dollar", color: "primary", tone: "All entries" },
  { key: "draft", label: "Draft", icon: "fa-file-lines", color: "secondary", tone: "Not yet posted" },
  { key: "posted", label: "Posted", icon: "fa-circle-check", color: "success", tone: "Confirmed" },
  { key: "cancelled", label: "Cancelled", icon: "fa-circle-xmark", color: "danger", tone: "Voided" },
];

const CreditNote = () => {
  const [data] = useState(staticData);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // "list"  -> cards + toolbar + table (full width)
  // "form"  -> col-8 form on the left, col-4 live preview on the right
  const [view, setView] = useState("list");
  const [editId, setEditId] = useState(null);

  // Mirrors whatever is currently being typed into the form so the col-4
  // preview panel can render live, without the form needing to know
  // anything about how it's displayed.
  const [liveData, setLiveData] = useState(null);

  const {
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    totalItems,
    paginatedData,
    indexOfFirst,
  } = useSearchFilter(data, {
    keys: ["credit_no", "customer_name", "status"],
    itemsPerPage: 100,
  });

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this credit note?")) return;
    alert(`(Static demo) Credit note ${id} would be deleted here.`);
  };

  const openAddForm = () => {
    setEditId(null);
    setLiveData(null);
    setView("form");
  };

  const openEditForm = (id) => {
    const record = data.find((d) => d.id === id);
    setEditId(id);
    setLiveData(
      record
        ? {
          creditNo: record.credit_no,
          creditDate: record.credit_date,
          customerName: record.customer_name,
          status: record.status,
          items: [],
          gstRows: [],
        }
        : null
    );
    setView("form");
  };

  const closeForm = () => {
    setView("list");
    setEditId(null);
    setLiveData(null);
  };

  // Summary counts derived from the full static dataset
  const totalCount = data.length;
  const draftCount = data.filter((c) => c.status === "Draft").length;
  const postedCount = data.filter((c) => c.status === "Posted").length;
  const cancelledCount = data.filter((c) => c.status === "Cancelled").length;
  // const counts = { total: totalCount, draft: draftCount, posted: postedCount, cancelled: cancelledCount };

  // Apply status + date filters on top of the search-filtered/paginated data
  const filteredData = paginatedData.filter((c) => {
    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    const matchesDate = dateFilter ? c.credit_date === dateFilter : true;
    return matchesStatus && matchesDate;
  });

  return (
    <>
      <PageTitle activeMenu="Credit Note Management" motherMenu="Tally" />

      {view === "list" && (
        <>
          {/* Summary Cards */}


          <Row>
            {/* Total */}
            <Col xl={3} lg={6} md={6} sm={6}>
              <Card>
                <Card.Header className="border-0 pb-0">
                  <h6 className="mb-0">Total</h6>
                </Card.Header>
                <Card.Body className="pt-2">
                  <h2 className="card-title mb-0">{totalCount}</h2>
                  <span><small className="text-muted">All Entries</small></span>
                  <div className="progress mt-3" style={{ height: "6px" }}>
                    <div className="progress-bar bg-primary" style={{ width: "100%" }}></div>
                  </div>
                  <div className="d-flex justify-content-between mt-1">
                    <small className="text-muted">All Records</small>
                    <small className="text-muted font-w600">{totalCount} total</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Draft */}
            <Col xl={3} lg={6} md={6} sm={6}>
              <Card>
                <Card.Header className="border-0 pb-0">
                  <h6 className="mb-0">Draft</h6>
                </Card.Header>
                <Card.Body className="pt-2">
                  <h2 className="card-title mb-0">{draftCount}</h2>
                  <span>
                    <small className="text-secondary font-w600 me-1">
                      {totalCount > 0 ? Math.round((draftCount / totalCount) * 100) : 0}%
                    </small>
                    of total
                  </span>
                  <div className="progress mt-3" style={{ height: "6px" }}>
                    <div
                      className="progress-bar bg-secondary"
                      style={{ width: `${totalCount > 0 ? (draftCount / totalCount) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <div className="d-flex justify-content-between mt-1">
                    <small className="text-muted">Of Total</small>
                    <small className="text-muted font-w600">{draftCount}</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Posted */}
            <Col xl={3} lg={6} md={6} sm={6}>
              <Card>
                <Card.Header className="border-0 pb-0">
                  <h6 className="mb-0">Posted</h6>
                </Card.Header>
                <Card.Body className="pt-2">
                  <h2 className="card-title mb-0">{postedCount}</h2>
                  <span>
                    <small className="text-success font-w600 me-1">
                      {totalCount > 0 ? Math.round((postedCount / totalCount) * 100) : 0}%
                    </small>
                    of total
                  </span>
                  <div className="progress mt-3" style={{ height: "6px" }}>
                    <div
                      className="progress-bar bg-success"
                      style={{ width: `${totalCount > 0 ? (postedCount / totalCount) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <div className="d-flex justify-content-between mt-1">
                    <small className="text-muted">Of Total</small>
                    <small className="text-muted font-w600">{postedCount}</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Cancelled */}
            <Col xl={3} lg={6} md={6} sm={6}>
              <Card>
                <Card.Header className="border-0 pb-0">
                  <h6 className="mb-0">Cancelled</h6>
                </Card.Header>
                <Card.Body className="pt-2">
                  <h2 className="card-title mb-0">{cancelledCount}</h2>
                  <span>
                    <small className={`font-w600 me-1 ${cancelledCount > 0 ? "text-danger" : "text-success"}`}>
                      {totalCount > 0 ? Math.round((cancelledCount / totalCount) * 100) : 0}%
                    </small>
                    of total
                  </span>
                  <div className="progress mt-3" style={{ height: "6px" }}>
                    <div
                      className="progress-bar bg-danger"
                      style={{ width: `${totalCount > 0 ? (cancelledCount / totalCount) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <div className="d-flex justify-content-between mt-1">
                    <small className="text-muted">Of Total</small>
                    <small className="text-muted font-w600">{cancelledCount}</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Toolbar + Table */}


          <Row>
            <Col lg={12}>

              <Card className="border-0 shadow-sm rounded">
                <Card.Body>


                  <Card.Header className="d-flex align-items-center justify-content-between flex-wrap gap-3 bg-white">
                    <Card.Title className="mb-0 flex-shrink-0 fw-bold">Credit Note List</Card.Title>

                    <div className="d-flex align-items-center gap-2 flex-wrap flex-lg-nowrap ms-auto">
                      <div style={{ minWidth: 180 }}>
                        <SearchInput
                          value={search}
                          onChange={setSearch}
                          placeholder="Search credit notes..."
                        />
                      </div>

                      <input
                        type="date"
                        className="form-control"
                        style={{ minWidth: 180, maxWidth: 150 }}
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                      />

                      <select
                        className="form-control"
                        style={{ minWidth: 180, maxWidth: 150 }}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="">All Status</option>
                        <option value="Draft">Draft</option>
                        <option value="Posted">Posted</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>

                      <div className="flex-shrink-0">
                        <TableExportActions
                          data={data}
                          columns={[
                            { label: "Credit No", key: "credit_no" },
                            { label: "Date", key: "credit_date" },
                            { label: "Customer", key: "customer_name" },
                            { label: "Amount", key: "amount" },
                            { label: "Status", key: "status" },
                          ]}
                          fileName="Credit_Note_List"
                        />
                      </div>

                      <button
                        className="btn btn-primary text-nowrap flex-shrink-0 d-flex align-items-center gap-2"
                        onClick={openAddForm}
                      >
                        <i className="fa fa-plus"></i> New Credit Note
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
                  <Table responsive className="cn-table text-nowrap align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Sno</th>
                        <th>Credit No</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th >Amount</th>
                        <th>Status</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredData.length > 0 ? (
                        filteredData.map((note, index) => (
                          <tr key={note.id || index}>
                            <td className="text-muted">{indexOfFirst + index + 1}</td>
                            <td className="fw-semibold">{note.credit_no || "N/A"}</td>
                            <td>{note.credit_date || "N/A"}</td>
                            <td>{note.customer_name || "N/A"}</td>
                            <td className="fw-bold text-success">
                              {note.amount != null ? `\u20b9${note.amount.toLocaleString("en-IN")}` : "N/A"}
                            </td>

                            <td>
                              <Badge
                                bg={statusVariant[note.status] || "secondary"}
                                className="cn-status-badge rounded-pill"
                              >
                                <i className={`fa-solid ${statusIcon[note.status] || "fa-circle"} me-1`}></i>
                                {note.status || "N/A"}
                              </Badge>
                            </td>
                            <td className="text-end">
                              <div className="">
                                <button
                                  className="btn btn-info shadow btn-xs sharp me-1"
                                  onClick={() => openEditForm(note.id)}
                                  title="View"
                                >
                                  <i className="fa fa-eye"></i>
                                </button>
                                <button
                                  className="btn btn-primary shadow btn-xs sharp me-1"
                                  onClick={() => openEditForm(note.id)}
                                  title="Edit"
                                >
                                  <i className="fas fa-pencil-alt"></i>
                                </button>
                                <button
                                  className="btn btn-danger shadow btn-xs sharp"
                                  onClick={() => handleDelete(note.id)}
                                  title="Delete"
                                >
                                  <i className="fa fa-trash"></i>
                                </button>
                              </div>
                            </td>

                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center text-muted py-5">
                            No Data Found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>

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
          {/* Form — col-8 */}
          <Col lg={8}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="d-flex align-items-center gap-2 bg-white">
                <button className="btn btn-light cn-action-btn" onClick={closeForm} title="Back to list">
                  <i className="fa fa-arrow-left"></i>
                </button>
                <Card.Title className="mb-0 fw-bold">
                  {editId ? "Edit Credit Note" : "New Credit Note"}
                </Card.Title>
              </Card.Header>
              <Card.Body>
                <CreditNoteForm
                  creditNoteId={editId}
                  initialData={liveData}
                  onDataChange={setLiveData}
                  onClose={closeForm}
                  onSaved={closeForm}
                />
              </Card.Body>
            </Card>
          </Col>

          {/* Live preview — col-4 */}
          <Col lg={4}>
            <div className="cn-sticky-panel">
              <CreditNotePreview data={liveData} isEdit={!!editId} />
            </div>
          </Col>
        </Row>
      )}

      <style>{`
    .cn-sticky-panel { position: sticky; top: 85px; }
        @media (max-width: 991px) { .cn-sticky-panel { position: static; margin-top: 1.5rem; } }
      `}
      </style>


    </>
  );
};

export default CreditNote;