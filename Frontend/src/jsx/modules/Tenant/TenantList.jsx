import React, { useEffect, useState } from "react";
import { Col, Card, Table, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../layouts/PageTitle";
import { getTenants, deleteTenant, tenantLogoUrl } from "./tenantApi";

const TenantList = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const rows = await getTenants();
      setTenants(rows);
    } catch (error) {
      alert(error.message || "Failed to load tenants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete tenant "${name}" and its admin user?`)) return;
    try {
      await deleteTenant(id);
      fetchTenants();
    } catch (error) {
      alert(error.message || "Delete failed");
    }
  };

  return (
    <>
      <PageTitle activeMenu="Company List" motherMenu="Settings" />

      <Col lg={12}>
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <Card.Title>Companies</Card.Title>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => navigate("/tenant/add")}
            >
              <i className="fa fa-plus me-1" /> Add Company
            </button>
          </Card.Header>

          <Card.Body>
            {loading ? (
              <p className="mb-0">Loading...</p>
            ) : (
              <Table responsive className="text-nowrap">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Company Name</th>
                    <th>Sidebar Name</th>
                    <th>Logo</th>
                    <th>Unique ID (company_id)</th>
                    <th>Admin Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.length ? (
                    tenants.map((t, i) => (
                      <tr key={t.id}>
                        <td>{i + 1}</td>
                        <td>{t.name}</td>
                        <td>{t.tenant_showing_name || t.name}</td>
                        <td>
                          {t.tenant_logo ? (
                            <img
                              src={tenantLogoUrl(t.tenant_logo)}
                              alt=""
                              style={{ height: 32, maxWidth: 80, objectFit: "contain" }}
                            />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          <code>{t.unique_id}</code>
                        </td>
                        <td>{t.email}</td>
                        <td>{t.phone || "—"}</td>
                        <td>
                          <Badge bg={t.status ? "success" : "secondary"}>
                            {t.status ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <button
                              type="button"
                              className="btn btn-primary btn-xs sharp"
                              onClick={() => navigate(`/tenant/edit/${t.id}`)}
                            >
                              <i className="fas fa-pencil-alt" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-xs sharp"
                              onClick={() => handleDelete(t.id, t.name)}
                            >
                              <i className="fa fa-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="text-center">
                        No companies found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </Col>
    </>
  );
};

export default TenantList;
