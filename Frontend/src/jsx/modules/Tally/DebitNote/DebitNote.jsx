import React, { useState } from "react";
import { Col, Row, Card, Table, Badge, Modal } from "react-bootstrap";
import PageTitle from "../../../layouts/PageTitle";
import TableExportActions from "../../../components/Common/TableExportActions";
import Pagination from "../../../components/Common/Pagination";
import { useSearchFilter, SearchInput } from "../../../components/Common/useSearchFilter";
import DebitNoteForm from "./DebitNoteForm";

const statusVariant = {
  Posted: "success",
  Draft: "secondary",
  Cancelled: "danger",
};

const staticData = [
  {
    id: 1,
    DebitNoteNo: "Pur0991",
    DebitNoteDate: "2026-07-02",
    PurchaseNo: "PO908",
    VendorName: "XYZ Pvt Ltd",
    DebitNoteAmount: 120000,
    Vendorgstin: "",
    status: "Posted",
  },
  {
    id: 2,
    DebitNoteNo: "Pur0992",
    DebitNoteDate: "2026-07-04",
    PurchaseNo: "PO909",
    VendorName: "ABC Traders",
    DebitNoteAmount: 45500,
    Vendorgstin: "",
    status: "Draft",
  },
  {
    id: 3,
    DebitNoteNo: "Pur0993",
    DebitNoteDate: "2026-07-05",
    PurchaseNo: "PO910",
    VendorName: "Global Supplies",
    DebitNoteAmount: 18700,
    Vendorgstin: "",
    status: "Posted",
  },
  {
    id: 4,
    DebitNoteNo: "Pur0994",
    DebitNoteDate: "2026-07-06",
    PurchaseNo: "PO911",
    VendorName: "Sunrise Vendors",
    DebitNoteAmount: 9300,
    Vendorgstin: "",
    status: "Cancelled",
  },
];

const DebitNote = () => {
  const [data] = useState(staticData);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const {
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    totalItems,
    paginatedData,
    indexOfFirst,
  } = useSearchFilter(data, {
    keys: ["DebitNoteNo", "VendorName", "status"],
    itemsPerPage: 100,
  });

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this debit note?")) return;
    alert(`(Static demo) Debit note ${id} would be deleted here.`);
  };

  const openAddModal = () => {
    setEditId(null);
    setShowFormModal(true);
  };

  const openEditModal = (id) => {
    setEditId(id);
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditId(null);
  };

  // Summary counts derived from the full static dataset
  const totalCount = data.length;
  const draftCount = data.filter((d) => d.status === "Draft").length;
  const postedCount = data.filter((d) => d.status === "Posted").length;
  const cancelledCount = data.filter((d) => d.status === "Cancelled").length;

  // Apply status + date filters on top of the search-filtered/paginated data
  const filteredData = paginatedData.filter((d) => {
    const matchesStatus = statusFilter ? d.status === statusFilter : true;
    const matchesDate = dateFilter ? d.DebitNoteDate === dateFilter : true;
    return matchesStatus && matchesDate;
  });

  return (
    <>
      <PageTitle activeMenu="Debit Note Management" motherMenu="Tally" />

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

      <Col lg={12}>
        <Card>
          <Card.Header className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <Card.Title className="mb-0 flex-shrink-0">Debit Note List</Card.Title>

            {/* Toolbar: stays in a single row from lg breakpoint (laptop) up, hugs the right edge */}
            <div className="d-flex align-items-center gap-2 flex-wrap flex-lg-nowrap ms-auto">
              <div style={{ minWidth: 180 }}>
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search debit notes..."
                />
              </div>

              <input
                type="date"
                className="form-control"
                style={{ minWidth: 150, maxWidth: 160 }}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />

              <select
                className="form-control"
                style={{ minWidth: 130, maxWidth: 150 }}
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
                    { label: "Debit Note No", key: "DebitNoteNo" },
                    { label: "Date", key: "DebitNoteDate" },
                    { label: "Purchase No", key: "PurchaseNo" },
                    { label: "Vendor", key: "VendorName" },
                    { label: "Amount", key: "DebitNoteAmount" },
                    { label: "Status", key: "status" },
                  ]}
                  fileName="Debit_Note_List"
                />
              </div>

              <button
                className="btn btn-primary text-nowrap flex-shrink-0"
                onClick={openAddModal}
              >
                <i className="fa fa-plus me-1"></i> New Debit Note
              </button>
            </div>
          </Card.Header>

          <Card.Body>
            <Table responsive className="text-nowrap">
              <thead>
                <tr>
                  <th>Sno</th>
                  <th>Debit Note No</th>
                  <th>Date</th>
                  <th>Purchase No</th>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((note, index) => (
                    <tr key={note.id || index}>
                      <td>{indexOfFirst + index + 1}</td>
                      <td>{note.DebitNoteNo || "N/A"}</td>
                      <td>{note.DebitNoteDate || "N/A"}</td>
                      <td>{note.PurchaseNo || "N/A"}</td>
                      <td>{note.VendorName || "N/A"}</td>
                      <td>{note.DebitNoteAmount != null ? note.DebitNoteAmount : "N/A"}</td>

                      <td>
                        <Badge bg={statusVariant[note.status] || "secondary"}>
                          {note.status || "N/A"}
                        </Badge>
                      </td>

                      <td className="text-end">
                        <div className="">
                          <button
                            className="btn btn-info shadow btn-xs sharp me-1"
                            onClick={() => openEditModal(note.id)}
                            title="View"
                          >
                            <i className="fa fa-eye"></i>
                          </button>
                          <button
                            className="btn btn-primary shadow btn-xs sharp me-1"
                            onClick={() => openEditModal(note.id)}
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
                    <td colSpan="8" className="text-center">
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

      {/* Big modal popup for Add / Edit Debit Note */}
      <Modal
        show={showFormModal}
        onHide={closeFormModal}
        size="xl"
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editId ? "Edit Debit Note" : "New Debit Note"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <DebitNoteForm
            debitNoteId={editId}
            onClose={closeFormModal}
            onSaved={closeFormModal}
          />
        </Modal.Body>
      </Modal>
    </>
  );
};

export default DebitNote;