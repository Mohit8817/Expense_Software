import React, { useEffect, useState } from "react";
import PageTitle from "../../layouts/PageTitle";
import { useParams } from "react-router-dom";
import { assignPermissions, getRoleById } from "./roleApi";
import { getPermissions } from "./permissionApi";

const AssignPermission = () => {
  const { id } = useParams();

  const [permissions, setPermissions] = useState([]);
  const [selected, setSelected] = useState([]);
  const [roleName, setRoleName] = useState("");

  useEffect(() => {
    fetchPermissions();
    fetchRoleDetails();
  }, []);

  /* ================= FETCH ALL PERMISSIONS ================= */
  const fetchPermissions = async () => {
    try {
      const res = await getPermissions();
      setPermissions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= FETCH ROLE + ASSIGNED PERMISSIONS ================= */
  const fetchRoleDetails = async () => {
    try {
      const res = await getRoleById(id);

      // Role Name
      setRoleName(res.data.name);

      // Already assigned permissions
      const assigned = res.data.permissions.map(
        (p) => p.permission_id
      );

      setSelected(assigned);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= CHECKBOX ================= */
  const handleCheck = (pid) => {
    setSelected((prev) =>
      prev.includes(pid)
        ? prev.filter((p) => p !== pid)
        : [...prev, pid]
    );
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    try {
      await assignPermissions({
        role_id: id,
        permission_ids: selected,
      });

      alert("Permissions updated  ");
    } catch (error) {
      console.error(error);
      alert("Error updating permissions");
    }
  };

  return (
    <>
      <PageTitle
        activeMenu={`Assign Permission - ${roleName}`}
        motherMenu="Role Management"
      />

      <div className="card">
        <div className="card-header">
          <h4 className="card-title">
            Assign Permissions {roleName && `- ${roleName}`}
          </h4>
        </div>

        <div className="card-body">

          {/* PERMISSIONS LIST */}
          <div className="row">
            {permissions.map((perm) => (
              <div className="col-md-4 mb-2" key={perm.id}>
                <div className="form-check">

                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={selected.includes(perm.id)}   //   FIXED
                    onChange={() => handleCheck(perm.id)}
                  />

                  <label className="form-check-label">
                    {perm.label} ({perm.module})
                  </label>

                </div>
              </div>
            ))}
          </div>

          <button
            className="btn btn-success mt-3"
            onClick={handleSubmit}
          >
            Save Permissions
          </button>

        </div>
      </div>
    </>
  );
};

export default AssignPermission;