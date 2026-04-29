import React, { useEffect, useState } from "react";
import { Card, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";


const AddExpense = () => {
  const [projects, setProjects] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const navigate = useNavigate();


  const [formData, setFormData] = useState({
    project_name: "",
    project_state: "",
    project_district: "",
    project_village: "",
    intervention: "",
    amount: "",
    document: null,
    remarks: "",
  });

  const [errors, setErrors] = useState({});

  // FETCH DROPDOWN DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_API_URL}expense/add-expense`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const data = await res.json();
        console.log("API DATA 👉", data);
        setProjects(data.projects || []);
        setInterventions(data.interventions || []);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  // VALIDATE SINGLE FIELD
  const validateField = (name, value) => {
    switch (name) {
      case "project_name":
        return value ? "" : "Project Name is required.";

      case "project_state":
        if (!value.trim()) return "State is required.";
        if (!/^[a-zA-Z\s]+$/.test(value.trim()))
          return "State should contain only letters.";
        return "";

      case "project_district":
        if (!value.trim()) return "District is required.";
        if (!/^[a-zA-Z\s]+$/.test(value.trim()))
          return "District should contain only letters.";
        return "";

      case "project_village":
        if (!value.trim()) return "Village is required.";
        if (!/^[a-zA-Z\s]+$/.test(value.trim()))
          return "Village should contain only letters.";
        return "";

      case "intervention":
        return value ? "" : "Intervention is required.";

      case "amount":
        if (!value) return "Amount is required.";
        if (isNaN(value) || Number(value) <= 0)
          return "Amount must be a positive number.";
        return "";

      case "document": {
        if (!value) return "";
        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "application/pdf",
          "image/jpg",
        ];
        if (!allowedTypes.includes(value.type))
          return "Only JPG, PNG, or PDF files are allowed.";
        if (value.size > 5 * 1024 * 1024)
          return "File size must be less than 5MB.";
        return "";
      }

      case "remarks":
        if (value.trim() && value.trim().length < 5)
          return "Remarks must be at least 5 characters if provided.";
        if (value.length > 500)
          return "Remarks cannot exceed 500 characters.";
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
      "project_state",
      "project_district",
      "project_village",
      "intervention",
      "amount",
      "remarks",
    ];

    fields.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    // Validate document separately
    const docError = validateField("document", formData.document);
    if (docError) newErrors.document = docError;

    return newErrors;
  };

  // HANDLE CHANGE
  // const handleChange = (e) => {
  //   const { name, value, files } = e.target;
  //   let newValue = name === "document" ? files[0] : value;

  //   setFormData((prev) => ({ ...prev, [name]: newValue }));

  //   // Live validation: clear error as user fixes it
  //   const error = validateField(name, newValue);
  //   setErrors((prev) => ({ ...prev, [name]: error }));
  // };

  const handleChange = (e) => {
  const { name, value, files } = e.target;
  
  // Fix: check if files exists and has items
  let newValue;
  if (name === "document") {
    newValue = files && files.length > 0 ? files[0] : null;
  } else {
    newValue = value;
  }

  setFormData((prev) => ({ ...prev, [name]: newValue }));

  const error = validateField(name, newValue);
  setErrors((prev) => ({ ...prev, [name]: error }));
};

  // SUBMIT FORM
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateAll();
    if (Object.values(validationErrors).some((err) => err !== "")) {
      setErrors(validationErrors);
      return;
    }

    try {
      const form = new FormData();
      form.append("project_name", formData.project_name);
      form.append("project_state", formData.project_state);
      form.append("project_district", formData.project_district);
      form.append("project_village", formData.project_village);
      form.append("amount", formData.amount);
      form.append("intervention", formData.intervention);
      form.append("remarks", formData.remarks);
      if (formData.document) {
        form.append("document", formData.document);
      }

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}expense/create`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: form,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      alert("Expense Created Successfully");
      navigate("/payment-list");

      // RESET FORM
      setFormData({
        project_name: "",
        project_state: "",
        project_district: "",
        project_village: "",
        intervention: "",
        amount: "",
        document: null,
        remarks: "",
      });
      setErrors({});
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    }
  };

  return (
    <Col lg={12}>
      <Card>
        <Card.Header>
          <Card.Title>Create Expense</Card.Title>
        </Card.Header>

        <Card.Body>
          <form onSubmit={handleSubmit} noValidate>
            <div className="row">

              {/* Project Name */}
              <div className="col-lg-6 mb-3">
                <label>
                  Project Name <span className="text-danger">*</span>
                </label>
                <select
                  name="project_name"
                  className={`form-control ${errors.project_name ? "is-invalid" : ""}`}
                  value={formData.project_name}
                  onChange={handleChange}
                >
                  <option value="">Select Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {errors.project_name && (
                  <div className="invalid-feedback">{errors.project_name}</div>
                )}
              </div>

              {/* State */}
              <div className="col-lg-6 mb-3">
                <label>
                  State <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="project_state"
                  className={`form-control ${errors.project_state ? "is-invalid" : ""}`}
                  value={formData.project_state}
                  onChange={handleChange}
                  placeholder="e.g. Rajasthan"
                />
                {errors.project_state && (
                  <div className="invalid-feedback">{errors.project_state}</div>
                )}
              </div>

              {/* District */}
              <div className="col-lg-6 mb-3">
                <label>
                  District <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="project_district"
                  className={`form-control ${errors.project_district ? "is-invalid" : ""}`}
                  value={formData.project_district}
                  onChange={handleChange}
                  placeholder="e.g. Jaipur"
                />
                {errors.project_district && (
                  <div className="invalid-feedback">{errors.project_district}</div>
                )}
              </div>

              {/* Village */}
              <div className="col-lg-6 mb-3">
                <label>
                  Village <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="project_village"
                  className={`form-control ${errors.project_village ? "is-invalid" : ""}`}
                  value={formData.project_village}
                  onChange={handleChange}
                  placeholder="e.g. Sanganer"
                />
                {errors.project_village && (
                  <div className="invalid-feedback">{errors.project_village}</div>
                )}
              </div>

              {/* Intervention */}
              <div className="col-lg-6 mb-3">
                <label>
                  Intervention <span className="text-danger">*</span>
                </label>
                <select
                  name="intervention"
                  className={`form-control ${errors.intervention ? "is-invalid" : ""}`}
                  value={formData.intervention}
                  onChange={handleChange}
                >
                  <option value="">Select Intervention</option>
                  {interventions.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
                {errors.intervention && (
                  <div className="invalid-feedback">{errors.intervention}</div>
                )}
              </div>

              {/* Amount */}
              <div className="col-lg-6 mb-3">
                <label>
                  Amount (₹) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  className={`form-control ${errors.amount ? "is-invalid" : ""}`}
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  min="0.01"
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e" || e.key === "E") {
                      e.preventDefault();
                    }
                  }}
                />
              </div>

              {/* Document */}
              <div className="col-lg-12 mb-3">
                <label>Upload Document</label>
        <input
  type="file"
  name="document"
  className={`form-control ${errors.document ? "is-invalid" : ""}`}
  onChange={handleChange}
  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,image/jpg,application/pdf"
  multiple={false}
/>
                <small className="text-muted">
                  Allowed: JPG, PNG, PDF — Max size: 5MB
                </small>
                {errors.document && (
                  <div className="invalid-feedback d-block">{errors.document}</div>
                )}
              </div>

              {/* Remarks */}
              <div className="col-lg-12 mb-3">
                <label>Remarks</label>
                <textarea
                  name="remarks"
                  className={`form-control ${errors.remarks ? "is-invalid" : ""}`}
                  rows="3"
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Optional remarks (max 500 characters)"
                  maxLength={500}
                ></textarea>
                <small className="text-muted">
                  {formData.remarks.length}/500
                </small>
                {errors.remarks && (
                  <div className="invalid-feedback">{errors.remarks}</div>
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

export default AddExpense;