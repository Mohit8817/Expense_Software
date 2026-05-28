import React, { useState, useEffect } from "react";
import { Col, Card, Table, Button, Row } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PageTitle from "../../layouts/PageTitle";
import TableExportActions from "../../components/Common/TableExportActions";
import Pagination from "../../components/Common/Pagination";
import { useSearchFilter, SearchInput } from "../../components/Common/useSearchFilter";

// ─── FY Helpers ───────────────────────────────────────────────────────────────

const getFYDateRange = (fy) => {
    if (!fy || fy === "all") return { fyStart: "", fyEnd: "" };
    const startYear = parseInt(fy.split("-")[0], 10);
    return { fyStart: `${startYear}-04-01`, fyEnd: `${startYear + 1}-03-31` };
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * UserDetailReport can be used in two ways:
 *
 * 1. As a standalone page (normal route) — reads params from URL via useSearchParams
 * 2. As a modal child (modalMode=true) — reads params from `modalParams` prop string
 *
 * Props:
 *   modalMode   {boolean}  — if true, component runs in embedded/modal mode (no PageTitle)
 *   modalParams {string}   — URLSearchParams string, e.g. "user_id=5&fy_year=2024-25"
 */
const UserDetailReport = ({ modalMode = false, modalParams = "" }) => {
    // ── Resolve params depending on mode ─────────────────────────────────────
    const [urlSearchParams] = useSearchParams();

    const resolvedParams = modalMode
        ? new URLSearchParams(modalParams)
        : urlSearchParams;

    const urlUserId   = resolvedParams.get("user_id")   || "";
    const urlFY       = resolvedParams.get("fy_year")   || "";
    const urlFromDate = resolvedParams.get("from_date") || "";
    const urlToDate   = resolvedParams.get("to_date")   || "";
    const urlName     = resolvedParams.get("name")      || "";
    const urlEmail    = resolvedParams.get("email")     || "";
    const urlPhone    = resolvedParams.get("phone")     || "";

    // ── State ────────────────────────────────────────────────────────────────
    const [userProfile, setUserProfile] = useState(
        urlName ? { username: urlName, email: urlEmail, phone_no: urlPhone } : null
    );
    const [rows, setRows]                 = useState([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState(null);
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const [fyOptions, setFyOptions]       = useState([]);

    const TODAY = new Date().toISOString().split("T")[0];

    const [selectedFY,  setSelectedFY]  = useState(urlFY);
    const [fromDate,    setFromDate]    = useState(urlFromDate);
    const [toDate,      setToDate]      = useState(urlToDate);
    const [appliedFrom, setAppliedFrom] = useState(urlFromDate);
    const [appliedTo,   setAppliedTo]   = useState(urlToDate);
    const [dateError,   setDateError]   = useState("");

    const { fyStart, fyEnd } = getFYDateRange(selectedFY);
    const calendarMax = fyEnd && fyEnd < TODAY ? fyEnd : TODAY;

    const {
        search, setSearch,
        currentPage, setCurrentPage,
        totalItems, paginatedData, indexOfFirst,
    } = useSearchFilter(rows, {
        keys: ["project_name", "intervention_name", "financial_year"],
        itemsPerPage: 100,
    });

    // ── Fetch data from API ──────────────────────────────────────────────────
    const fetchData = async (from, to, fy, options = {}) => {
        if (!urlUserId) {
            setLoading(false);
            setError("No user selected. Please go back and click a user.");
            return;
        }

        if (!fy || fy === "all") {
            if (!options.initFYOptions) {
                setLoading(false);
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            params.set("user_id", urlUserId);

            if (fy && fy !== "all") {
                params.set("fy_year", fy);
            } else if (selectedFY && selectedFY !== "all") {
                params.set("fy_year", selectedFY);
            }
            if (from) params.set("from_date", from);
            if (to)   params.set("to_date",   to);

            const url = `${import.meta.env.VITE_BACKEND_API_URL}reports/userwise-paid-expense-summary?${params.toString()}`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });

            if (!res.ok) throw new Error("Failed to fetch data");

            const json = await res.json();

            const isSuccess =
                json.success === true ||
                json.success === undefined ||
                json.status === "success";

            if (isSuccess) {
                const raw      = json.data ?? [];
                const dataRows = Array.isArray(raw) ? raw : [];

                setRows(dataRows);
                setCurrentPage(1);

                const userObj = Array.isArray(json.user) ? json.user[0] : json.user ?? null;

                if (userObj) {
                    setUserProfile(userObj);
                } else if (dataRows.length > 0) {
                    const r = dataRows[0];
                    setUserProfile({
                        username:       r.requested_by_name  || "—",
                        email:          r.requested_by_email || "—",
                        reporting_head: r.manager_name       || "—",
                    });
                }

                const fyList = (json.availableFYList ?? []).map((item) => item.fy_year);

                if (options.initFYOptions && fyList.length > 0) {
                    setFyOptions(fyList);
                    if (!fy && fyList.length > 0) {
                        setSelectedFY(fyList[0]);
                        fetchData(from, to, fyList[0]);
                    }
                }
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── Init — re-runs whenever the user changes (modal opens for a new user) ─
    useEffect(() => {
        // Reset state when user changes
        setUserProfile(urlName ? { username: urlName, email: urlEmail, phone_no: urlPhone } : null);
        setRows([]);
        setSelectedFY(urlFY);
        setFromDate(urlFromDate);
        setToDate(urlToDate);
        setAppliedFrom(urlFromDate);
        setAppliedTo(urlToDate);
        setDateError("");

        fetchData(urlFromDate, urlToDate, urlFY, { initFYOptions: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urlUserId]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleFYChange = (fy) => {
        setSelectedFY(fy);
        setAppliedFrom(""); setAppliedTo(""); setDateError("");
        // dates persist — do NOT clear fromDate/toDate
        fetchData("", "", fy);
    };

    const handleFilter = () => {
        setAppliedFrom(fromDate);
        setAppliedTo(toDate);
        fetchData(fromDate, toDate, selectedFY);
    };

    const handleReset = () => {
        setFromDate(""); setToDate(""); setAppliedFrom(""); setAppliedTo(""); setDateError("");
        fetchData("", "", selectedFY);
    };

    const validateAndSetFrom = (val) => {
        setFromDate(val);
        if (!val) { setDateError(""); return; }
        if (toDate && val > toDate) { setDateError("From date cannot be after To date."); return; }
        setDateError("");
    };

    const validateAndSetTo = (val) => {
        setToDate(val);
        if (!val) { setDateError(""); return; }
        if (val > calendarMax) { setDateError("To date cannot be a future date."); return; }
        if (fromDate && val < fromDate) { setDateError("To date cannot be before From date."); return; }
        setDateError("");
    };

    const isFilterDisabled = (!fromDate && !toDate) || !!dateError;

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
        });
    };

    const formatAmount = (val) =>
        val !== undefined && val !== null ? Number(val).toLocaleString("en-IN") : "0";

    // ── Download PDF ─────────────────────────────────────────────────────────
    const handleDownloadPDF = () => {
        setIsPdfLoading(true);
        try {
            const user = userProfile || {};
            const doc  = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
            const pageWidth = doc.internal.pageSize.getWidth();
            let cursorY = 14;

            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text("User Expense Report", pageWidth / 2, cursorY, { align: "center" });
            cursorY += 8;

            doc.setDrawColor(180, 180, 180);
            doc.line(14, cursorY, pageWidth - 14, cursorY);
            cursorY += 6;

            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 30, 30);
            doc.text("Employee Information", 14, cursorY);
            cursorY += 5;

            const userFields = [
                ["Name",           user.username       || user.Name       || user.name    || "N/A"],
                ["Email",          user.email          || user.user_email                 || "N/A"],
                ["Phone",          user.phone_no       || user.user_phone || user.phone   || "N/A"],
                ["Reporting Head", user.reporting_head                                    || "N/A"],
            ];

            doc.setFontSize(9);
            const colW    = (pageWidth - 28) / 2;
            const rowH    = 7;
            const labelX1 = 14,          valueX1 = labelX1 + 38;
            const labelX2 = 14 + colW + 4, valueX2 = labelX2 + 38;

            userFields.forEach((field, i) => {
                const col = i % 2, row = Math.floor(i / 2);
                const y  = cursorY + row * rowH;
                const lx = col === 0 ? labelX1 : labelX2;
                const vx = col === 0 ? valueX1 : valueX2;
                doc.setFont("helvetica", "bold");  doc.setTextColor(100, 100, 100);
                doc.text(`${field[0]}:`, lx, y);
                doc.setFont("helvetica", "normal"); doc.setTextColor(30, 30, 30);
                doc.text(String(field[1]), vx, y);
            });

            cursorY += Math.ceil(userFields.length / 2) * rowH + 4;
            doc.setDrawColor(200, 200, 200);
            doc.line(14, cursorY, pageWidth - 14, cursorY);
            cursorY += 6;

            if (appliedFrom || appliedTo || (selectedFY && selectedFY !== "all")) {
                doc.setFontSize(8); doc.setFont("helvetica", "italic"); doc.setTextColor(120, 120, 120);
                const filterParts = [];
                if (selectedFY && selectedFY !== "all") filterParts.push(`FY: ${selectedFY}`);
                if (appliedFrom) filterParts.push(`From: ${formatDate(appliedFrom)}`);
                if (appliedTo)   filterParts.push(`To: ${formatDate(appliedTo)}`);
                doc.text(`Filters applied — ${filterParts.join("  |  ")}`, 14, cursorY);
                cursorY += 6;
            }

            doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 30, 30);
            doc.text("Expense Transactions", 14, cursorY);
            cursorY += 4;

            const tableHead = [[
                "S No", "Project", "Intervention",
                "Request Amt (₹)", "Request Date",
                "Approved Amt (₹)", "Paid Amt (₹)", "Paid Date",
            ]];

            const tableBody = rows.map((row, index) => [
                index + 1,
                row.project_name      || "N/A",
                row.intervention_name || "N/A",
                formatAmount(row.amount),
                formatDate(row.requested_date),
                formatAmount(row.final_approved_amount),
                formatAmount(row.paid_amount),
                formatDate(row.payment_date),
               
            ]);

            autoTable(doc, {
                startY: cursorY,
                head: tableHead,
                body: tableBody,
                theme: "striped",
                headStyles: {
                    fillColor: [41, 128, 185], textColor: 255,
                    fontStyle: "bold", fontSize: 8, halign: "center",
                },
                bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
                alternateRowStyles: { fillColor: [245, 249, 255] },
                columnStyles: {
                    0: { cellWidth: 12, halign: "center" },
                    3: { halign: "right" },
                    4: { halign: "center" },
                    5: { halign: "right", fontStyle: "bold" },
                    6: { halign: "right", fontStyle: "bold", textColor: [0, 128, 0] },
                    7: { halign: "center" },
                    8: { cellWidth: 40, textColor: [100, 100, 100] },
                },
                margin: { left: 14, right: 14 },
                didDrawPage: (data) => {
                    const pageCount = doc.internal.getNumberOfPages();
                    doc.setFontSize(8); doc.setTextColor(150);
                    doc.text(
                        `Page ${data.pageNumber} of ${pageCount}`,
                        pageWidth / 2,
                        doc.internal.pageSize.getHeight() - 8,
                        { align: "center" }
                    );
                },
            });

            const userName = (userProfile?.username || "User").replace(/\s+/g, "_");
            doc.save(`User_Report_${userName}.pdf`);
        } catch (err) {
            console.error("PDF generation failed:", err);
            alert("PDF download failed: " + err.message);
        } finally {
            setIsPdfLoading(false);
        }
    };

    // ── Export ────────────────────────────────────────────────────────────────
    const exportColumns = [
        { label: "Project",         key: "project_name"          },
        { label: "Intervention",    key: "intervention_name"     },
        { label: "Request Amount",  key: "amount"                },
        { label: "Request Date",    key: "requested_date"        },
        { label: "Approved Amount", key: "final_approved_amount" },
        { label: "Paid Amount",     key: "paid_amount"           },
        { label: "Paid Date",       key: "payment_date"          },
    ];

    const exportData = rows.map((row) => ({
        project_name:          row.project_name          || "N/A",
        intervention_name:     row.intervention_name     || "N/A",
        amount:                row.amount                ?? 0,
        requested_date:        formatDate(row.requested_date),
        final_approved_amount: row.final_approved_amount ?? 0,
        paid_amount:           row.paid_amount           ?? 0,
        payment_date:          formatDate(row.payment_date),
    }));

    const displayName   = userProfile?.username || "—";
    const displayStatus = userProfile?.status   || "Active";

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <>
            {/* PageTitle only shown when used as a standalone page, not inside modal */}
            {!modalMode && (
                <PageTitle activeMenu="User Detail Report" motherMenu="Reports" />
            )}

            {/* ── User Profile Card ── */}
            <Col lg={12} className="mb-4">
                <Card className="border-0 shadow-sm">
                    <Card.Body className="py-3">
                        {loading && !userProfile ? (
                            <div className="text-center py-3">Loading user info...</div>
                        ) : !loading && !userProfile ? (
                            <div className="text-center py-3 text-muted">No user data found.</div>
                        ) : (
                            <>
                                <div className="d-flex align-items-center gap-3 mb-3">
                                    <h5 className="mb-0 fw-bold">{displayName}</h5>
                                    <span className={`badge ${displayStatus === "Active" ? "bg-success" : "bg-secondary"}`}>
                                        {displayStatus}
                                    </span>
                                    <div className="ms-auto text-end">
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={handleDownloadPDF}
                                            disabled={isPdfLoading || loading}
                                        >
                                            {isPdfLoading ? "Generating PDF..." : "Download PDF"}
                                        </Button>
                                    </div>
                                </div>

                                <Row className="g-2">
                                    {[
                                        { label: "Employee ID",    value: userProfile?.user_id        || "—" },
                                        { label: "Email",          value: userProfile?.email          || "—" },
                                        { label: "Phone Number",   value: userProfile?.phone_no       || "—" },
                                        { label: "Reporting Head", value: userProfile?.reporting_head || "—" },
                                    ].map((item, index) => (
                                        <Col key={index} xl={3} sm={6} xs={12}>
                                            <div className="border rounded px-3 py-2 bg-light h-100">
                                                <div className="text-muted small mb-1">{item.label}</div>
                                                <div className="fw-semibold text-truncate">{item.value}</div>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            </>
                        )}
                    </Card.Body>
                </Card>
            </Col>

            {/* ── Expense Table Card ── */}
            <Col lg={12}>
                <Card>
                    <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <Card.Title className="mb-0">Expense Transactions</Card.Title>

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

                            {/* No key prop — dates persist across interactions */}
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
                                placeholder="Search Expenses..."
                            />
                            <TableExportActions
                                data={exportData}
                                columns={exportColumns}
                                fileName={`User_Expense_${displayName.replace(/\s+/g, "_")}`}
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
                                            <th>Project</th>
                                            <th>Intervention</th>
                                            <th>Request Amt (₹)</th>
                                            <th>Request Date</th>
                                            <th>Approved Amt (₹)</th>
                                            <th>Paid Amt (₹)</th>
                                            <th>Paid Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedData.length > 0 ? (
                                            paginatedData.map((row, index) => (
                                                <tr key={row.id ?? index}>
                                                    <td>{indexOfFirst + index + 1}</td>
                                                    <td>{row.project_name      || "N/A"}</td>
                                                    <td>{row.intervention_name || "N/A"}</td>
                                                    <td>{formatAmount(row.amount)}</td>
                                                    <td>{formatDate(row.requested_date)}</td>
                                                    <td className="fw-bold">{formatAmount(row.final_approved_amount)}</td>
                                                    <td className="fw-bold text-success">{formatAmount(row.paid_amount)}</td>
                                                    <td>{formatDate(row.payment_date)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={9} className="text-center">No Data Found</td>
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

export default UserDetailReport;