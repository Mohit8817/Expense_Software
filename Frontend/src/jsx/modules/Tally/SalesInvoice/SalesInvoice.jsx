import React, { useState } from "react";
import { Col, Row, Card, Table, Badge, Modal } from "react-bootstrap";
import PageTitle from "../../../layouts/PageTitle";
import TableExportActions from "../../../components/Common/TableExportActions";
import Pagination from "../../../components/Common/Pagination";
import { useSearchFilter, SearchInput } from "../../../components/Common/useSearchFilter";
import SalesInvoiceForm from "./SalesInvoiceForm";

const statusVariant = {
  Posted: "success",
  Draft: "secondary",
  Cancelled: "danger",
};

const staticData = [
  {
    id: 1,
    InvoiceNo: "Inv0991",
    InvoiceDate: "2026-07-02",
    Challanno: "DL0991",
    CustomerName: "ABC Pvt Ltd",
    BillAmount: 120000,
    GstAmount: 11644,
    customergstin: "",
    status: "Posted",
  },
  {
    id: 2,
    InvoiceNo: "Inv0992",
    InvoiceDate: "2026-07-04",
    Challanno: "DL0992",
    CustomerName: "XYZ Traders",
    BillAmount: 45500,
    GstAmount: 4550,
    customergstin: "",
    status: "Draft",
  },
  {
    id: 3,
    InvoiceNo: "Inv0993",
    InvoiceDate: "2026-07-05",
    Challanno: "DL0993",
    CustomerName: "Global Supplies",
    BillAmount: 18700,
    GstAmount: 1870,
    customergstin: "",
    status: "Posted",
  },
  {
    id: 4,
    InvoiceNo: "Inv0994",
    InvoiceDate: "2026-07-06",
    Challanno: "DL0994",
    CustomerName: "Sunrise Enterprises",
    BillAmount: 9300,
    GstAmount: 930,
    customergstin: "",
    status: "Cancelled",
  },
];

