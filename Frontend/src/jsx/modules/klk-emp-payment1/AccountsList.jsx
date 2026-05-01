import React, { useState, useEffect } from "react";
import { Table, Card, Col, Modal, Button, Form, Badge } from "react-bootstrap";
import axios from "axios";
import PageTitle from "../../layouts/PageTitle";
import TableExportActions from "../../components/Common/TableExportActions";
import Pagination from "../../components/Common/Pagination";

const PaymentList = () => {

  const [data, setData] = useState([]);
  const [history, setHistory] = useState([]);

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);

  const [accountData, setAccountData] = useState({
    budget: "",
    paymentMode: "Cash",
    paymentDate: "",
    reference_no: "",
    remarks: "",
  });

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    fetchAccountsData();
  }, []);

  const fetchAccountsData = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_API_URL}expense/accounts-expenses`,
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

  /* ---------------- FETCH HISTORY ---------------- */
  const fetchHistory = async (id) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_API_URL}expense/payment-history/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setHistory(res.data);
      setShowHistoryModal(true);

    } catch (error) {
      console.error(error);
    }
  };

  /* ---------------- EXPORT ---------------- */
  const exportData = data.map((item) => ({
    ...item,
    payment_status:
      item.payment_status === 2 ? "Fully Paid" :
        item.payment_status === 1 ? "Partially Paid" : "Unpaid",
    requested_date: new Date(item.requested_date).toLocaleDateString(),
  }));

  const columns = [
    { label: "Raised By", key: "raised_by" },
    { label: "Date", key: "requested_date" },
    { label: "Project", key: "project" },
    { label: "Intervention", key: "intervention" },
    { label: "Manager", key: "manager_name" },
    { label: "Document", key: "document" },
    { label: "Amount", key: "final_approved_amount" },
    { label: "Paid", key: "paid_amount" },
    { label: "Payment Status", key: "payment_status" },
  ];

  /* ---------------- PAGINATION ---------------- */
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentData = data.slice(indexOfFirst, indexOfLast);

  /* ---------------- HANDLERS ---------------- */

  const handleAccount = (item) => {
    setSelectedItem(item);

    const remaining =
      item.final_approved_amount - (item.paid_amount || 0);

    setAccountData({
      budget: remaining,
      paymentMode: "Cash",
      paymentDate: "",
      reference_no: "",
      remarks: "",
    });

    setShowAccountModal(true);
  };

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountData({ ...accountData, [name]: value });
  };

  /* ---------------- PAYMENT SUBMIT ---------------- */

  const handleAccountSubmit = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_API_URL}expense/process-payment/${selectedItem.id}`,
        {
          payment_amount: Number(accountData.budget),
          payment_mode: accountData.paymentMode,
          payment_date: accountData.paymentDate,
          reference_no: accountData.reference_no,
          remarks: accountData.remarks,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      alert("✅ Payment Processed Successfully");

      setShowAccountModal(false);
      fetchAccountsData();

    } catch (error) {
      console.error(error);
    }
  };

  /* ---------------- PDF VIEW ---------------- */

