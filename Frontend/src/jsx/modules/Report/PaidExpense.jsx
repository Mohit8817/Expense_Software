import React, { useState, useEffect } from "react";
import { Col, Card, Table, Button } from "react-bootstrap";
import PageTitle from "../../layouts/PageTitle";
import TableExportActions from "../../components/Common/TableExportActions";
import Pagination from "../../components/Common/Pagination";
import { useSearchFilter, SearchInput } from "../../components/Common/useSearchFilter";

// ─── FY Helpers ────────────────────────────────────────────────────────────────

/** Returns the FY string for a given date, e.g. "2025-2026" */
const getFYFromDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

/** Returns the current FY string */
const getCurrentFY = () => getFYFromDate(new Date().toISOString());

/** Returns { fyStart: "YYYY-MM-DD", fyEnd: "YYYY-MM-DD" } for a given FY string */
const getFYDateRange = (fy) => {
  const startYear = parseInt(fy.split("-")[0], 10);
  return {
    fyStart: `${startYear}-04-01`,
    fyEnd: `${startYear + 1}-03-31`,
  };
};

// ───────────────────────────────────────────────────────────────────────────────

const PaidExpense = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const TODAY = new Date().toISOString().split("T")[0];

  // FY state — default to current FY; options built from data
  const [selectedFY, setSelectedFY] = useState(getCurrentFY());
  const [fyOptions, setFyOptions] = useState([getCurrentFY()]);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [dateError, setDateError] = useState("");

  // Calendar bounds derived from the selected FY
  const { fyStart, fyEnd } = getFYDateRange(selectedFY);
  const calendarMax = fyEnd > TODAY ? TODAY : fyEnd; 

  const {
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    totalItems,
    paginatedData,
    indexOfFirst,
  } = useSearchFilter(rows, {
    keys: [
      "requested_by_name",
      "requested_by_email",
      "manager_name",
      "project_name",
      "intervention_name",
      "amount",
      "requested_date",
      "final_approved_amount",
      "updated_at",
      "paid_amount",
      "payment_date",
    ],
    itemsPerPage: 100,
  });

  // On mount — fetch all data (no FY filter) to derive available FY options from data
  useEffect(() => {
    fetchData("", "", "", { buildFYOptions: true });
  }, []);

  const buildFYOptionsFromData = (data) => {
    const currentFY = getCurrentFY();
    const currentFYStart = parseInt(currentFY.split("-")[0], 10);

    if (!data || data.length === 0) {
      setFyOptions([currentFY]);
      return;
    }

    let minYear = null;
    data.forEach((row) => {
      ["requested_date", "payment_date", "updated_at"].forEach((key) => {
        if (row[key]) {
          const d = new Date(row[key]);
          if (!isNaN(d)) {
            // Which FY does this date belong to?
            const fy = getFYFromDate(row[key]);
            const fyStartYear = parseInt(fy.split("-")[0], 10);
            if (minYear === null || fyStartYear < minYear) minYear = fyStartYear;
          }
        }
      });
    });

    if (minYear === null) {
      setFyOptions([currentFY]);
      return;
    }

    // Build descending list: currentFY → minFY
    const options = [];
    for (let y = currentFYStart; y >= minYear; y--) {
      options.push(`${y}-${y + 1}`);
    }

    setFyOptions(options.length ? options : [currentFY]);
  };

  const fetchData = async (from, to, fy, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (from) params.append("from_date", from);
      if (to) params.append("to_date", to);
      if (fy) params.append("fy_year", fy);

      const queryString = params.toString();
      const url = `${import.meta.env.VITE_BACKEND_API_URL}reports/paid-expense-report${queryString ? `?${queryString}` : ""
        }`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch data");

      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setRows(json.data);
        setCurrentPage(1);

        if (options.buildFYOptions) {
          buildFYOptionsFromData(json.data);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFYChange = (fy) => {
    setSelectedFY(fy);
    const { fyStart: newStart } = getFYDateRange(fy);
    setFromDate(newStart);
    setToDate("");
    setAppliedFrom("");
    setAppliedTo("");
    setDateError("");
    fetchData("", "", fy);
  };

  const handleFilter = () => {
    setAppliedFrom(fromDate);
    setAppliedTo(toDate);
    fetchData(fromDate, toDate, selectedFY);
  };

  const handleReset = () => {
    setFromDate("");
    setToDate("");
    setAppliedFrom("");
    setAppliedTo("");
    setDateError("");
    fetchData("", "", selectedFY);
  };

  const validateAndSetFrom = (val) => {
    if (!val) { setFromDate(""); setDateError(""); return; }
    if (toDate && val > toDate) {
      setDateError("From date cannot be after To date.");
      setFromDate(val);
      return;
    }
    setFromDate(val);
    setDateError("");
  };

  const validateAndSetTo = (val) => {
    if (!val) { setToDate(""); setDateError(""); return; }
    if (val > calendarMax) {
      setDateError("To date cannot be a future date.");
      setToDate(val);
      return;
    }
    if (fromDate && val < fromDate) {
      setDateError("To date cannot be before From date.");
      setToDate(val);
      return;
    }
    setToDate(val);
    setDateError("");
  };

  const isFilterDisabled = (!fromDate && !toDate) || !!dateError;

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const exportColumns = [
    { label: "Name", key: "requested_by_name" },
    { label: "Email", key: "requested_by_email" },
    { label: "Manager", key: "manager_name" },
    { label: "Project", key: "project_name" },
    { label: "Intervention", key: "intervention_name" },
    { label: "Request Amount", key: "amount" },
    { label: "Request Date", key: "requested_date" },
    { label: "Final Approved Amount", key: "final_approved_amount" },
    { label: "Final Approve Date", key: "updated_at" },
    { label: "Paid Amount", key: "paid_amount" },
    { label: "Paid Date", key: "payment_date" },
  ];

  const exportData = rows.map((row) => ({
    requested_by_name: row.requested_by_name || "N/A",
    requested_by_email: row.requested_by_email || "N/A",
    manager_name: row.manager_name || "N/A",
    project_name: row.project_name || "N/A",
    intervention_name: row.intervention_name || "N/A",
    amount: row.amount ?? 0,
    requested_date: formatDate(row.requested_date),
    final_approved_amount: row.final_approved_amount ?? 0,
    updated_at: formatDate(row.updated_at),
    paid_amount: row.paid_amount ?? 0,
    payment_date: formatDate(row.payment_date),
  }));

  return (
    <>
      <PageTitle activeMenu="Paid Expense Reports" motherMenu="Reports" />

      <Col lg={12}>
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">

            {/* LEFT — Title */}
            <Card.Title className="mb-0">Paid Expense Reports
            </Card.Title>

            {/* CENTER — FY Selector + Date Filter */}
            <div className="d-flex align-items-center gap-2 flex-wrap justify-content-center">

              {/* FY Year Select */}
              <select
                className="form-select"
                style={{ width: "145px" }}
                value={selectedFY}
                onChange={(e) => handleFYChange(e.target.value)}
              >

                {fyOptions.map((fy) => (
                  <option key={fy} value={fy}>
                    {fy}
                    
                  </option>
                ))}
                <option value="0">All Years</option>
              </select>

              {/* Date Filter */}
              <input
                key={`from-${selectedFY}`}   
                type="date"
                className="form-control"
                style={{ width: "150px" }}
                value={fromDate}
                min={fyStart}
                max={toDate || calendarMax}
                onChange={(e) => validateAndSetFrom(e.target.value)}
              />
              <span>to</span>

              <input
                key={`to-${selectedFY}`}   
                type="date"
                className="form-control"
                style={{ width: "150px" }}
                value={toDate}
                min={fromDate || fyStart}
                max={calendarMax}
                onChange={(e) => validateAndSetTo(e.target.value)}
              />

              <Button variant="primary" onClick={handleFilter} disabled={isFilterDisabled}>
                Filter
              </Button>

              {(appliedFrom || appliedTo) && (
                <Button variant="outline-secondary" onClick={handleReset}>
                  Reset
                </Button>
              )}
            </div>

            {/* RIGHT — Search + Export */}
            <div className="d-flex align-items-center gap-2">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search Paid Expenses..."
              />
              <TableExportActions
                data={exportData}
                columns={exportColumns}
                fileName="Paid_Expense_Report"
              />
            </div>

          </Card.Header>

          <Card.Body>
            {loading ? (
              <p className="text-center mt-3">Loading...</p>
            ) : error ? (
              <p className="text-center text-danger mt-3">{error}</p>
            ) : (
              <>
                <Table responsive bordered className="text-nowrap">
                  <thead>
                    <tr>
                      <th>Sno</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Manager</th>
                      <th>Project</th>
                      <th>Intervention</th>
                      <th>Request Amount</th>
                      <th>Request Date</th>
                      <th>Final Approved Amount</th>
                      <th>Final Approve Date</th>
                      <th>Paid Amount</th>
                      <th>Paid Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((row, index) => (
                        <tr key={row.id}>
                          <td>{indexOfFirst + index + 1}</td>
                          <td>{row.requested_by_name || "N/A"}</td>
                          <td>{row.requested_by_email || "N/A"}</td>
                          <td>{row.manager_name || "N/A"}</td>
                          <td>{row.project_name || "N/A"}</td>
                          <td>{row.intervention_name || "N/A"}</td>
                          <td>{row.amount ?? 0}</td>
                          <td>{formatDate(row.requested_date)}</td>
                          <td className="fw-bold">{row.final_approved_amount ?? 0}</td>
                          <td>{formatDate(row.updated_at)}</td>
                          <td className="fw-bold text-success">{row.paid_amount ?? 0}</td>
                          <td>{formatDate(row.payment_date)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={12} className="text-center">
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
              </>
            )}
          </Card.Body>
        </Card>
      </Col>
    </>
  );
};

export default PaidExpense;