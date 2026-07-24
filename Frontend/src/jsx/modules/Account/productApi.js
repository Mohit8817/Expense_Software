const BASE_URL = import.meta.env.VITE_BACKEND_API_URL;
const getToken = () => localStorage.getItem("token");

const authHeaders = (json = true) => ({
  Authorization: `Bearer ${getToken()}`,
  ...(json ? { "Content-Type": "application/json" } : {}),
});

export const getAllProducts = async () => {
  const res = await fetch(`${BASE_URL}productdetail/all`, {
    headers: authHeaders(false),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch products");
  return data.data || [];
};

export const getProductById = async (id) => {
  const res = await fetch(`${BASE_URL}productdetail/${id}`, {
    headers: authHeaders(false),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Product not found");
  return data.data;
};

export const createProduct = async (payload) => {
  const res = await fetch(`${BASE_URL}productdetail/create`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create product");
  return data;
};

export const updateProduct = async (id, payload) => {
  const res = await fetch(`${BASE_URL}productdetail/update/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update product");
  return data;
};

export const deleteProduct = async (id) => {
  const res = await fetch(`${BASE_URL}productdetail/delete/${id}`, {
    method: "DELETE",
    headers: authHeaders(false),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete product");
  return data;
};

export const importProducts = async (products) => {
  const res = await fetch(`${BASE_URL}productdetail/import`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ products }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to import products");
  return data;
};
