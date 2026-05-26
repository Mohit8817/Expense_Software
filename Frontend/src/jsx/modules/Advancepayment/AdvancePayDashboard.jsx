import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Col, Card, Dropdown, Nav, Tab } from "react-bootstrap";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
} from "chart.js";
import { SVGICON } from "../../constant/theme";
import SkyGreeting from "../../components/Common/SkyGreeting";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatINRShort = (v) => {
    if (v >= 1_00_000) return "₹" + (v / 1_00_000).toFixed(1) + "L";
    if (v >= 1_000) return "₹" + (v / 1_000).toFixed(0) + "K";
    return "₹" + v;
};

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
    paid:     { label: "Paid",     color: "#6c63ff", bg: "#f0eeff" },
    settled:  { label: "Settled",  color: "#16a34a", bg: "#dcfce7" },
    approved: { label: "Approved", color: "#2563eb", bg: "#dbeafe" },
    pending:  { label: "Pending",  color: "#d97706", bg: "#fef3c7" },
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
            {s === "pending" }
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

// ── Chart config ──────────────────────────────────────────────────────────────
const CHART_COLORS = {
    total:    "rgba(11, 15, 237, 0.85)",
    approved: "rgba(10, 180, 72, 0.85)",
    paid:     "rgba(59, 130, 246, 0.85)",
    pending:  "rgba(244, 181, 22, 0.85)",
    rejected: "rgba(244, 17, 17, 0.85)",
};

const CHART_LEGEND = [
    { key: "total",    label: "Total Requested" },
    { key: "approved", label: "Approved"        },
    { key: "paid",     label: "Disbursed"       },
    { key: "pending",  label: "Pending"         },
    { key: "rejected", label: "Rejected"        },
];

const PROJECT_CHART_DATA = [
    {
        project_name: "ERP Dev",
        totalRequested: 450000,
        approvedAmount: 400000,
        disbursedAmount: 380000,
        pendingAmount: 50000,
        rejectedAmount: 10000,
    },
    {
        project_name: "CRM Dev",
        totalRequested: 320000,
        approvedAmount: 280000,
        disbursedAmount: 270000,
        pendingAmount: 30000,
        rejectedAmount: 20000,
    },
    {
        project_name: "Mobile App",
        totalRequested: 210000,
        approvedAmount: 190000,
        disbursedAmount: 175000,
        pendingAmount: 20000,
        rejectedAmount: 10000,
    },
    {
        project_name: "Web Portal",
        totalRequested: 180000,
        approvedAmount: 150000,
        disbursedAmount: 140000,
        pendingAmount: 25000,
        rejectedAmount: 15000,
    },
    {
        project_name: "Food",
        totalRequested: 180000,
        approvedAmount: 150000,
        disbursedAmount: 140000,
        pendingAmount: 25000,
        rejectedAmount: 15000,
    },
];

