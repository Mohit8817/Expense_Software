import React, { useState, useEffect } from "react";
import { Table, Card, Col, Modal, Button, Form } from "react-bootstrap";
import axios from "axios";
import PageTitle from "../../layouts/PageTitle";
import TableExportActions from "../../components/Common/TableExportActions";
import Pagination from "../../components/Common/Pagination";
import { useSearchFilter, SearchInput } from "../../components/Common/useSearchFilter"; //   ADD THIS

const ReviewerList = () => {

  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [reviewData, setReviewData] = useState({
    reviewerApproval: "1",
    approvedamount: "",
    remark: "",
  });

  //   REPLACE manual pagination state with useSearchFilter
  const {
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    totalItems,
    paginatedData,
    indexOfFirst,
  } = useSearchFilter(data, {
    keys: [ "raised_by", "manager_name", "reviewer_name", "project", "intervention", "state", "district", "village" , "amount", "approved_amount", "manager_remark", "reviewer_remarks", "reviewer_status" ],
    itemsPerPage: 100,
  });

  //   FETCH DATA
  useEffect(() => {
    fetchReviewerExpenses();
  }, []);

  const fetchReviewerExpenses = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_API_URL}expense/review-expenses`,
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

  /* ---------------- EXPORT ---------------- */
  const exportData = data.map((item) => ({
    ...item,
    reviewer_status:
      item.reviewer_status === "Approved"
        ? "Approved"
        : item.reviewer_status === "Rejected"
        ? "Rejected"
        : "Pending",
  }));

  const columns = [
    { label: "Raised By", key: "raised_by" },
    { label: "Manager", key: "manager_name" },
    { label: "Reviewer", key: "reviewer_name" },
    { label: "Project", key: "project" },
    { label: "Intervention", key: "intervention" },
    { label: "State", key: "state" },
    { label: "District", key: "district" },
    { label: "Village", key: "village" },
    { label: "Amount", key: "amount" },
    { label: "Approved Amount", key: "approved_amount" },
    { label: "Manager Remark", key: "manager_remark" },
    { label: "Reviewer Remarks", key: "reviewer_remarks" },
    { label: "Status", key: "reviewer_status" },
  ];

  //   OPEN MODAL
  const handleOpenModal = (item) => {
    setSelectedItem(item);
    setReviewData({
      reviewerApproval: "1",
      approvedamount: item.approved_amount || item.amount,
      remark: "",
    });
    setShowModal(true);
  };

  //   HANDLE CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;
    setReviewData({ ...reviewData, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_BACKEND_API_URL}expense/reviewer-approval/${selectedItem.id}`,
        {
          reviewer_approval_status: Number(reviewData.reviewerApproval),
          reviewer_remarks: reviewData.remark,
          approved_amount: Number(reviewData.approvedamount),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      alert("Review submitted successfully ");
      setShowModal(false);
      fetchReviewerExpenses();
    } catch (error) {
      console.error(error);
      alert("Something went wrong ");
    }
  };

  return (
    <>
      <PageTitle activeMenu="Reviewer Panel" motherMenu="Payment" />

      <Col lg={12}>
        <Card>

          {/*   Header with Search + Export */}
          <Card.Header className="d-flex justify-content-between align-items-center">
            <Card.Title>Reviewer Tasks</Card.Title>

            <div className="d-flex align-items-center gap-2">
              {/*   ADD SearchInput */}
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search reviewer tasks..."
              />
              <TableExportActions
                data={exportData}
                columns={columns}
                fileName="Reviewer_List"
              />
            </div>
          </Card.Header>

          <Card.Body>
            <Table responsive className="text-nowrap">
              <thead>
                <tr>
                  <th>Sno</th>
                  <th>Raised By</th>
                  <th>Manager</th>
                  <th>Reviewer</th>
                  <th>Project</th>
                  <th>Intervention</th>
                  <th>State</th>
                  <th>District</th>
                  <th>Village</th>
                  <th>Document</th>
                  <th>Amount</th>
                  <th>Approved Amount</th>
                  <th>Manager Remark</th>
                  <th>Reviewer Approval</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {/*   USE paginatedData instead of currentData */}
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, index) => (
                    <tr key={item.id}>
                      {/*   USE indexOfFirst from hook for correct serial number */}
                      <td>{indexOfFirst + index + 1}</td>
                      <td>{item.raised_by}</td>
                      <td>{item.manager_name}</td>
                      <td>{item.reviewer_name}</td>
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
                      <td>₹ {item.approved_amount}</td>
                      <td>{item.manager_remark}</td>
                      <td>{item.reviewer_remarks}</td>

                      <td>
                        <span
                          className={`badge ${
                            item.reviewer_status === "Approved"
                              ? "bg-success"
                              : item.reviewer_status === "Rejected"
                              ? "bg-danger"
                              : "bg-warning"
                          }`}
                        >
                          {item.reviewer_status}
                        </span>
                      </td>

                      <td>
                        {item.reviewer_status === "Pending" ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleOpenModal(item)}
                          >
                            Review
                          </Button>
                        ) : (
                          <span className="badge bg-secondary">Done</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="16" className="text-center">
                      No Data Found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>

            {/*   USE totalItems from hook */}
            <Pagination
              totalItems={totalItems}
              itemsPerPage={100}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </Card.Body>
        </Card>
      </Col>

      {/* MODAL — unchanged */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Reviewer Form</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <>
              <div className="d-flex justify-content-between mb-3">
                <span><strong>Project:</strong> {selectedItem.project}</span>
                <span><strong>Amount:</strong> ₹ {selectedItem.amount}</span>
              </div>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Approval</Form.Label>
                  <Form.Select name="reviewerApproval" value={reviewData.reviewerApproval} onChange={handleChange}>
                    <option value="1">Approved</option>
                    <option value="2">Rejected</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Approved Amount</Form.Label>
                  <Form.Control type="number" name="approvedamount" value={reviewData.approvedamount} onChange={handleChange}/>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Remark</Form.Label>
                  <Form.Control as="textarea" rows={3} name="remark" value={reviewData.remark} onChange={handleChange}/>
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>Submit</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ReviewerList;