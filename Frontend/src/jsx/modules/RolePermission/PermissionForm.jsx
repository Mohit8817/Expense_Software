import React, { useState } from "react";
import PageTitle from "../../layouts/PageTitle";
import { useNavigate } from "react-router-dom";
import { createPermission } from "./permissionApi";

const PermissionForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    label: "",
    module: "",
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Permission key required";
    if (!formData.label.trim()) newErrors.label = "Label required";
    if (!formData.module.trim()) newErrors.module = "Module required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({ ...formData, [name]: value });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await createPermission(formData);
      alert("Permission created  ");
      navigate("/permission/list");
    } catch (error) {
      console.error(error);
      alert("Error creating permission");
    }
  };

  return (
    <>
      <PageTitle activeMenu="Permission Form" motherMenu="Permission Management" />

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">

              <div className="col-md-4 mb-3">
                <label className="form-label">Permission Key</label>
                <input
                  type="text"
                  className={`form-control ${errors.name ? "is-invalid" : ""}`}
                  name="name"
                  placeholder="create_expense"
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">Label</label>
                <input
                  type="text"
                  className={`form-control ${errors.label ? "is-invalid" : ""}`}
                  name="label"
                  placeholder="Create Expense"
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">Module</label>
                <input
                  type="text"
                  className={`form-control ${errors.module ? "is-invalid" : ""}`}
                  name="module"
                  placeholder="Expense"
                  onChange={handleChange}
                />
              </div>

            </div>

            <div className="text-end">
              <button className="btn btn-primary">Save Permission</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default PermissionForm;