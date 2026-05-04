import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Dropdown, Nav, Tab } from "react-bootstrap";
import { SVGICON } from "../../../constant/theme";
import { BsCheckCircle, BsXCircle } from "react-icons/bs";
import ReactApexChart from "react-apexcharts";
import SkyGreeting from "../../../components/Common/SkyGreeting";
import InvoiceChart, { EarningsChart } from "./UserWidgets";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveStatus(exp) {
  if (exp.payment_status === 2) return "Paid";
  if (exp.approval_status === 2) return "Rejected";
  if (exp.approval_status === 1) return "Approved";
  if (exp.reviewer_status === 1) return "Under Review";
  return "Pending";
}

const STATUS_BADGE_CLASS = {
  Paid: "badge badge-success light border-0",
  Approved: "badge badge-info light border-0",
  "Under Review": "badge badge-warning light border-0",
  Pending: "badge badge-warning light border-0",
  Rejected: "badge badge-danger light border-0",
};

function formatINR(amount) {
  return Number(amount || 0).toLocaleString("en-IN");
}

function formatDate(dateStr) {
  if (!dateStr || typeof dateStr === "object") return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// FY months in Indian financial-year order (Apr → Mar)
const FY_MONTH_ORDER = [
  "Apr", "May", "Jun", "Jul", "Aug", "Sep",
  "Oct", "Nov", "Dec", "Jan", "Feb", "Mar",
];

// month_number → short name
const MONTH_NUM_TO_SHORT = {
  1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr",
  5: "May", 6: "Jun", 7: "Jul", 8: "Aug",
  9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec",
};

function buildMonthlyChartDataFromAPI(yearlyMonthlyPaidData, selectedFY) {
  const monthMap = {};

  // initialize all months
  FY_MONTH_ORDER.forEach((m) => {
    monthMap[m] = { total: 0, paid: 0, approved: 0, pending: 0 };
  });

  if (!yearlyMonthlyPaidData?.length) {
    return {
      categories: FY_MONTH_ORDER,
      total: FY_MONTH_ORDER.map(() => 0),
      paid: FY_MONTH_ORDER.map(() => 0),
      approved: FY_MONTH_ORDER.map(() => 0),
      pending: FY_MONTH_ORDER.map(() => 0),
    };
  }

  yearlyMonthlyPaidData.forEach((item) => {
    const isFYMatch =
      !selectedFY ||
      selectedFY === "0" ||
      selectedFY === "all" ||
      item.fy_year === selectedFY;

    if (!isFYMatch) return;

    const shortName = MONTH_NUM_TO_SHORT[item.month_number];
    if (!shortName || !monthMap[shortName]) return;

    monthMap[shortName].total += Number(item.totalAmount || 0);
    monthMap[shortName].paid += Number(item.totalPaid || 0);
    monthMap[shortName].approved += Number(item.approvedAmount || 0);
    monthMap[shortName].pending += Number(item.pendingAmount || 0);
  });

  return {
    categories: FY_MONTH_ORDER,
    total: FY_MONTH_ORDER.map((m) => monthMap[m].total),
    paid: FY_MONTH_ORDER.map((m) => monthMap[m].paid),
    approved: FY_MONTH_ORDER.map((m) => monthMap[m].approved),
    pending: FY_MONTH_ORDER.map((m) => monthMap[m].pending),
  };
}

//  project chart unchanged
function buildProjectChartData(projectWiseData) {
  return {
    labels: projectWiseData.map((p) => p.project_name ?? "Unknown"),
    totalAmount: projectWiseData.map((p) => Number(p.totalAmount) || 0),
    approvedAmount: projectWiseData.map((p) => Number(p.approvedAmount) || 0),
    pendingAmount: projectWiseData.map((p) => Number(p.pendingAmount) || 0),
    paidAmount: projectWiseData.map((p) => Number(p.totalPaid) || 0),
  };
}

//  Monthly area chart unchanged
function MonthlyTrendChart({ data }) {
  if (!data?.categories?.length ||
    (data.total.every((v) => v === 0) && data.paid.every((v) => v === 0))) {
    return <p className="text-center text-muted py-4">No monthly expense data available.</p>;
  }

  const options = {
    chart: { type: "area", toolbar: { show: false }, zoom: { enabled: false }, fontFamily: "inherit" },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: [2, 2, 2] },
    colors: ["#6571ff", "#38c4f3", "#10b981", "#f59e0b"],
    fill: {
      type: "gradient",
      gradient: { shadeIntensity: 1, opacityFrom: 0.22, opacityTo: 0.01, stops: [0, 95, 100] },
    },
    xaxis: {
      categories: data.categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { fontSize: "11px", colors: "#999" } },
    },
    yaxis: {
      labels: {
        style: { fontSize: "11px", colors: "#999" },
        formatter: (val) =>
          val >= 100000 ? `₹${(val / 100000).toFixed(1)}L`
            : val >= 1000 ? `₹${(val / 1000).toFixed(0)}k`
              : `₹${val}`,
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: { formatter: (val) => `₹ ${Number(val || 0).toLocaleString("en-IN")}` },
    },
    legend: { show: false },
    grid: { borderColor: "rgba(0,0,0,0.06)", strokeDashArray: 0 },
    markers: {
      size: data.categories.map((_, i) => (data.total[i] > 0 ? 4 : 0)),
      strokeWidth: 0,
      hover: { size: 6 },
    },
  };

  const series = [
    { name: "Total expense", data: data.total },
    { name: "Approved", data: data.approved },
    { name: "Paid", data: data.paid },
    { name: "Pending", data: data.pending },
  ];

  return <ReactApexChart options={options} series={series} type="area" height={260} />;
}

