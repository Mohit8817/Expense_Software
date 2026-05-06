/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { Col, Card, Table } from "react-bootstrap";
import PageTitle from "../../layouts/PageTitle";
import TableExportActions from "../../components/Common/TableExportActions";
import Pagination from "../../components/Common/Pagination";
import { useSearchFilter, SearchInput } from "../../components/Common/useSearchFilter";

// ─── FY Helpers ────────────────────────────────────────────────────────────────

const getFYFromDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

const getCurrentFY = () => getFYFromDate(new Date().toISOString());

// ───────────────────────────────────────────────────────────────────────────────

const InterventionReports = () => {
    const [rows, setRows] = useState([]);
    const [interventions, setInterventions] = useState([]);
    const [columnTotals, setColumnTotals] = useState({});
    const [grandTotal, setGrandTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // FY state — default to current FY; options built from data
    const [selectedFY, setSelectedFY] = useState(getCurrentFY());
    const [fyOptions, setFyOptions] = useState([getCurrentFY()]);

    /* SEARCH + PAGINATION */
    const {
        search,
        setSearch,
        currentPage,
        setCurrentPage,
        totalItems,
        paginatedData,
        indexOfFirst,
    } = useSearchFilter(rows, {
        keys: ["employee_name", "interventions"],
        itemsPerPage: 100,
    });

    // On mount — fetch all data (no FY filter) to derive available FY options from rows
    useEffect(() => {
        fetchData("0", { buildFYOptions: true });
    }, []);

    // Exactly like PaidExpense: scan rows for date fields → extract unique FYs → build dropdown
    const buildFYOptionsFromData = (apiRows) => {
        const currentFY = getCurrentFY();
        const currentFYStart = parseInt(currentFY.split("-")[0], 10);

        if (!apiRows || apiRows.length === 0) {
            setFyOptions([currentFY]);
            return;
        }

        let minYear = null;

        apiRows.forEach((row) => {
            // Check any date-like fields available on intervention rows
            ["payment_date", "requested_date", "updated_at", "created_at"].forEach((key) => {
                if (row[key]) {
                    const fy = getFYFromDate(row[key]);
                    if (fy) {
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

        // Build descending list: currentFY → minFY (same as PaidExpense)
        const options = [];
        for (let y = currentFYStart; y >= minYear; y--) {
            options.push(`${y}-${y + 1}`);
        }

        setFyOptions(options.length ? options : [currentFY]);
    };

    const fetchData = async (fyYear, options = {}) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.append("fy_year", fyYear || "0");

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
                const validInterventions = json.data.interventions.filter(
                    (i) => i.intervention_id !== null
                );
                setInterventions(validInterventions);
                setRows(json.data.rows);
                setColumnTotals(json.data.columnTotals);
                setGrandTotal(json.data.grandTotal);

                // Build FY options from all rows (only on initial mount call)
                if (options.buildFYOptions) {
                    buildFYOptionsFromData(json.data.rows);
                    // After building options, fetch current FY data to show by default
                    fetchData(getCurrentFY());
                    return;
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
        fetchData(fy);
    };

    /* EXPORT */
    const exportColumns = [
        { label: "Employee Name", key: "employee_name" },
        ...interventions.map((i) => ({
            label: i.intervention_name,
            key: `intervention_${i.intervention_id}`,
        })),
        { label: "Total", key: "row_total" },
    ];

    const exportData = rows.map((row) => {
        const flat = { employee_name: row.employee_name || "N/A" };
        interventions.forEach((i) => {
            flat[`intervention_${i.intervention_id}`] =
                row.interventions?.[i.intervention_id]?.total_paid ?? 0;
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

                        {/* CENTER — FY Year Dropdown */}
                        <div className="d-flex align-items-center gap-2 flex-wrap justify-content-center">
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
                                            <th>Employee Name</th>
                                            {interventions.map((i) => (
                                                <th key={i.intervention_id}>{i.intervention_name}</th>
                                            ))}
                                            <th>Total</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {paginatedData.length > 0 ? (
                                            paginatedData.map((row, index) => (
                                                <tr key={row.user_id}>
                                                    <td>{indexOfFirst + index + 1}</td>
                                                    <td>{row.employee_name || "N/A"}</td>
                                                    {interventions.map((i) => (
                                                        <td key={i.intervention_id}>
                                                            {row.interventions?.[i.intervention_id]
                                                                ?.total_paid ?? 0}
                                                        </td>
                                                    ))}
                                                    <td className="fw-bold">{row.row_total}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={interventions.length + 3}
                                                    className="text-center"
                                                >
                                                    No Data Found
                                                </td>
                                            </tr>
                                        )}

                                        {/* COLUMN TOTALS ROW */}
                                        {rows.length > 0 && (
                                            <tr className="fw-bold bg-light">
                                                <td></td>
                                                <td>Total</td>
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