import React, { useState, useEffect } from "react";
import { Col, Card, Table } from "react-bootstrap";
import PageTitle from "../../layouts/PageTitle";
import TableExportActions from "../../components/Common/TableExportActions";
import Pagination from "../../components/Common/Pagination";

const InterventionReports = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

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

        try {

            let apiData = [
                {
                    EmployeeName: "Manish",
                    intervention1: 1000,
                    intervention2: 20000,
                    intervention3: 4000,
                    intervention4: 3000,
                },
                {
                    EmployeeName: "Mohit",
                    intervention1: 1000,
                    intervention2: 20000,
                    intervention3: 4000,
                    intervention4: 3000,
                },      {
                    EmployeeName: "pagal",
                    intervention1: 1000,
                    intervention2: 20000,
                    intervention3: 4000,
                    intervention4: 3000,
                },
                {
                    EmployeeName: "Utkarsh",
                    intervention1: 2000,
                    intervention2: 40000,
                    intervention3: 8000,
                    intervention4: 0,
                },
                {
                    EmployeeName: "Parvesh",
                    intervention1: 2000,
                    intervention2: 40000,
                    intervention3: 8000,
                    intervention4: 0,
                },
            ];


            const formatted = apiData.map((item) => ({
                ...item,
                total:
                    (item.intervention1 || 0) +
                    (item.intervention2 || 0) +
                    (item.intervention3 || 0) +
                    (item.intervention4 || 0),
            }));

            setData(formatted);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const currentData = data.slice(indexOfFirst, indexOfLast);

    /* GRAND TOTAL */
    const grandTotal = data.reduce(
        (acc, item) => {
            acc.i1 += item.intervention1 || 0;
            acc.i2 += item.intervention2 || 0;
            acc.i3 += item.intervention3 || 0;
            acc.i4 += item.intervention4 || 0;
            acc.total += item.total || 0;
            return acc;
        },
        { i1: 0, i2: 0, i3: 0, i4: 0, total: 0 }
    );

    if (loading) return <p>Loading...</p>;

    return (
        <>
            <PageTitle
                activeMenu="Intervention Reports"
                motherMenu="Reports"
            />

            <Col lg={12}>
                <Card>
                    <Card.Header className="d-flex justify-content-between align-items-center flex-wrap ">
                        {/* LEFT → HEADING */}
                        <Card.Title className="mb-0">
                            Intervention Reports
                        </Card.Title>

                        {/* RIGHT SECTION (FILTER + EXPORT) */}
                        <div className="d-flex align-items-center gap-3 flex-wrap">

                            {/* DATE FILTER */}
                            <div className="d-flex align-items-center gap-2">
                                <input
                                    type="date"
                                    className="form-control"
                                    style={{ width: "150px" }}
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                />

                                <span>to</span>

                                <input
                                    type="date"
                                    className="form-control"
                                    style={{ width: "150px" }}
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                />
                            </div>

                            {/* EXPORT BUTTON */}
                            <TableExportActions
                                data={data}
                                columns={[
                                    { label: "Employee Name", key: "EmployeeName" },
                                    { label: "Intervention 1", key: "intervention1" },
                                    { label: "Intervention 2", key: "intervention2" },
                                    { label: "Intervention 3", key: "intervention3" },
                                    { label: "Intervention 4", key: "intervention4" },
                                    { label: "Total", key: "total" },
                                ]}
                                fileName="Intervention_Report"
                            />
                        </div>
                    </Card.Header>

                    {/* BODY */}
                    <Card.Body>
                        <Table responsive className="text-nowrap">
                            <thead>
                                <tr>
                                    <th>Sno</th>
                                    <th>Employee Name</th>
                                    <th>Intervention 1</th>
                                    <th>Intervention 2</th>
                                    <th>Intervention 3</th>
                                    <th>Intervention 4</th>
                                    <th>Total</th>
                                </tr>
                            </thead>

                            <tbody>
                                {currentData.length > 0 ? (
                                    currentData.map((row, index) => (
                                        <tr key={index}>
                                            <td>{indexOfFirst + index + 1}</td>
                                            <td>{row.EmployeeName}</td>
                                            <td>{row.intervention1}</td>
                                            <td>{row.intervention2}</td>
                                            <td>{row.intervention3}</td>
                                            <td>{row.intervention4}</td>
                                            <td className="fw-bold">{row.total}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center">
                                            No Data Found
                                        </td>
                                    </tr>
                                )}

                                {/* TOTAL ROW */}
                                <tr className="fw-bold bg-light">
                                    <td></td>
                                    <td>Total</td>
                                    <td>{grandTotal.i1}</td>
                                    <td>{grandTotal.i2}</td>
                                    <td>{grandTotal.i3}</td>
                                    <td>{grandTotal.i4}</td>
                                    <td>{grandTotal.total}</td>
                                </tr>
                            </tbody>
                        </Table>

                        {/* PAGINATION */}
                        <Pagination
                            totalItems={data.length}
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