const SalesInvoice = () => {
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
    keys: ["InvoiceNo", "CustomerName", "status"],
    itemsPerPage: 100,
  });

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this sales invoice?")) return;
    alert(`(Static demo) Sales invoice ${id} would be deleted here.`);
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

  // ---- Sales-focused summary metrics (different from other pages) ----
  const totalInvoices = data.length;
  const totalSalesAmount = data.reduce((sum, d) => sum + (d.BillAmount || 0), 0);
  const totalGstCollected = data.reduce((sum, d) => sum + (d.GstAmount || 0), 0);
  const avgInvoiceValue = totalInvoices > 0 ? totalSalesAmount / totalInvoices : 0;

  const formatINR = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  // Apply status + date filters on top of the search-filtered/paginated data
  const filteredData = paginatedData.filter((d) => {
    const matchesStatus = statusFilter ? d.status === statusFilter : true;
    const matchesDate = dateFilter ? d.InvoiceDate === dateFilter : true;
    return matchesStatus && matchesDate;
  });

  return (
    <>
      <PageTitle activeMenu="Sales Invoice Management" motherMenu="Tally" />

      {/* Summary Cards */}
      <Row>
        {/* Total Invoices */}
        <Col xl={3} lg={6} md={6} sm={6}>
          <Card>
            <Card.Header className="border-0 pb-0">
              <h6 className="mb-0">Total Invoices</h6>
            </Card.Header>
            <Card.Body className="pt-2">
              <h2 className="card-title mb-0">{totalInvoices}</h2>
              <span><small className="text-muted">All Sales Invoices</small></span>
              <div className="progress mt-3" style={{ height: "6px" }}>
                <div className="progress-bar bg-primary" style={{ width: "100%" }}></div>
              </div>
              <div className="d-flex justify-content-between mt-1">
                <small className="text-muted">Invoices Raised</small>
                <small className="text-muted font-w600">{totalInvoices} total</small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Total Sales Amount */}
        <Col xl={3} lg={6} md={6} sm={6}>
          <Card>
            <Card.Header className="border-0 pb-0">
              <h6 className="mb-0">Total Sales Amount</h6>
            </Card.Header>
            <Card.Body className="pt-2">
              <h2 className="card-title mb-0">{formatINR(totalSalesAmount)}</h2>
              <span><small className="text-info">Across all invoices</small></span>
              <div className="progress mt-3" style={{ height: "6px" }}>
                <div className="progress-bar bg-info" style={{ width: "100%" }}></div>
              </div>
              <div className="d-flex justify-content-between mt-1">
                <small className="text-muted">Billed Value</small>
                <small className="text-muted font-w600">{formatINR(totalSalesAmount)}</small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* GST Collected */}
        <Col xl={3} lg={6} md={6} sm={6}>
          <Card>
            <Card.Header className="border-0 pb-0">
              <h6 className="mb-0">GST Collected</h6>
            </Card.Header>
            <Card.Body className="pt-2">
              <h2 className="card-title mb-0">{formatINR(totalGstCollected)}</h2>
              <span>
                <small className="text-success font-w600 me-1">
                  {totalSalesAmount > 0
                    ? Math.round((totalGstCollected / totalSalesAmount) * 100)
                    : 0}%
                </small>
                of sales value
              </span>
              <div className="progress mt-3" style={{ height: "6px" }}>
                <div
                  className="progress-bar bg-success"
                  style={{
                    width: `${
                      totalSalesAmount > 0
                        ? (totalGstCollected / totalSalesAmount) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
              <div className="d-flex justify-content-between mt-1">
                <small className="text-muted">CGST + SGST + IGST</small>
                <small className="text-muted font-w600">{formatINR(totalGstCollected)}</small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Average Invoice Value */}
        <Col xl={3} lg={6} md={6} sm={6}>
          <Card>
            <Card.Header className="border-0 pb-0">
              <h6 className="mb-0">Avg Invoice Value</h6>
            </Card.Header>
            <Card.Body className="pt-2">
              <h2 className="card-title mb-0">{formatINR(avgInvoiceValue)}</h2>
              <span><small className="text-muted">Per invoice, this period</small></span>
              <div className="progress mt-3" style={{ height: "6px" }}>
                <div className="progress-bar bg-warning" style={{ width: "100%" }}></div>
              </div>
              <div className="d-flex justify-content-between mt-1">
                <small className="text-muted">Sales ÷ Invoices</small>
                <small className="text-muted font-w600">{formatINR(avgInvoiceValue)}</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Col lg={12}>
        <Card>
          <Card.Header className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <Card.Title className="mb-0 flex-shrink-0">Sales Invoice List</Card.Title>

            {/* Toolbar: stays in a single row from lg breakpoint (laptop) up, hugs the right edge */}
            <div className="d-flex align-items-center gap-2 flex-wrap flex-lg-nowrap ms-auto">
              <div style={{ minWidth: 180 }}>
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search sales invoices..."
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
                    { label: "Invoice No", key: "InvoiceNo" },
                    { label: "Date", key: "InvoiceDate" },
                    { label: "Challan No", key: "Challanno" },
                    { label: "Customer", key: "CustomerName" },
                    { label: "Bill Amount", key: "BillAmount" },
                    { label: "Status", key: "status" },
                  ]}
                  fileName="Sales_Invoice_List"
                />
              </div>

              <button
                className="btn btn-primary text-nowrap flex-shrink-0"
                onClick={openAddModal}
              >
                <i className="fa fa-plus me-1"></i> New Sales Invoice
              </button>
            </div>
          </Card.Header>

          <Card.Body>
            <Table responsive className="text-nowrap">
              <thead>
                <tr>
                  <th>Sno</th>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Challan No</th>
                  <th>Customer</th>
                  <th>Bill Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((note, index) => (
                    <tr key={note.id || index}>
                      <td>{indexOfFirst + index + 1}</td>
                      <td>{note.InvoiceNo || "N/A"}</td>
                      <td>{note.InvoiceDate || "N/A"}</td>
                      <td>{note.Challanno || "N/A"}</td>
                      <td>{note.CustomerName || "N/A"}</td>
                      <td>{note.BillAmount != null ? note.BillAmount : "N/A"}</td>

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

      {/* Big modal popup for Add / Edit Sales Invoice */}
      <Modal
        show={showFormModal}
        onHide={closeFormModal}
        size="xl"
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editId ? "Edit Sales Invoice" : "New Sales Invoice"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <SalesInvoiceForm
            invoiceId={editId}
            onClose={closeFormModal}
            onSaved={closeFormModal}
          />
        </Modal.Body>
      </Modal>
    </>
  );
};

export default SalesInvoice;