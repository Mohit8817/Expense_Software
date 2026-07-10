import React, { useState, useEffect } from "react";
import { Col, Card, Table, Modal } from "react-bootstrap";
import PageTitle from "../../layouts/PageTitle";
import TableExportActions from "../../components/Common/TableExportActions";
import Pagination from "../../components/Common/Pagination";
import { useSearchFilter, SearchInput } from "../../components/Common/useSearchFilter";
import { getAdvancePaymentList } from "./AdvancePayAPI";

const AdvancePayList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null); // for modal

  // FETCH LIST — one row per USER (wallet)
  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      const res = await getAdvancePaymentList();
      if (res.ok) setData(res.result); // res.result = array of wallet objects
      setLoading(false);
    };
    fetchList();
  }, []);

  const {
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    totalItems,
    paginatedData,
    indexOfFirst,
  } = useSearchFilter(data, {
    keys: ["username", "email"],
    itemsPerPage: 100,
  });



  return (
    <>
      <PageTitle activeMenu="Advance Payment List" motherMenu="Advance Payment" />

      <Col lg={12}>
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <Card.Title>Advance Payment List</Card.Title>
            <div className="d-flex align-items-center gap-2">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search by user or email..."
              />
              <TableExportActions
                data={data}
                columns={[
                  { label: "User", key: "username" },
                  { label: "Email", key: "email" },
                  { label: "Wallet Balance", key: "wallet_balance" },
                ]}
                fileName="Advance_Payment_List"
              />
            </div>
          </Card.Header>

          <Card.Body>
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status" />
                <p className="mt-2 text-muted">Loading...</p>
              </div>
            ) : (
              <Table responsive className="text-nowrap">
                <thead>
                  <tr>
                    <th>Sno</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Wallet Balance</th>
                    <th>Total Advances</th>
                    <th>No. of Payments</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((wallet, index) => (
                      <tr key={wallet.wallet_id}>
                        <td>{indexOfFirst + index + 1}</td>
                        <td>{wallet.username || "N/A"}</td>
                        <td>{wallet.email || "N/A"}</td>
                        <td>
                          ₹{Number(wallet.wallet_balance).toLocaleString("en-IN")}
                        </td>
                        <td>
                          {/* ₹{(wallet.advances).toLocaleString("en-IN")} */}
                          total advance amount
                        </td>
                        <td>
                          <span className="badge badge-info">
                            {wallet.advances.length} payment{wallet.advances.length !== 1 ? "s" : ""}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-primary shadow btn-xs sharp"
                            title="View Advances"
                            onClick={() => setSelectedUser(wallet)}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center">No Data Found</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            )}

            <Pagination
              totalItems={totalItems}
              itemsPerPage={10}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </Card.Body>
        </Card>
      </Col>

      {/* ADVANCES DETAIL MODAL */}
      <AdvancesModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </>
  );
};

// MODAL COMPONENT
const AdvancesModal = ({ user, onClose }) => {
  if (!user) return null;



  return (
    <Modal show={!!user} onHide={onClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          Advance Payments —{" "}
          <span className="text-primary">{user.username}</span>
          <small className="text-muted ms-2" style={{ fontSize: "14px" }}>
            ({user.email})
          </small>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Summary */}
        <div className="d-flex gap-4 mb-3">
          <div>
            <small className="text-muted">Wallet Balance</small>
            <div className="fw-bold">
              ₹{Number(user.wallet_balance).toLocaleString("en-IN")}
            </div>
          </div>
          <div>
            <small className="text-muted">Total Payments</small>
            <div className="fw-bold">{user.advances.length}</div>
          </div>
          <div>
            <small className="text-muted">Total Amount</small>
            <div className="fw-bold">
              ₹{user.advances
                .reduce((sum, a) => sum + Number(a.amount || 0), 0)
                .toLocaleString("en-IN")}
            </div>    
          </div>
        </div>

        {/* Advances Table */}
        <Table responsive className="text-nowrap">
          <thead>
            <tr>
              <th>Sno</th>
              <th>Amount (₹)</th>
              <th>Payment Mode</th>
              <th>Payment Date</th>
              <th>Reference No</th>
              <th>Remarks</th>
              <th>Doc</th>
            </tr>
          </thead>
          <tbody>
            {user.advances.length > 0 ? (
              user.advances.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>₹{Number(item.amount).toLocaleString("en-IN")}</td>
                  <td className="text-capitalize">{item.payment_mode || "N/A"}</td>
                  <td>
                    {item.payment_date
                      ? new Date(item.payment_date).toLocaleDateString("en-IN")
                      : "N/A"}
                  </td>
                  <td>{item.reference_no || "—"}</td>
                  <td>
                    <span
                      title={item.remarks}
                      style={{
                        maxWidth: "160px",
                        display: "inline-block",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.remarks || "—"}
                    </span>
                  </td>
                  <td>
                    {item.doc_file ? (
                      <a
                        href={`${import.meta.env.VITE_BACKEND_API_URL}/uploads/${item.doc_file}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-xs btn-outline-primary"
                      >
                        <i className="fas fa-file"></i>
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                 
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center">No advances found</td>
              </tr>
            )}
          </tbody>
        </Table>
      </Modal.Body>

      <Modal.Footer>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default AdvancePayList;