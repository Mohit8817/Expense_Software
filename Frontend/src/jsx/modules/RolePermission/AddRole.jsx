import React, { useState } from "react";
import PageTitle from "../../layouts/PageTitle";
import { useNavigate } from "react-router-dom";
import { createRole } from "./roleApi.js";

const AddRole = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const [errors, setErrors] = useState({});

  // ✅ Validation
  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Role Name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Handle Change
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({ ...formData, [name]: value });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // ✅ Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const res = await createRole(formData);

      if (res?.data?.success === false) {
        alert(res.data.message || "Something went wrong");
        return;
      }

      alert("Role created successfully ✅");
      navigate("/role/list", { replace: true });

    } catch (error) {
      console.error(error);
      alert("Error creating role");
    }
  };

  return (
    <>
      <PageTitle activeMenu="Role Form" motherMenu="Role Management" />

      <div className="row">
        <div className="col-xl-12">
          <div className="card">

            <div className="card-header">
              <h4 className="card-title">Add Role</h4>
            </div>

            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">

                  {/* ROLE NAME */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Role Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.name ? "is-invalid" : ""}`}
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                    />
                    {errors.name && (
                      <div className="invalid-feedback">{errors.name}</div>
                    )}
                  </div>

                  {/* DESCRIPTION */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Description <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.description ? "is-invalid" : ""}`}
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                    />
                    {errors.description && (
                      <div className="invalid-feedback">
                        {errors.description}
                      </div>
                    )}
                  </div>

                </div>

                <div className="text-end mt-3">
                  <button type="submit" className="btn btn-primary">
                    Save Role
                  </button>
                </div>

              </form>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default AddRole;