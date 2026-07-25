import axios from "axios";

const API  = import.meta.env.VITE_BACKEND_API_URL;

// ✅ COMMON HEADERS
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

/* ================= CREATE ROLE ================= */
export const createRole = async (data) => {
  try {
    const res = await axios.post(`${API}role/create-roles`, data, {
      headers: authHeaders(),
    });
    return res.data;
  } catch (error) {
    return error.response?.data || { message: "Error creating role" };
  }
};

/* ================= GET ALL ROLES ================= */
export const getRoles = async () => {
  try {
    const res = await axios.get(`${API}role/get-roles`, {
      headers: authHeaders(),
    });
    console.log(res);
    return res.data;
  } catch (error) {
    return [];
  }
};

/* ================= GET ROLE BY ID ================= */
export const getRoleById = async (id) => {
  try {
    const res = await axios.get(`${API}role/get-role/${id}`, {
      headers: authHeaders(),
    });
    return res.data;
  } catch (error) {
    return null;
  }
};

/* ================= UPDATE ROLE ================= */
export const updateRole = async (id, data) => {
  try {
    const res = await axios.put(`${API}role/update-role/${id}`, data, {
      headers: authHeaders(),   // ✅ FIXED
    });
    return res.data;
  } catch (error) {
    return error.response?.data || { message: "Update failed" };
  }
};

/* ================= DELETE ROLE ================= */
export const deleteRole = async (id) => {
  try {
    const res = await axios.delete(`${API}role/delete-role/${id}`, {
      headers: authHeaders(),
    });
    return res.data;
  } catch (error) {
    return error.response?.data || { message: "Delete failed" };
  }
};

/* ================= ASSIGN PERMISSIONS ================= */
export const assignPermissions = async (data) => {
  const res = await axios.post(`${API}role/assign-permissions`, data, {
    headers: authHeaders(),
  });
  return res.data;
};


export const getMyPermissions = () =>
  axios.get(`${API}role/my-permissions`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });