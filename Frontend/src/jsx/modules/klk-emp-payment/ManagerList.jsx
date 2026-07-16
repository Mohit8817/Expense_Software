import React, { useState, useEffect } from "react";
import { Table, Card, Col, Button, Modal, Form, Badge, Spinner } from "react-bootstrap";
import axios from "axios";
import PageTitle from "../../layouts/PageTitle";
import TableExportActions from "../../components/Common/TableExportActions";
import Pagination from "../../components/Common/Pagination";
import { useSearchFilter, SearchInput } from "../../components/Common/useSearchFilter";


const ManagerExpenseTable = ({ status, pageTitle, cardTitle }) => {
  const [data, setData] = useState([]);
  const [reviewers, setReviewers] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [reviewData, setReviewData] = useState({
    managerApproval: "1",
    remark: "",
  });

  const [assignData, setAssignData] = useState({
    reviewer_id: "",
    managertoreviewer: "",
  });

  // ─── PAYMENT HISTORY STATE (NEW) ──────────────────────────────────────────
  const [history, setHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ─── FETCH ────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchExpenses();
    fetchReviewers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_API_URL}expense/manager-expenses`,
        {
          params: { status },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setData(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchReviewers = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_API_URL}expense/reviewers`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setReviewers(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  // ─── FETCH PAYMENT HISTORY (NEW) ──────────────────────────────────────────
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

  // ─── SEARCH + PAGINATION ──────────────────────────────────────────────────
  const {
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    totalItems,
    paginatedData,
    indexOfFirst,
  } = useSearchFilter(data, {
    keys: [
      "raised_by",
      "manager_name",
      "project",
      "intervention",
      "state",
      "district",
      "village",
      "amount",
      "reviewer_name",
      "reviewer_approval_text",
      "status",
    ],
    itemsPerPage: 100,
  });

  // ─── EXPORT ───────────────────────────────────────────────────────────────
  const exportData = data.map((item) => ({
    ...item,
    status:
      item.status === "Approved"
        ? "Approved"
        : item.status === "Rejected"
          ? "Rejected"
          : "Pending",
    reviewer_approval_text: item.reviewer_approval_text || "Pending",
    review_assign: item.review_assign ? "Assigned" : "Pending",
    // ── Pending Amount export (NEW) ──
    pending_amount:
      Number(item.final_approved_amount || 0) - Number(item.paid_amount || 0),
  }));

  const columns = [
    { label: "Raised By", key: "raised_by" },
    { label: "Raised Date", key: "requested_date" },
    { label: "Manager", key: "manager_name" },
    { label: "Project", key: "project" },
    { label: "Intervention", key: "intervention" },
    { label: "State", key: "state" },
    { label: "District", key: "district" },
    { label: "Village", key: "village" },
    { label: "Amount", key: "amount" },
    { label: "Reviewer", key: "reviewer_name" },
    { label: "Reviewer Assigned", key: "assign_date" },
    { label: "Reviewer Status", key: "reviewer_approval_text" },
    { label: "Approved Amount", key: "approved_amount" },
    { label: "Manager Approved Date", key: "manager_approved_at" },
    { label: "Paid Amount", key: "paid_amount" },
    { label: "Pending Amount", key: "pending_amount" },
    { label: "Manager Approval", key: "status" },
  ];

  // ─── HELPERS ──────────────────────────────────────────────────────────────
  const getFinalAmount = (item) => {
    if (
      item.review_assign === true &&
      Number(item.reviewer_approval_status) === 1
    ) {
      return item.approved_amount;
    }
    return item.amount;
  };

  // ─── PENDING AMOUNT CALCULATION (NEW) ─────────────────────────────────────
  const getPendingAmount = (item) => {
    const approved = Number(item.final_approved_amount || 0);
    const paid = Number(item.paid_amount || 0);
    return approved - paid;
  };

  // ─── HISTORY TOTAL (NEW) ──────────────────────────────────────────────────
  const totalHistoryPayment = history.reduce(
    (sum, item) => sum + Number(item.payment_amount || 0),
    0
  );

  // ─── MODAL HANDLERS ───────────────────────────────────────────────────────
  const handleOpenModal = (item) => {
    setSelectedItem(item);
    setReviewData({
      managerApproval: "1",
      approvedamount: getFinalAmount(item),
      remark: "",
    });
    setShowModal(true);
  };

  const handleAssign = (item) => {
    setSelectedItem(item);
    setShowAssignModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...reviewData, [name]: value };
    if (name === "managerApproval" && value === "2") {
      updated.approvedamount = 0;
    }
    setReviewData(updated);
  };

  const handleAssignChange = (e) => {
    const { name, value } = e.target;
    setAssignData({ ...assignData, [name]: value });
  };

  // ─── SUBMIT APPROVAL ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_BACKEND_API_URL}expense/manager-approve/${selectedItem.id}`,
        {
          approval_status: Number(reviewData.managerApproval),
          manager_remarks: reviewData.remark,
          final_approved_amount: Number(reviewData.approvedamount),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      alert("Manager decision saved");
      setShowModal(false);
      fetchExpenses();
    } catch (error) { 
      console.error(error);
    }
  };

  // ─── ASSIGN REVIEWER ──────────────────────────────────────────────────────
  const handleAssignSubmit = async () => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_BACKEND_API_URL}expense/assign-reviewer/${selectedItem.id}`,
        {
          reviewer_id: Number(assignData.reviewer_id),
          managertoreviewer: assignData.managertoreviewer,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      alert("Reviewer assigned successfully");
      setShowAssignModal(false);
      setAssignData({ reviewer_id: "", managertoreviewer: "" });
      fetchExpenses();
    } catch (error) {
      console.error(error);
    }
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <>
      <PageTitle activeMenu={pageTitle} motherMenu="Payment" />

      <Col lg={12}>
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <Card.Title>{cardTitle}</Card.Title>

            <div className="d-flex align-items-center gap-2">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search..."
              />
              <TableExportActions
                data={exportData}
                columns={columns}
                fileName={`Manager_${pageTitle}`}
              />
            </div>
          </Card.Header>

          <Card.Body>
            <Table responsive className="text-nowrap">
              <thead>
                <tr>
                  <th>Sno</th>
                  <th>Raised By</th>
                  <th>Raised Date</th>
                  <th>Manager</th>
                  <th>Project</th>
                  <th>Intervention</th>
                  <th>State</th>
                  <th>District</th>
                  <th>Village</th>
                  <th>Document</th>
                  <th>Amount</th>
                  <th>Reviewer</th>
                  <th>Reviewer Detail</th>
                  <th>Reviewer Response</th>
                  <th>Approved Amount</th>
                  <th>Manager Approval</th>
                  <th>Manager Approval Date</th>
                  <th>Paid Amount</th>
                  <th>Pending Amount</th>
                  <th>View History</th>
                  {status === 0 && <th>Action</th>}
                </tr>
              </thead>

              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, index) => (
                    <tr key={item.id}>
                      <td>{indexOfFirst + index + 1}</td>
                      <td>{item.raised_by}</td>
                      <td>    {item.requested_date}  </td>

                      <td>{item.manager_name}</td>
                      <td>{item.project}</td>
                      <td>{item.intervention}</td>
                      <td>{item.state}</td>
                      <td>{item.district}</td>
                      <td>{item.village}</td>

                      <td>
                        {item.document ? (
                          <a
                            href={`${import.meta.env.VITE_BACKEND_BASE_URL}/uploads/${item.document}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary"
                          >
                            View
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </td>

                      <td>₹ {item.amount}</td>

                      {/* Assign Reviewer */}
                      <td>
                        <button
                          className={`btn btn-xs ${item.review_assign ? "btn-success" : "btn-warning"}`}
                          onClick={() => !item.review_assign && handleAssign(item)}
                          disabled={!!item.review_assign || status !== 0}
                        >
                          {item.review_assign ? "Assigned" : "Pending"}
                        </button>
                      </td>

                      <td>
                        <b>Reviewer : </b> {item.reviewer_name} <br />
                        <b>Manager to Reviewer : </b> {item.managertoreviewer} <br/>
                        <b>Assign Date : </b> {item.assign_date}

                      </td>

                      <td>
                        <b>Approval status : </b>
                        <span
                          className={`badge ${item.reviewer_approval_text === "Approved"
                            ? "bg-success"
                            : item.reviewer_approval_text === "Rejected"
                              ? "bg-danger"
                              : "bg-warning"
                            }`}
                        >
                          {item.reviewer_approval_text}
                        </span>
                        <br />
                        <b>Approved Amount : </b> {item.approved_amount} <br />
                        <b>Reviewer to Manager : </b> {item.reviewer_remarks} <br/>
                        <b> Reviewer Date: </b> {item.reviewer_approved_at}
                      </td>

                      <td>₹ {item.final_approved_amount}</td>

                      {/* Manager Approval Status */}
                      <td>
                        <span
                          className={`badge ${item.status === "Approved"
                            ? "bg-success"
                            : item.status === "Rejected"
                              ? "bg-danger"
                              : "bg-warning"
                            }`}
                        >
                          {item.status}

                        </span>
                                             
                      </td>
                      <td className="text-center"> {item.manager_approved_at} </td>
                      <td>₹ {item.paid_amount || 0}</td>

                      {/* Pending Amount (NEW) */}
                      <td>
                        <span>
                          ₹ {getPendingAmount(item)}
                        </span>
                      </td>



                      {/* View History  */}
                      <td className="text-center">
                        {item.payment_status !== "Pending" ? (
                          <button
                            className="btn btn-info btn-sm text-white"
                            title="View Payment History"
                            onClick={() => fetchHistory(item.id)}
                          >
                            <i className="fa fa-history" />
                          </button>
                        ) : (
                          <span className="text-muted">
                            <i className="fa fa-lock" />
                          </span>
                        )}
                      </td>

                      {/* Action — only on Pending page */}
                      {status === 0 && (
                        <td>
                          <Button
                            size="sm"
                            onClick={() => handleOpenModal(item)}
                            disabled={
                              item.status === "Approved" ||
                              item.status === "Rejected"
                            }
                          >
                            Review
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={status === 0 ? "18" : "17"} className="text-center">
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

      {/* ── REVIEW MODAL ────────────────────────────────────────────────── */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Manager Review</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selectedItem && (
            <>
              <div className="mb-3 p-3 border rounded bg-light">
                <div className="d-flex justify-content-between mb-2">
                  <span><strong>Project:</strong> {selectedItem.project}</span>
                  <span><strong>Intervention:</strong> {selectedItem.intervention}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span><strong>Amount:</strong> ₹ {selectedItem.amount}</span>
                  <span>
                    <strong>Approved Amount:</strong> ₹{" "}
                    {selectedItem.approved_amount || selectedItem.amount}
                  </span>
                </div>
              </div>

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Approval</Form.Label>
                  <Form.Select
                    name="managerApproval"
                    value={reviewData.managerApproval}
                    onChange={handleChange}
                  >
                    <option value="1">Approved</option>
                    <option value="2">Rejected</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Approved Amount</Form.Label>
                  <Form.Control
                    type="number"
                    name="approvedamount"
                    value={reviewData.approvedamount || selectedItem.amount}
                    onChange={handleChange}
                    disabled={reviewData.managerApproval === "2"}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Remarks</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="remark"
                    value={reviewData.remark}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── ASSIGN MODAL ────────────────────────────────────────────────── */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Assign Reviewer</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Select
              name="reviewer_id"
              value={assignData.reviewer_id}
              onChange={handleAssignChange}
            >
              <option value="">Select Reviewer</option>
              {reviewers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.username} ({r.email})
                </option>
              ))}
            </Form.Select>

            <Form.Control
              as="textarea"
              className="mt-3"
              name="managertoreviewer"
              value={assignData.managertoreviewer}
              placeholder="Enter remark"
              onChange={handleAssignChange}
            />
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={() => setShowAssignModal(false)}>Cancel</Button>
          <Button onClick={handleAssignSubmit}>Assign</Button>
        </Modal.Footer>
      </Modal>

      {/* ── PAYMENT HISTORY MODAL (NEW) ─────────────────────────────────── */}
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
              Total: ₹ {totalHistoryPayment.toLocaleString("en-IN")}
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
            <Table hover responsive className="text-nowrap mb-0">
              <thead>
                <tr>
                  <th>Sno</th>
                  <th>Payment Amount</th>
                  <th>Payment Date</th>
                  <th>Remarks</th>
                  <th>Reference No</th>
                  <th>Payment Mode</th>
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
                      <span>{h.payment_mode || "N/A"}</span>
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

export default ManagerExpenseTable;