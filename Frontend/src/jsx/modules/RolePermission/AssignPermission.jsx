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
        role_id: Number(id),
        permission_ids: selected.map((pid) => Number(pid)),
      });

      alert("Permissions updated  ");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Error updating permissions");
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

          {Object.entries(
            permissions.reduce((groups, perm) => {
              const moduleName = perm.module || "Other";
              if (!groups[moduleName]) groups[moduleName] = [];
              groups[moduleName].push(perm);
              return groups;
            }, {})
          ).map(([moduleName, modulePerms]) => (
            <div key={moduleName} className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">{moduleName}</h5>
              <div className="row">
                {modulePerms.map((perm) => (
                  <div className="col-md-4 mb-2" key={perm.id}>
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selected.includes(perm.id)}
                        onChange={() => handleCheck(perm.id)}
                      />
                      <label className="form-check-label">
                        {perm.label}
                        <span className="text-muted small ms-1">({perm.name})</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

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