// ── AdvancePayOverviewChart ───────────────────────────────────────────────────
const AdvancePayOverviewChart = ({ data = [] }) => {
    if (data.length === 0) {
        return (
            <p className="text-muted text-center py-4">
                No advance payment data available.
            </p>
        );
    }

    const chartData = {
        labels: data.map((p) => p.project_name),
        datasets: [
            {
                label: "Total Requested",
                data: data.map((p) => p.totalRequested),
                backgroundColor: CHART_COLORS.total,
                borderRadius: 10,
                barPercentage: 0.5,
                categoryPercentage: 0.6,
            },
            {
                label: "Approved",
                data: data.map((p) => p.approvedAmount),
                backgroundColor: CHART_COLORS.approved,
                borderRadius: 6,
                barPercentage: 0.5,
                categoryPercentage: 0.6,
            },
            {
                label: "Disbursed",
                data: data.map((p) => p.disbursedAmount),
                backgroundColor: CHART_COLORS.paid,
                borderRadius: 6,
                barPercentage: 0.5,
                categoryPercentage: 0.6,
            },
            {
                label: "Pending",
                data: data.map((p) => p.pendingAmount),
                backgroundColor: CHART_COLORS.pending,
                borderRadius: 6,
                barPercentage: 0.5,
                categoryPercentage: 0.6,
            },
            {
                label: "Rejected",
                data: data.map((p) => p.rejectedAmount),
                backgroundColor: CHART_COLORS.rejected,
                borderRadius: 6,
                barPercentage: 0.5,
                categoryPercentage: 0.6,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) =>
                        "  " + ctx.dataset.label + ": " +
                        new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                            maximumFractionDigits: 0,
                        }).format(ctx.raw),
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { size: 12 }, maxRotation: 20, minRotation: 0 },
            },
            y: {
                grid: { color: "rgba(128,128,128,0.1)" },
                ticks: { font: { size: 11 }, callback: (v) => formatINRShort(v) },
            },
        },
    };

    return (
        <>
            <div className="d-flex flex-wrap gap-3 mb-3 px-3 pt-3">
                {CHART_LEGEND.map((item) => (
                    <span
                        key={item.key}
                        className="d-flex align-items-center gap-1"
                        style={{ fontSize: 12, color: "#888" }}
                    >
                        <span
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: 2,
                                background: CHART_COLORS[item.key],
                                display: "inline-block",
                            }}
                        />
                        {item.label}
                    </span>
                ))}
            </div>
            <div style={{ position: "relative", width: "100%", height: 320, padding: "0 12px 12px" }}>
                <Bar data={chartData} options={options} />
            </div>
        </>
    );
};

// ── Dashboard Cards ───────────────────────────────────────────────────────────
const cards = [
    {
        title: "Total Advance Payment",
        amount: "₹12,45,000",
        percent: "100%",
        subtitle: "All Advance Payments",
        requests: "125 Requests",
        progress: "100%",
        color: "primary",
    },
    {
        title: "Approved Advance",
        amount: "₹9,80,000",
        percent: "78%",
        subtitle: "Of Total Advance",
        requests: "₹9,80,000",
        progress: "78%",
        color: "info",
    },
    {
        title: "Paid Advance",
        amount: "₹7,25,000",
        percent: "74%",
        subtitle: "Of Approved Amount",
        requests: "₹7,25,000",
        progress: "74%",
        color: "success",
    },
    {
        title: "Rejected Advance",
        amount: "₹1,10,000",
        percent: "9%",
        subtitle: "Of Total Advance",
        requests: "₹1,10,000",
        progress: "9%",
        color: "danger",
    },
];

