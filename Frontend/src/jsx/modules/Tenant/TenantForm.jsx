import React, { useEffect, useState } from "react";
import { Col, Card, Row, Form } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import PageTitle from "../../layouts/PageTitle";
import { createTenant, updateTenant, getTenantById, tenantLogoUrl } from "./tenantApi";

const TenantForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [existingLogo, setExistingLogo] = useState("");
  const [removeLogo, setRemoveLogo] = useState(false);
  const [form, setForm] = useState({
    unique_id: "",
    name: "",
    tenant_showing_name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    status: true,
  });

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const tenant = await getTenantById(id);
        setForm({
          unique_id: tenant.unique_id || "",
          name: tenant.name || "",
          tenant_showing_name: tenant.tenant_showing_name || "",
          email: tenant.email || "",
          password: "",
          phone: tenant.phone || "",
          address: tenant.address || "",
          status: tenant.status !== false,
        });
        setExistingLogo(tenant.tenant_logo || "");
      } catch (error) {
        alert(error.message || "Failed to load tenant");
        navigate("/tenant/list");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit, navigate]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("tenant_showing_name", form.tenant_showing_name.trim());
    fd.append("email", form.email.trim());
    fd.append("phone", form.phone.trim());
    fd.append("address", form.address.trim());
    fd.append("status", form.status ? "1" : "0");

    if (!isEdit) {
      fd.append("unique_id", form.unique_id.trim());
      fd.append("password", form.password.trim());
    } else if (form.password.trim()) {
      fd.append("password", form.password.trim());
    }

    if (logoFile) fd.append("tenant_logo", logoFile);
    if (isEdit && removeLogo) fd.append("remove_logo", "1");

    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      alert("Company name and admin email are required");
      return;
    }
    if (!isEdit && !form.password.trim()) {
      alert("Admin password is required for new company");
      return;
    }

    try {
      setSubmitting(true);
      const payload = buildFormData();
      if (isEdit) {
        await updateTenant(id, payload);
      } else {
        await createTenant(payload);
      }
      window.dispatchEvent(new Event("tenant-branding-updated"));
      navigate("/tenant/list");
    } catch (error) {
      alert(error.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const currentLogo = logoPreview || (existingLogo && !removeLogo ? tenantLogoUrl(existingLogo) : "");

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <PageTitle
        activeMenu={isEdit ? "Edit Company" : "Add Company"}
        motherMenu="Settings"
      />

      <Col lg={12}>
        <Card>
          <Card.Header>
            <Card.Title>{isEdit ? "Edit Company" : "Add Company"}</Card.Title>
          </Card.Header>
          <Card.Body>
            <p className="text-muted small mb-4">
              Each company has one unique ID used as <code>company_id</code> for all users and data.
              The showing name and logo appear in the sidebar for users of that company.
            </p>

            <form onSubmit={handleSubmit}>
              <Row className="mb-3">
                <Col md={4}>
                  <Form.Label>Company Name *</Form.Label>
                  <Form.Control
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="Acme Corporation"
                  />
                </Col>
                <Col md={4}>
                  <Form.Label>Sidebar Display Name</Form.Label>
                  <Form.Control
                    value={form.tenant_showing_name}
                    onChange={(e) => setField("tenant_showing_name", e.target.value)}
                    placeholder="Shown in sidebar (defaults to company name)"
                  />
                </Col>
                {!isEdit && (
                  <Col md={4}>
                    <Form.Label>Unique ID (company_id)</Form.Label>
                    <Form.Control
                      value={form.unique_id}
                      onChange={(e) => setField("unique_id", e.target.value.toUpperCase())}
                      placeholder="Auto-generated if empty"
                    />
                  </Col>
                )}
                {isEdit && (
                  <Col md={4}>
                    <Form.Label>Unique ID (company_id)</Form.Label>
                    <Form.Control value={form.unique_id} disabled readOnly />
                  </Col>
                )}
              </Row>

              <Row className="mb-3">
                <Col md={4}>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={form.status ? "1" : "0"}
                    onChange={(e) => setField("status", e.target.value === "1")}
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Form.Label>Company Logo</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      setLogoFile(e.target.files?.[0] || null);
                      setRemoveLogo(false);
                    }}
                  />
                  <Form.Text className="text-muted">
                    Shown in sidebar for all users with this company_id.
                  </Form.Text>
                </Col>
                <Col md={4} className="d-flex align-items-end">
                  {currentLogo ? (
                    <div>
                      <img
                        src={currentLogo}
                        alt="Company logo preview"
                        style={{ maxHeight: 56, maxWidth: 160, objectFit: "contain" }}
                      />
                      {isEdit && existingLogo && !logoFile && !removeLogo && (
                        <button
                          type="button"
                          className="btn btn-link btn-sm text-danger p-0 ms-2"
                          onClick={() => setRemoveLogo(true)}
                        >
                          Remove logo
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted small">No logo selected</span>
                  )}
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={12}>
                  <Form.Label>Company Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={form.address}
                    onChange={(e) => setField("address", e.target.value)}
                  />
                </Col>
              </Row>

              <h5 className="mb-2 mt-2">Company Admin Login</h5>
              <p className="text-muted small mb-3">
                Auto-created with admin role. Manage only here — not from Employee list.
              </p>
              <Row className="mb-4">
                <Col md={4}>
                  <Form.Label>Admin Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                  />
                </Col>
                <Col md={4}>
                  <Form.Label>{isEdit ? "New Password" : "Admin Password *"}</Form.Label>
                  <Form.Control
                    type="password"
                    value={form.password}
                    onChange={(e) => setField("password", e.target.value)}
                    placeholder={isEdit ? "Leave blank to keep current" : ""}
                  />
                </Col>
                <Col md={4}>
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                  />
                </Col>
              </Row>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : isEdit ? "Update Company" : "Create Company"}
                </button>
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => navigate("/tenant/list")}
                >
                  Cancel
                </button>
              </div>
            </form>
          </Card.Body>
        </Card>
      </Col>
    </>
  );
};

export default TenantForm;
