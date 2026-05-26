import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Col, Card } from "react-bootstrap";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
} from "chart.js";
import SkyGreeting from "../../components/Common/SkyGreeting";
import AdvancePayForm from "./AdvancePayForm";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);



const formatINR = (val) =>
    val != null
        ? "₹" + Number(val).toLocaleString("en-IN")
        : <span className="text-muted">—</span>;

// ── Table Static Data ─────────────────────────────────────────────────────────
const STATIC_DATA = [
    {
        id: 1,
        project_name: "Road Repair – Block A",
        location: "Jaipur, Rajasthan",
        financial_year: "2025-26",
        requested_by: "Suresh Yadav",
        requested_amount: 25000,
        approved_amount: 22000,
        paid_amount: 22000,
        settled_percent: 64,
        status: "paid",
    },
    {
        id: 2,
        project_name: "School Wall Construction",
        location: "Agra, UP",
        financial_year: "2025-26",
        requested_by: "Mohan Lal",
        requested_amount: 15000,
        approved_amount: 15000,
        paid_amount: 15000,
        settled_percent: 100,
        status: "settled",
    },
    {
        id: 3,
        project_name: "Water Pipeline – Phase 2",
        location: "Bhopal, MP",
        financial_year: "2025-26",
        requested_by: "Ramesh Gupta",
        requested_amount: 40000,
        approved_amount: 38000,
        paid_amount: null,
        settled_percent: 0,
        status: "approved",
    },
    {
        id: 4,
        project_name: "Community Hall Repair",
        location: "Surat, Gujarat",
        financial_year: "2025-26",
        requested_by: "Dinesh Patel",
        requested_amount: 18000,
        approved_amount: null,
        paid_amount: null,
        settled_percent: 0,
        status: "pending",
    },
    {
        id: 5,
        project_name: "Irrigation Channel Deepening",
        location: "Pune, Maharashtra",
        financial_year: "2025-26",
        requested_by: "Anjali More",
        requested_amount: 32000,
        approved_amount: null,
        paid_amount: null,
        settled_percent: 0,
        status: "rejected",
    },
];

// ── Table Sub-components ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
    paid: { label: "Paid", color: "#6c63ff", bg: "#f0eeff" },
    settled: { label: "Settled", color: "#16a34a", bg: "#dcfce7" },
    approved: { label: "Approved", color: "#2563eb", bg: "#dbeafe" },
    pending: { label: "Pending", color: "#d97706", bg: "#fef3c7" },
    rejected: { label: "Rejected", color: "#dc2626", bg: "#fee2e2" },
};

const StatusBadge = ({ status }) => {
    const s = (status || "pending").toLowerCase();
    const cfg = STATUS_CONFIG[s] || STATUS_CONFIG.pending;
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 12px",
                borderRadius: 20,
                border: `1px solid ${cfg.color}`,
                background: cfg.bg,
                color: cfg.color,
                fontWeight: 600,
                fontSize: 13,
                whiteSpace: "nowrap",
            }}
        >
            {cfg.label}
        </span>
    );
};

const SettledBar = ({ percent }) => {
    const color = percent === 100 ? "#16a34a" : "#2563eb";
    return (
        <div>
            <div
                style={{
                    height: 5,
                    borderRadius: 4,
                    background: "#e5e7eb",
                    width: 180,
                    marginBottom: 2,
                }}
            >
                <div
                    style={{
                        height: "100%",
                        borderRadius: 4,
                        background: color,
                        width: `${percent}%`,
                        transition: "width 0.4s",
                    }}
                />
            </div>
            <small style={{ color: "#6b7280", fontSize: 11 }}>{percent}% settled</small>
        </div>
    );
};

const ActionButton = ({ status, id }) => {
    const navigate = useNavigate();
    if (status === "pending") {
        return (
            <button
                className="btn btn-primary btn-sm"
                style={{ borderRadius: 6, fontWeight: 600, padding: "4px 14px" }}
                onClick={() => navigate(`/approve-advance/${id}`)}
            >
                Approve
            </button>
        );
    }
    if (status === "approved") {
        return (
            <button
                className="btn btn-primary btn-sm"
                style={{ borderRadius: 6, fontWeight: 600, padding: "4px 14px" }}
                onClick={() => navigate(`/pay-advance/${id}`)}
            >
                Pay
            </button>
        );
    }
    return (
        <button
            className="btn btn-outline-secondary btn-sm"
            style={{ borderRadius: 6, fontWeight: 500, padding: "4px 14px" }}
            onClick={() => navigate(`/view-advance/${id}`)}
        >
            View
        </button>
    );
};

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "paid", label: "Paid" },
    { key: "settled", label: "Settled" },
];

