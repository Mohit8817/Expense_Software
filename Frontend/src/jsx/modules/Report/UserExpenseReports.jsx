import React, { useState, useEffect } from "react";
import { Col, Card, Table, Button } from "react-bootstrap";
import PageTitle from "../../layouts/PageTitle";
import TableExportActions from "../../components/Common/TableExportActions";
import Pagination from "../../components/Common/Pagination";
import { useSearchFilter, SearchInput } from "../../components/Common/useSearchFilter";

// ─── FY Helpers ────────────────────────────────────────────────────────────────

const getFYDateRange = (fy) => {
  if (!fy || fy === "0") return { fyStart: "", fyEnd: "" };
  const startYear = parseInt(fy.split("-")[0], 10);
  return {
    fyStart: `${startYear}-04-01`,
    fyEnd:   `${startYear + 1}-03-31`,
  };
};

// ───────────────────────────────────────────────────────────────────────────────

const UserExpenseReports = () => {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const TODAY = new Date().toISOString().split("T")[0];

  const [selectedFY, setSelectedFY] = useState("");
  const [fyOptions, setFyOptions]   = useState([]);

  const [fromDate, setFromDate]       = useState("");
  const [toDate, setToDate]           = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo]     = useState("");
  const [dateError, setDateError]     = useState("");

  const { fyStart, fyEnd } = getFYDateRange(selectedFY);
  const calendarMax = fyEnd && fyEnd < TODAY ? fyEnd : TODAY;

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
      "Name",
      "user_email",
      "user_phone",
      "approvedAmount",
      "totalPaid",
      "pendingAmount",
    ],
    itemsPerPage: 1000,
  });

  useEffect(() => {
    fetchData("", "", "", { initFYOptions: true });
  }, []);

  const fetchData = async (from, to, fy, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (from) params.append("from_date", from);
      if (to)   params.append("to_date", to);
      if (fy && fy !== "0") params.append("fy_year", fy);

      const queryString = params.toString();
      const url = `${import.meta.env.VITE_BACKEND_API_URL}reports/userwise-expense-report${
        queryString ? `?${queryString}` : ""
      }`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch data");

      const json = await res.json();

      if (json.success) {
        const payload = json.data ?? {};
        const dataRows = Array.isArray(payload.rows) ? payload.rows : [];
        setRows(dataRows);
        setCurrentPage(1);

        if (
          options.initFYOptions &&
          Array.isArray(payload.availableFYList) &&
          payload.availableFYList.length > 0
        ) {
          const fyFromApi = payload.availableFYList.map((item) => item.fy_year);
          setFyOptions(fyFromApi);

          const firstFY = fyFromApi[0];
          setSelectedFY(firstFY);
          fetchData("", "", firstFY);
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
    setFromDate("");
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

  const formatAmount = (val) =>
    val !== undefined && val !== null ? Number(val).toLocaleString("en-IN") : "0";

  const exportColumns = [
    { label: "Name",             key: "Name" },
    { label: "Email",            key: "user_email" },
    { label: "Phone",            key: "user_phone" },
    { label: "Approved Amount",  key: "approvedAmount" },
    { label: "Total Paid",       key: "totalPaid" },
    { label: "Pending Amount",   key: "pendingAmount" },
  ];

  const exportData = rows.map((row) => ({
    Name:            row.Name            || "N/A",
    user_email:      row.user_email      || "N/A",
    user_phone:      row.user_phone      || "N/A",
    approvedAmount:  row.approvedAmount  ?? 0,
    totalPaid:       row.totalPaid       ?? 0,
    pendingAmount:   row.pendingAmount   ?? 0,
  }));

  return (
    <>
      <PageTitle activeMenu="Userwise Paid Expense Report" motherMenu="Reports" />

      <Col lg={12}>
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">

            {/* LEFT — Title */}
            <Card.Title className="mb-0">Userwise Paid Expense</Card.Title>

            <div className="d-flex align-items-center gap-2 flex-wrap justify-content-center">

              <select
                className="form-select"
                style={{ width: "145px" }}
                value={selectedFY}
                onChange={(e) => handleFYChange(e.target.value)}
                disabled={fyOptions.length === 0}
              >
                {fyOptions.map((fy) => (
                  <option key={fy} value={fy}>{fy}</option>
                ))}
                <option value="all">All Years</option>
              </select>

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
              <Button
                variant="primary"
                onClick={handleFilter}
                disabled={isFilterDisabled}
              >
                Filter
              </Button>
              {(appliedFrom || appliedTo) && (
                <Button variant="outline-secondary" onClick={handleReset}>
                  Reset
                </Button>
              )}

              {dateError && (
                <span className="text-danger small">{dateError}</span>
              )}
            </div>

            {/* RIGHT — Search + Export */}
            <div className="d-flex align-items-center gap-2">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search Users..."
              />
              <TableExportActions
                data={exportData}
                columns={exportColumns}
                fileName="Userwise_Paid_Expense_Report"
              />
            </div>

          </Card.Header>

          <Card.Body>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : error ? (
              <div className="text-center text-danger py-4">{error}</div>
            ) : (
              <>
                <Table responsive bordered className="text-nowrap">
                  <thead>
                    <tr>
                      <th>Sno</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Approved Amount (₹)</th>
                      <th>Total Paid (₹)</th>
                      <th>Pending Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((row, index) => (
                        <tr key={row.user_id ?? index}>
                          <td>{indexOfFirst + index + 1}</td>
                          <td>{row.Name || "N/A"}</td>
                          <td>{row.user_email || "N/A"}</td>
                          <td>{row.user_phone || "N/A"}</td>
                          <td className="fw-bold">{formatAmount(row.approvedAmount)}</td>
                          <td className="fw-bold text-success">{formatAmount(row.totalPaid)}</td>
                          <td className="fw-bold text-danger">{formatAmount(row.pendingAmount)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center">No Data Found</td>
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

export default UserExpenseReports;