const BASE_URL = import.meta.env.VITE_BACKEND_API_URL;
const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

export const getAccountDashboard = async () => {
  const res = await fetch(`${BASE_URL}account/dashboard`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to load account dashboard");
  return data;
};

export const getSalesRegister = async (from, to) => {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const res = await fetch(`${BASE_URL}account/reports/sales-register?${params}`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to load sales register");
  return data;
};

export const getPurchaseRegister = async (from, to) => {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const res = await fetch(`${BASE_URL}account/reports/purchase-register?${params}`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to load purchase register");
  return data;
};

export const getVoucherRegister = async (type, from, to) => {
  const params = new URLSearchParams({ type });
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const res = await fetch(`${BASE_URL}account/reports/voucher-register?${params}`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to load voucher register");
  return data;
};

export const getGstSummary = async (from, to) => {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const res = await fetch(`${BASE_URL}account/reports/gst-summary?${params}`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to load GST summary");
  return data;
};

export const getDocumentLinksReport = async () => {
  const res = await fetch(`${BASE_URL}account/reports/document-links`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to load document links report");
  return data;
};

export const getSalesInvoiceOptions = async () => {
  const res = await fetch(`${BASE_URL}account/links/sales`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to load sales invoices");
  return data;
};

export const getPurchaseInvoiceOptions = async () => {
  const res = await fetch(`${BASE_URL}account/links/purchases`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to load purchase invoices");
  return data;
};

export const getSalesInvoiceForLink = async (id) => {
  const res = await fetch(`${BASE_URL}account/links/sales/${id}`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Sales invoice not found");
  return data;
};

export const getPurchaseInvoiceForLink = async (id) => {
  const res = await fetch(`${BASE_URL}account/links/purchases/${id}`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Purchase invoice not found");
  return data;
};

export const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

export const formatMoney = (n) =>
  `\u20b9${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const approvalLabel = (status) => {
  if (status === "APPROVED") return "Posted";
  if (status === "REJECTED") return "Cancelled";
  return "Draft";
};
