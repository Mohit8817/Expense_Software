const BASE_URL = import.meta.env.VITE_BACKEND_API_URL;
const getToken = () => localStorage.getItem("token");

export const UPLOADS_BASE = BASE_URL.replace(/\/api\/?$/, "").replace(/\/+$/, "");

export const ATTACHMENT_DOCUMENT_TYPES = {
  PURCHASE: "PURCHASE",
  SALES: "SALES",
  CREDIT_NOTE: "CREDIT_NOTE",
  DEBIT_NOTE: "DEBIT_NOTE",
  DELIVERY_CHALLAN: "DELIVERY_CHALLAN",
  JOURNAL_VOUCHER: "JOURNAL_VOUCHER",
  PAYMENT_VOUCHER: "PAYMENT_VOUCHER",
  COMPANY: "COMPANY",
  PRODUCT: "PRODUCT",
};

export const attachmentFileUrl = (fileName) => `${UPLOADS_BASE}/uploads/${fileName}`;

const authHeaders = (json = false) => ({
  Authorization: `Bearer ${getToken()}`,
  ...(json ? { "Content-Type": "application/json" } : {}),
});

export const getDocumentAttachments = async (documentType, documentId) => {
  const res = await fetch(`${BASE_URL}attachments/${documentType}/${documentId}`, {
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to load attachments");
  return Array.isArray(data) ? data : data.data || [];
};

export const uploadDocumentAttachments = async (documentType, documentId, files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const res = await fetch(`${BASE_URL}attachments/${documentType}/${documentId}`, {
    method: "POST",
    headers: authHeaders(false),
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Upload failed");
  return data.data || [];
};

export const deleteDocumentAttachment = async (attachmentId) => {
  const res = await fetch(`${BASE_URL}attachments/file/${attachmentId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Delete failed");
  return data;
};

export const formatFileSize = (bytes) => {
  const size = Number(bytes) || 0;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};
