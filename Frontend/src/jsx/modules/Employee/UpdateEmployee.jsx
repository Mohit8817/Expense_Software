import React, { useEffect, useState } from "react";
import { Col, Card } from "react-bootstrap";
import PageTitle from "../../layouts/PageTitle";
import { useNavigate, useParams } from "react-router-dom";
import {
  getEmployeeById,
  updateEmployee,
  getReportingHeads,
} from "./employeeApi";
import { getRoles } from "../RolePermission/roleApi";

const UpdateEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [reportingHeads, setReportingHeads] = useState([]);
  const [roles, setRoles] = useState([]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    empName: "",
    empEmail: "",
    password: "",
    reportingHead: "",
    doj: "",
    dol: "",
    ctc: "",
    phone: "",
    designation: "",
    dob: "",
    gender: "",
    qualification: "",
    status: "1",
    role_id: "",
    photo: null,
  });

  // ✅ Fetch Reporting Heads + Roles
  useEffect(() => {
    const fetchData = async () => {
      const headsRes = await getReportingHeads();
      if (headsRes?.ok) setReportingHeads(headsRes.result);

      const rolesRes = await getRoles();
      if (rolesRes?.ok) {
        setRoles(rolesRes.result);
      } else {
        setRoles(rolesRes?.data || []);
      }
    };

    fetchData();
  }, []);

  // ✅ Fetch Employee
  useEffect(() => {
    if (!id) return;

    const fetchEmployee = async () => {
      try {
        const res = await getEmployeeById(id);

        // ✅ FIXED: correct data path
        const data = res.user;

        setFormData({
          empName: data.username || "",
          empEmail: data.email || "",
          password: "",
          reportingHead: data.reporting_head || "",
          doj: data.doj ? data.doj.split("T")[0] : "",
          dol: data.dol ? data.dol.split("T")[0] : "",
          ctc: data.ctc ? String(data.ctc) : "",
          phone: data.phone_no || "",
          designation: data.designation || "",
          dob: data.dob ? data.dob.split("T")[0] : "",
          gender: data.gender || "",
          qualification: data.qualification || "",
          status: data.status ? "1" : "0", // ✅ FIXED
          role_id: data.role_id ? String(data.role_id) : "", // ✅ FIXED
          photo: null,
        });

        if (data.user_img) {
          setPreview(
            `${import.meta.env.VITE_BACKEND_API_URL}uploads/${data.user_img}`
          );
        }
      } catch (err) {
        console.error(err);
        alert("Failed to fetch employee");
      }
    };

    fetchEmployee();
  }, [id]);

  // ✅ Handle Change
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "photo") {
      const file = files[0];
      setFormData((prev) => ({ ...prev, photo: file }));
      if (file) setPreview(URL.createObjectURL(file));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ✅ Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          switch (key) {
            case "photo":
              data.append("user_img", value);
              break;
            case "status":
              data.append("status", value === "1"); // boolean
              break;
            case "role_id":
              data.append("role_id", value);
              break;
            default:
              data.append(key, value);
          }
        }
      });

      const { ok, result } = await updateEmployee(id, data);

      if (ok) {
        alert("Employee updated successfully");
        navigate("/employee-List");
      } else {
        alert(result.message || "Update failed");
      }
    } catch (error) {
      console.error(error);
      alert("Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageTitle activeMenu="Update Employee" motherMenu="Employee" />

      <Col lg={12}>
        <Card>
          <Card.Header>
            <Card.Title>Update Employee</Card.Title>
          </Card.Header>

          <Card.Body>
            <form onSubmit={handleSubmit}>
              <div className="row">

                {/* Name */}
                <div className="col-lg-6 mb-3">
                  <label>Name</label>
                  <input className="form-control" name="empName" value={formData.empName} onChange={handleChange} />
                </div>

                {/* Email */}
                <div className="col-lg-6 mb-3">
                  <label>Email</label>
                  <input className="form-control" name="empEmail" value={formData.empEmail} onChange={handleChange} />
                </div>

                {/* Password */}
                <div className="col-lg-6 mb-3">
                  <label>Password</label>
                  <div className="input-group">
                    <input type={showPassword ? "text" : "password"} className="form-control" name="password" value={formData.password} onChange={handleChange} />
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPassword(!showPassword)}>
                      👁
                    </button>
                  </div>
                </div>

                {/* Reporting Head */}
                <div className="col-lg-6 mb-3">
                  <label>Reporting Head</label>
                  <select className="form-control" name="reportingHead" value={formData.reportingHead} onChange={handleChange}>
                    <option value="">Select</option>
                    {reportingHeads.map((h) => (
                      <option key={h.id} value={h.username}>
                        {h.username}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Role */}
                <div className="col-lg-6 mb-3">
                  <label>Role</label>
                  <select className="form-control" name="role_id" value={formData.role_id || ""} onChange={handleChange}>
                    <option value="">Select Role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={String(role.id)}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Designation */}
                <div className="col-lg-6 mb-3">
                  <label>Designation</label>
                  <input className="form-control" name="designation" value={formData.designation} onChange={handleChange} />
                </div>

                {/* Phone */}
                <div className="col-lg-6 mb-3">
                  <label>Phone</label>
                  <input className="form-control" name="phone" value={formData.phone} onChange={handleChange} />
                </div>

                {/* DOB */}
                <div className="col-lg-6 mb-3">
                  <label>DOB</label>
                  <input type="date" className="form-control" name="dob" value={formData.dob} onChange={handleChange} />
                </div>

                {/* Gender */}
                <div className="col-lg-6 mb-3">
                  <label>Gender</label>
                  <select className="form-control" name="gender" value={formData.gender} onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                {/* DOJ */}
                <div className="col-lg-6 mb-3">
                  <label>Joining Date</label>
                  <input type="date" className="form-control" name="doj" value={formData.doj} onChange={handleChange} />
                </div>

                {/* DOL */}
                <div className="col-lg-6 mb-3">
                  <label>Leaving Date</label>
                  <input type="date" className="form-control" name="dol" value={formData.dol} onChange={handleChange} />
                </div>

                {/* CTC */}
                <div className="col-lg-6 mb-3">
                  <label>CTC</label>
                  <input type="number" className="form-control" name="ctc" value={formData.ctc} onChange={handleChange} />
                </div>

                {/* Qualification */}
                <div className="col-lg-6 mb-3">
                  <label>Qualification</label>
                  <input className="form-control" name="qualification" value={formData.qualification} onChange={handleChange} />
                </div>

                {/* Status */}
                <div className="col-lg-6 mb-3">
                  <label>Status</label>
                  <select className="form-control" name="status" value={formData.status} onChange={handleChange}>
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>

                {/* Photo */}
                <div className="col-lg-6 mb-3">
                  <label>Photo</label>
                  <input type="file" className="form-control" name="photo" onChange={handleChange} />
                  {preview && <img src={preview} alt="" style={{ width: 80, marginTop: 10 }} />}
                </div>

              </div>

              <div className="text-end">
                <button type="button" className="btn btn-secondary me-2" onClick={() => navigate("/employee-List")}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Updating..." : "Update"}
                </button>
              </div>
            </form>
          </Card.Body>
        </Card>
      </Col>
    </>
  );
};

export default UpdateEmployee;