/* eslint-disable react-hooks/exhaustive-deps */
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
    fyEnd: `${startYear + 1}-03-31`,
  };
};

// ───────────────────────────────────────────────────────────────────────────────

const InterventionReports = () => {
    const [rows, setRows] = useState([]);
    const [interventions, setInterventions] = useState([]);
    const [columnTotals, setColumnTotals] = useState({});
    const [grandTotal, setGrandTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedFY, setSelectedFY] = useState("current");
    const [fyOptions, setFyOptions] = useState([]);

    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

    // ─── Date filter state (same as PaidExpense) ───────────────────────────────
    const TODAY = new Date().toISOString().split("T")[0];

    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [appliedFrom, setAppliedFrom] = useState("");
    const [appliedTo, setAppliedTo] = useState("");
    const [dateError, setDateError] = useState("");

    const { fyStart, fyEnd } = getFYDateRange(selectedFY);
    const calendarMax = fyEnd && fyEnd < TODAY ? fyEnd : TODAY;
    // ──────────────────────────────────────────────────────────────────────────

    const {
        search,
        setSearch,
        currentPage,
        setCurrentPage,
        totalItems,
        paginatedData,
        indexOfFirst,
    } = useSearchFilter(rows, {
        keys: ["employee_name"],
        itemsPerPage: 100,
    });

    useEffect(() => {
        fetchData("current");
    }, []);

    const fetchData = async (fyYear, from = "", to = "") => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.append("fy_year", fyYear || "current");
            if (from) params.append("from_date", from);
            if (to) params.append("to_date", to);

            const res = await fetch(
                `${import.meta.env.VITE_BACKEND_API_URL}reports/intervention-report?${params.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            if (!res.ok) throw new Error("Failed to fetch data");

            const json = await res.json();

            if (json.success) {
                const validInterventions = (json.data.interventions || []).filter(
                    (i) => i.intervention_id !== null
                );
                setInterventions(validInterventions);
                setRows(json.data.rows || []);
                setColumnTotals(json.data.columnTotals || {});
                setGrandTotal(json.data.grandTotal || 0);

                if (json.data.availableFYList?.length > 0) {
                    setFyOptions(json.data.availableFYList.map((f) => f.fy_year));
                }

                const activeFY = json.data.activeFilters?.fy;
                if (activeFY && activeFY !== "all") {
                    setSelectedFY(activeFY);
                }

                setCurrentPage(1);
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
        fetchData(fy);
    };

    // ─── Date filter handlers (same as PaidExpense) ────────────────────────────
    const handleFilter = () => {
        setAppliedFrom(fromDate);
        setAppliedTo(toDate);
        fetchData(selectedFY, fromDate, toDate);
    };

    const handleReset = () => {
        setFromDate("");
        setToDate("");
        setAppliedFrom("");
        setAppliedTo("");
        setDateError("");
        fetchData(selectedFY);
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
    // ──────────────────────────────────────────────────────────────────────────

    const handleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
        }));
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return " ↕";
        return sortConfig.direction === "asc" ? " ↑" : " ↓";
    };

    const sortedData = [...paginatedData].sort((a, b) => {
        if (!sortConfig.key) return 0;

        let aVal, bVal;

        if (sortConfig.key === "employee_name") {
            aVal = (a.employee_name || "").toLowerCase();
            bVal = (b.employee_name || "").toLowerCase();
        } else if (sortConfig.key === "employee_email") {
            aVal = (a.employee_email || "").toLowerCase();
            bVal = (b.employee_email || "").toLowerCase();
        } else if (sortConfig.key === "row_total") {
            aVal = a.row_total ?? 0;
            bVal = b.row_total ?? 0;
        } else {
            aVal = a.interventions?.[sortConfig.key]?.total_paid ?? 0;
            bVal = b.interventions?.[sortConfig.key]?.total_paid ?? 0;
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
    });

    /* EXPORT */
    const exportColumns = [
        { label: "Employee Name", key: "employee_name" },
        { label: "Employee Email", key: "employee_email" },
        ...interventions.map((i) => ({
            label: i.intervention_name,
            key: `intervention_${i.intervention_id}`,
        })),
        { label: "Total", key: "row_total" },
    ];

    const exportData = rows.map((row) => {
        const flat = {
            employee_name: row.employee_name || "N/A",
            employee_email: row.employee_email || "N/A",
        };
        interventions.forEach((i) => {
            flat[`intervention_${i.intervention_id}`] =
                row.interventions?.[i.intervention_id]?.total_4paid ?? 0;
        });
        flat.row_total = row.row_total;
        return flat;
    });

    return (
        <>
            <PageTitle activeMenu="Intervention Reports" motherMenu="Reports" />

            <Col lg={12}>
                <Card>
                    <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">

                        {/* LEFT — Title */}
                        <Card.Title className="mb-0">Intervention Reports</Card.Title>

                        <div className="d-flex align-items-center gap-2 flex-wrap justify-content-center">
                            {/* FY Selector */}
                            <select
                                className="form-select"
                                style={{ width: "145px" }}
                                value={selectedFY}
                                onChange={(e) => handleFYChange(e.target.value)}
                                disabled={loading || fyOptions.length === 0}
                            >
                                {fyOptions.map((fy) => (
                                    <option key={fy} value={fy}>
                                        {fy}
                                    </option>
                                ))}
                                <option value="0">All Years</option>
                            </select>

                            {/* Date Range Filter (same as PaidExpense) */}
                            <>
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
                            </>

                            {dateError && (
                                <span className="text-danger small">{dateError}</span>
                            )}
                        </div>

                        {/* RIGHT — Search + Export */}
                        <div className="d-flex align-items-center gap-2">
                            <SearchInput
                                value={search}
                                onChange={setSearch}
                                placeholder="Search employees..."
                            />
                            <TableExportActions
                                data={exportData}
                                columns={exportColumns}
                                fileName="Intervention_Report"
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

                                            {/* Employee Name */}
                                            <th
                                                className="sorting c-pointer"
                                                onClick={() => handleSort("employee_name")}
                                                style={{ cursor: "pointer" }}
                                            >
                                                Employee Name{getSortIcon("employee_name")}
                                            </th>

                                            {/* Employee Email */}
                                            <th
                                                className="sorting c-pointer"
                                                onClick={() => handleSort("employee_email")}
                                                style={{ cursor: "pointer" }}
                                            >
                                                Employee Email{getSortIcon("employee_email")}
                                            </th>

                                            {/* Each Intervention Column */}
                                            {interventions.map((i) => (
                                                <th
                                                    key={i.intervention_id}
                                                    className="sorting c-pointer"
                                                    onClick={() => handleSort(i.intervention_id)}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    {i.intervention_name}{getSortIcon(i.intervention_id)}
                                                </th>
                                            ))}

                                            {/* Total */}
                                            <th
                                                className="sorting c-pointer"
                                                onClick={() => handleSort("row_total")}
                                                style={{ cursor: "pointer" }}
                                            >
                                                Total{getSortIcon("row_total")}
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {sortedData.length > 0 ? (
                                            sortedData.map((row, index) => (
                                                <tr key={row.user_id} className="odd" role="row">
                                                    <td>{indexOfFirst + index + 1}</td>
                                                    <td>{row.employee_name || "N/A"}</td>
                                                    <td>{row.employee_email || "N/A"}</td>
                                                    {interventions.map((i) => (
                                                        <td key={i.intervention_id}>
                                                            {row.interventions?.[i.intervention_id]
                                                                ?.total_paid ?? 0}
                                                        </td>
                                                    ))}
                                                    <td className="fw-bold text-success">
                                                        {row.row_total}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={interventions.length + 4}
                                                    className="text-center"
                                                >
                                                    No Data Found
                                                </td>
                                            </tr>
                                        )}

                                        {/* COLUMN TOTALS ROW */}
                                        {rows.length > 0 && (
                                            <tr className="fw-bold bg-light">
                                                <td colSpan={3}>Total</td>
                                                {interventions.map((i) => (
                                                    <td key={i.intervention_id}>
                                                        {columnTotals?.[i.intervention_id] ?? 0}
                                                    </td>
                                                ))}
                                                <td>{grandTotal}</td>
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

export default InterventionReports;