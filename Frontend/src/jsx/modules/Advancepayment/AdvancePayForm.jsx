import React, { useState } from "react";
import { Card, Col } from "react-bootstrap";

const AdvancePayForm = () => {
  const [formData, setFormData] = useState({
    project_name: "",
    company: "",
    project_state: "",
    project_district: "",
    project_village: "",
    intervention: "",
    requested_amount: "",
    manager: "",
    purpose: "",
  });

  const [errors, setErrors] = useState({});

  // VALIDATE SINGLE FIELD
  const validateField = (name, value) => {
    switch (name) {
      case "project_name":
        return value ? "" : "Project Name is required.";

      case "requested_amount":
        if (!value) return "Requested Amount is required.";
        if (isNaN(value) || Number(value) <= 0)
          return "Amount must be a positive number.";
        return "";

      case "purpose":
        if (!value.trim()) return "Purpose is required.";
        if (value.trim().length < 5)
          return "Purpose must be at least 5 characters.";
        if (value.length > 500) return "Purpose cannot exceed 500 characters.";
        return "";

      default:
        return "";
    }
  };

  // VALIDATE ALL FIELDS
  const validateAll = () => {
    const newErrors = {};
    const fields = [
      "project_name",
      "company",
      "project_state",
      "project_district",
      "project_village",
      "intervention",
      "requested_amount",
      "manager",
      "purpose",
    ];

    fields.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    return newErrors;
  };

  // HANDLE CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // SUBMIT FORM
  const handleSubmit = (e) => {
    e.preventDefault();

    const validationErrors = validateAll();
    if (Object.values(validationErrors).some((err) => err !== "")) {
      setErrors(validationErrors);
      return;
    }

    alert("Advance Payment Request Created Successfully");

    // RESET FORM
    setFormData({
      project_name: "",
      company: "",
      project_state: "",
      project_district: "",
      project_village: "",
      intervention: "",
      requested_amount: "",
      manager: "",
      purpose: "",
    });
    setErrors({});
  };

  return (
    <Col lg={12}>
      <Card>
        <Card.Header>
          <Card.Title>New Advance Request</Card.Title>
        </Card.Header>

        <Card.Body>
          <form onSubmit={handleSubmit} noValidate>
            <div className="row">

              {/* Project Name */}
              <div className="col-lg-6 mb-3">
                <label>
                  Project Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="project_name"
                  className={`form-control ${errors.project_name ? "is-invalid" : ""}`}
                  value={formData.project_name}
                  onChange={handleChange}
                  placeholder="e.g. Road Repair – Block A"
                />
                {errors.project_name && (
                  <div className="invalid-feedback">{errors.project_name}</div>
                )}
              </div>

              {/* Company */}
              <div className="col-lg-6 mb-3">
                <label>Company</label>
                <input
                  type="text"
                  name="company"
                  className="form-control"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Company name"
                />
              </div>

              {/* State */}
              <div className="col-lg-6 mb-3">
                <label>State</label>
                <input
                  type="text"
                  name="project_state"
                  className="form-control"
                  value={formData.project_state}
                  onChange={handleChange}
                  placeholder="State"
                />
              </div>

              {/* District */}
              <div className="col-lg-6 mb-3">
                <label>District</label>
                <input
                  type="text"
                  name="project_district"
                  className="form-control"
                  value={formData.project_district}
                  onChange={handleChange}
                  placeholder="District"
                />
              </div>

              {/* Village */}
              <div className="col-lg-6 mb-3">
                <label>Village</label>
                <input
                  type="text"
                  name="project_village"
                  className="form-control"
                  value={formData.project_village}
                  onChange={handleChange}
                  placeholder="Village"
                />
              </div>

              {/* Intervention */}
              <div className="col-lg-6 mb-3">
                <label>Intervention</label>
                <input
                  type="text"
                  name="intervention"
                  className="form-control"
                  value={formData.intervention}
                  onChange={handleChange}
                  placeholder="e.g. Agriculture"
                />
              </div>

              {/* Requested Amount */}
              <div className="col-lg-6 mb-3">
                <label>
                  Requested Amount (₹) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  name="requested_amount"
                  className={`form-control ${errors.requested_amount ? "is-invalid" : ""}`}
                  value={formData.requested_amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e" || e.key === "E") {
                      e.preventDefault();
                    }
                  }}
                />
                {errors.requested_amount && (
                  <div className="invalid-feedback">{errors.requested_amount}</div>
                )}
              </div>

              {/* Manager */}
              <div className="col-lg-6 mb-3">
                <label>Manager</label>
                <input
                  type="text"
                  name="manager"
                  className="form-control"
                  value={formData.manager}
                  onChange={handleChange}
                  placeholder="e.g. Amit Sharma"
                />
              </div>

              {/* Purpose */}
              <div className="col-lg-12 mb-3">
                <label>
                  Purpose <span className="text-danger">*</span>
                </label>
                <textarea
                  name="purpose"
                  className={`form-control ${errors.purpose ? "is-invalid" : ""}`}
                  rows="3"
                  value={formData.purpose}
                  onChange={handleChange}
                  placeholder="Describe the purpose of this advance request (max 500 characters)"
                  maxLength={500}
                ></textarea>
                <small className="text-muted">
                  {formData.purpose.length}/500
                </small>
                {errors.purpose && (
                  <div className="invalid-feedback">{errors.purpose}</div>
                )}
              </div>

              <div className="text-end">
                <button type="submit" className="btn btn-primary">
                  Submit Request
                </button>
              </div>

            </div>
          </form>
        </Card.Body>
      </Card>
    </Col>
  );
};

export default AdvancePayForm;