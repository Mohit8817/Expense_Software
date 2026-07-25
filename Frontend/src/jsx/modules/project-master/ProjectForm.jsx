import React, { useState } from "react";
import PageTitle from "../../layouts/PageTitle";
import { createProject, getManagers } from "./projectApi";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const ProjectMasterForm = () => {
  const navigate = useNavigate();

  const [Manager, setManager] = useState([]);

  const [formData, setFormData] = useState({
    project_name: "",
    start_date: "",
    end_date: "",
    financial_year: "",
    funder_name: "",
    contact_person: "",
    contact_person_number: "",
    mou: null,
    manager_id: "",
    description: "",
    projectStatus: "",
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!formData.project_name.trim())
      newErrors.project_name = "Project Name is required";

    if (!formData.start_date)
      newErrors.start_date = "Start Date is required";

    if (!formData.end_date)
      newErrors.end_date = "End Date is required";

    if (formData.start_date && formData.end_date && formData.end_date < formData.start_date)
      newErrors.end_date = "End Date cannot be before Start Date";

    if (!formData.financial_year.trim())
      newErrors.financial_year = "Financial Year is required";

    if (!formData.funder_name.trim())
      newErrors.funder_name = "Funder Name is required";

    if (!formData.contact_person.trim())
      newErrors.contact_person = "Contact Person is required";

    if (!formData.contact_person_number.trim())
      newErrors.contact_person_number = "Contact Number is required";
    else if (!/^\d{10}$/.test(formData.contact_person_number))
      newErrors.contact_person_number = "Enter valid 10-digit number";

    if (!formData.manager_id.trim())
      newErrors.manager_id = "Project Manager is required";

    if (!formData.projectStatus)
      newErrors.projectStatus = "Project Status is required";

    if (!formData.description.trim())
      newErrors.description = "Description is required";

    // MOU validation add
    if (!formData.mou)
      newErrors.mou = "MOU file is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "mou") {
      setFormData({ ...formData, mou: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };


  useEffect(() => {
    const fetchManagers = async () => {
      const { ok, result } = await getManagers();
      console.log("Managers API response:", ok, result);
      if (ok) setManager(result);
    };
    fetchManagers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const form = new FormData();

      form.append("project_name", formData.project_name);
      form.append("start_date", formData.start_date);
      form.append("end_date", formData.end_date);
      form.append("financial_year", formData.financial_year);
      form.append("funder_name", formData.funder_name);
      form.append("contact_person", formData.contact_person);
      form.append("contact_person_number", formData.contact_person_number);
      form.append("manager_id", formData.manager_id);
      form.append("description", formData.description);
      form.append("status", formData.projectStatus === "Ongoing" ? "true" : "false");

      if (formData.mou) {
        form.append("mou", formData.mou);
      }

      const data = await createProject(form);

      if (data?.success === false) {
        alert(data.message || "Something went wrong");
        return;
      }

      alert("Project created successfully  ");
      navigate("/project-list", { replace: true });
    } catch (error) {
      console.error(error);
      alert("Error creating project");
    }
  };

  return (
    <>
      <PageTitle activeMenu="Project Master Form" motherMenu="Project Master" />

      <div className="row">
        <div className="col-xl-12">
          <div className="card">

            <div className="card-header">
              <h4 className="card-title">Add Project</h4>
            </div>

            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Project Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className={`form-control ${errors.project_name ? "is-invalid" : ""}`}
                      name="project_name"
                      value={formData.project_name}
                      onChange={handleChange}
                    />
                    {errors.project_name && <div className="invalid-feedback">{errors.project_name}</div>}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Start Date <span className="text-danger">*</span></label>
                    <input
                      type="date"
                      className={`form-control ${errors.start_date ? "is-invalid" : ""}`}
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                    />
                    {errors.start_date && <div className="invalid-feedback">{errors.start_date}</div>}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">End Date <span className="text-danger">*</span></label>
                    <input
                      type="date"
                      className={`form-control ${errors.end_date ? "is-invalid" : ""}`}
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleChange}
                    />
                    {errors.end_date && <div className="invalid-feedback">{errors.end_date}</div>}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Financial Year <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className={`form-control ${errors.financial_year ? "is-invalid" : ""}`}
                      name="financial_year"
                      value={formData.financial_year}
                      placeholder="2025-2026"
                      onChange={handleChange}
                    />
                    {errors.financial_year && <div className="invalid-feedback">{errors.financial_year}</div>}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Funder Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className={`form-control ${errors.funder_name ? "is-invalid" : ""}`}
                      name="funder_name"
                      value={formData.funder_name}
                      onChange={handleChange}
                    />
                    {errors.funder_name && <div className="invalid-feedback">{errors.funder_name}</div>}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Contact Person <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className={`form-control ${errors.contact_person ? "is-invalid" : ""}`}
                      name="contact_person"
                      value={formData.contact_person}
                      onChange={handleChange}
                    />
                    {errors.contact_person && <div className="invalid-feedback">{errors.contact_person}</div>}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Contact Person Number <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className={`form-control ${errors.contact_person_number ? "is-invalid" : ""}`}
                      name="contact_person_number"
                      value={formData.contact_person_number}
                      onChange={handleChange}
                      maxLength={10}
                    />
                    {errors.contact_person_number && <div className="invalid-feedback">{errors.contact_person_number}</div>}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Upload MOU <span className="text-danger">*</span>
                    </label>
                    <input
                      type="file"
                      className={`form-control ${errors.mou ? "is-invalid" : ""}`}
                      name="mou"
                      onChange={handleChange}
                    />
                    {errors.mou && <div className="invalid-feedback">{errors.mou}</div>}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Project Manager <span className="text-danger">*</span></label>
                    {/* <input
                      type="text"
                      className={`form-control ${errors.manager_id ? "is-invalid" : ""}`}
                      name="manager_id"
                      value={formData.manager_id}
                      onChange={handleChange}
                    /> */}

                    <select
                      name="manager_id"
                      className={`form-control ${errors.manager_id ? "is-invalid" : ""}`}
                      value={formData.manager_id}
                      onChange={handleChange}
                    >
                      <option value="">Select Manager</option>
                      {Manager.map((head) => (
                        <option key={head.id} value={head.id}>
                          {head.username} ({head.email})
                        </option>
                      ))}
                    </select>
                    {errors.manager_id && <div className="invalid-feedback">{errors.manager_id}</div>}
                  </div>



                  <div className="col-md-6 mb-3">
                    <label className="form-label">Project Status <span className="text-danger">*</span></label>
                    <select
                      className={`form-control ${errors.projectStatus ? "is-invalid" : ""}`}
                      name="projectStatus"
                      value={formData.projectStatus}
                      onChange={handleChange}
                    >
                      <option value="">Select</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                    {errors.projectStatus && <div className="invalid-feedback">{errors.projectStatus}</div>}
                  </div>

                  <div className="col-md-12 mb-3">
                    <label className="form-label">Description </label>
                    <textarea
                      className="form-control"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      maxLength={150}
                    />
                  </div>

                </div>

                <div className="text-end mt-3">
                  <button type="submit" className="btn btn-primary">
                    Save Project
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

export default ProjectMasterForm;