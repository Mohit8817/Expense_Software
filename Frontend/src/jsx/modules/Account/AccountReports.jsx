import React, { useEffect, useState, useCallback } from "react";
import { Col, Row, Card, Table, Badge, Nav, Tab } from "react-bootstrap";
import { toast } from "react-toastify";
import PageTitle from "../../layouts/PageTitle";
import TableExportActions from "../../components/Common/TableExportActions";
import {
  getSalesRegister,
  getPurchaseRegister,
  getVoucherRegister,
  getGstSummary,
  getDocumentLinksReport,
  formatDate,
  formatMoney,
  approvalLabel,
} from "./accountDashboardApi";

const defaultRange = () => {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    from: from.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
};

const AccountReports = () => {
  const [range, setRange] = useState(defaultRange);
  const [activeTab, setActiveTab] = useState("sales");
  const [loading, setLoading] = useState(false);
  const [salesRows, setSalesRows] = useState([]);
  const [purchaseRows, setPurchaseRows] = useState([]);
  const [voucherRows, setVoucherRows] = useState([]);
  const [gstSummary, setGstSummary] = useState(null);
  const [linksReport, setLinksReport] = useState(null);
  const [voucherType, setVoucherType] = useState("credit");

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const [sales, purchases, vouchers, gst, links] = await Promise.all([
        getSalesRegister(range.from, range.to),
        getPurchaseRegister(range.from, range.to),
        getVoucherRegister(voucherType, range.from, range.to),
        getGstSummary(range.from, range.to),
        getDocumentLinksReport(),
      ]);
      setSalesRows(Array.isArray(sales) ? sales : []);
      setPurchaseRows(Array.isArray(purchases) ? purchases : []);
      setVoucherRows(Array.isArray(vouchers) ? vouchers : []);
      setGstSummary(gst);
      setLinksReport(links);
    } catch (error) {
      toast.error(error.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to, voucherType]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const salesExport = salesRows.map((r) => ({
    invoice_no: r.invoice_no,
    date: formatDate(r.invoice_date),
    buyer: r.buyer_name,
    taxable: Number(r.taxable_value),
    tax: Number(r.total_tax_amount),
    total: Number(r.total_amount),
    status: approvalLabel(r.approval_status),
  }));

  const purchaseExport = purchaseRows.map((r) => ({
    invoice_no: r.invoice_no,
    date: formatDate(r.invoice_date),
    vendor: r.seller_name,
    taxable: Number(r.taxable_value),
    tax: Number(r.total_tax_amount),
    total: Number(r.total_amount),
    status: approvalLabel(r.approval_status),
  }));

  const voucherExport = voucherRows.map((r) => {
    if (voucherType === "journal") {
      return {
        voucher_no: r.voucher_no,
        date: formatDate(r.voucher_date),
        company: r.company_name,
        narration: r.narration,
        debit: Number(r.total_debit),
        credit: Number(r.total_credit),
        status: approvalLabel(r.approval_status),
      };
    }
    if (voucherType === "payment") {
      return {
        voucher_no: r.voucher_no,
        date: formatDate(r.voucher_date),
        party: r.party_name,
        type: r.payment_type,
        ref: r.linked_document_no || "",
        total: Number(r.total_amount),
        status: approvalLabel(r.approval_status),
      };
    }
    const docNo = r.credit_note_no || r.debit_note_no || r.challan_no;
    const date = r.credit_note_date || r.debit_note_date || r.challan_date;
    return {
      doc_no: docNo,
      date: formatDate(date),
      party: r.buyer_name,
      ref: r.original_invoice_no || r.invoice_no || "",
      total: Number(r.total_amount),
      status: approvalLabel(r.approval_status),
    };
  });

  return (
    <>
      <PageTitle activeMenu="Account Reports" motherMenu="Accounting" />

      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="d-flex flex-wrap align-items-end gap-3">
          <div>
            <label className="form-label small mb-1">From</label>
            <input
              type="date"
              className="form-control"
              value={range.from}
              onChange={(e) => setRange((prev) => ({ ...prev, from: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label small mb-1">To</label>
            <input
              type="date"
              className="form-control"
              value={range.to}
              onChange={(e) => setRange((prev) => ({ ...prev, to: e.target.value }))}
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={loadReports} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </Card.Body>
      </Card>

      {gstSummary && (
        <Row className="g-3 mb-3">
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="text-muted small">Outward (Sales)</div>
                <h4>{formatMoney(gstSummary.outward?.totalAmount)}</h4>
                <div className="small">Tax: {formatMoney(gstSummary.outward?.totalTax)}</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="text-muted small">Inward (Purchase)</div>
                <h4>{formatMoney(gstSummary.inward?.totalAmount)}</h4>
                <div className="small">Tax: {formatMoney(gstSummary.inward?.totalTax)}</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="text-muted small">Credit Notes</div>
                <h4>{formatMoney(gstSummary.creditNotes?.totalAmount)}</h4>
                <div className="small">Tax: {formatMoney(gstSummary.creditNotes?.totalTax)}</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="text-muted small">Net Tax (Sales − CN)</div>
                <h4>{formatMoney(gstSummary.netTax)}</h4>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || "sales")}>
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-white">
            <Nav variant="tabs">
              <Nav.Item><Nav.Link eventKey="sales">Sales Register</Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link eventKey="purchase">Purchase Register</Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link eventKey="vouchers">Voucher Register</Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link eventKey="links">Document Links</Nav.Link></Nav.Item>
            </Nav>
          </Card.Header>
          <Card.Body>
            <Tab.Content>
              <Tab.Pane eventKey="sales">
                <div className="d-flex justify-content-end mb-2">
                  <TableExportActions
                    data={salesExport}
                    columns={[
                      { label: "Invoice No", key: "invoice_no" },
                      { label: "Date", key: "date" },
                      { label: "Buyer", key: "buyer" },
                      { label: "Taxable", key: "taxable" },
                      { label: "Tax", key: "tax" },
                      { label: "Total", key: "total" },
                      { label: "Status", key: "status" },
                    ]}
                    fileName="Sales_Register"
                  />
                </div>
                <Table responsive className="text-nowrap">
                  <thead>
                    <tr>
                      <th>Invoice No</th>
                      <th>Date</th>
                      <th>Buyer</th>
                      <th>Taxable</th>
                      <th>Tax</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesRows.map((r) => (
                      <tr key={r.id}>
                        <td>{r.invoice_no}</td>
                        <td>{formatDate(r.invoice_date)}</td>
                        <td>{r.buyer_name}</td>
                        <td>{formatMoney(r.taxable_value)}</td>
                        <td>{formatMoney(r.total_tax_amount)}</td>
                        <td>{formatMoney(r.total_amount)}</td>
                        <td><Badge bg={r.approval_status === "APPROVED" ? "success" : "warning"}>{approvalLabel(r.approval_status)}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Tab.Pane>

              <Tab.Pane eventKey="purchase">
                <div className="d-flex justify-content-end mb-2">
                  <TableExportActions
                    data={purchaseExport}
                    columns={[
                      { label: "Invoice No", key: "invoice_no" },
                      { label: "Date", key: "date" },
                      { label: "Vendor", key: "vendor" },
                      { label: "Taxable", key: "taxable" },
                      { label: "Tax", key: "tax" },
                      { label: "Total", key: "total" },
                      { label: "Status", key: "status" },
                    ]}
                    fileName="Purchase_Register"
                  />
                </div>
                <Table responsive className="text-nowrap">
                  <thead>
                    <tr>
                      <th>Invoice No</th>
                      <th>Date</th>
                      <th>Vendor</th>
                      <th>Taxable</th>
                      <th>Tax</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseRows.map((r) => (
                      <tr key={r.id}>
                        <td>{r.invoice_no}</td>
                        <td>{formatDate(r.invoice_date)}</td>
                        <td>{r.seller_name}</td>
                        <td>{formatMoney(r.taxable_value)}</td>
                        <td>{formatMoney(r.total_tax_amount)}</td>
                        <td>{formatMoney(r.total_amount)}</td>
                        <td><Badge bg={r.approval_status === "APPROVED" ? "success" : "warning"}>{approvalLabel(r.approval_status)}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Tab.Pane>

              <Tab.Pane eventKey="vouchers">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                  <select className="form-control" style={{ maxWidth: 220 }} value={voucherType} onChange={(e) => setVoucherType(e.target.value)}>
                    <option value="credit">Credit Note</option>
                    <option value="debit">Debit Note</option>
                    <option value="challan">Delivery Challan</option>
                    <option value="journal">Journal Voucher</option>
                    <option value="payment">Payment Voucher</option>
                  </select>
                  <TableExportActions
                    data={voucherExport}
                    columns={
                      voucherType === "journal"
                        ? [
                            { label: "Voucher No", key: "voucher_no" },
                            { label: "Date", key: "date" },
                            { label: "Company", key: "company" },
                            { label: "Narration", key: "narration" },
                            { label: "Debit", key: "debit" },
                            { label: "Credit", key: "credit" },
                            { label: "Status", key: "status" },
                          ]
                        : voucherType === "payment"
                          ? [
                              { label: "Voucher No", key: "voucher_no" },
                              { label: "Date", key: "date" },
                              { label: "Party", key: "party" },
                              { label: "Type", key: "type" },
                              { label: "Reference", key: "ref" },
                              { label: "Total", key: "total" },
                              { label: "Status", key: "status" },
                            ]
                          : [
                              { label: "Doc No", key: "doc_no" },
                              { label: "Date", key: "date" },
                              { label: "Party", key: "party" },
                              { label: "Reference", key: "ref" },
                              { label: "Total", key: "total" },
                              { label: "Status", key: "status" },
                            ]
                    }
                    fileName={`${voucherType}_Register`}
                  />
                </div>
                <Table responsive className="text-nowrap">
                  <thead>
                    {voucherType === "journal" ? (
                      <tr>
                        <th>Voucher No</th>
                        <th>Date</th>
                        <th>Company</th>
                        <th>Narration</th>
                        <th>Debit</th>
                        <th>Credit</th>
                        <th>Status</th>
                      </tr>
                    ) : (
                      <tr>
                        <th>Doc No</th>
                        <th>Date</th>
                        <th>Party</th>
                        <th>Reference Invoice</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {voucherRows.map((r) =>
                      voucherType === "journal" ? (
                        <tr key={r.id}>
                          <td>{r.voucher_no}</td>
                          <td>{formatDate(r.voucher_date)}</td>
                          <td>{r.company_name}</td>
                          <td>{r.narration || "—"}</td>
                          <td>{formatMoney(r.total_debit)}</td>
                          <td>{formatMoney(r.total_credit)}</td>
                          <td>{approvalLabel(r.approval_status)}</td>
                        </tr>
                      ) : voucherType === "payment" ? (
                        <tr key={r.id}>
                          <td>{r.voucher_no}</td>
                          <td>{formatDate(r.voucher_date)}</td>
                          <td>{r.party_name}</td>
                          <td>{r.linked_document_no || "—"}</td>
                          <td>{formatMoney(r.total_amount)}</td>
                          <td>{approvalLabel(r.approval_status)}</td>
                        </tr>
                      ) : (
                        <tr key={r.id}>
                          <td>{r.credit_note_no || r.debit_note_no || r.challan_no}</td>
                          <td>{formatDate(r.credit_note_date || r.debit_note_date || r.challan_date)}</td>
                          <td>{r.buyer_name}</td>
                          <td>{r.original_invoice_no || r.invoice_no || "—"}</td>
                          <td>{formatMoney(r.total_amount)}</td>
                          <td>{approvalLabel(r.approval_status)}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </Table>
              </Tab.Pane>

              <Tab.Pane eventKey="links">
                {linksReport && (
                  <>
                    <Row className="mb-3">
                      <Col md={4}>
                        <Card className="border">
                          <Card.Body>
                            <h6>Credit Notes → Sales</h6>
                            <div>Linked: {linksReport.summary?.creditNote?.linked || 0}</div>
                            <div>Unlinked: {linksReport.summary?.creditNote?.unlinked || 0}</div>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={4}>
                        <Card className="border">
                          <Card.Body>
                            <h6>Debit Notes → Purchase</h6>
                            <div>Linked: {linksReport.summary?.debitNote?.linked || 0}</div>
                            <div>Unlinked: {linksReport.summary?.debitNote?.unlinked || 0}</div>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={4}>
                        <Card className="border">
                          <Card.Body>
                            <h6>Challans → Sales</h6>
                            <div>Linked: {linksReport.summary?.deliveryChallan?.linked || 0}</div>
                            <div>Unlinked: {linksReport.summary?.deliveryChallan?.unlinked || 0}</div>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                    <Table responsive>
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Document</th>
                          <th>Reference</th>
                          <th>Link Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(linksReport.creditNotes || []).map((r) => (
                          <tr key={`cn-${r.id}`}>
                            <td>Credit Note</td>
                            <td>{r.credit_note_no}</td>
                            <td>{r.original_invoice_no || "—"}</td>
                            <td><Badge bg={r.linkStatus === "linked" ? "success" : r.linkStatus === "unlinked" ? "danger" : "secondary"}>{r.linkStatus}</Badge></td>
                          </tr>
                        ))}
                        {(linksReport.debitNotes || []).map((r) => (
                          <tr key={`dn-${r.id}`}>
                            <td>Debit Note</td>
                            <td>{r.debit_note_no}</td>
                            <td>{r.original_invoice_no || "—"}</td>
                            <td><Badge bg={r.linkStatus === "linked" ? "success" : r.linkStatus === "unlinked" ? "danger" : "secondary"}>{r.linkStatus}</Badge></td>
                          </tr>
                        ))}
                        {(linksReport.deliveryChallans || []).map((r) => (
                          <tr key={`dc-${r.id}`}>
                            <td>Delivery Challan</td>
                            <td>{r.challan_no}</td>
                            <td>{r.invoice_no || "—"}</td>
                            <td><Badge bg={r.linkStatus === "linked" ? "success" : r.linkStatus === "unlinked" ? "danger" : "secondary"}>{r.linkStatus}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </>
                )}
              </Tab.Pane>
            </Tab.Content>
          </Card.Body>
        </Card>
      </Tab.Container>
    </>
  );
};

export default AccountReports;
