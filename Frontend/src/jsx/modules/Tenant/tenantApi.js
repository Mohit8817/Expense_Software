const BASE_URL = import.meta.env.VITE_BACKEND_API_URL;
const UPLOADS_BASE =
  import.meta.env.VITE_BACKEND_BASE_URL ||
  BASE_URL.replace(/\/api\/?$/, "").replace(/\/+$/, "");

const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

export const tenantLogoUrl = (filename) =>
  filename ? `${UPLOADS_BASE}/uploads/${filename}` : null;

export const getTenantBranding = async () => {
  const res = await fetch(`${BASE_URL}tenant/branding`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch company branding");
  return data.data;
};

export const getTenants = async () => {
  const res = await fetch(`${BASE_URL}tenant`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch tenants");
  return data.data || [];
};

export const getTenantById = async (id) => {
  const res = await fetch(`${BASE_URL}tenant/${id}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Tenant not found");
  return data.data;
};

export const createTenant = async (formData) => {
  const res = await fetch(`${BASE_URL}tenant`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create tenant");
  return data;
};

export const updateTenant = async (id, formData) => {
  const res = await fetch(`${BASE_URL}tenant/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update tenant");
  return data;
};

export const deleteTenant = async (id) => {
  const res = await fetch(`${BASE_URL}tenant/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete tenant");
  return data;
};
