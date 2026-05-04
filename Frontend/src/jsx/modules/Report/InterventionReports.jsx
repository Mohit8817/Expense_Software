/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { Col, Card, Table, Button } from "react-bootstrap";
import PageTitle from "../../layouts/PageTitle";
import TableExportActions from "../../components/Common/TableExportActions";
import Pagination from "../../components/Common/Pagination";
import { useSearchFilter, SearchInput } from "../../components/Common/useSearchFilter";

const InterventionReports = () => {
    const [rows, setRows] = useState([]);
    const [interventions, setInterventions] = useState([]);
    const [columnTotals, setColumnTotals] = useState({});
    const [grandTotal, setGrandTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /* DATE FILTER */
    const TODAY = new Date().toISOString().split("T")[0];
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [appliedFrom, setAppliedFrom] = useState("");
    const [appliedTo, setAppliedTo] = useState("");
    const [dateError, setDateError] = useState("");

    /* SEARCH FILTER — replaces manual pagination */
    const {
        search,
        setSearch,
        currentPage,
        setCurrentPage,
        totalItems,
        paginatedData,
        indexOfFirst,
    } = useSearchFilter(rows, {
        keys: ["employee_name",
            "interventions",

        ],
        itemsPerPage: 100,
    });

    /* FETCH DATA */
    useEffect(() => {
        fetchData("", "");
    }, []);

    const fetchData = async (from, to) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
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
                const validInterventions = json.data.interventions.filter(
                    (i) => i.intervention_id !== null
                );
                setInterventions(validInterventions);
                setRows(json.data.rows);
                setColumnTotals(json.data.columnTotals);
                setGrandTotal(json.data.grandTotal);
                setCurrentPage(1);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load data. Please try again.");
        } finally {
            setLoading(false);
        }
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
        if (val > TODAY) {
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

    const handleFilter = () => {
        console.log("Filter clicked:", { fromDate, toDate });
        setAppliedFrom(fromDate);
        setAppliedTo(toDate);
        fetchData(fromDate, toDate);
    };

    const handleReset = () => {
        setFromDate("");
        setToDate("");
        setAppliedFrom("");
        setAppliedTo("");
        setDateError("");
        fetchData("", "");
    };

    const isFilterDisabled = (!fromDate && !toDate) || !!dateError;

    /* EXPORT COLUMNS */
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

    if (loading) return <p className="text-center mt-4">Loading...</p>;
    if (error) return <p className="text-center text-danger mt-4">{error}</p>;

    return (
        <>
            <PageTitle activeMenu="Intervention Reports" motherMenu="Reports" />

            <Col lg={12}>
                <Card>
                    <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">

                        {/* LEFT — Title + date error */}
                        <div>
                            <Card.Title className="mb-0">Intervention Reports</Card.Title>
                            {dateError && (
                                <small className="text-danger">{dateError}</small>
                            )}
                        </div>

                        {/* SEARCH */}
                        <div className="float-right text-end">
                            <SearchInput
                                value={search}
                                onChange={setSearch}
                                placeholder="Search employees..."
                            />
                        </div>

                        {/* RIGHT — Date filter + Export */}
                        <div className="d-flex align-items-center flex-wrap gap-2">

                            {/* DATE FILTER */}
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <input
                                    type="date"
                                    className={
                                        "form-control" +
                                        (dateError && fromDate && toDate && fromDate > toDate
                                            ? " is-invalid"
                                            : "")
                                    }
                                    style={{ width: "150px" }}
                                    value={fromDate}
                                    onChange={(e) => validateAndSetFrom(e.target.value)}
                                />
                                <span>to</span>
                                <input
                                    type="date"
                                    className={
                                        "form-control" +
                                        (dateError &&
                                            toDate &&
                                            (toDate > TODAY || (fromDate && toDate < fromDate))
                                            ? " is-invalid"
                                            : "")
                                    }
                                    style={{ width: "150px" }}
                                    value={toDate}
                                    min={fromDate || undefined}
                                    max={TODAY}
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
                            </div>

                            {/* EXPORT */}
                            <TableExportActions
                                data={exportData}
                                columns={exportColumns}
                                fileName="Intervention_Report"
                            />
                        </div>
                    </Card.Header>

                    <Card.Body>
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
                                {paginatedData.length > 0 ? (    // ✅ paginatedData instead of currentData
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

                        {/* PAGINATION */}
                        <Pagination
                            totalItems={totalItems}
                            itemsPerPage={100}
                            currentPage={currentPage}
                            onPageChange={setCurrentPage}
                        />
                    </Card.Body>
                </Card>
            </Col>
        </>
    );
};

export default InterventionReports;