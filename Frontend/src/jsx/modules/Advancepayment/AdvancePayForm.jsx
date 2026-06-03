import React, { useState, useEffect } from "react";
import { Card, Col } from "react-bootstrap";
import {
  getUsers,
  getProjectsAndInterventions,
  createAdvanceExpense,
} from "./AdvancePayAPI";

const AdvancePayForm = () => {

  const [formData, setFormData] = useState({
    user_id: "",
    project_id: "",
    amount: "",
    payment_mode: "",
    reference_no: "",
    payment_date: "",
    remarks: "",
    doc_file: null,
  });

  const [errors, setErrors] = useState({});
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(true);



  // FETCH DROPDOWN DATA
  useEffect(() => {

    const fetchDropdowns = async () => {

      setDropdownLoading(true);

      try {

        const [usersRes, projectsRes] = await Promise.all([
          getUsers(),
          getProjectsAndInterventions(),
        ]);

        if (usersRes.ok) {
          setUsers(usersRes.result?.data || usersRes.result || []);
        }

        if (projectsRes.ok) {
          setProjects(projectsRes.projects || []);
        }

      } catch (error) {

        console.error("Dropdown fetch error:", error);

      } finally {

        setDropdownLoading(false);

      }
    };

    fetchDropdowns();

  }, []);

  // VALIDATION
  const validateField = (name, value) => {

    switch (name) {

      case "user_id":
        return value ? "" : "User is required.";

      case "amount":

        if (!value) return "Amount is required.";

        if (isNaN(value) || Number(value) <= 0) {
          return "Amount must be a positive number.";
        }

        return "";

      case "payment_mode":
        return value ? "" : "Payment mode is required.";

      case "payment_date":

        if (!value) return "Payment date is required.";

        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return "Invalid date format (YYYY-MM-DD).";
        }

        return "";

      default:
        return "";
    }
  };

  // VALIDATE ALL
  const validateAll = () => {

    const newErrors = {};

    ["user_id", "amount", "payment_mode", "payment_date"].forEach(
      (field) => {

        const error = validateField(field, formData[field]);

        if (error) {
          newErrors[field] = error;
        }
      }
    );

    return newErrors;
  };

  // HANDLE CHANGE
  const handleChange = (e) => {

    const { name, value, files } = e.target;

    if (name === "doc_file") {

      setFormData((prev) => ({
        ...prev,
        doc_file: files[0] || null,
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    const error = validateField(name, value);

    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  // HANDLE SUBMIT
  const handleSubmit = async (e) => {

    e.preventDefault();



    const validationErrors = validateAll();

    if (
      Object.values(validationErrors).some(
        (err) => err !== ""
      )
    ) {

      setErrors(validationErrors);

      return;
    }

    setLoading(true);
    try {

      const response = await createAdvanceExpense(formData);

      // ALERT SUCCESS MESSAGE
      alert(response?.message || "Request Submitted Successfully");

      setFormData({
        user_id: "",
        project_id: "",
        amount: "",
        payment_mode: "",
        reference_no: "",
        payment_date: "",
        remarks: "",
        doc_file: null,
      });

      setErrors({});

    } catch (error) {

      console.error(error);


      alert(
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong"
      );

    }

  };

  return (
    <Col lg={12}>

      <Card>

        <Card.Header>
          <Card.Title>
            New Advance Request
          </Card.Title>
        </Card.Header>

        <Card.Body>
          <form onSubmit={handleSubmit} noValidate>

            <div className="row">

              {/* USER */}
              <div className="col-lg-6 mb-3">

                <label>
                  User <span className="text-danger">*</span>
                </label>

                <select
                  name="user_id"
                  className={`form-control ${errors.user_id ? "is-invalid" : ""
                    }`}
                  value={formData.user_id}
                  onChange={handleChange}
                  disabled={dropdownLoading}
                >

                  <option value="">
                    {dropdownLoading
                      ? "Loading users..."
                      : "-- Select User --"}
                  </option>

                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.email})
                    </option>
                  ))}

                </select>

                {errors.user_id && (
                  <div className="invalid-feedback">
                    {errors.user_id}
                  </div>
                )}

              </div>

              {/* PROJECT */}
              <div className="col-lg-6 mb-3">

                <label>Project</label>

                <select
                  name="project_id"
                  className="form-control"
                  value={formData.project_id}
                  onChange={handleChange}
                  disabled={dropdownLoading}
                >

                  <option value="">
                    {dropdownLoading
                      ? "Loading projects..."
                      : "-- Select Project --"}
                  </option>

                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}

                </select>

              </div>

              {/* AMOUNT */}
              <div className="col-lg-6 mb-3">

                <label>
                  Amount (₹)
                  <span className="text-danger">*</span>
                </label>

                <input
                  type="number"
                  name="amount"
                  className={`form-control ${errors.amount ? "is-invalid" : ""
                    }`}
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                />

                {errors.amount && (
                  <div className="invalid-feedback">
                    {errors.amount}
                  </div>
                )}

              </div>

              {/* PAYMENT MODE */}
              <div className="col-lg-6 mb-3">

                <label>
                  Payment Mode
                  <span className="text-danger">*</span>
                </label>

                <select
                  name="payment_mode"
                  className={`form-control ${errors.payment_mode ? "is-invalid" : ""
                    }`}
                  value={formData.payment_mode}
                  onChange={handleChange}
                >

                  <option value="">
                    -- Select Payment Mode --
                  </option>

                  <option value="cash">
                    Cash
                  </option>

                  <option value="bank_transfer">
                    Bank Transfer
                  </option>

                  <option value="upi">
                    UPI
                  </option>

                  <option value="cheque">
                    Cheque
                  </option>

                </select>

                {errors.payment_mode && (
                  <div className="invalid-feedback">
                    {errors.payment_mode}
                  </div>
                )}

              </div>

              {/* PAYMENT DATE */}
              <div className="col-lg-6 mb-3">

                <label>
                  Payment Date
                  <span className="text-danger">*</span>
                </label>

                <input
                  type="date"
                  name="payment_date"
                  className={`form-control ${errors.payment_date ? "is-invalid" : ""
                    }`}
                  value={formData.payment_date}
                  onChange={handleChange}
                />

                {errors.payment_date && (
                  <div className="invalid-feedback">
                    {errors.payment_date}
                  </div>
                )}

              </div>

              {/* REFERENCE */}
              <div className="col-lg-6 mb-3">

                <label>Reference No</label>

                <input
                  type="text"
                  name="reference_no"
                  className="form-control"
                  value={formData.reference_no}
                  onChange={handleChange}
                  placeholder="TXN123456"
                />

              </div>

              {/* FILE */}
              <div className="col-lg-6 mb-3">

                <label>Document</label>

                <input
                  type="file"
                  name="doc_file"
                  className="form-control"
                  onChange={handleChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                />

              </div>

              {/* REMARKS */}
              <div className="col-lg-12 mb-3">

                <label>Remarks</label>

                <textarea
                  name="remarks"
                  className="form-control"
                  rows="3"
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Optional remarks"
                />

              </div>

              {/* SUBMIT */}
              <div className="text-end">

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >

                  {loading
                    ? "Submitting..."
                    : "Submit Request"}

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