//  Project bar chart unchanged
function ProjectBarChart({ data }) {
  if (!data?.labels?.length) {
    return <p className="text-center text-muted py-4">No project data available.</p>;
  }

  const options = {
    chart: { type: "bar", toolbar: { show: false } },
    plotOptions: { bar: { horizontal: false, columnWidth: "50%", borderRadius: 4 } },
    dataLabels: { enabled: false },
    colors: ["#6571ff", "#22c55e", "#f59e0b"],
    xaxis: { categories: data.labels },
    yaxis: { labels: { formatter: (val) => `₹${(val / 1000).toFixed(0)}k` } },
    tooltip: { y: { formatter: (val) => `₹ ${formatINR(val)}` } },
    legend: { position: "top" },
    grid: { borderColor: "#f1f1f1" },
  };

  const series = [
    { name: "Total Amount", data: data.totalAmount },
    { name: "Paid", data: data.paidAmount },
    { name: "Pending", data: data.pendingAmount },
  ];

  return (
    <ReactApexChart options={options} series={series} type="bar" height={300} />
  );
}

//  FY helper unchanged
const getCurrentFY = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const fyStart = month >= 4 ? year : year - 1;
  return `${fyStart}-${fyStart + 1}`;
};

//  Main component – fixed: use allExpenses for monthly chart, fixed
function UserCommanSection() {
  const [selectedFY, setSelectedFY] = useState(() => getCurrentFY());
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [availableFYList, setAvailableFYList] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [interventionWiseData, setInterventionWiseData] = useState([]);

  const [submitMsg, setSubmitMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    totalExpense: 0,
    paidAmount: 0,
    pendingAmount: 0,
    rejectedAmount: 0,
    approvedAmount: 0,
  });

  const [allExpenses, setAllExpenses] = useState([]);
  const [projectWiseData, setProjectWiseData] = useState([]);
  const [yearlyMonthlyPaidData, setYearlyMonthlyPaidData] = useState([]);

  const isFirstLoad = useRef(true);

  //  fetchDashboard 
  const fetchDashboard = async (fy, projectId) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("fy_year", fy && fy !== "0" ? fy : "0");
      if (projectId) params.set("project_id", projectId);

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}dashboard/user-dashboard?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();

      if (json.success && json.data) {
        const d = json.data;

        const fyList = d.filterOptions?.availableFYList ?? [];
        const projects = d.filterOptions?.availableProjects ?? [];

        if (fyList.length) {
          setAvailableFYList(fyList.map((item) => item.fy_year).filter(Boolean));
        }
        if (projects.length) {
          setAvailableProjects(projects);
        }

        // if (isFirstLoad.current) {
        //   isFirstLoad.current = false;
        //   const currentFY = getCurrentFY();
        //   const currentExists = fyList.some((f) => f.fy_year === currentFY);
        //   if (!currentExists && fyList.length > 0) {
        //     setSelectedFY(fyList[fyList.length - 1].fy_year);
        //     return;
        //   }
        // }

        if (isFirstLoad.current) {
          isFirstLoad.current = false;
          const currentFY = getCurrentFY();
          const currentExists = fyList.some((f) => f.fy_year === currentFY);
          if (!currentExists && fyList.length > 0) {
            // Current FY ka data nahi hai, to current - 1 try karo
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const fyStart = month >= 4 ? year : year - 1;
            const prevFY = `${fyStart - 1}-${fyStart}`;
            const prevExists = fyList.some((f) => f.fy_year === prevFY);
            setSelectedFY(prevExists ? prevFY : fyList[fyList.length - 1].fy_year);
            return;
          }
        }

        setStats({
          totalExpense: d.totalExpense ?? 0,
          paidAmount: d.paidAmount ?? 0,
          pendingAmount: d.pendingAmount ?? 0,
          rejectedAmount: d.rejectedAmount ?? 0,
          approvedAmount: d.approvedAmount ?? 0,
        });
        setAllExpenses(d.AllExpenseData ?? []);
        setProjectWiseData(d.projectWiseData ?? []);
        setYearlyMonthlyPaidData(d.yearlyMonthlyPaidData ?? []);
        setInterventionWiseData(d.interventionWiseData ?? []);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(selectedFY, selectedProjectId);
  }, [selectedFY, selectedProjectId]);

  //  expensesWithStatus
  const expensesWithStatus = useMemo(
    () => allExpenses.map((e) => ({ ...e, _status: deriveStatus(e) })),
    [allExpenses]
  );

  const countByStatus = (status) =>
    expensesWithStatus.filter((e) => e._status === status).length;

  // const monthlyChartData = useMemo(
  //   () => buildMonthlyChartDataFromAPI(yearlyMonthlyPaidData, selectedFY),
  //   [yearlyMonthlyPaidData, selectedFY]
  // );


  const monthlyChartData = useMemo(
    () => buildMonthlyChartDataFromAPI(yearlyMonthlyPaidData, selectedFY),
    [yearlyMonthlyPaidData, selectedFY]
  );


  const chartTotals = useMemo(() => ({
    total: monthlyChartData.total.reduce((a, b) => a + b, 0),
    approved: monthlyChartData.approved.reduce((a, b) => a + b, 0),
    paid: monthlyChartData.paid.reduce((a, b) => a + b, 0),
    pending: monthlyChartData.pending.reduce((a, b) => a + b, 0),
  }), [monthlyChartData]);

  const projectChartData = useMemo(
    () => buildProjectChartData(projectWiseData),
    [projectWiseData]
  );

  //  filterLabel
  const selectedProjectLabel = selectedProjectId
    ? (availableProjects.find(
      (p) => String(p.project_id) === String(selectedProjectId)
    )?.project_name ?? "Project")
    : "All Projects";

  const filterLabel =
    selectedFY && selectedFY !== "0" && selectedFY !== "all"
      ? `${selectedProjectLabel} — FY ${selectedFY}`
      : `${selectedProjectLabel} — All Years`;

  //  intervention donut
  const interventionDonutSeries = interventionWiseData.map((i) => Number(i.totalAmount) || 0);
  const interventionDonutLabels = interventionWiseData.map((i) => i.intervention_name ?? "Unknown");
  const hasInterventionData = interventionDonutSeries.some((v) => v > 0);

  const interventionDonutOptions = {
    chart: { type: "donut" },
    labels: interventionDonutLabels,
    colors: ["#6571ff", "#22c55e", "#f59e0b", "#ff5f5f", "#06b6d4", "#8b5cf6", "#ec4899"],
    legend: { position: "bottom" },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: "13px",
      },
      formatter: (val, opts) => {
        const value = opts.w.config.series[opts.seriesIndex];
        return `₹ ${formatINR(value)}`;
      }
    },

    tooltip: {
      y: { formatter: (val) => `₹ ${formatINR(val)}` }
    },

    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,

            total: {
              show: true,
              label: "Total",
              fontWeight: 400,
              formatter: () =>
                `₹ ${formatINR(
                  interventionDonutSeries.reduce((a, b) => a + b, 0)
                )}`
            }
          }
        }
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
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
                  <option value="">All Projects</option>
                  {availableProjects.map((p) => (
                    <option key={p.project_id} value={String(p.project_id)}>
                      {p.project_name}
                    </option>
                  ))}
                </select>

                <select
                  className="form-select flex-fill"
                  value={selectedFY}
                  onChange={(e) => setSelectedFY(e.target.value)}
                >
                  {availableFYList
                    .filter((fy) => fy)
                    .map((fy) => (
                      <option key={fy} value={fy}>
                        FY {fy}
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

      {/* ── Alerts ── */}
      {submitMsg && (
        <div className="alert alert-success alert-dismissible fade show mb-3" role="alert">
          <BsCheckCircle className="me-2" /> {submitMsg}
          <button type="button" className="btn-close" onClick={() => setSubmitMsg("")} />
        </div>
      )}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">
          <BsXCircle className="me-2" /> {error}
          <button type="button" className="btn-close" onClick={() => setError("")} />
        </div>
      )}

      {/* ── ROW 1: Stat Cards ── */}
      <div className="row">

        {/* Card 1: Total Expense */}
        <div className="col-xl-3 col-sm-6">
          <div className="card">
            <div className="card-header border-0 pb-0">
              <h6 className="mb-0">Total Expense Raised</h6>
            </div>
            <div className="card-body pt-2">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h2 className="card-title">
                    ₹ {formatINR(stats.totalExpense)}
                  </h2>


                  <small className="text-muted">{filterLabel}</small>
                </div>


                <InvoiceChart data={monthlyChartData.total} color="#6571ff" />
              </div>
              <small> UnApproved
                <span className="fw-bold text-warning" > ₹ {formatINR(stats.totalExpense - stats.approvedAmount)}</span>
              </small>
            </div>
          </div>
        </div>



        {/* Card 2: Paid */}
        <div className="col-xl-3 col-sm-6">
          <div className="card">
            <div className="card-header border-0 pb-0">
              <h6 className="mb-0">Paid Amount</h6>
            </div>
            <div className="card-body pt-2">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  {loading
                    ? <div className="placeholder-glow"><span className="placeholder col-8" style={{ height: 36 }} /></div>
                    : <h2 className="card-title text-success">₹ {formatINR(stats.paidAmount)}</h2>
                  }
                  <span>
                    <small className="text-success font-w600 me-1">{countByStatus("Paid")} expenses</small>paid
                  </span>
                  <div className="mt-1">
                    <small className="text-muted">
                      Approved: <span className="text-info fw-bold">₹ {formatINR(stats.approvedAmount)}</span>
                    </small>
                  </div>
                </div>
                <EarningsChart data={monthlyChartData.paid} color="#22c55e" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Pending */}
        <div className="col-xl-3 col-sm-6">
          <div className="card">
            <div className="card-header border-0 pb-0">
              <h6 className="mb-0">Pending Amount</h6>
            </div>
            <div className="card-body pt-2">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  {loading
                    ? <div className="placeholder-glow"><span className="placeholder col-8" style={{ height: 36 }} /></div>
                    : <h2 className="card-title text-warning">₹ {formatINR(stats.pendingAmount)}</h2>
                  }
                  <span>
                    <small className="text-warning font-w600 me-1">{countByStatus("Pending")} expenses</small>awaiting
                  </span>
                </div>
                <EarningsChart data={monthlyChartData.pending} color="#f59e0b" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Rejected */}
        <div className="col-xl-3 col-sm-6">
          <div className="card">
            <div className="card-header border-0 pb-0">
              <h6 className="mb-0">Rejected</h6>
            </div>
            <div className="card-body pt-2">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  {loading
                    ? <div className="placeholder-glow"><span className="placeholder col-8" style={{ height: 36 }} /></div>
                    : <h2 className="card-title text-danger">₹ {formatINR(stats.rejectedAmount)}</h2>
                  }
                  <span>
                    <small className="text-danger font-w600 me-1">{countByStatus("Rejected")} expenses</small>rejected
                  </span>
                </div>



              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 2: Monthly Trend + Intervention Donut ── */}
      <div className="row">

        <div className="col-xl-8">
          <div className="card">
            <div className="card-header d-flex align-items-start justify-content-between flex-wrap gap-2">
              <div>
                <h4 className="mb-1">Monthly Expense Trend</h4>
                <small className="text-muted">Based on requested date</small>
              </div>
              <span className="badge badge-sm badge-info light">{filterLabel}</span>
            </div>

            {/* ── Stat pills row ── */}
            <div className="px-4 py-2 border-bottom d-flex gap-3 flex-wrap" style={{ fontSize: 12 }}>
              {[
                { label: "Total", val: chartTotals.total, color: "#6571ff" },
                { label: "Approved", val: chartTotals.approved, color: "#38c4f3" },
                { label: "Paid", val: chartTotals.paid, color: "#22c55e" },
                { label: "Pending", val: chartTotals.pending, color: "#f59e0b" },
              ].map(({ label, val, color }) => (
                <div key={label} className="d-flex align-items-center gap-1">
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
                  <span className="text-muted me-1">{label}</span>
                  <span className="fw-bold" style={{ color }}>₹ {formatINR(val)}</span>
                </div>
              ))}
            </div>

            <div className="card-body pt-2">
              <MonthlyTrendChart data={monthlyChartData} />

            </div>
          </div>
        </div>

        {/* Intervention Breakdown Donut */}
        <div className="col-xl-4">
          <div className="card">
            <div className="card-header">
              <div>
                <h4 className="mb-0">Intervention Breakdown</h4>
                <small className="text-muted">
                  <span className="badge badge-info light">{filterLabel}</span>
                </small>
              </div>
            </div>
            <div className="card-body">
              {hasInterventionData ? (
                <ReactApexChart
                  options={interventionDonutOptions}
                  series={interventionDonutSeries}
                  type="donut"
                  height={350}
                />
              ) : (
                <p className="text-center text-muted py-4">
                  No intervention data available.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 3: Project Wise Bar Chart ── */}
      {projectWiseData.length > 0 && (
        <div className="row">
          <div className="col-xl-12">
            <div className="card">
              <div className="card-header border-0 pb-0">
                <h4 className="mb-0">Project Wise Expense</h4>
                <span className="badge badge-sm badge-info light ms-2">{filterLabel}</span>
              </div>
              <div className="card-body">
                {loading
                  ? <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>
                  : <ProjectBarChart data={projectChartData} />
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ROW 4: Expense Table with Tabs ── */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header border-0 pb-0">
              <h4 className="mb-0">My Expense</h4>
              <span className="badge badge-sm badge-info light ms-2">{filterLabel}</span>
            </div>
            <div className="card-body px-0">
              <Tab.Container defaultActiveKey="table">
                <Nav className="nav nav-pills success-tab">
                  <Nav.Item>
                    <Nav.Link eventKey="table" className="nav-link w-100">
                      {SVGICON.scale} <span>All Expenses</span>
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="project" className="nav-link w-100">
                      {SVGICON.project} <span>Project Wise</span>
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="status" className="nav-link w-100">
                      {SVGICON.mobile} <span>Payment Status</span>
                    </Nav.Link>
                  </Nav.Item>
                </Nav>

                <Tab.Content>
                  {/* ALL EXPENSES TAB */}
                  <Tab.Pane eventKey="table">
                    <div className="table-responsive">
                      <table className="table card-table border-no success-tbl">
                        <thead>
                          <tr>
                            <th>S no</th>
                            <th>Project</th>
                            <th>State / District</th>
                            <th>Requested Date</th>
                            <th>Amount</th>
                            <th>Approved Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expensesWithStatus.length === 0 ? (
                            <tr><td colSpan={7}>No expenses found.</td></tr>
                          ) : (
                            expensesWithStatus.map((exp, i) => (
                              <tr key={exp.id ?? i}>
                                <td>{i + 1}</td>
                                <td>
                                  <h6 className="mb-0">{exp.project_name}</h6>
                                  <span className="fs-13 text-muted">{exp.created_by}</span>
                                </td>
                                <td>
                                  {exp.project_state}
                                  <br />
                                  <small className="text-muted">{exp.project_district}</small>
                                </td>
                                <td>{formatDate(exp.requested_date)}</td>
                                <td className="fw-bold text-primary">₹ {formatINR(exp.amount)}</td>
                                <td className="fw-bold text-success">
                                  {exp.approved_amount != null
                                    ? `₹ ${formatINR(exp.final_approved_amount)}`
                                    : <span className="text-muted">—</span>}
                                </td>
                                {/* Manager Approval column */}
                                <td>
                                  <span className={
                                    exp.approval_status === 2 ? "badge badge-danger light border-0"
                                      : exp.approval_status === 1 ? "badge badge-success light border-0"
                                        : "badge badge-warning light border-0"
                                  }>
                                    {exp.approval_status === 2 ? "Rejected"
                                      : exp.approval_status === 1 ? "Approved"
                                        : "Pending"}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Tab.Pane>

                  {/* PROJECT WISE TAB */}
                  <Tab.Pane eventKey="project">
                    <div className="table-responsive">
                      <table className="table card-table border-no success-tbl">
                        <thead>
                          <tr>
                            <th>Project Name</th>
                            <th>Total Amount</th>
                            <th>Paid</th>
                            <th>Pending</th>
                            <th>Rejected</th>
                            <th>Approved</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr><td colSpan={6} className="text-center py-4">
                              <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                              Loading...
                            </td></tr>
                          ) : projectWiseData.length === 0 ? (
                            <tr><td colSpan={6} className="text-center text-muted py-4">No project data available.</td></tr>
                          ) : (
                            projectWiseData.map((p, i) => (
                              <tr key={i}>
                                <td><h6 className="mb-0">{p.project_name ?? "—"}</h6></td>
                                <td className="fw-bold text-primary">₹ {formatINR(p.totalAmount)}</td>
                                <td className="text-success fw-bold">₹ {formatINR(p.totalPaid)}</td>
                                <td className="text-warning fw-bold">₹ {formatINR(p.pendingAmount)}</td>
                                <td className="text-danger fw-bold">₹ {formatINR(p.rejectedAmount)}</td>
                                <td className="text-info fw-bold">₹ {formatINR(p.approvedAmount)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Tab.Pane>

                  {/* PAYMENT STATUS TAB */}
                  <Tab.Pane eventKey="status">
                    <div className="table-responsive">
                      <table className="table card-table border-no success-tbl">
                        <thead>
                          <tr>
                            <th>Project</th>
                            <th>Requested Date</th>
                            <th>Amount</th>
                            <th>Manager Approval</th>
                            <th>Reviewer</th>
                            <th>Payment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr><td colSpan={6} className="text-center py-4">
                              <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                              Loading...
                            </td></tr>
                          ) : expensesWithStatus.length === 0 ? (
                            <tr><td colSpan={6} className="text-center text-muted py-4">No payment data available.</td></tr>
                          ) : (
                            expensesWithStatus.map((exp, i) => (
                              <tr key={exp.id ?? i}>
                                <td><h6 className="mb-0">{exp.project_name}</h6></td>
                                <td>{formatDate(exp.requested_date)}</td>
                                <td className="fw-bold text-primary">₹ {formatINR(exp.amount)}</td>


                                <td>
                                  <span className={
                                    exp.approval_status === 2 ? "badge badge-danger light border-0"
                                      : exp.approval_status === 1 ? "badge badge-success light border-0"
                                        : "badge badge-warning light border-0"
                                  }>
                                    {exp.approval_status === 2 ? "Rejected"
                                      : exp.approval_status === 1 ? "Approved"
                                        : "Pending"}
                                  </span>
                                </td>
                                <td>
                                  <span className={exp.reviewer_status ? "badge badge-success light border-0" : "badge badge-secondary light border-0"}>
                                    {exp.reviewer_status ? "Reviewed" : "Not Reviewed"}
                                  </span>
                                </td>
                                <td>
                                  <span className={exp.payment_status > 0 ? "badge badge-success light border-0" : "badge badge-warning light border-0"}>
                                    {exp.payment_status > 0 ? "Paid" : "Unpaid"}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Tab.Pane>

                </Tab.Content>
              </Tab.Container>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default UserCommanSection;