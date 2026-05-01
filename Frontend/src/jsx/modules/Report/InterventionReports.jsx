import React, { useState, useEffect } from "react";
import { Col, Card, Table } from "react-bootstrap";
import PageTitle from "../../layouts/PageTitle";
import TableExportActions from "../../components/Common/TableExportActions";
import Pagination from "../../components/Common/Pagination";

const InterventionReports = () => {
    const [rows, setRows] = useState([]);
    const [interventions, setInterventions] = useState([]);
    const [columnTotals, setColumnTotals] = useState({});
    const [grandTotal, setGrandTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /* DATE FILTER */
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    /* PAGINATION */
    const itemsPerPage = 10;
    const [currentPage, setCurrentPage] = useState(1);

    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;

    /* FETCH DATA */
    useEffect(() => {
        fetchData();
    }, [fromDate, toDate]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (fromDate) params.append("fromDate", fromDate);
            if (toDate) params.append("toDate", toDate);

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
                // Filter out interventions with null intervention_id
                const validInterventions = json.data.interventions.filter(
                    (i) => i.intervention_id !== null
                );
                setInterventions(validInterventions);
                setRows(json.data.rows);
                setColumnTotals(json.data.columnTotals);
                setGrandTotal(json.data.grandTotal);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const currentData = rows.slice(indexOfFirst, indexOfLast);

    /* EXPORT COLUMNS */
    const exportColumns = [
        { label: "Employee Name", key: "employee_name" },
        ...interventions.map((i) => ({
            label: i.intervention_name,
            key: `intervention_${i.intervention_id}`,
        })),
        { label: "Total", key: "row_total" },
    ];

    /* EXPORT DATA — flatten for export */
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
                    <Card.Header className="d-flex justify-content-between align-items-center flex-wrap">
                        {/* HEADING */}
                        <Card.Title className="mb-0">Intervention Reports</Card.Title>

                        {/* FILTER + EXPORT */}
                        <div className="d-flex align-items-center gap-3 flex-wrap">

                            {/* DATE FILTER */}
                            <div className="d-flex align-items-center gap-2">
                                <input
                                    type="date"
                                    className="form-control"
                                    style={{ width: "150px" }}
                                    value={fromDate}
                                    onChange={(e) => {
                                        setFromDate(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                                <span>to</span>
                                <input
                                    type="date"
                                    className="form-control"
                                    style={{ width: "150px" }}
                                    value={toDate}
                                    onChange={(e) => {
                                        setToDate(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
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
                                    {/* DYNAMIC INTERVENTION COLUMNS */}
                                    {interventions.map((i) => (
                                        <th key={i.intervention_id}>
                                            {i.intervention_name}
                                        </th>
                                    ))}
                                    <th>Total</th>
                                </tr>
                            </thead>

                            <tbody>
                                {currentData.length > 0 ? (
                                    currentData.map((row, index) => (
                                        <tr key={row.user_id}>
                                            <td>{indexOfFirst + index + 1}</td>
                                            <td>{row.employee_name || "N/A"}</td>
                                            {/* DYNAMIC INTERVENTION CELLS */}
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
                            totalItems={rows.length}
                            itemsPerPage={itemsPerPage}
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