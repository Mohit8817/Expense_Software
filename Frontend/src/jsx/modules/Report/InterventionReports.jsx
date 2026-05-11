/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { Col, Card, Table } from "react-bootstrap";
import PageTitle from "../../layouts/PageTitle";
import TableExportActions from "../../components/Common/TableExportActions";
import Pagination from "../../components/Common/Pagination";
import { useSearchFilter, SearchInput } from "../../components/Common/useSearchFilter";

// ─── No FY helpers needed — everything comes from backend ─────────────────────

const InterventionReports = () => {
    const [rows, setRows] = useState([]);
    const [interventions, setInterventions] = useState([]);
    const [columnTotals, setColumnTotals] = useState({});
    const [grandTotal, setGrandTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    //   FY state — options & current FY come from API, not hardcoded
    const [selectedFY, setSelectedFY] = useState("current");
    const [fyOptions, setFyOptions] = useState([]);

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
        keys: ["employee_name"],
        itemsPerPage: 100,
    });

    //   Single fetch on mount — "current" lets backend decide the active FY
    useEffect(() => {
        fetchData("current");
    }, []);

    const fetchData = async (fyYear) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.append("fy_year", fyYear || "current");

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
                //   Filter out null interventions
                const validInterventions = (json.data.interventions || []).filter(
                    (i) => i.intervention_id !== null
                );
                setInterventions(validInterventions);
                setRows(json.data.rows || []);
                setColumnTotals(json.data.columnTotals || {});
                setGrandTotal(json.data.grandTotal || 0);

                //   Populate FY dropdown from backend's availableFYList
                if (json.data.availableFYList?.length > 0) {
                    setFyOptions(json.data.availableFYList.map((f) => f.fy_year));
                }

                //   Sync selectedFY with what backend actually filtered on
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
        fetchData(fy);
    };

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

                        {/* CENTER — FY Year Dropdown (dynamic from backend) */}
                        <div className="d-flex align-items-center gap-2 flex-wrap justify-content-center">
                            <select
                                className="form-select"
                                style={{ width: "145px" }}
                                value={selectedFY}
                                onChange={(e) => handleFYChange(e.target.value)}
                                disabled={loading}
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
                                            <th>Employee Email</th>
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