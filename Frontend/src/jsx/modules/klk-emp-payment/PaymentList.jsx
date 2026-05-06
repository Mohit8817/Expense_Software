import React, { useEffect, useState } from "react";
import { Table, Card, Col, Modal, Spinner } from "react-bootstrap";
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

  /* ---------------- EDIT STATE ---------------- */
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editErrors, setEditErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [editFormData, setEditFormData] = useState({
    project_name: "",
    project_state: "",
    project_district: "",
    project_village: "",
    intervention: "",
    amount: "",
    document: null,
    remarks: "",
  });

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    fetchExpenses();
  }, []);

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
      "project_name", "state", "district", "village", "intervention_name",
      "raised_by", "manager_name", "amount", "remarks", "payment_amount",
      "requested_date", "reviewer_status", "approval_status", "payment_status",
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
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setHistory(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setHistoryLoading(false);
    }
  };

  /* ---------------- FETCH EDIT DATA ---------------- */
  const fetchEditData = async (id) => {
    try {
      setEditLoading(true);
      setEditErrors({});
      setEditingId(id);
      setShowEditModal(true);

      // Fetch expense data and dropdown options in parallel
      const [expenseRes, dropdownRes] = await Promise.all([
        fetch(
          `${import.meta.env.VITE_BACKEND_API_URL}expense/edit-expense/${id}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        ),
        fetch(
          `${import.meta.env.VITE_BACKEND_API_URL}expense/add-expense`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        ),
      ]);

      const expenseJson = await expenseRes.json();
      const dropdownJson = await dropdownRes.json();

      if (!expenseRes.ok) {
        alert(expenseJson.message || "Failed to load expense.");
        setShowEditModal(false);
        return;
      }

      const expense = expenseJson.data;
      setProjects(dropdownJson.projects || []);
      setInterventions(dropdownJson.interventions || []);

      setEditFormData({
        project_name: expense.project_name || "",
        project_state: expense.project_state || "",
        project_district: expense.project_district || "",
        project_village: expense.project_village || "",
        intervention: expense.intervention || "",
        amount: expense.amount || "",
        document: null, // file input always starts empty
        remarks: expense.remarks || "",
        existingDocument: expense.document || null,
      });
    } catch (error) {
      console.error(error);
      alert("Something went wrong while loading expense.");
      setShowEditModal(false);
    } finally {
      setEditLoading(false);
    }
  };

  /* ---------------- EDIT VALIDATION ---------------- */
  const validateEditField = (name, value) => {
    switch (name) {
      case "project_name":
        return value ? "" : "Project Name is required.";
      case "project_state":
        if (!value.trim()) return "State is required.";
        if (!/^[a-zA-Z\s]+$/.test(value.trim())) return "State should contain only letters.";
        return "";
      case "project_district":
        if (!value.trim()) return "District is required.";
        if (!/^[a-zA-Z\s]+$/.test(value.trim())) return "District should contain only letters.";
        return "";
      case "project_village":
        if (!value.trim()) return "Village is required.";
        if (!/^[a-zA-Z\s]+$/.test(value.trim())) return "Village should contain only letters.";
        return "";
      case "intervention":
        return value ? "" : "Intervention is required.";
      case "amount":
        if (!value) return "Amount is required.";
        if (isNaN(value) || Number(value) <= 0) return "Amount must be a positive number.";
        return "";
      case "document": {
        if (!value) return "";
        const allowedTypes = ["image/jpeg", "image/png", "application/pdf", "image/jpg"];
        if (!allowedTypes.includes(value.type)) return "Only JPG, PNG, or PDF files are allowed.";
        if (value.size > 8 * 1024 * 1024) return "File size must be less than 5MB.";
        return "";
      }
      case "remarks":
        if (value.trim() && value.trim().length < 5) return "Remarks must be at least 5 characters if provided.";
        if (value.length > 500) return "Remarks cannot exceed 500 characters.";
        return "";
      default:
        return "";
    }
  };

  const validateEditAll = () => {
    const newErrors = {};
    ["project_name", "project_state", "project_district", "project_village",
      "intervention", "amount", "remarks"].forEach((field) => {
        const error = validateEditField(field, editFormData[field]);
        if (error) newErrors[field] = error;
      });
    const docError = validateEditField("document", editFormData.document);
    if (docError) newErrors.document = docError;
    return newErrors;
  };

  /* ---------------- EDIT HANDLE CHANGE ---------------- */
  const handleEditChange = (e) => {
    const { name, value, files } = e.target;
    let newValue;
    if (name === "document") {
      newValue = files && files.length > 0 ? files[0] : null;
    } else {
      newValue = value;
    }
    setEditFormData((prev) => ({ ...prev, [name]: newValue }));
    const error = validateEditField(name, newValue);
    setEditErrors((prev) => ({ ...prev, [name]: error }));
  };

  /* ---------------- EDIT SUBMIT ---------------- */
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateEditAll();
    if (Object.values(validationErrors).some((err) => err !== "")) {
      setEditErrors(validationErrors);
      return;
    }

    try {
      setEditSubmitting(true);

      const form = new FormData();
      form.append("project_name", editFormData.project_name);
      form.append("project_state", editFormData.project_state);
      form.append("project_district", editFormData.project_district);
      form.append("project_village", editFormData.project_village);
      form.append("amount", editFormData.amount);
      form.append("intervention", editFormData.intervention);
      form.append("remarks", editFormData.remarks);
      if (editFormData.document) {
        form.append("document", editFormData.document);
      }

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}expense/update-expense/${editingId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: form,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to update expense.");
        return;
      }

      alert("Expense updated successfully.");
      setShowEditModal(false);
      fetchExpenses(); // Refresh the list
    } catch (error) {
      console.error(error);
      alert("Something went wrong while updating.");
    } finally {
      setEditSubmitting(false);
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
    { label: "Request Date", key: "requested_date" },
    { label: "Manager", key: "manager_name" },
    { label: "Manager Approved Date", key: "manager_approved_at" },
    { label: "Amount", key: "amount" },
    { label: "Approved Amount", key: "final_approved_amount" },
    { label: "Document", key: "document" },
    { label: "Payment Amount", key: "payment_amount" },
    { label: "Remarks", key: "remarks" },
    { label: "Reviewer Status", key: "reviewer_status" },
    { label: "Approval Status", key: "approval_status" },
    { label: "Payment Status", key: "payment_status" },
  ];

  const exportData = expenses.map((item) => ({
    ...item,
    requested_date: item.requested_date || "N/A",
    manager_approved_at: item.manager_approved_at || "N/A",
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
                  <th>Raised Date</th>
                  <th>Manager</th>
                  <th>Manager Appr Date</th>
                  <th>Amount</th>
                  <th>Remarks</th>
                  <th>Approved Amount</th>
                  <th>Document</th>
                  {/* <th>Request Date</th> */}
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
                      <td>{indexOfFirst + index + 1}</td>
                      <td>{item.project_name}</td>
                      <td>{item.state || "N/A"}</td>
                      <td>{item.district || "N/A"}</td>
                      <td>{item.village || "N/A"}</td>
                      <td>{item.intervention_name || "N/A"}</td>
                      <td>{item.raised_by || "N/A"}</td>

                      <td>
                        {item.requested_date}
                      </td>

                      <td>{item.manager_name || "N/A"}</td>

                      <td className="text-center">
                        {item.manager_approved_at}
                      </td>

                      <td>₹ {item.amount}</td>
                      <td>{item.remarks || "N/A"}</td>
                      <td>₹ {item.final_approved_amount || 0}</td>

                      <td>
                        {item.document ? (
                          <a
                            href={`${import.meta.env.VITE_BACKEND_BASE_URL}/uploads/${item.document}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </td>



                      <td>₹ {item.payment_amount || 0}</td>

                      <td>
                        <span className={`badge ${getBadgeClass(item.reviewer_status)}`}>
                          {item.reviewer_status}
                        </span>
                      </td>

                      <td>
                        <span className={`badge ${getBadgeClass(item.approval_status)}`}>
                          {item.approval_status}
                        </span>
                      </td>

                      <td className="text-center">
                        <span className={`badge ${getBadgeClass(item.payment_status)}`}>
                          {item.payment_status}
                        </span>
                      </td>

                      {/* View History */}
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

                      {/* Action: Edit + Delete — only when approval_status is Pending */}
                      <td className="text-center">
                        {item.approval_status === "Pending" ? (
                          <div className="d-flex gap-1 justify-content-center">
                            <button
                              className="btn btn-warning btn-sm text-white"
                              title="Edit Expense"
                              onClick={() => fetchEditData(item.id)}
                            >
                              <i className="fa fa-pencil" />
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              title="Delete Expense"
                              onClick={() => handleDelete(item.id)}
                            >
                              <i className="fa fa-trash" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted">
                            <i className="fa fa-lock" />
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
            <Table hover responsive className="text-nowrap mb-0">
              <thead>
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
                    <td>{h.payment_mode || "N/A"}</td>
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

      {/* ==================== EDIT EXPENSE MODAL ==================== */}
      <Modal
        show={showEditModal}
        onHide={() => !editSubmitting && setShowEditModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fa fa-pencil me-2 text-warning" />
            Edit Expense
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {editLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="warning" />
              <p className="mt-2 text-muted">Loading expense data...</p>
            </div>
          ) : (
            <form onSubmit={handleEditSubmit} noValidate>
              <div className="row">

                {/* Project Name */}
                <div className="col-lg-6 mb-3">
                  <label>
                    Project Name <span className="text-danger">*</span>
                  </label>
                  <select
                    name="project_name"
                    className={`form-control ${editErrors.project_name ? "is-invalid" : ""}`}
                    value={editFormData.project_name}
                    onChange={handleEditChange}
                  >
                    <option value="">Select Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {editErrors.project_name && (
                    <div className="invalid-feedback">{editErrors.project_name}</div>
                  )}
                </div>

                {/* State */}
                <div className="col-lg-6 mb-3">
                  <label>
                    State <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="project_state"
                    className={`form-control ${editErrors.project_state ? "is-invalid" : ""}`}
                    value={editFormData.project_state}
                    onChange={handleEditChange}
                    placeholder="e.g. Rajasthan"
                  />
                  {editErrors.project_state && (
                    <div className="invalid-feedback">{editErrors.project_state}</div>
                  )}
                </div>

                {/* District */}
                <div className="col-lg-6 mb-3">
                  <label>
                    District <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="project_district"
                    className={`form-control ${editErrors.project_district ? "is-invalid" : ""}`}
                    value={editFormData.project_district}
                    onChange={handleEditChange}
                    placeholder="e.g. Jaipur"
                  />
                  {editErrors.project_district && (
                    <div className="invalid-feedback">{editErrors.project_district}</div>
                  )}
                </div>

                {/* Village */}
                <div className="col-lg-6 mb-3">
                  <label>
                    Village <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="project_village"
                    className={`form-control ${editErrors.project_village ? "is-invalid" : ""}`}
                    value={editFormData.project_village}
                    onChange={handleEditChange}
                    placeholder="e.g. Sanganer"
                  />
                  {editErrors.project_village && (
                    <div className="invalid-feedback">{editErrors.project_village}</div>
                  )}
                </div>

                {/* Intervention */}
                <div className="col-lg-6 mb-3">
                  <label>
                    Intervention <span className="text-danger">*</span>
                  </label>
                  <select
                    name="intervention"
                    className={`form-control ${editErrors.intervention ? "is-invalid" : ""}`}
                    value={editFormData.intervention}
                    onChange={handleEditChange}
                  >
                    <option value="">Select Intervention</option>
                    {interventions.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                  {editErrors.intervention && (
                    <div className="invalid-feedback">{editErrors.intervention}</div>
                  )}
                </div>

                {/* Amount */}
                <div className="col-lg-6 mb-3">
                  <label>
                    Amount (₹) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    className={`form-control ${editErrors.amount ? "is-invalid" : ""}`}
                    value={editFormData.amount}
                    onChange={handleEditChange}
                    placeholder="Enter amount"
                    min="0.01"
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e" || e.key === "E") {
                        e.preventDefault();
                      }
                    }}
                  />
                  {editErrors.amount && (
                    <div className="invalid-feedback">{editErrors.amount}</div>
                  )}
                </div>

                {/* Document */}
                <div className="col-lg-12 mb-3">
                  <label>Upload Document</label>
                  {/* Show existing document link if available */}
                  {editFormData.existingDocument && (
                    <div className="mb-1">
                      <small className="text-muted">Current: </small>
                      <a
                        href={`${import.meta.env.VITE_BACKEND_BASE_URL}/uploads/${editFormData.existingDocument}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-info small"
                      >
                        View existing document
                      </a>
                    </div>
                  )}
                  <input
                    type="file"
                    name="document"
                    className={`form-control ${editErrors.document ? "is-invalid" : ""}`}
                    onChange={handleEditChange}
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,image/jpg,application/pdf"
                    multiple={false}
                  />
                  <small className="text-muted">
                    Allowed: JPG, PNG, PDF — Max size: 5MB
                    {editFormData.existingDocument && " (leave empty to keep existing)"}
                  </small>
                  {editErrors.document && (
                    <div className="invalid-feedback d-block">{editErrors.document}</div>
                  )}
                </div>

                {/* Remarks */}
                <div className="col-lg-12 mb-3">
                  <label>Remarks</label>
                  <textarea
                    name="remarks"
                    className={`form-control ${editErrors.remarks ? "is-invalid" : ""}`}
                    rows="3"
                    value={editFormData.remarks}
                    onChange={handleEditChange}
                    placeholder="Optional remarks (max 500 characters)"
                    maxLength={500}
                  />
                  <small className="text-muted">
                    {editFormData.remarks.length}/500
                  </small>
                  {editErrors.remarks && (
                    <div className="invalid-feedback">{editErrors.remarks}</div>
                  )}
                </div>

              </div>

              <div className="text-end d-flex gap-2 justify-content-end">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                  disabled={editSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-warning text-white"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-1" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="fa fa-save me-1" />
                      Update Expense
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default PaymentList;