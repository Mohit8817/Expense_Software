import React, { useState, useEffect } from "react";
import { Table, Card, Col, Button, Modal, Form } from "react-bootstrap";
import axios from "axios";
import PageTitle from "../../layouts/PageTitle";
import TableExportActions from "../../components/Common/TableExportActions";
import Pagination from "../../components/Common/Pagination";




const ManagerList = () => {
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

  // ✅ FETCH DATA
  useEffect(() => {
    fetchExpenses();
    fetchReviewers();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_API_URL}expense/manager-expenses`,
        {
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

  // ✅ FETCH REVIEWERS
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


  /* ---------------- EXPORT ---------------- */
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
  }));

  const columns = [
    { label: "Raised By", key: "raised_by" },
    { label: "Manager", key: "manager_name" },
    { label: "Project", key: "project" },
    { label: "Intervention", key: "intervention" },
    { label: "State", key: "state" },
    { label: "District", key: "district" },
    { label: "Village", key: "village" },
    { label: "Amount", key: "amount" },
    { label: "Reviewer", key: "reviewer_name" },
    { label: "Reviewer Status", key: "reviewer_approval_text" },
    { label: "Approved Amount", key: "approved_amount" },
    { label: "Manager Approval", key: "status" },
  ];



  /* ---------------- PAGINATION ---------------- */
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentData = data.slice(indexOfFirst, indexOfLast);


  const getFinalAmount = (item) => {
  if (
    item.review_assign === true &&
    Number(item.reviewer_approval_status) === 1
  ) {
    return item.approved_amount;
  }
  return item.amount;
};

  

  // ✅ OPEN REVIEW MODAL
const handleOpenModal = (item) => {
  setSelectedItem(item);

  setReviewData({
    managerApproval: "1",
    approvedamount: getFinalAmount(item), // ✅ correct now
    remark: "",
  });

  setShowModal(true);
};

  // ✅ OPEN ASSIGN MODAL
  const handleAssign = (item) => {
    setSelectedItem(item);
    setShowAssignModal(true);
  };

  // ✅ HANDLE CHANGE
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

  // ✅ SUBMIT APPROVAL
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

    alert("✅ Manager decision saved");

    setShowModal(false);
    fetchExpenses();

  } catch (error) {
    console.error(error);
  }
};

  // ✅ ASSIGN REVIEWER API
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

    alert("✅ Reviewer assigned successfully");
    setShowAssignModal(false);
    setAssignData({
      reviewer_id: "",
      managertoreviewer: "",
    });

    fetchExpenses(); // refresh table

  } catch (error) {
    console.error(error);
  }
};

  return (
    <>
      <PageTitle activeMenu="Manager Panel" motherMenu="Payment" />

     <Col lg={12}>
        <Card>

          {/*   Header with Export */}
          <Card.Header className="d-flex justify-content-between">
            <Card.Title>Manager Approval</Card.Title>

            <TableExportActions
              data={exportData}
              columns={columns}
              fileName="Manager_List"
            />
          </Card.Header>

          <Card.Body>
            <Table responsive className="text-nowrap">
              <thead>
                <tr>
                  <th>Sno</th>
                  <th>Raised By</th>
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
                  <th>Manager Approval</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {currentData.length > 0 ? (
                  currentData.map((item, index) => (
                    <tr key={item.id}>
                      {/*   Serial number uses indexOfFirst like PaymentList */}
                      <td>{indexOfFirst + index + 1}</td>
                      <td>{item.raised_by}</td>
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

                      {/* ASSIGN */}
                      <td>
                        <button
                          className={`btn btn-xs ${
                            item.review_assign ? "btn-success" : "btn-warning"
                          }`}
                          onClick={() =>
                            !item.review_assign && handleAssign(item)
                          }
                          disabled={!!item.review_assign}
                        >
                          {item.review_assign ? "Assigned" : "Pending"}
                        </button>
                      </td>

                      <td>
                        <b>Reviewer : </b> {item.reviewer_name} <br />
                        <b>Manager to Reviewer : </b> {item.managertoreviewer}
                      </td>

                      <td>
                        <b>Approval status : </b>
                        <span
                          className={`badge ${
                            item.reviewer_approval_text === "Approved"
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
                        <b>Reviewer to Manager : </b> {item.reviewer_remarks}
                      </td>

                      {/* STATUS */}
                      <td>
                        <span
                          className={`badge ${
                            item.status === "Approved"
                              ? "bg-success"
                              : item.status === "Rejected"
                              ? "bg-danger"
                              : "bg-warning"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* ACTION */}
                      <td>
                        <Button
                          size="sm"
                          onClick={() => handleOpenModal(item)}
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="15" className="text-center">
                      No Data Found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>

            {/*   Pagination */}
            <Pagination
              totalItems={data.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </Card.Body>
        </Card>
      </Col>
      {/* REVIEW MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
  <Modal.Header closeButton>
    <Modal.Title>Manager Review</Modal.Title>
  </Modal.Header>

  <Modal.Body>
    {selectedItem && (
      <>
        {/* 🔹 TOP INFO */}
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

        {/* 🔹 FORM */}
        <Form>

          {/* Approval */}
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

          {/* Approved Amount */}
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

          {/* Remark */}
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

      {/* ASSIGN MODAL */}
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
    </>
  );
};

export default ManagerList;