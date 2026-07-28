import { uploadDocumentForScan } from "./aiScanUtils";
import { approvalToStatus, tallyToLabel } from "./purchaseApi";

const BASE_URL = import.meta.env.VITE_BACKEND_API_URL;
const getToken = () => localStorage.getItem("token");

const authHeaders = (json = true) => ({
  Authorization: `Bearer ${getToken()}`,
  ...(json ? { "Content-Type": "application/json" } : {}),
});

export const mapCompanyToList = (company) => ({
  ...company,
  status: approvalToStatus(company.approval_status),
  approval_status: company.approval_status,
  tally_push_status: company.tally_push_status,
  tallyLabel: tallyToLabel(company.tally_push_status),
  sourceLabel: company.data_status === 2 ? "Tally" : "App",
});

export const scanCompanyDocument = async (file) =>
  uploadDocumentForScan("companydetail/scan-document", file);

export const mapScannedToCompanyForm = (scan) => ({
  formData: {
    name: scan.name || "",
    ledger_name: scan.ledger_name || scan.name || "",
    short_name: scan.short_name || (scan.name ? scan.name.slice(0, 10) : ""),
    gst: scan.gstin || "",
    pan: scan.pan || "",
    tan: scan.tan || "",
    cin: scan.cin || "",
    email: scan.email || "",
    state_code: scan.state_code || "",
    add_line1: scan.add_line1 || scan.address || "",
    add_line2: scan.add_line2 || "",
    add_line3: scan.add_line3 || "",
    address: scan.address || "",
    city: scan.city || "",
    state: scan.state || "",
    country: scan.country || "India",
    zipcode: scan.zipcode || "",
    contact_person: scan.contact_person || "",
    contact_number: scan.contact_number || "",
    ledger_group: scan.ledger_group || "",
    code: scan.gstin ? scan.gstin.slice(0, 6) : "",
    status: "1",
  },
  bankAccounts: (scan.bank_accounts || []).length
    ? scan.bank_accounts.map((b, i) => ({
        bank_name: b.bank_name || "",
        ac_no: b.ac_no || "",
        branch_name: b.branch_name || "",
        ifsc_code: b.ifsc_code || "",
        is_primary: i === 0,
      }))
    : [{ bank_name: "", ac_no: "", branch_name: "", ifsc_code: "", is_primary: true }],
  summary: {
    name: scan.name,
    gstin: scan.gstin,
    bankCount: (scan.bank_accounts || []).length,
  },
});

export const scanAndMapCompanyDocument = async (file) => {
  const extracted = await scanCompanyDocument(file);
  return mapScannedToCompanyForm(extracted);
};

export const getAllCompanies = async () => {
  const res = await fetch(`${BASE_URL}companydetail/all`, {
    headers: authHeaders(false),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch companies");
  return (data.data || []).map(mapCompanyToList);
};

export const getCompanyById = async (id) => {
  const res = await fetch(`${BASE_URL}companydetail/${id}`, {
    headers: authHeaders(false),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Company not found");
  return data.data;
};

export const createCompany = async (payload) => {
  const res = await fetch(`${BASE_URL}companydetail/create`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create company");
  return data;
};

export const updateCompany = async (id, payload) => {
  const res = await fetch(`${BASE_URL}companydetail/update/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update company");
  return data;
};

export const deleteCompany = async (id) => {
  const res = await fetch(`${BASE_URL}companydetail/delete/${id}`, {
    method: "DELETE",
    headers: authHeaders(false),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete company");
  return data;
};

export const approveCompany = async (id, remarks = "") => {
  const res = await fetch(`${BASE_URL}companydetail/${id}/approve`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ remarks }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to approve company");
  return data;
};

export const rejectCompany = async (id, remarks) => {
  const res = await fetch(`${BASE_URL}companydetail/${id}/reject`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ remarks }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to reject company");
  return data;
};

export const pushCompanyToTally = async (id) => {
  const res = await fetch(`${BASE_URL}companydetail/${id}/tally-push`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Tally push failed");
  return data;
};

export const retryCompanyTallyPush = async (id) => {
  const res = await fetch(`${BASE_URL}companydetail/${id}/tally-push/retry`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Tally push retry failed");
  return data;
};
