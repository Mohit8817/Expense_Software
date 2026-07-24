import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Col, Row, Card, Table, Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import PageTitle from "../../layouts/PageTitle";
import { getAccountDashboard, formatMoney, approvalLabel } from "./accountDashboardApi";

const MODULE_LINKS = [
  { key: "sales", label: "Sales Invoice", route: "/account/Sales-Invoice", color: "primary" },
  { key: "purchase", label: "Purchase Invoice", route: "/account/Purchase-Invoice", color: "info" },
  { key: "creditNote", label: "Credit Note", route: "/account/credit-note", color: "warning" },
  { key: "debitNote", label: "Debit Note", route: "/account/debit-note", color: "danger" },
  { key: "deliveryChallan", label: "Delivery Challan", route: "/account/Delivery-Challan", color: "secondary" },
  { key: "journalVoucher", label: "Journal Voucher", route: "/account/Expense", color: "success" },
  { key: "paymentVoucher", label: "Payment Voucher", route: "/account/Payment", color: "dark" },
];

const StatCard = ({ title, stats, color = "primary" }) => (
  <Card className="border-0 shadow-sm h-100">
    <Card.Body>
      <div className="d-flex justify-content-between align-items-start mb-2">
        <h6 className="text-muted mb-0">{title}</h6>
        <Badge bg={color} className="rounded-pill">{stats?.total || 0}</Badge>
      </div>
      <h3 className="mb-2">{formatMoney(stats?.amount)}</h3>
      <div className="d-flex gap-3 small">
        <span className="text-warning">Draft {stats?.draft || 0}</span>
        <span className="text-success">Posted {stats?.posted || 0}</span>
        <span className="text-danger">Cancelled {stats?.cancelled || 0}</span>
      </div>
    </Card.Body>
  </Card>
);

const AccountDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAccountDashboard();
      setData(res);
    } catch (error) {
      toast.error(error.message || "Failed to load account dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <>
        <PageTitle activeMenu="Account Dashboard" motherMenu="Accounting" />
        <p className="text-center text-muted py-5">Loading account dashboard...</p>
      </>
    );
  }

  const summary = data?.summary || {};
  const links = data?.links || {};

  return (
    <>
      <PageTitle activeMenu="Account Dashboard" motherMenu="Accounting" />

      <Row className="mb-3">
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <h5 className="mb-1 fw-bold">Accounting Overview</h5>
                <p className="text-muted mb-0 small">
                  Sales, purchase, vouchers, and journal entries in one place.
                </p>
              </div>
              <Link to="/account/reports" className="btn btn-primary">
                <i className="fa fa-chart-bar me-1"></i> View Reports
              </Link>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h6 className="text-muted">Masters</h6>
              <div className="d-flex justify-content-between">
                <Link to="/account/Company-Detail">Companies</Link>
                <span className="fw-bold">{summary.masters?.companies || 0}</span>
              </div>
              <div className="d-flex justify-content-between mt-2">
                <Link to="/account/Product-Detail">Products</Link>
                <span className="fw-bold">{summary.masters?.products || 0}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 mb-3">
        {MODULE_LINKS.map((mod) => (
          <Col xl={4} lg={6} key={mod.key}>
            <Link to={mod.route} className="text-decoration-none text-dark">
              <StatCard title={mod.label} stats={summary[mod.key]} color={mod.color} />
            </Link>
          </Col>
        ))}
      </Row>

      <Row className="g-3 mb-3">
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white fw-bold">Tally Sync Status</Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>Not Pushed</span>
                <Badge bg="secondary">{data?.tally?.notPushed || 0}</Badge>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Pushed</span>
                <Badge bg="success">{data?.tally?.pushed || 0}</Badge>
              </div>
              <div className="d-flex justify-content-between">
                <span>Failed</span>
                <Badge bg="danger">{data?.tally?.failed || 0}</Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white fw-bold">Document Links (Sales ↔ Credit Note / Challan, Purchase ↔ Debit Note)</Card.Header>
            <Card.Body>
              <Row>
                <Col md={4} className="mb-3 mb-md-0">
                  <div className="small text-muted">Credit Notes</div>
                  <div>Linked: <strong>{links.creditNote?.linked || 0}</strong></div>
                  <div>Unlinked ref: <strong className="text-danger">{links.creditNote?.unlinked || 0}</strong></div>
                  <div>No ref: <strong>{links.creditNote?.missingRef || 0}</strong></div>
                </Col>
                <Col md={4} className="mb-3 mb-md-0">
                  <div className="small text-muted">Debit Notes</div>
                  <div>Linked: <strong>{links.debitNote?.linked || 0}</strong></div>
                  <div>Unlinked ref: <strong className="text-danger">{links.debitNote?.unlinked || 0}</strong></div>
                  <div>No ref: <strong>{links.debitNote?.missingRef || 0}</strong></div>
                </Col>
                <Col md={4}>
                  <div className="small text-muted">Delivery Challans</div>
                  <div>Linked: <strong>{links.deliveryChallan?.linked || 0}</strong></div>
                  <div>Unlinked ref: <strong className="text-danger">{links.deliveryChallan?.unlinked || 0}</strong></div>
                  <div>No ref: <strong>{links.deliveryChallan?.missingRef || 0}</strong></div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 mb-3">
        <Col lg={6}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white fw-bold">Monthly Sales vs Purchase (Posted)</Card.Header>
            <Card.Body className="p-0">
              <Table responsive className="mb-0">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Sales</th>
                    <th>Purchase</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.monthly || []).length ? (
                    data.monthly.map((row) => (
                      <tr key={row.month}>
                        <td>{row.month}</td>
                        <td className="text-success">{formatMoney(row.sales)}</td>
                        <td className="text-primary">{formatMoney(row.purchase)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center text-muted py-4">No posted data yet</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white fw-bold">Recent Activity</Card.Header>
            <Card.Body className="p-0">
              <Table responsive className="mb-0">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Doc No</th>
                    <th>Party</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recent || []).length ? (
                    data.recent.map((row, idx) => (
                      <tr key={`${row.type}-${row.id}-${idx}`}>
                        <td>{row.type}</td>
                        <td>
                          <Link to={row.route}>{row.docNo || "—"}</Link>
                        </td>
                        <td>{row.party || "—"}</td>
                        <td>{formatMoney(row.amount)}</td>
                        <td>{approvalLabel(row.status)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">No recent documents</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={12}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white fw-bold">Quick Links</Card.Header>
            <Card.Body className="d-flex flex-wrap gap-2">
              {MODULE_LINKS.map((mod) => (
                <Link key={mod.key} to={mod.route} className={`btn btn-outline-${mod.color} btn-sm`}>
                  {mod.label}
                </Link>
              ))}
              <Link to="/account/Company-Detail" className="btn btn-outline-dark btn-sm">Company Master</Link>
              <Link to="/account/Product-Detail" className="btn btn-outline-dark btn-sm">Product Master</Link>
              <Link to="/account/reports" className="btn btn-outline-primary btn-sm">Account Reports</Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default AccountDashboard;
