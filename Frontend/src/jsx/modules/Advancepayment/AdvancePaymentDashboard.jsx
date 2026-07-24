import React, { useState, useEffect } from "react";
import { Col, Card, Modal, Table } from "react-bootstrap";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
} from "chart.js";

import AdvancePayForm from "./AdvancePayForm";
import { getAdvancePaymentList, settleExpense } from "./AdvancePayAPI";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const formatINR = (val) =>
    val != null
        ? "₹" + Number(val).toLocaleString("en-IN")
        : <span className="text-muted">—</span>;


// ─────────────────────────────────────────────────────────────
// SETTLEMENT MODAL
// ─────────────────────────────────────────────────────────────
const SettlementModal = ({ user, onClose, onSuccess }) => {
    const [form, setForm] = useState({
        amount: "",
        remarks: "",
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState("");

    if (!user) return null;

    const validate = () => {
        const errs = {};

        if (!form.amount) {
            errs.amount = "Amount is required.";
        } else if (isNaN(form.amount) || Number(form.amount) <= 0) {
            errs.amount = "Enter a valid positive amount.";
        } else if (Number(form.amount) > Number(user.wallet_balance)) {
            errs.amount = `Cannot exceed wallet balance (${formatINR(user.wallet_balance)}).`;
        }

        return errs;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
        setApiError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const errs = validate();

        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }

        setLoading(true);

        const res = await settleExpense({
            user_id: user.user_id,
            amount: form.amount,
            remarks: form.remarks,
        });

        setLoading(false);

        if (res.ok) {
            onSuccess();
            onClose();
        } else {
            setApiError(res.message || "Something went wrong.");
        }
    };

    return (
        <Modal show={!!user} onHide={onClose} centered size="md">
            <Modal.Header closeButton>
                <Modal.Title>
                    Settle Advance —{" "}
                    <span className="text-primary">{user.username}</span>
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div
                    className="d-flex gap-4 mb-4 p-3 rounded"
                    style={{
                        background: "#f0f9ff",
                        border: "1px solid #bae6fd",
                    }}
                >
                    <div>
                        <small className="text-muted d-block">Wallet Balance</small>
                        <strong className="text-primary">{formatINR(user.wallet_balance)}</strong>
                    </div>

                    <div>
                        <small className="text-muted d-block">Total Advances</small>
                        <strong>{user.advances.length} payments</strong>
                    </div>
                </div>

                {apiError && (
                    <div className="alert alert-danger py-2">{apiError}</div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="mb-3">
                        <label className="form-label">
                            Settlement Amount (₹)
                            <span className="text-danger">*</span>
                        </label>

                        <input
                            type="number"
                            name="amount"
                            className={`form-control ${errors.amount ? "is-invalid" : ""}`}
                            value={form.amount}
                            onChange={handleChange}
                            placeholder="0.00"
                            min="0.01"
                            step="0.01"
                            onKeyDown={(e) => {
                                if (["e", "E", "-", "+"].includes(e.key)) {
                                    e.preventDefault();
                                }
                            }}
                        />

                        {errors.amount && (
                            <div className="invalid-feedback">{errors.amount}</div>
                        )}
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Remarks</label>

                        <textarea
                            name="remarks"
                            className="form-control"
                            rows="3"
                            value={form.remarks}
                            onChange={handleChange}
                            placeholder="Optional remarks..."
                            maxLength={500}
                        />

                        <small className="text-muted">{form.remarks.length}/500</small>
                    </div>

                    <div className="text-end">
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm me-2"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="btn btn-success btn-sm"
                            disabled={loading}
                        >
                            {loading ? "Processing..." : "Confirm Settlement"}
                        </button>
                    </div>
                </form>
            </Modal.Body>
        </Modal>
    );
};


// ─────────────────────────────────────────────────────────────
// ADVANCES MODAL
// ─────────────────────────────────────────────────────────────
const AdvancesModal = ({ user, onClose }) => {
    if (!user) return null;

    const totalAmount = user.advances.reduce(
        (sum, a) => sum + Number(a.amount || 0),
        0
    );

    return (
        <Modal show={!!user} onHide={onClose} centered size="xl">
            <Modal.Header closeButton>
                <Modal.Title>
                    Advances —{" "}
                    <span className="text-primary">{user.username}</span>
                    <small className="text-muted ms-2" style={{ fontSize: 14 }}>
                        ({user.email})
                    </small>
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div className="d-flex gap-4 mb-4">
                    <div>
                        <small className="text-muted d-block">Wallet Balance</small>
                        <strong>{formatINR(user.wallet_balance)}</strong>
                    </div>

                    <div>
                        <small className="text-muted d-block">Total Payments</small>
                        <strong>{user.advances.length}</strong>
                    </div>

                    <div>
                        <small className="text-muted d-block">Total Amount</small>
                        <strong>{formatINR(totalAmount)}</strong>
                    </div>
                </div>

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

                                    <td style={{ fontWeight: 600, color: "#16a34a" }}>
                                        {formatINR(item.amount)}
                                    </td>

                                    <td className="text-capitalize">
                                        {item.payment_mode || "N/A"}
                                    </td>

                                    <td>
                                        {item.payment_date}
                                    </td>

                                    <td>{item.reference_no || "—"}</td>

                                    <td>
                                        <span
                                            title={item.remarks}
                                            style={{
                                                maxWidth: 160,
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
                                                href={`${import.meta.env.VITE_BACKEND_API_URL}uploads/${item.doc_file}`}
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
                                <td colSpan="7" className="text-center">
                                    No advances found
                                </td>
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


// ─────────────────────────────────────────────────────────────
// SETTLEMENT HISTORY MODAL
// ─────────────────────────────────────────────────────────────
const SettlementsModal = ({ user, onClose }) => {
    if (!user) return null;

    const totalSettled = user.settlements.reduce(
        (sum, s) => sum + Number(s.amount || 0),
        0
    );

    return (
        <Modal show={!!user} onHide={onClose} centered size="xl" >
            <Modal.Header closeButton>
                <Modal.Title>
                    Settlement History —{" "}
                    <span className="text-primary">{user.username}</span>
                    <small className="text-muted ms-2" style={{ fontSize: 14 }}>
                        ({user.email})
                    </small>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body
                style={{
                    maxHeight: "70vh",
                    overflowY: "auto",
                }}
            >
                <div className="d-flex gap-4 mb-4">
                    <div>
                        <small className="text-muted d-block">Wallet Balance</small>
                        <strong className="text-primary">{formatINR(user.wallet_balance)}</strong>
                    </div>

                    <div>
                        <small className="text-muted d-block">Total Settlements</small>
                        <strong>{user.settlements.length}</strong>
                    </div>

                    <div>
                        <small className="text-muted d-block">Total Settled Amount</small>
                        <strong className="text-success">{formatINR(totalSettled)}</strong>
                    </div>
                </div>

                <Table responsive className="h-75 text-nowrap">
                    <thead>
                        <tr>
                            <th>Sno</th>
                            <th>Amount (₹)</th>
                            <th>Payment Mode</th>
                            <th>Settlement Date</th>
                            <th>Reference No</th>
                            <th>Remarks</th>
                        </tr>
                    </thead>

                    <tbody>
                        {user.settlements?.length > 0 ? (
                            user.settlements.map((item, index) => (
                                <tr key={item.id}>
                                    <td className="">{index + 1}</td>

                                    <td style={{ fontWeight: 600, color: "#dc2626" }}>
                                        {formatINR(item.amount)}
                                    </td>

                                    <td className="text-capitalize">
                                        {item.payment_mode || "N/A"}
                                    </td>

                                    <td>
                                        {item.payment_date}
                                    </td>

                                    <td>{item.reference_no || "—"}</td>

                                    <td>{item.remarks || "—"}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="text-center">
                                    No settlements found
                                </td>
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


// ─────────────────────────────────────────────────────────────
// TRANSACTION HISTORY MODAL
// ─────────────────────────────────────────────────────────────
const TransactionHistoryModal = ({ user, onClose }) => {
    if (!user) return null;

    const history = user.transaction_history || [];

    return (
        <Modal show={!!user} onHide={onClose} centered size="xl">
            <Modal.Header closeButton>
                <Modal.Title>
                    Transaction History —{" "}
                    <span className="text-primary">{user.username}</span>
                    <small className="text-muted ms-2" style={{ fontSize: 14 }}>
                        ({user.email})
                    </small>
                </Modal.Title>
            </Modal.Header>

            <Modal.Body
                style={{
                    maxHeight: "70vh",
                    overflowY: "auto",
                }}
            >
                <div
                    className="d-flex gap-4 mb-4 p-3 rounded"
                    style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                >
                    <div>
                        <small className="text-muted d-block">Current Balance</small>
                        <strong className="text-primary fs-5">
                            {formatINR(user.wallet_balance)}
                        </strong>
                    </div>
                    <div>
                        <small className="text-muted d-block">Total Transactions</small>
                        <strong>{history.length}</strong>
                    </div>
                    <div>
                        <small className="text-muted d-block">Total Credits</small>
                        <strong className="text-success">
                            {formatINR(
                                history
                                    .filter((t) => t.payment_mode === "credit")
                                    .reduce((s, t) => s + Number(t.amount || 0), 0)
                            )}
                        </strong>
                    </div>
                    <div>
                        <small className="text-muted d-block">Total Debits</small>
                        <strong className="text-danger">
                            {formatINR(
                                history
                                    .filter((t) => t.payment_mode === "debit")
                                    .reduce((s, t) => s + Number(t.amount || 0), 0)
                            )}
                        </strong>
                    </div>
                </div>

                <Table responsive className="text-nowrap">
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th>Type</th>
                            <th>Mode</th>
                            <th>Amount (₹)</th>
                            <th>Balance After (₹)</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.length > 0 ? (
                            history.map((txn, index) => {
                                const isCredit = txn.payment_mode === "credit";
                                const typeLabel =
                                    txn.type === "advance_expense"
                                        ? "Advance"
                                        : txn.type === "settlement_expense"
                                            ? "Settlement"
                                            : txn.type || "—";

                                return (
                                    <tr key={txn.id}>
                                        <td>{index + 1}</td>

                                        <td>
                                            <span
                                                className={`badge ${txn.type === "advance_expense"
                                                        ? "badge-info"
                                                        : "badge-warning"
                                                    }`}
                                            >
                                                {typeLabel}
                                            </span>
                                        </td>

                                        <td>
                                            <span
                                                className={`badge ${isCredit ? "badge-success" : "badge-danger"
                                                    }`}
                                            >
                                                {isCredit ? "↑ Credit" : "↓ Debit"}
                                            </span>
                                        </td>

                                        <td
                                            style={{
                                                fontWeight: 600,
                                                color: isCredit ? "#16a34a" : "#dc2626",
                                            }}
                                        >
                                            {isCredit ? "+" : "-"}
                                            {formatINR(txn.amount)}
                                        </td>

                                        <td style={{ fontWeight: 600, color: "#2563eb" }}>
                                            {formatINR(txn.balance)}
                                        </td>

                                        <td>
                                            {txn.createdAt
                                                ? new Date(txn.createdAt).toLocaleString("en-IN", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                })
                                                : "—"}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="6" className="text-center py-4 text-muted">
                                    No transactions found
                                </td>
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


// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
const AdvancePaymentDashboard = () => {
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [settleUser, setSettleUser] = useState(null);
    const [settlementsUser, setSettlementsUser] = useState(null);
    const [txnHistoryUser, setTxnHistoryUser] = useState(null);
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        const res = await getAdvancePaymentList();
        if (res.ok) setTableData(res.result);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <>
            {/* ── PAGE HEADER ─────────────────────────────────────── */}
            <div className="page-head">
                <div className="row align-items-center mb-4">
                    <div className="col-12 col-md-7 mb-3 mb-md-0">
                        <h3>Advance Payment</h3>
                    </div>

                    <div className="col-12 col-md-5">
                        <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center gap-2 justify-content-md-end">
                            <div className="d-flex gap-2 flex-grow-1 flex-md-grow-0">
                                <select className="form-select flex-fill">
                                    <option>KLK Project</option>
                                    <option>ERP Development</option>
                                    <option>CRM Project</option>
                                    <option>Mobile App</option>
                                </select>
                                <select className="form-select flex-fill">
                                    <option>FY 2025-26</option>
                                    <option>FY 2024-25</option>
                                    <option>FY 2023-24</option>
                                </select>
                            </div>
                            <button
                                className="btn btn-primary d-flex justify-content-center align-items-center px-3"
                                onClick={() => setShowModal(true)}
                            >
                                + Raise Advance
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── DASHBOARD SUMMARY CARDS ──────────────────────────── */}
            {/* <div className="row">
                <div className="col-xl-3 col-sm-6">
                    <div className="card">
                        <div className="card-header border-0 pb-0">
                            <h6 className="mb-0">Total Requests</h6>
                        </div>
                        <div className="card-body pt-2">
                            <h2 className="card-title mb-0">5</h2>
                            <small className="text-primary font-w600">All financial years</small>
                            <div className="progress mt-3" style={{ height: "6px" }}>
                                <div className="progress-bar bg-primary" style={{ width: "100%" }}></div>
                            </div>
                            <div className="d-flex justify-content-between mt-1">
                                <small className="text-muted">All Requests</small>
                                <small className="text-muted font-w600">100%</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-3 col-sm-6">
                    <div className="card">
                        <div className="card-header border-0 pb-0">
                            <h6 className="mb-0">Pending Approval</h6>
                        </div>
                        <div className="card-body pt-2">
                            <h2 className="card-title mb-0">1</h2>
                            <small className="text-warning font-w600">Action required</small>
                            <div className="progress mt-3" style={{ height: "6px" }}>
                                <div className="progress-bar bg-warning" style={{ width: "20%" }}></div>
                            </div>
                            <div className="d-flex justify-content-between mt-1">
                                <small className="text-muted">Pending Requests</small>
                                <small className="text-muted font-w600">20%</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-3 col-sm-6">
                    <div className="card">
                        <div className="card-header border-0 pb-0">
                            <h6 className="mb-0">Total Approved</h6>
                        </div>
                        <div className="card-body pt-2">
                            <h2 className="card-title mb-0">₹75,000</h2>
                            <small className="text-success font-w600">3 advances approved</small>
                            <div className="progress mt-3" style={{ height: "6px" }}>
                                <div className="progress-bar bg-success" style={{ width: "75%" }}></div>
                            </div>
                            <div className="d-flex justify-content-between mt-1">
                                <small className="text-muted">Approved Amount</small>
                                <small className="text-muted font-w600">75%</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-3 col-sm-6">
                    <div className="card">
                        <div className="card-header border-0 pb-0">
                            <h6 className="mb-0">Outstanding Balance</h6>
                        </div>
                        <div className="card-body pt-2">
                            <h2 className="card-title mb-0">₹8,000</h2>
                            <small className="text-danger font-w600">Unsettled advance</small>
                            <div className="progress mt-3" style={{ height: "6px" }}>
                                <div className="progress-bar bg-danger" style={{ width: "10%" }}></div>
                            </div>
                            <div className="d-flex justify-content-between mt-1">
                                <small className="text-muted">Outstanding Amount</small>
                                <small className="text-muted font-w600">10%</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div> */}

            {/* ── ADVANCE PAYMENT TABLE ────────────────────────────── */}
            <div className="row">
                <Col lg={12}>
                    <Card>
                        <Card.Header>
                            <Card.Title>Advance Payment List</Card.Title>
                        </Card.Header>

                        <Card.Body className="p-0">
                            {loading ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-primary" role="status" />
                                    <p className="mt-2 text-muted">Loading...</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table mb-0">
                                        <thead>
                                            <tr>
                                                <th>S.No</th>
                                                <th>User</th>
                                                <th>Balance</th>
                                                <th>Payments</th>
                                                <th>View</th>
                                                <th>Settlements</th>
                                                <th>Settle</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {tableData.length > 0 ? (
                                                tableData.map((wallet, index) => (
                                                    <tr key={wallet.wallet_id}>
                                                        <td>{index + 1}</td>

                                                        {/* USER */}
                                                        <td>
                                                            <span style={{ fontWeight: 600, fontSize: 14 }}>
                                                                {wallet.username || "N/A"}
                                                            </span>
                                                            <br />
                                                            <small className="text-muted">
                                                                {wallet.email}
                                                            </small>
                                                        </td>

                                                        {/* BALANCE — clickable → transaction history */}
                                                        <td>
                                                            <span
                                                                style={{
                                                                    fontWeight: 600,
                                                                    color: "#2563eb",
                                                                    cursor: "pointer",
                                                                    textDecoration: "underline",
                                                                    textDecorationStyle: "dotted",
                                                                    textUnderlineOffset: 3,
                                                                }}
                                                                title="Click to view transaction history"
                                                                onClick={() => setTxnHistoryUser(wallet)}
                                                            >
                                                                {formatINR(wallet.wallet_balance)}
                                                            </span>
                                                        </td>

                                                        {/* PAYMENTS */}
                                                        <td>
                                                            <span className="badge badge-info">
                                                                {wallet.advances.length} payment
                                                                {wallet.advances.length !== 1 ? "s" : ""}
                                                            </span>
                                                        </td>

                                                        {/* VIEW */}
                                                        <td>
                                                            <button
                                                                className="btn btn-outline-info btn-sm"
                                                                title="View Advances"
                                                                onClick={() => setSelectedUser(wallet)}
                                                            >
                                                                View
                                                            </button>
                                                        </td>

                                                        {/* SETTLEMENTS */}
                                                        <td>
                                                            <span
                                                                className="badge badge-warning"
                                                                style={{
                                                                    cursor:
                                                                        wallet.settlements?.length > 0
                                                                            ? "pointer"
                                                                            : "default",
                                                                }}
                                                                onClick={() => {
                                                                    if (wallet.settlements?.length > 0) {
                                                                        setSettlementsUser(wallet);
                                                                    }
                                                                }}
                                                            >
                                                                {wallet.settlements?.length || 0} settlement
                                                                {wallet.settlements?.length !== 1 ? "s" : ""}
                                                            </span>
                                                        </td>

                                                        {/* SETTLE */}
                                                        <td>
                                                            <button
                                                                className="btn btn-success btn-sm"
                                                                title="Settle Advance"
                                                                disabled={Number(wallet.wallet_balance) <= 0}
                                                                onClick={() => setSettleUser(wallet)}
                                                            >
                                                                Settle
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="7" className="text-center py-4 text-muted">
                                                        No Data Found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </div>

            {/* ── ADVANCES VIEW MODAL ──────────────────────────────── */}
            <AdvancesModal
                user={selectedUser}
                onClose={() => setSelectedUser(null)}
            />

            {/* ── SETTLEMENT HISTORY MODAL ─────────────────────────── */}
            <SettlementsModal
                user={settlementsUser}
                onClose={() => setSettlementsUser(null)}
            />

            {/* ── SETTLE MODAL ─────────────────────────────────────── */}
            <SettlementModal
                user={settleUser}
                onClose={() => setSettleUser(null)}
                onSuccess={() => {
                    setSettleUser(null);
                    fetchData();
                }}
            />

            {/* ── TRANSACTION HISTORY MODAL ────────────────────────── */}
            <TransactionHistoryModal
                user={txnHistoryUser}
                onClose={() => setTxnHistoryUser(null)}
            />

            {/* ── RAISE ADVANCE MODAL ──────────────────────────────── */}
            {showModal && (
                <div
                    className="modal fade show d-block"
                    style={{ background: "rgba(0,0,0,0.5)" }}
                    tabIndex="-1"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowModal(false);
                    }}
                >
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Raise Advance Request</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                />
                            </div>
                            <div className="modal-body">
                                <AdvancePayForm
                                    onSuccess={() => {
                                        setShowModal(false);
                                        fetchData();
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdvancePaymentDashboard;