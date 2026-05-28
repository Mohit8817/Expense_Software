import React, { useState, useEffect, useRef } from "react";
import { Col, Card, Table, Button, Modal } from "react-bootstrap";
import PageTitle from "../../layouts/PageTitle";
import TableExportActions from "../../components/Common/TableExportActions";
import Pagination from "../../components/Common/Pagination";
import { useSearchFilter, SearchInput } from "../../components/Common/useSearchFilter";
import UserDetailReport from "./UserDetailReport"; // adjust path if needed

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

  // ── Date state — persists until explicit Reset ──────────────────────────────
  const [fromDate, setFromDate]       = useState("");
  const [toDate, setToDate]           = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo]     = useState("");
  const [dateError, setDateError]     = useState("");

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [showModal, setShowModal]       = useState(false);
  const [selectedRow, setSelectedRow]   = useState(null);

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
    keys: ["Name", "user_email", "user_phone", "approvedAmount", "totalPaid"],
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
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
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
    // NOTE: We do NOT clear fromDate/toDate here intentionally
    // Dates persist across FY changes — only Reset clears them
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

  // ── Reset clears dates completely ────────────────────────────────────────────
  const handleReset = () => {
    setFromDate("");
    setToDate("");
    setAppliedFrom("");
    setAppliedTo("");
    setDateError("");
    fetchData("", "", selectedFY);
  };

  // ── Date validation — dates stick even if there's an error ──────────────────
  const validateAndSetFrom = (val) => {
    setFromDate(val); // always save the value
    if (!val) { setDateError(""); return; }
    if (toDate && val > toDate) {
      setDateError("From date cannot be after To date.");
      return;
    }
    setDateError("");
  };

  const validateAndSetTo = (val) => {
    setToDate(val); // always save the value
    if (!val) { setDateError(""); return; }
    if (val > calendarMax) {
      setDateError("To date cannot be a future date.");
      return;
    }
    if (fromDate && val < fromDate) {
      setDateError("To date cannot be before From date.");
      return;
    }
    setDateError("");
  };

  const isFilterDisabled = (!fromDate && !toDate) || !!dateError;

  const formatAmount = (val) =>
    val !== undefined && val !== null ? Number(val).toLocaleString("en-IN") : "0";

  // ── Open modal with selected row data ────────────────────────────────────────
  const handleRowClick = (row) => {
    setSelectedRow(row);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRow(null);
  };

  const exportColumns = [
    { label: "Name",            key: "Name"           },
    { label: "Email",           key: "user_email"     },
    { label: "Phone",           key: "user_phone"     },
    { label: "Approved Amount", key: "approvedAmount" },
    { label: "Total Paid",      key: "totalPaid"      },
  ];

  const exportData = rows.map((row) => ({
    Name:           row.Name            || "N/A",
    user_email:     row.user_email      || "N/A",
    user_phone:     row.user_phone      || "N/A",
    approvedAmount: row.approvedAmount  ?? 0,
    totalPaid:      row.totalPaid       ?? 0,
  }));

  // ── Build modal URL params (same as what navigate used to send) ──────────────
  const getModalParams = (row) => {
    const params = new URLSearchParams();
    if (row) {
      params.set("user_id", row.id);
      const fyToSend =
        selectedFY && selectedFY !== "0" && selectedFY !== "all"
          ? selectedFY
          : fyOptions[0] || "";
      if (fyToSend)    params.set("fy_year",   fyToSend);
      if (appliedFrom) params.set("from_date", appliedFrom);
      if (appliedTo)   params.set("to_date",   appliedTo);
      if (row.Name)       params.set("name",  row.Name);
      if (row.user_email) params.set("email", row.user_email);
      if (row.user_phone) params.set("phone", row.user_phone);
    }
    return params.toString();
  };

  return (
    <>
      <PageTitle activeMenu="Userwise Paid Expense Report" motherMenu="Reports" />

      <Col lg={12}>
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">

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

              {/* From date — no key prop so value is NOT reset on FY change */}
              <input
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
                <Table responsive className="text-nowrap">
                  <thead>
                    <tr>
                      <th>Sno</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Approved Amount (₹)</th>
                      <th>Total Paid (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((row, index) => (
                        <tr
                          key={row.user_id ?? index}
                          onClick={() => handleRowClick(row)}
                          style={{ cursor: "pointer" }}
                          className="table-row-hover"
                          title={`View details for ${row.Name}`}
                        >
                          <td>{indexOfFirst + index + 1}</td>
                          <td>
                            <span className="fw-semibold">{row.Name || "N/A"}</span>
                          </td>
                          <td>{row.user_email || "N/A"}</td>
                          <td>{row.user_phone || "N/A"}</td>
                          <td className="fw-bold">{formatAmount(row.approvedAmount)}</td>
                          <td className="fw-bold text-success">{formatAmount(row.totalPaid)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center">No Data Found</td>
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

      {/* ── User Detail Modal ─────────────────────────────────────────────────── */}
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        size="xl"
        centered
        scrollable
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedRow?.Name ? `${selectedRow.Name} — Expense Detail` : "User Expense Detail"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ minHeight: "70vh", padding: "1rem" }}>
          {selectedRow && (
            <UserDetailReport
              /* Pass data as props so detail component works in modal mode */
              modalMode
              modalParams={getModalParams(selectedRow)}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UserExpenseReports;