// ── Main Component ────────────────────────────────────────────────────────────
const AdvancePaymentDashboard = () => {
    const [activeTab, setActiveTab] = useState("all");

    const [showModal, setShowModal] = useState(false);

    const filteredData =
        activeTab === "all"
            ? STATIC_DATA
            : STATIC_DATA.filter((item) => item.status === activeTab);

    return (
        <>
            {/* ───────── PAGE HEADER ───────── */}
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

            {/* ───────── DASHBOARD CARDS ───────── */}
            <div className="row ">

                {/* Total Requests */}
                <div className="col-xl-3 col-sm-6">
                    <div className="card">
                        <div className="card-header border-0 pb-0">
                            <h6 className="mb-0">Total Requests</h6>
                        </div>
                        <div className="card-body pt-2">
                            <h2 className="card-title mb-0">5</h2>
                            <span>
                                <small className="text-primary font-w600 me-1">
                                    All financial years
                                </small>
                            </span>
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

                {/* Pending Approval */}
                <div className="col-xl-3 col-sm-6">
                    <div className="card">
                        <div className="card-header border-0 pb-0">
                            <h6 className="mb-0">Pending Approval</h6>
                        </div>
                        <div className="card-body pt-2">
                            <h2 className="card-title mb-0">1</h2>
                            <span>
                                <small className="text-warning font-w600 me-1">
                                    Action required
                                </small>
                            </span>
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

                {/* Total Approved */}
                <div className="col-xl-3 col-sm-6">
                    <div className="card">
                        <div className="card-header border-0 pb-0">
                            <h6 className="mb-0">Total Approved</h6>
                        </div>
                        <div className="card-body pt-2">
                            <h2 className="card-title mb-0">₹75,000</h2>
                            <span>
                                <small className="text-success font-w600 me-1">
                                    3 advances approved
                                </small>
                            </span>
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

                {/* Outstanding Balance */}
                <div className="col-xl-3 col-sm-6">
                    <div className="card">
                        <div className="card-header border-0 pb-0">
                            <h6 className="mb-0">Outstanding Balance</h6>
                        </div>
                        <div className="card-body pt-2">
                            <h2 className="card-title mb-0">₹8,000</h2>
                            <span>
                                <small className="text-danger font-w600 me-1">
                                    Unsettled advance
                                </small>
                            </span>
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

            </div>

            {/* ───────── ROW 4 : ADVANCE PAYMENT TABLE ───────── */}
            <div className="row">
                <Col lg={12}>
                    <Card>
                        <Card.Header>
                            <Card.Title>Advance Payment List</Card.Title>
                        </Card.Header>

                        {/* ── Tabs ── */}
                        <div style={{ borderBottom: "1px solid #e5e7eb", paddingLeft: 16, paddingRight: 16 }}>
                            <ul style={{ display: "flex", gap: 0, margin: 0, padding: 0, listStyle: "none" }}>
                                {TABS.map((tab) => (
                                    <li key={tab.key}>
                                        <button
                                            onClick={() => setActiveTab(tab.key)}
                                            style={{
                                                padding: "10px 16px",
                                                fontSize: 14,
                                                fontWeight: activeTab === tab.key ? 600 : 400,
                                                color: activeTab === tab.key ? "#2563eb" : "#6b7280",
                                                background: "none",
                                                border: "none",
                                                borderBottom: activeTab === tab.key ? "2px solid #2563eb" : "2px solid transparent",
                                                cursor: "pointer",
                                                marginBottom: -1,
                                                transition: "color 0.2s, border-color 0.2s",
                                            }}
                                        >
                                            {tab.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <table className="table mb-0" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
                                    <thead>
                                        <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                                            {["S.No", "PROJECT", "REQUESTED BY", "REQUESTED", "APPROVED", "PAID", "STATUS", "ACTIONS"].map((h) => (
                                                <th
                                                    key={h}

                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredData.length > 0 ? (
                                            filteredData.map((item, index) => (
                                                <tr
                                                    key={item.id}

                                                >
                                                    {/* # */}
                                                    <td >
                                                        {index + 1}
                                                    </td>

                                                    {/* PROJECT */}
                                                    <td style={{ padding: "16px", minWidth: 220 }}>
                                                        <div style={{ fontWeight: 600, fontSize: 14, color: "#111827", marginBottom: 3 }}>
                                                            {item.project_name}
                                                        </div>
                                                        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
                                                            {item.location}
                                                            <span style={{ margin: "0 5px", color: "#d1d5db" }}>·</span>
                                                            {item.financial_year}
                                                        </div>
                                                        {(item.status === "paid" || item.status === "settled") && (
                                                            <SettledBar percent={item.settled_percent} />
                                                        )}
                                                    </td>

                                                    {/* REQUESTED BY */}
                                                    <td style={{ padding: "16px", color: "#374151", fontSize: 14 }}>
                                                        {item.requested_by}
                                                    </td>

                                                    {/* REQUESTED */}
                                                    <td style={{ padding: "16px", fontWeight: 600, fontSize: 13, color: "#111827" }}>
                                                        {formatINR(item.requested_amount)}
                                                    </td>

                                                    {/* APPROVED */}
                                                    <td style={{ padding: "16px", fontWeight: 600, fontSize: 13, color: "#16a34a" }}>
                                                        {formatINR(item.approved_amount)}
                                                    </td>

                                                    {/* PAID */}
                                                    <td style={{ padding: "16px", fontWeight: 600, fontSize: 13, color: "#16a34a" }}>
                                                        {formatINR(item.paid_amount)}
                                                    </td>

                                                    {/* STATUS */}
                                                    <td style={{ padding: "16px" }}>
                                                        <StatusBadge status={item.status} />
                                                    </td>

                                                    {/* ACTIONS */}
                                                    <td style={{ padding: "16px" }}>
                                                        <ActionButton status={item.status} id={item.id} />
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="8" className="text-center py-4 text-muted">
                                                    No Data Found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </div>




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
                                    onSuccess={() => setShowModal(false)}
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