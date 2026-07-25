import { Link } from "react-router-dom";
import { SVGICON } from "../../../constant/theme";
import { Dropdown, Nav, Tab } from "react-bootstrap";
import { useState, useEffect, useCallback } from "react";
import SkyGreeting from "../../../components/Common/SkyGreeting";

import { Bar } from "react-chartjs-2";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Tooltip,
	Legend,
} from "chart.js";
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatINR = (amount) =>
	new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const formatINRShort = (v) => {
	if (v >= 10000000) return "₹" + Math.round(v / 10000000) + "Cr";
	if (v >= 100000) return "₹" + Math.round(v / 100000) + "L";
	if (v >= 1000) return "₹" + Math.round(v / 1000) + "K";
	return "₹" + v;
};

// ── Shared chart colors ───────────────────────────────────────────────────────
const CHART_COLORS = {
	total: "#0073fd",
	approved: "#00aeef",
	paid: "#1d9e75",
	pending: "#ee9742",
};

const CHART_LEGEND = [
	{ key: "total", label: "Total Amount" },
	{ key: "approved", label: "Approved" },
	{ key: "paid", label: "Paid" },
	{ key: "pending", label: "Pending" },
];

// ── ExpenseOverviewChart — project-wise bars ──────────────────────────────────
const ExpenseOverviewChart = ({ data = [] }) => {
	const chartData = {
		labels: data.map((p) => p.project_name),
		datasets: [
			{
				label: "Total Amount",
				data: data.map((p) => p.totalAmount),
				backgroundColor: CHART_COLORS.total,
				borderRadius: 10,
				barPercentage: 0.25,
				categoryPercentage: 0.8,
			},
			{
				label: "Approved",
				data: data.map((p) => p.approvedAmount),
				backgroundColor: CHART_COLORS.approved,
				borderRadius: 10,
				barPercentage: 0.25,
				categoryPercentage: 0.8,
			},
			{
				label: "Paid",
				data: data.map((p) => p.totalPaid),
				backgroundColor: CHART_COLORS.paid,
				borderRadius: 10,
				barPercentage: 0.25,
				categoryPercentage: 0.8,
			},
			{
				label: "Pending",
				data: data.map((p) => p.pendingAmount),
				backgroundColor: CHART_COLORS.pending,
				borderRadius: 10,
				barPercentage: 0.25,
				categoryPercentage: 0.8,
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

	if (data.length === 0) {
		return <p className="text-muted text-center py-4">No project data available.</p>;
	}

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

// ── UserBarChart ──────────────────────────────────────────────────────────────
const UserBarChart = ({ data = [] }) => {
	const chartData = {
		labels: data.map((u) => u.Name),
		datasets: [
			{
				label: "Total Amount",
				data: data.map((u) => u.totalAmount),
				backgroundColor: CHART_COLORS.total,
				borderRadius: 10,
				barPercentage: 0.40,
				categoryPercentage: 0.8,
			},
			{
				label: "Approved",
				data: data.map((u) => u.approvedAmount),
				backgroundColor: CHART_COLORS.approved,
				borderRadius: 10,
				barPercentage: 0.40,
				categoryPercentage: 0.8,
			},
			{
				label: "Paid",
				data: data.map((u) => u.totalPaid),
				backgroundColor: CHART_COLORS.paid,
				borderRadius: 10,
				barPercentage: 0.40,
				categoryPercentage: 0.8,
			},
			{
				label: "Pending",
				data: data.map((u) => u.pendingAmount),
				backgroundColor: CHART_COLORS.pending,
				borderRadius: 10,
				barPercentage: 0.40,
				categoryPercentage: 0.8,
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
			<div className="d-flex flex-wrap gap-3 mb-3">
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
			<div style={{ position: "relative", width: "100%", height: 380 }}>
				<Bar data={chartData} options={options} />
			</div>
		</>
	);
};

// ── ManagerDashboard ───────────────────────────────────────────────────────────
const ManagerDashboard = () => {
	const [selectedFY, setSelectedFY] = useState("");
	const [selectedProjectId, setSelectedProjectId] = useState("");
	const [dashData, setDashData] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	// ── Fetch ─────────────────────────────────────────────────────────────────

	const fetchDashboard = useCallback(async (fy = selectedFY, projectId = selectedProjectId) => {
		setLoading(true);
		setError(null);
		try {
			const params = new URLSearchParams();
			params.set("fy_year", fy || "");
			if (projectId) params.set("project_id", projectId);

			const res = await fetch(
				`${import.meta.env.VITE_BACKEND_API_URL}dashboard/manager-dashboard?${params}`,
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				}
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const json = await res.json();
			if (json.success) {
				setDashData(json.data);
				const fyList = json.data?.filterOptions?.availableFYList ?? [];
				if (!selectedFY && fyList.length > 0) {
					setSelectedFY(fyList[0].fy_year);
				}
			} else {
				throw new Error("API returned success: false");
			}
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, [selectedFY, selectedProjectId]);

	useEffect(() => {
		fetchDashboard(selectedFY, selectedProjectId);
	}, [selectedFY, selectedProjectId, fetchDashboard]);

	// ── Derived values ────────────────────────────────────────────────────────
	const totalExpense = dashData?.totalExpense ?? 0;
	const paidAmount = dashData?.paidAmount ?? 0;
	const pendingAmount = dashData?.pendingAmount ?? 0;
	const rejectedAmount = dashData?.rejectedAmount ?? 0;
	const approvedAmount = dashData?.approvedAmount ?? 0;
	const approvalQueueCount = dashData?.approvalQueueCount ?? 0;

	const userWiseSummary = dashData?.userWiseSummary ?? [];
	const projectWiseData = dashData?.projectWiseData ?? [];
	const interventionWiseData = dashData?.interventionWiseData ?? [];
	const approvalQueue = dashData?.approvalQueue ?? [];
	const availableFYList = dashData?.filterOptions?.availableFYList ?? [];
	const availableProjects = dashData?.filterOptions?.availableProjects ?? [];
	const availableUsers = dashData?.filterOptions?.availableUsers ?? [];
	const availableInterventions = (dashData?.filterOptions?.availableInterventions ?? []).filter(
		(i) => i.intervention_id !== null
	);

	const totalRequests = userWiseSummary.reduce((s, u) => s + (u.totalRequests ?? 0), 0);

	// ── Loading / Error ───────────────────────────────────────────────────────
	if (loading) return (
		<div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
			<div className="spinner-border text-primary" role="status">
				<span className="visually-hidden">Loading…</span>
			</div>
		</div>
	);

	if (error) return (
		<div className="alert alert-danger m-4">
			Failed to load dashboard data: <strong>{error}</strong>
			<button className="btn btn-sm btn-outline-danger ms-3" onClick={() => fetchDashboard(selectedFY)}>
				Retry
			</button>
		</div>
	);

	// ── Render ────────────────────────────────────────────────────────────────
	return (
		<>
			{/* ── Page Header ── */}
			<div className="page-head">
				<div className="row align-items-center">

					{/* Left: Greeting */}
					<div className="col-12 col-md-7 mb-3 mb-md-0">
						<SkyGreeting />
					</div>

					{/* Right: Filters + CTA */}
					<div className="col-12 col-md-5">
						<div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center gap-2 justify-content-md-end">
							<div className="d-flex gap-2 flex-grow-1 flex-md-grow-0">

								{/* Project Filter */}
								<select
									className="form-select flex-fill"
									value={selectedProjectId}
									onChange={(e) => setSelectedProjectId(e.target.value)}
								>
									{availableProjects
										.filter((p) => p.project_id)
										.map((p) => (
											<option key={p.project_id} value={String(p.project_id)}>
												{p.project_name}
											</option>
										))}

									<option value="">All Projects</option>

								</select>

								{/* FY Filter */}
								<select
									className="form-select flex-fill"
									value={selectedFY}
									onChange={(e) => setSelectedFY(e.target.value)}
								>
									{availableFYList
										.filter((f) => f.fy_year)
										.map((f) => (
											<option key={f.fy_year} value={f.fy_year}>
												FY {f.fy_year}
											</option>
										))}
									<option value="0">All Years</option>
								</select>
							</div>

							<Link
								to="/add-expense"
								className="btn btn-primary d-flex justify-content-center align-items-center px-3"
							>
								+ Raise Expense
							</Link>
						</div>
					</div>

				</div>
			</div>

			{/* ── ROW 1: FIRST 4 STAT CARDS ── */}
			<div className="row">

				{/* Total Expense */}
				<div className="col-xl-3 col-sm-6">
					<div className="card">
						<div className="card-header border-0 pb-0">
							<h6 className="mb-0">Total Expense</h6>
							<Dropdown className="dropdown ms-auto c-pointer">
								<Dropdown.Toggle as="div" className="btn-link i-false">{SVGICON.threedot}</Dropdown.Toggle>
								<Dropdown.Menu align="end">
									<Dropdown.Item>View Detail</Dropdown.Item>
									<Dropdown.Item>Download</Dropdown.Item>
								</Dropdown.Menu>
							</Dropdown>
						</div>
						<div className="card-body pt-2">
							<h2 className="card-title mb-0">{formatINR(totalExpense)}</h2>
							<span><small className="text-muted">FY {selectedFY}</small></span>
							<div className="progress mt-3" style={{ height: "6px" }}>
								<div className="progress-bar bg-primary" style={{ width: "100%" }}></div>
							</div>
							<div className="d-flex justify-content-between mt-1">
								<small className="text-muted">All Expenses</small>
								<small className="text-muted font-w600">{totalRequests} requests</small>
							</div>
						</div>
					</div>
				</div>

				{/* Approved Amount */}
				<div className="col-xl-3 col-sm-6">
					<div className="card">
						<div className="card-header border-0 pb-0">
							<h6 className="mb-0">Approved Amount</h6>
							<Dropdown className="dropdown ms-auto c-pointer">
								<Dropdown.Toggle as="div" className="btn-link i-false">{SVGICON.threedot}</Dropdown.Toggle>
								<Dropdown.Menu align="end">
									<Dropdown.Item>View Detail</Dropdown.Item>
									<Dropdown.Item>Download</Dropdown.Item>
								</Dropdown.Menu>
							</Dropdown>
						</div>
						<div className="card-body pt-2">
							<h2 className="card-title mb-0">{formatINR(approvedAmount)}</h2>
							<span>
								<small className="text-info font-w600 me-1">
									{totalExpense > 0 ? Math.round((approvedAmount / totalExpense) * 100) : 0}%
								</small>
								of total expense
							</span>
							<div className="progress mt-3" style={{ height: "6px" }}>
								<div
									className="progress-bar bg-info"
									style={{ width: `${totalExpense > 0 ? (approvedAmount / totalExpense) * 100 : 0}%` }}
								></div>
							</div>
							<div className="d-flex justify-content-between mt-1">
								<small className="text-muted">Of Total Expense</small>
								<small className="text-muted font-w600">{formatINR(approvedAmount)}</small>
							</div>
						</div>
					</div>
				</div>

				{/* Paid Amount */}
				<div className="col-xl-3 col-sm-6">
					<div className="card">
						<div className="card-header border-0 pb-0">
							<h6 className="mb-0">Paid Expenses</h6>
							<Dropdown className="dropdown ms-auto c-pointer">
								<Dropdown.Toggle as="div" className="btn-link i-false">{SVGICON.threedot}</Dropdown.Toggle>
								<Dropdown.Menu align="end">
									<Dropdown.Item>View Detail</Dropdown.Item>
									<Dropdown.Item>Download</Dropdown.Item>
								</Dropdown.Menu>
							</Dropdown>
						</div>
						<div className="card-body pt-2">
							<h2 className="card-title mb-0">{formatINR(paidAmount)}</h2>
							<span>
								<small className="text-success font-w600 me-1">
									{approvedAmount > 0 ? Math.round((paidAmount / approvedAmount) * 100) : 0}%
								</small>
								of approved amount
							</span>
							<div className="progress mt-3" style={{ height: "6px" }}>
								<div
									className="progress-bar bg-success"
									style={{ width: `${approvedAmount > 0 ? (paidAmount / approvedAmount) * 100 : 0}%` }}
								></div>
							</div>
							<div className="d-flex justify-content-between mt-1">
								<small className="text-muted">Of Approved</small>
								<small className="text-muted font-w600">{formatINR(paidAmount)}</small>
							</div>
						</div>
					</div>
				</div>

				{/* Rejected Amount */}
				<div className="col-xl-3 col-sm-6">
					<div className="card">
						<div className="card-header border-0 pb-0">
							<h6 className="mb-0">Rejected Expenses</h6>
							<Dropdown className="dropdown ms-auto c-pointer">
								<Dropdown.Toggle as="div" className="btn-link i-false">{SVGICON.threedot}</Dropdown.Toggle>
								<Dropdown.Menu align="end">
									<Dropdown.Item>View Detail</Dropdown.Item>
									<Dropdown.Item>Download</Dropdown.Item>
								</Dropdown.Menu>
							</Dropdown>
						</div>
						<div className="card-body pt-2">
							<h2 className="card-title mb-0">{formatINR(rejectedAmount)}</h2>
							<span>
								<small className={`font-w600 me-1 ${rejectedAmount > 0 ? "text-danger" : "text-success"}`}>
									{totalExpense > 0 ? Math.round((rejectedAmount / totalExpense) * 100) : 0}%
								</small>
								of total expense
							</span>
							<div className="progress mt-3" style={{ height: "6px" }}>
								<div
									className="progress-bar bg-danger"
									style={{ width: `${totalExpense > 0 ? (rejectedAmount / totalExpense) * 100 : 0}%` }}
								></div>
							</div>
							<div className="d-flex justify-content-between mt-1">
								<small className="text-muted">Of Total Expense</small>
								<small className="text-muted font-w600">{formatINR(rejectedAmount)}</small>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* ── ROW 2: SECOND 4 STAT CARDS ── */}
			<div className="row">

				{/* Claims Submitted */}
				<div className="col-xl-3 col-sm-6">
					<div className="card">
						<div className="card-header border-0 pb-0">
							<h6 className="mb-0">Claims Submitted</h6>
							<Dropdown className="dropdown ms-auto c-pointer">
								<Dropdown.Toggle as="div" className="btn-link i-false">{SVGICON.threedot}</Dropdown.Toggle>
								<Dropdown.Menu align="end">
									<Dropdown.Item>View Detail</Dropdown.Item>
									<Dropdown.Item>Download</Dropdown.Item>
								</Dropdown.Menu>
							</Dropdown>
						</div>
						<div className="card-body pt-2">
							<h2 className="card-title mb-0">{totalRequests}</h2>
							<span><small className="text-muted">FY {selectedFY}</small></span>
							<div className="progress mt-3" style={{ height: "6px" }}>
								<div className="progress-bar bg-primary" style={{ width: "100%" }}></div>
							</div>
							<div className="d-flex justify-content-between mt-1">
								<small className="text-muted">Total Claims</small>
								<small className="text-muted font-w600">{totalRequests} requests</small>
							</div>
						</div>
					</div>
				</div>

				{/* Approval Queue */}
				<div className="col-xl-3 col-sm-6">
					<div className="card">
						<div className="card-header border-0 pb-0">
							<h6 className="mb-0">Pending Review</h6>
							<Dropdown className="dropdown ms-auto c-pointer">
								<Dropdown.Toggle as="div" className="btn-link i-false">{SVGICON.threedot}</Dropdown.Toggle>
								<Dropdown.Menu align="end">
									<Dropdown.Item>View Detail</Dropdown.Item>
									<Dropdown.Item>Download</Dropdown.Item>
								</Dropdown.Menu>
							</Dropdown>
						</div>
						<div className="card-body pt-2">
							<h2 className="card-title mb-0">{approvalQueueCount}</h2>
							<span><small className="text-warning font-w600 me-1">Awaiting action</small></span>
							<div className="progress mt-3" style={{ height: "6px" }}>
								<div
									className="progress-bar bg-warning"
									style={{ width: `${totalRequests > 0 ? (approvalQueueCount / totalRequests) * 100 : 0}%` }}
								></div>
							</div>
							<div className="d-flex justify-content-between mt-1">
								<small className="text-muted">Awaiting Action</small>
								<small className="text-muted font-w600">{approvalQueueCount} open</small>
							</div>
						</div>
					</div>
				</div>

				{/* Pending Amount */}
				<div className="col-xl-3 col-sm-6">
					<div className="card">
						<div className="card-header border-0 pb-0">
							<h6 className="mb-0">Pending Amount</h6>
							<Dropdown className="dropdown ms-auto c-pointer">
								<Dropdown.Toggle as="div" className="btn-link i-false">{SVGICON.threedot}</Dropdown.Toggle>
								<Dropdown.Menu align="end">
									<Dropdown.Item>View Detail</Dropdown.Item>
									<Dropdown.Item>Download</Dropdown.Item>
								</Dropdown.Menu>
							</Dropdown>
						</div>
						<div className="card-body pt-2">
							<h2 className="card-title mb-0">{formatINR(pendingAmount)}</h2>
							<span>
								<small className="text-warning font-w600 me-1">
									{totalExpense > 0 ? Math.round((pendingAmount / totalExpense) * 100) : 0}%
								</small>
								of total expense
							</span>
							<div className="progress mt-3" style={{ height: "6px" }}>
								<div
									className="progress-bar bg-warning"
									style={{ width: `${totalExpense > 0 ? (pendingAmount / totalExpense) * 100 : 0}%` }}
								></div>
							</div>
							<div className="d-flex justify-content-between mt-1">
								<small className="text-muted">Unpaid / Unreviewed</small>
								<small className="text-muted font-w600">{formatINR(pendingAmount)}</small>
							</div>
						</div>
					</div>
				</div>

				{/* Active Users */}
				<div className="col-xl-3 col-sm-6">
					<div className="card">
						<div className="card-header border-0 pb-0">
							<h6 className="mb-0">Active Users</h6>
							<Dropdown className="dropdown ms-auto c-pointer">
								<Dropdown.Toggle as="div" className="btn-link i-false">{SVGICON.threedot}</Dropdown.Toggle>
								<Dropdown.Menu align="end">
									<Dropdown.Item>View Detail</Dropdown.Item>
									<Dropdown.Item>Download</Dropdown.Item>
								</Dropdown.Menu>
							</Dropdown>
						</div>
						<div className="card-body pt-2">
							<h2 className="card-title mb-0">{availableUsers.length}</h2>
							<span><small className="text-info font-w600 me-1">submitting expenses</small></span>
							<div className="progress mt-3" style={{ height: "6px" }}>
								<div className="progress-bar bg-info" style={{ width: "100%" }}></div>
							</div>
							<div className="d-flex justify-content-between mt-1">
								<small className="text-muted">Total Users</small>
								<small className="text-muted font-w600">{availableUsers.length} active</small>
							</div>
						</div>
					</div>
				</div>
			</div>



			{/* ── ROW 2B: Interventions + Expense Overview bar chart project wise ── */}
			<div className="row">
				<div className="col-xl-3">
					<div className="card d-flex flex-column" style={{ height: "530px" }}>
						<div className="card-header pb-0 border-0">
							<div className="clearfix">
								<h5 className="mb-0">Interventions</h5>
								<small className="d-block text-muted">
									{availableInterventions.length} Intervention{availableInterventions.length !== 1 ? "s" : ""} Available
								</small>
							</div>
							<div className="clearfix ms-auto">
								<button type="button" className="btn btn-light btn-icon-xxs tp-btn fs-18 align-self-start">
									<i className="bi bi-grid" />
								</button>
							</div>
						</div>
						<div
							className="card-body flex-grow-1"
							style={{ overflowY: "auto" }}
						>
							{availableInterventions.length === 0 ? (
								<p className="text-muted text-center py-3">No interventions found</p>
							) : (
								availableInterventions.map((intv, idx) => {
									const match = interventionWiseData.find(
										(d) => d.intervention_id === intv.intervention_id
									);
									const count = match?.totalRequests ?? 0;
									const avatarColors = [
										"bg-primary", "bg-success", "bg-warning",
										"bg-info", "bg-danger", "bg-dark",
									];
									const bg = avatarColors[idx % avatarColors.length];
									const initials = intv.intervention_name
										? intv.intervention_name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
										: "?";

									return (
										<div key={intv.intervention_id ?? idx} className="d-flex align-items-center py-2 hover-bg-light rounded my-1">
											<div
												className={`avatar avatar-md style-1 border border-opacity-10 rounded d-flex align-items-center justify-content-center ${bg}`}
												style={{ minWidth: 40, minHeight: 40, fontSize: 13, color: "#fff", fontWeight: 700 }}
											>
												{initials}
											</div>
											<div className="clearfix ms-3">
												<h6 className="mb-0 fw-semibold">
													{intv.intervention_name ?? <em className="text-muted">Unassigned</em>}
												</h6>
												{match && (
													<span className="fs-13 text-muted">{formatINR(match.totalAmount ?? 0)}</span>
												)}
											</div>
											<div className="clearfix ms-auto">
												<span className="badge badge-sm badge-light">{count}</span>
											</div>
										</div>
									);
								})
							)}
							<div className="alert alert-primary border-primary outline-dashed py-3 px-3 mt-4 mb-0 text-black">
								<strong className="text-primary">Reminder:</strong> Submit all pending expense requests for this month to avoid delays in payment.
							</div>
						</div>
					</div>
				</div>



				<div className="col-xl-9">
					<div className="card overflow-hidden">
						<div className="card-header border-0 pb-0 flex-wrap">
							<div className="blance-media">
								<h5 className="mb-0">Expense Overview</h5>
								<h4 className="mb-0 text-dark">
									{formatINR(totalExpense)}{" "}
									<span className="badge badge-sm badge-success light">FY {selectedFY}</span>
								</h4>
							</div>
						</div>

						<ExpenseOverviewChart data={projectWiseData} />

						{/* Summary footer */}
						<div className="ttl-project">
							<div className="pr-data">
								<h5>{totalRequests}</h5>
								<span>Total Request</span>
							</div>
							<div className="pr-data">
								<h5 className="text-primary">{approvalQueueCount}</h5>
								<span>Pending Review</span>
							</div>
							<div className="pr-data">
								<h5>{formatINR(paidAmount)}</h5>
								<span>Paid Amount</span>
							</div>
							<div className="pr-data">
								<h5 className="text-danger">{formatINR(rejectedAmount)}</h5>
								<span>Rejected</span>
							</div>
						</div>
					</div>
				</div>

			</div>




			{/* ── ROW 3B: EXPENSE TABS (Approval Queue / Payment Overview / Project-wise) ── */}
			<div className="row">
				<div className="col-xl-9">
					<div className="card">
						<div className="card-header border-0 pb-0">
							<h4 className="mb-0">Expense Overview</h4>
							<span className="badge badge-sm badge-info light ms-2">FY {selectedFY}</span>
						</div>
						<div className="card-body px-0">
							<Tab.Container defaultActiveKey="approval">
								<Nav className="nav nav-pills success-tab">
									<Nav.Item className="nav-item">
										<Nav.Link eventKey="approval" className="nav-link w-100">
											{SVGICON.project} <span>Approval Queue</span>
										</Nav.Link>
									</Nav.Item>

									<Nav.Item className="nav-item">
										<Nav.Link eventKey="projectwise" className="nav-link w-100">
											{SVGICON.socialheart} <span>Project Wise</span>
										</Nav.Link>
									</Nav.Item>
								</Nav>

								<div style={{ maxHeight: "400px", overflowY: "auto" }}>
									<Tab.Content>
										{/* ── TAB 1: APPROVAL QUEUE ── */}
										<Tab.Pane eventKey="approval">
											<div className="table-responsive">
												<table className="table card-table border-no success-tbl">
													<thead>
														<tr>
															<th>S.No</th>
															<th>User</th>
															<th>Project</th>
															<th>Intervention</th>
															<th>Amount</th>
															<th>Financial Year</th>
															<th>Status</th>
														</tr>
													</thead>
													<tbody>
														{approvalQueue.length === 0 ? (
															<tr><td colSpan={7} className="text-center text-muted py-4">No pending approvals</td></tr>
														) : (
															approvalQueue.map((item, idx) => (
																<tr key={item.expense_id}>
																	<td>
																		<span className="font-w600 text-primary">{idx + 1}</span>
																	</td>
																	<td>
																		<div className="d-flex align-items-center gap-2">
																			<div
																				className="avatar avatar-sm rounded-circle bg-primary d-flex align-items-center justify-content-center"
																				style={{ width: 32, height: 32, fontSize: 12, color: "#fff", fontWeight: 700, flexShrink: 0 }}
																			>
																				{item.user_name?.charAt(0) ?? "U"}
																			</div>
																			<div>
																				<h6 className="mb-0 fs-14">{item.user_name}</h6>
																				<small className="text-muted">{item.user_email}</small>
																			</div>
																		</div>
																	</td>
																	<td><span className="font-w500">{item.project_name}</span></td>
																	<td><span className="text-muted">{item.intervention_name ?? <em>—</em>}</span></td>
																	<td><span className="font-w700 text-dark">{formatINR(item.amount)}</span></td>
																	<td><span className="badge badge-sm badge-info light border-0">{item.financial_year}</span></td>
																	<td>
																		<span
																			className="badge light border-0"
																			style={{
																				background:
																					item.payment_status === 0
																						? "#FAEEDA"
																						: item.payment_status === 1
																							? "#FFF4E5"
																							: "#E1F5EE",
																				color:
																					item.payment_status === 0
																						? "#854F0B"
																						: item.payment_status === 1
																							? "#B26A00"
																							: "#0F6E56",
																			}}
																		>
																			{item.payment_status === 0
																				? "Pending"
																				: item.payment_status === 1
																					? "Partially Paid"
																					: "Paid"}
																		</span>
																	</td>
																</tr>
															))
														)}
													</tbody>
												</table>
											</div>
										</Tab.Pane>


										{/* ── TAB 3: PROJECT WISE ── */}
										<Tab.Pane eventKey="projectwise">
											<div className="table-responsive">
												<table className="table card-table border-no success-tbl">
													<thead>
														<tr>
															<th>Project</th>
															<th>Requests</th>
															<th>Total Amount</th>
															<th>Paid</th>
															<th>Pending</th>
															<th>Rejected</th>
														</tr>
													</thead>
													<tbody>
														{projectWiseData.length === 0 ? (
															<tr><td colSpan={6} className="text-center text-muted py-4">No project data available</td></tr>
														) : (
															projectWiseData.map((row) => {
																const paidPct = row.totalAmount > 0
																	? Math.round((row.totalPaid / row.totalAmount) * 100)
																	: 0;
																return (
																	<tr key={row.project_id}>
																		<td>
																			<div className="d-flex align-items-center gap-2">
																				<div
																					className="avatar avatar-sm rounded d-flex align-items-center justify-content-center bg-primary"
																					style={{ width: 34, height: 34, fontSize: 12, color: "#fff", fontWeight: 700, flexShrink: 0 }}
																				>
																					{row.project_name?.charAt(0) ?? "P"}
																				</div>
																				<div>
																					<h6 className="mb-0 fs-14 font-w600">{row.project_name}</h6>
																				</div>
																			</div>
																		</td>
																		<td><span className="font-w600">{row.totalRequests}</span></td>
																		<td><span className="font-w700">{formatINR(row.totalAmount)}</span></td>
																		<td>
																			<span className="text-success font-w600">{formatINR(row.totalPaid)}</span>
																			<div className="progress mt-1" style={{ height: "4px", width: "80px" }}>
																				<div className="progress-bar bg-success" style={{ width: `${paidPct}%` }}></div>
																			</div>
																		</td>
																		<td><span className="text-warning font-w600">{formatINR(row.pendingAmount)}</span></td>
																		<td>
																			{row.rejectedAmount > 0
																				? <span className="text-danger font-w600">{formatINR(row.rejectedAmount)}</span>
																				: <span className="badge badge-success light border-0">None</span>
																			}
																		</td>
																	</tr>
																);
															})
														)}
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


				{/* Active Projects — Timeline style */}
				<div className="col-xl-3">
					<div className="card">
						<div className="card-header">
							<h4 className="mb-0">Active Projects</h4>
							<span className="badge badge-primary light ms-auto">{availableProjects.length} Projects</span>
						</div>
						<div className="card-body">
							<div className="widget-timeline-status">
								<ul className="timeline">
									{availableProjects.length === 0 ? (
										<li className="text-muted text-center py-3">No projects available</li>
									) : (
										availableProjects.map((p, idx) => {
											const badgeColors = [
												"border-primary",
												"border-success",
												"border-warning",
												"border-info",
												"border-danger",
												"border-dark",
											];
											const color = badgeColors[idx % badgeColors.length];
											return (
												<li key={p.project_id}>
													<span className="timeline-status">{idx + 1}</span>
													<div className={`timeline-badge ${color}`}></div>
													<div className="timeline-panel">
														<span className="text-black fs-14 fw-semibold">{p.project_name}</span>
													</div>
												</li>
											);
										})
									)}
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* ── ROW 4: PROJECT-WISE TABLE ── */}
			<div className="row">
				<div className="col-xl-12">
					<div className="card">
						<div className="card-header flex-wrap">
							<h5 className="mb-0">Project-wise Expense Summary</h5>
							<span className="badge badge-sm badge-primary light">FY {selectedFY}</span>
						</div>
						<div className="card-body pb-2">
							<div className="table-responsive">
								<table className="table transaction-tbl ItemsCheckboxSec no-footer mb-0">
									<thead className="border-self">
										<tr>
											<th>Project</th>
											<th>Requests</th>
											<th>Total Amount</th>
											<th>Approved</th>
											<th>Paid</th>
											<th>Pending</th>
											<th>Rejected</th>
										</tr>
									</thead>
									<tbody>
										{projectWiseData.map((row, i) => (
											<tr key={i}>
												<td><span className="font-w600">{row.project_name}</span></td>
												<td><span>{row.totalRequests}</span></td>
												<td><span className="font-w700">{formatINR(row.totalAmount)}</span></td>
												<td><span className="text-info">{formatINR(row.approvedAmount)}</span></td>
												<td><span className="text-success">{formatINR(row.totalPaid)}</span></td>
												<td><span className="text-warning">{formatINR(row.pendingAmount)}</span></td>
												<td><span className="text-danger">{formatINR(row.rejectedAmount)}</span></td>
											</tr>
										))}
										{projectWiseData.length === 0 && (
											<tr>
												<td colSpan={7} className="text-center text-muted py-3">No data available.</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* ── ROW 5: USER-WISE BAR CHART ── */}
			<div className="row">
				<div className="col-xl-12">
					<div className="card">
						<div className="card-header border-0 pb-0">
							<h5 className="mb-0">User-wise Summary</h5>
							<span className="badge badge-info light">FY {selectedFY}</span>
						</div>
						<div className="card-body">
							{userWiseSummary.length > 0 ? (
								<UserBarChart data={userWiseSummary} />
							) : (
								<p className="text-muted text-center py-3">No user data available.</p>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* ── ROW 6: INTERVENTION-WISE SUMMARY ── */}
			<div className="row">
				<div className="col-xl-12">
					<div className="card">
						<div className="card-header border-0 pb-0">
							<h5 className="mb-0">Intervention-wise Summary</h5>
							<span className="badge badge-primary light">FY {selectedFY}</span>
						</div>
						<div className="card-body pb-2">
							<div className="table-responsive">
								<table className="table transaction-tbl mb-0">
									<thead className="border-self">
										<tr>
											<th>Intervention</th>
											<th>Requests</th>
											<th>Total Amount</th>
											<th>Approved</th>
											<th>Paid</th>
											<th>Pending</th>
										</tr>
									</thead>
									<tbody>
										{interventionWiseData.map((row, i) => (
											<tr key={i}>
												<td>
													<span className="font-w600">
														{row.intervention_name ?? <em className="text-muted">Unassigned</em>}
													</span>
												</td>
												<td><span>{row.totalRequests}</span></td>
												<td><span className="font-w700">{formatINR(row.totalAmount)}</span></td>
												<td><span className="text-info">{formatINR(row.approvedAmount)}</span></td>
												<td><span className="text-success">{formatINR(row.totalPaid)}</span></td>
												<td><span className="text-warning">{formatINR(row.pendingAmount)}</span></td>
											</tr>
										))}
										{interventionWiseData.length === 0 && (
											<tr>
												<td colSpan={6} className="text-center text-muted py-3">No data available.</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default ManagerDashboard;