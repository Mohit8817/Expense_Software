import React, { useEffect, useState } from "react";
import { Table, Card, Col, Modal, Badge, Spinner } from "react-bootstrap";
import axios from "axios";
import PageTitle from "../../layouts/PageTitle";
import TableExportActions from "../../components/Common/TableExportActions";
import Pagination from "../../components/Common/Pagination";
import { useSearchFilter, SearchInput } from "../../components/Common/useSearchFilter";

const PaymentList = () => {
  const [expenses, setExpenses] = useState([]);

  /* ---------------- HISTORY STATE ---------------- */
  const [history, setHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_API_URL}expense/view-my-expense`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const data = await res.json();
        setExpenses(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      }
    };

    fetchExpenses();
  }, []);

  /* ---------------- SEARCH FILTER + PAGINATION ---------------- */
  const {
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    totalItems,
    paginatedData,
    indexOfFirst,
  } = useSearchFilter(expenses, {
    keys: [
      "project_name",
      "state",
      "district",
      "village",
      "intervention_name",
      "raised_by",
      "manager_name",
      "amount",
      "remarks",
      "payment_amount",
      "created_at",
      "reviewer_status",
      "approval_status",
      "payment_status",
    ],
    itemsPerPage: 100,
  });

  /* ---------------- FETCH HISTORY ---------------- */
  const fetchHistory = async (id) => {
    try {
      setHistoryLoading(true);
      setHistory([]);
      setShowHistoryModal(true);

      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_API_URL}expense/payment-history/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setHistory(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setHistoryLoading(false);
    }
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}expense/delete-expense/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        alert(data.message || "Expense deleted successfully.");
        setExpenses((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert(data.message || "Failed to delete expense.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong while deleting.");
    }
  };

  /* ---------------- EXPORT ---------------- */
  const columns = [
    { label: "Project", key: "project_name" },
    { label: "State", key: "state" },
    { label: "District", key: "district" },
    { label: "Village", key: "village" },
    { label: "Intervention", key: "intervention_name" },
    { label: "Raised By", key: "raised_by" },
    { label: "Manager", key: "manager_name" },
    { label: "Amount", key: "amount" },
    { label: "Approved Amount", key: "final_approved_amount" },
    { label: "Document", key: "document" },
    { label: "Request Date", key: "created_at" },
    { label: "Payment Amount", key: "payment_amount" },
    { label: "Remarks", key: "remarks" },
    { label: "Reviewer Status", key: "reviewer_status" },
    { label: "Approval Status", key: "approval_status" },
    { label: "Payment Status", key: "payment_status" },
  ];

  const exportData = expenses.map((item) => ({
    ...item,
    created_at: item.created_at
      ? new Date(item.created_at).toLocaleDateString("en-IN")
      : "N/A",
  }));

  /* ---------------- STATUS BADGE ---------------- */
  const getBadgeClass = (status) => {
    if (status === "Approved" || status === "Paid") return "bg-success";
    if (status === "Rejected") return "bg-danger";
    if (status === "Partially Paid") return "bg-info";
    return "bg-warning";
  };

  const totalPaymentAmount = history.reduce(
    (sum, item) => sum + Number(item.payment_amount || 0),
    0
  );

  return (
    <>
      <PageTitle activeMenu="Payment List" motherMenu="Payment" />

      <Col lg={12}>
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <Card.Title>Payment Workflow</Card.Title>

            <div className="d-flex align-items-center gap-2">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search payments..."
              />

              <TableExportActions
                data={exportData}
                columns={columns}
                fileName="Payment_List"
              />
            </div>
          </Card.Header>

          <Card.Body>
            <Table responsive className="text-nowrap">
              <thead>
                <tr>
                  <th>Sno</th>
                  <th>Project</th>
                  <th>State</th>
                  <th>District</th>
                  <th>Village</th>
                  <th>Intervention</th>
                  <th>Raised By</th>
                  <th>Manager</th>
                  <th>Amount</th>
                  <th>Remarks</th>
                  <th>Approved Amount</th>
                  <th>Document</th>
                  <th>Request Date</th>
                  <th>Payment Amount</th>
                  <th>Reviewer Status</th>
                  <th>Approval Status</th>
                  <th>Payment Status</th>
                  <th>View History</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, index) => (
                    <tr key={item.id}>
                      {/* indexOfFirst + index + 1 — same as EmployeeList */}
                      <td>{indexOfFirst + index + 1}</td>

                      <td>{item.project_name}</td>
                      <td>{item.state || "N/A"}</td>
                      <td>{item.district || "N/A"}</td>
                      <td>{item.village || "N/A"}</td>

                      <td>{item.intervention_name || "N/A"}</td>
                      <td>{item.raised_by || "N/A"}</td>
                      <td>{item.manager_name || "N/A"}</td>

                      <td>₹ {item.amount}</td>
                      <td>{item.remarks || "N/A"}</td>
                      <td>₹ {item.final_approved_amount || 0}</td>

                      {/* Document */}
                      <td>
                        {item.document ? (
                          <a
                            href={`${import.meta.env.VITE_BACKEND_API_URL}uploads/${item.document}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </td>

                      {/* Date */}
                      <td>
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString("en-IN")
                          : "N/A"}
                      </td>

                      <td>₹ {item.payment_amount || 0}</td>



                      {/* Reviewer */}
                      <td>
                        <span className={`badge ${getBadgeClass(item.reviewer_status)}`}>
                          {item.reviewer_status}
                        </span>
                      </td>

                      {/* Approval */}
                      <td>
                        <span className={`badge ${getBadgeClass(item.approval_status)}`}>
                          {item.approval_status}
                        </span>
                      </td>

                      {/* Payment */}
                      <td className="text-center">
                        <span className={`badge ${getBadgeClass(item.payment_status)}`}>
                          {item.payment_status}
                        </span>
                      </td>

                      {/* View History */}
                      <td className="text-center">
                        {item.payment_status != "Pending" ? (
                          <button
                            className="btn btn-info btn-sm text-white"
                            title="View Payment History"
                            onClick={() => fetchHistory(item.id)}
                          >
                            <i className="fa fa-history" />
                          </button>
                        ) : (
                          <span className="text-muted">
                            <i className="fa fa-lock"></i>
                          </span>
                        )}
                      </td>

                      {/* Delete Action */}
                      <td className="text-center">
                        {item.approval_status === "Pending" ? (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(item.id)}
                          >
                            <i className="fa fa-trash" />
                          </button>
                        ) : (
                          <span className="text-muted">
                            <i className="fa fa-lock"></i>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="19" className="text-center">
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

      {/* ==================== PAYMENT HISTORY MODAL ==================== */}
      <Modal
        show={showHistoryModal}
        onHide={() => setShowHistoryModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fa fa-history me-2 text-info" />
            Payment History
            <span className="ms-2 text-success">
              Total: ₹ {totalPaymentAmount.toLocaleString("en-IN")}
            </span>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {historyLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="info" />
              <p className="mt-2 text-muted">Loading history...</p>
            </div>
          ) : history.length > 0 ? (
            <Table hover className="text-nowrap mb-0">
              <thead className="">
                <tr>
                  <th>Sno</th>
                  <th>Payment Amount</th>
                  <th>Payment Date</th>
                  <th>Remarks</th>
                  <th>Reference no</th>
                  <th>Payment Status</th>
                  <th>Paid By</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, idx) => (
                  <tr key={h.id || idx}>
                    <td>{idx + 1}</td>

                    <td>₹ {h.payment_amount ?? "N/A"}</td>

                    <td>
                      {h.payment_date
                        ? new Date(h.payment_date).toLocaleDateString("en-IN")
                        : "N/A"}
                    </td>

                    <td>{h.remarks || "N/A"}</td>
                    <td>{h.reference_no || "N/A"}</td>
                    <td>

                      {h.payment_mode || "N/A"}

                    </td>

                    <td>{h.accountant_name || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted">
              <i className="fa fa-inbox fa-2x mb-2" />
              <p className="mb-0">No payment history found.</p>
            </div>
          )}
        </Modal.Body>



      </Modal>
    </>
  );
};

export default PaymentList;