const handleViewPDF = async (id) => {
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_BACKEND_API_URL}expense/payment-receipt/${id}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        responseType: "blob",
      }
    );

    const file = new Blob([res.data], { type: "application/pdf" });
    const fileURL = URL.createObjectURL(file);

    window.open(fileURL);

  } catch (error) {
    console.error(error);
  }
};

  /* ---------------- PAYMENT STATUS ---------------- */

 const getPaymentStatus = (item) => {
  if (item.payment_status === 2) {
    return <span className="badge bg-success">Fully Paid</span>;
  } else if (item.payment_status === 1) {
    return <span className="badge bg-warning">Partially Paid</span>;
  } else {
    return <span className="badge bg-secondary">Unpaid</span>;
  }
};

  return (
    <>
      <PageTitle activeMenu="Payment List" motherMenu="Accounts" />

      <Col lg={12}>
        <Card>

          <Card.Header className="d-flex justify-content-between">
            <Card.Title>Accounts</Card.Title>

            <TableExportActions
              data={exportData}
              columns={columns}
              fileName="Payment_List"
            />
          </Card.Header>

          <Card.Body>
            <Table responsive className="text-nowrap">
              <thead>
                <tr>
                  <th>Sno</th>
                  <th>Raised By</th>
                  <th>Date</th>
                  <th>Project</th>
                  <th>Intervention</th>
                  <th>Manager</th>
                  <th>Document</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Status</th>
                  <th>History</th>
                  <th>Receipt</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {currentData.map((item, index) => {
                  const remaining =
                    item.final_approved_amount - (item.paid_amount || 0);

                  return (
                    <tr key={item.id}>
                      <td>{indexOfFirst + index + 1}</td>
                      <td>{item.raised_by}</td>
                      <td>{new Date(item.requested_date).toLocaleDateString()}</td>
                      <td>{item.project}</td> 
                      <td>{item.intervention}</td> 
                      <td>{item.manager_name}</td>
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

                      <td>₹ {item.final_approved_amount}</td>
                      <td>₹ {item.paid_amount || 0}</td>

                      <td>{getPaymentStatus(item)}</td>

                      {/* HISTORY */}
                      <td>
                        <Button
                          size="sm"
                          variant="info"
                          onClick={() => fetchHistory(item.id)}
                        >
                          View
                        </Button>
                      </td>

                      {/* PDF */}
                      <td>
                        <Button
                          size="sm"
                          variant="dark"
                          onClick={() => handleViewPDF(item.id)}
                        >
                          PDF
                        </Button>
                      </td>

                      {/* PAY */}
                      <td>
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleAccount(item)}
                          disabled={remaining <= 0}
                        >
                          Pay
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>

            <Pagination
              totalItems={data.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </Card.Body>
        </Card>
      </Col>

      {/* ---------------- PAYMENT MODAL ---------------- */}
      <Modal show={showAccountModal} onHide={() => setShowAccountModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Process Payment</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selectedItem && (
            <>
              <div className="mb-3 p-3 border rounded bg-light">
                <p><strong>Project:</strong> {selectedItem.project}</p>
                <p><strong>Final Amount:</strong> ₹ {selectedItem.final_approved_amount}</p>
                <p><strong>Paid:</strong> ₹ {selectedItem.paid_amount || 0}</p>
              </div>

              <Form>

                <Form.Group className="mb-3">
                  <Form.Label>Payment Amount</Form.Label>
                  <Form.Control
                    type="number"
                    name="budget"
                    value={accountData.budget}
                    onChange={handleAccountChange}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Payment Mode</Form.Label>
                  <Form.Select
                    name="paymentMode"
                    value={accountData.paymentMode}
                    onChange={handleAccountChange}
                  >
                    <option>Cash</option>
                    <option>Bank</option>
                    <option>UPI</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Reference No</Form.Label>
                  <Form.Control
                    type="text"
                    name="reference_no"
                    value={accountData.reference_no}
                    onChange={handleAccountChange}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Payment Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="paymentDate"
                    value={accountData.paymentDate}
                    onChange={handleAccountChange}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Remarks</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="remarks"
                    value={accountData.remarks}
                    onChange={handleAccountChange}
                  />
                </Form.Group>

              </Form>
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={() => setShowAccountModal(false)}>Cancel</Button>
          <Button onClick={handleAccountSubmit}>Submit</Button>
        </Modal.Footer>
      </Modal>

      {/* ---------------- HISTORY MODAL ---------------- */}
      <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Payment History</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Table>
            <thead>
              <tr>
                <th>Amount</th>
                <th>Mode</th>
                <th>Date</th>
                <th>Ref</th>
                <th>Payee</th>
              </tr>
            </thead>

            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td>₹ {h.payment_amount}</td>
                  <td>{h.payment_mode}</td>
                  <td>{new Date(h.payment_date).toLocaleDateString()}</td>
                  <td>{h.reference_no}</td>
                  <td>{h.accountant_name}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default PaymentList;