// ── Main Component ────────────────────────────────────────────────────────────
const AdvancePayDashboard = () => {
    return (
        <>
            {/* ───────── PAGE HEADER ───────── */}
            <div className="page-head">
                <div className="row align-items-center">
                    <div className="col-12 col-md-7 mb-3 mb-md-0">
                        <SkyGreeting />
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
                            <Link
                                to="/AdvancePayForm"
                                className="btn btn-primary d-flex justify-content-center align-items-center px-3"
                            >
                                + Raise Advance
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-12">
                        <div className="page-title">
                            <h3>Advance Payment</h3>
                        </div>
                        <hr />
                    </div>
                </div>
            </div>

            {/* ───────── DASHBOARD CARDS ───────── */}
            <div className="row">
                {cards.map((card, index) => (
                    <div className="col-xl-3 col-sm-6" key={index}>
                        <div className="card">
                            <div className="card-header border-0 pb-0">
                                <h6 className="mb-0">{card.title}</h6>
                                <Dropdown className="dropdown ms-auto c-pointer">
                                    <Dropdown.Toggle as="div" className="btn-link i-false">
                                        {SVGICON.threedot}
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu align="end">
                                        <Dropdown.Item>View Detail</Dropdown.Item>
                                        <Dropdown.Item>Download</Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>
                            <div className="card-body pt-2">
                                <h2 className="card-title mb-0">{card.amount}</h2>
                                <span>
                                    <small className={`text-${card.color} font-w600 me-1`}>
                                        {card.percent}
                                    </small>
                                    {card.subtitle}
                                </span>
                                <div className="progress mt-3" style={{ height: "6px" }}>
                                    <div
                                        className={`progress-bar bg-${card.color}`}
                                        style={{ width: card.progress }}
                                    ></div>
                                </div>
                                <div className="d-flex justify-content-between mt-1">
                                    <small className="text-muted">{card.subtitle}</small>
                                    <small className="text-muted font-w600">{card.requests}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ───────── ROW 2 : TABS + RECENT ACTIVITY ───────── */}
            <div className="row">
                {/* ── Tabs ── */}
                <div className="col-xl-9">
                    <div className="card">
                        <div className="card-header border-0 pb-0">
                            <h4 className="mb-0">Advance Payment Overview</h4>
                            <span className="badge badge-sm badge-primary light ms-2">
                                FY 2025-26
                            </span>
                        </div>
                        <div className="card-body px-0">
                            <Tab.Container defaultActiveKey="pending">
                                <Nav className="nav nav-pills success-tab flex-wrap px-3">
                                    <Nav.Item>
                                        <Nav.Link eventKey="pending" className="nav-link px-4 py-3 fs-15 fw-semibold" style={{ minWidth: "130px", textAlign: "center" }}>
                                            {SVGICON.advancePending} <span>Pending</span>
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="approved" className="nav-link px-4 py-3 fs-15 fw-semibold" style={{ minWidth: "130px", textAlign: "center" }}>
                                            {SVGICON.advanceApproved} <span>Approved</span>
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="paid" className="nav-link px-4 py-3 fs-15 fw-semibold" style={{ minWidth: "130px", textAlign: "center" }}>
                                            {SVGICON.advancePaid} <span>Paid</span>
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="settled" className="nav-link px-4 py-3 fs-15 fw-semibold" style={{ minWidth: "130px", textAlign: "center" }}>
                                            {SVGICON.advanceSettled} <span>Settled</span>
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="projectwise" className="nav-link px-4 py-3 fs-15 fw-semibold" style={{ minWidth: "130px", textAlign: "center" }}>
                                            {SVGICON.advanceProject} <span>Project Wise</span>
                                        </Nav.Link>
                                    </Nav.Item>
                                </Nav>

                                <div style={{ maxHeight: "420px", overflowY: "auto" }}>
                                    <Tab.Content>
                                        {/* PENDING */}
                                        <Tab.Pane eventKey="pending">
                                            <div className="table-responsive">
                                                <table className="table card-table border-no success-tbl">
                                                    <thead>
                                                        <tr>
                                                            <th>S.No</th><th>Employee</th><th>Project</th>
                                                            <th>Advance Type</th><th>Amount</th><th>Date</th><th>Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td>1</td><td>Mohit Sharma</td><td>ERP Development</td>
                                                            <td>Travel Advance</td><td>₹25,000</td><td>21 May 2026</td>
                                                            <td><span className="badge badge-warning light border-0">Pending</span></td>
                                                        </tr>
                                                        <tr>
                                                            <td>2</td><td>Rahul Kumar</td><td>CRM Project</td>
                                                            <td>Office Expense</td><td>₹18,000</td><td>20 May 2026</td>
                                                            <td><span className="badge badge-warning light border-0">Pending</span></td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </Tab.Pane>

                                        {/* APPROVED */}
                                        <Tab.Pane eventKey="approved">
                                            <div className="table-responsive">
                                                <table className="table card-table border-no success-tbl">
                                                    <thead>
                                                        <tr>
                                                            <th>S.No</th><th>Employee</th><th>Project</th>
                                                            <th>Approved By</th><th>Amount</th><th>Date</th><th>Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td>1</td><td>Aman Verma</td><td>Mobile App</td>
                                                            <td>Admin</td><td>₹40,000</td><td>18 May 2026</td>
                                                            <td><span className="badge badge-info light border-0">Approved</span></td>
                                                        </tr>
                                                        <tr>
                                                            <td>2</td><td>Rohit Singh</td><td>Website Project</td>
                                                            <td>Manager</td><td>₹32,000</td><td>17 May 2026</td>
                                                            <td><span className="badge badge-info light border-0">Approved</span></td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </Tab.Pane>

                                        {/* PAID */}
                                        <Tab.Pane eventKey="paid">
                                            <div className="table-responsive">
                                                <table className="table card-table border-no success-tbl">
                                                    <thead>
                                                        <tr>
                                                            <th>S.No</th><th>Employee</th><th>Project</th>
                                                            <th>Payment Mode</th><th>Amount</th><th>Paid Date</th><th>Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td>1</td><td>Priya Sharma</td><td>CRM Software</td>
                                                            <td>Bank Transfer</td><td>₹55,000</td><td>15 May 2026</td>
                                                            <td><span className="badge badge-success light border-0">Paid</span></td>
                                                        </tr>
                                                        <tr>
                                                            <td>2</td><td>Deepak Kumar</td><td>ERP Module</td>
                                                            <td>UPI</td><td>₹28,000</td><td>14 May 2026</td>
                                                            <td><span className="badge badge-success light border-0">Paid</span></td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </Tab.Pane>

                                        {/* SETTLED */}
                                        <Tab.Pane eventKey="settled">
                                            <div className="table-responsive">
                                                <table className="table card-table border-no success-tbl">
                                                    <thead>
                                                        <tr>
                                                            <th>S.No</th><th>Employee</th><th>Project</th>
                                                            <th>Settlement Amount</th><th>Advance Used</th><th>Balance</th><th>Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td>1</td><td>Akash Jain</td><td>Marketing Campaign</td>
                                                            <td>₹45,000</td><td>₹42,000</td><td>₹3,000</td>
                                                            <td><span className="badge badge-primary light border-0">Settled</span></td>
                                                        </tr>
                                                        <tr>
                                                            <td>2</td><td>Neha Singh</td><td>Web Portal</td>
                                                            <td>₹60,000</td><td>₹58,000</td><td>₹2,000</td>
                                                            <td><span className="badge badge-primary light border-0">Settled</span></td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </Tab.Pane>

                                        {/* PROJECT WISE */}
                                        <Tab.Pane eventKey="projectwise">
                                            <div className="table-responsive">
                                                <table className="table card-table border-no success-tbl">
                                                    <thead>
                                                        <tr>
                                                            <th>Project</th><th>Total Requests</th><th>Total Advance</th>
                                                            <th>Paid</th><th>Pending</th><th>Settled</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td>ERP Development</td><td>25</td><td>₹4,50,000</td>
                                                            <td className="text-success">₹3,80,000</td>
                                                            <td className="text-warning">₹50,000</td>
                                                            <td className="text-primary">₹20,000</td>
                                                        </tr>
                                                        <tr>
                                                            <td>CRM Development</td><td>18</td><td>₹3,20,000</td>
                                                            <td className="text-success">₹2,70,000</td>
                                                            <td className="text-warning">₹30,000</td>
                                                            <td className="text-primary">₹20,000</td>
                                                        </tr>
                                                        <tr>
                                                            <td>Mobile App</td><td>12</td><td>₹2,10,000</td>
                                                            <td className="text-success">₹1,75,000</td>
                                                            <td className="text-warning">₹20,000</td>
                                                            <td className="text-primary">₹15,000</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </Tab.Pane>
                                    </Tab.Content>
                                </div>
                            </Tab.Container>
                        </div>
                    </div>
                </div>

                {/* ── Recent Activities ── */}
                <div className="col-xl-3">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="mb-0">Recent Activities</h4>
                            <span className="badge badge-primary light ms-auto">08 Activities</span>
                        </div>
                        <div className="card-body">
                            <div className="widget-timeline-status">
                                <ul className="timeline">
                                    <li>
                                        <span className="timeline-status">1</span>
                                        <div className="timeline-badge border-warning"></div>
                                        <div className="timeline-panel">
                                            <span className="text-black fs-14 fw-semibold">Mohit raised ₹25,000 advance</span>
                                        </div>
                                    </li>
                                    <li>
                                        <span className="timeline-status">2</span>
                                        <div className="timeline-badge border-info"></div>
                                        <div className="timeline-panel">
                                            <span className="text-black fs-14 fw-semibold">Rahul advance approved</span>
                                        </div>
                                    </li>
                                    <li>
                                        <span className="timeline-status">3</span>
                                        <div className="timeline-badge border-success"></div>
                                        <div className="timeline-panel">
                                            <span className="text-black fs-14 fw-semibold">Priya payment completed</span>
                                        </div>
                                    </li>
                                    <li>
                                        <span className="timeline-status">4</span>
                                        <div className="timeline-badge border-primary"></div>
                                        <div className="timeline-panel">
                                            <span className="text-black fs-14 fw-semibold">Neha settlement done</span>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ───────── ROW 3 : BAR CHART ───────── */}
            <div className="row">
                <div className="col-xl-12">
                    <div className="card overflow-hidden">
                        <div className="card-header border-0 pb-0 flex-wrap">
                            <div className="blance-media">
                                <h5 className="mb-0">Project-wise Advance Breakdown</h5>
                                <h4 className="mb-0 text-dark">
                                    ₹12,45,000{" "}
                                    <span className="badge badge-sm badge-success light">FY 2025-26</span>
                                </h4>
                            </div>
                        </div>

                        <AdvancePayOverviewChart data={PROJECT_CHART_DATA} />

                        <div className="ttl-project">
                            <div className="pr-data">
                                <h5>125</h5>
                                <span>Total Requests</span>
                            </div>
                            <div className="pr-data">
                                <h5 className="text-primary">18</h5>
                                <span>Pending Review</span>
                            </div>
                            <div className="pr-data">
                                <h5>₹7,25,000</h5>
                                <span>Disbursed</span>
                            </div>
                            <div className="pr-data">
                                <h5 className="text-danger">₹1,10,000</h5>
                                <span>Rejected</span>
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

                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <table className="table mb-0" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
                                    <thead>
                                        <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                                            {["#", "PROJECT", "REQUESTED BY", "REQUESTED", "APPROVED", "PAID", "STATUS", "ACTIONS"].map((h) => (
                                                <th
                                                    key={h}
                                                    style={{
                                                        padding: "12px 16px",
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        color: "#6b7280",
                                                        letterSpacing: "0.05em",
                                                        borderBottom: "1px solid #e5e7eb",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {STATIC_DATA.length > 0 ? (
                                            STATIC_DATA.map((item, index) => (
                                                <tr
                                                    key={item.id}
                                                    style={{ borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" }}
                                                >
                                                    {/* # */}
                                                    <td style={{ padding: "16px", color: "#9ca3af", fontWeight: 500, width: 40 }}>
                                                        {index + 1}
                                                    </td>

                                                    {/* PROJECT */}
                                                    <td style={{ padding: "16px", minWidth: 220 }}>
                                                        <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 3 }}>
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
                                                    <td style={{ padding: "16px", fontWeight: 700, fontSize: 15, color: "#111827" }}>
                                                        {formatINR(item.requested_amount)}
                                                    </td>

                                                    {/* APPROVED */}
                                                    <td style={{ padding: "16px", fontWeight: 700, fontSize: 15, color: "#16a34a" }}>
                                                        {formatINR(item.approved_amount)}
                                                    </td>

                                                    {/* PAID */}
                                                    <td style={{ padding: "16px", fontWeight: 700, fontSize: 15, color: "#16a34a" }}>
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
        </>
    );
};

export default AdvancePayDashboard;