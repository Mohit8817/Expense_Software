import { approvalToStatus, tallyToLabel } from "./purchaseApi";
import { calcItemAmount, parseNonNegative } from "./vouchers/shared/numberInputUtils";

const BASE_URL = import.meta.env.VITE_BACKEND_API_URL;
const getToken = () => localStorage.getItem("token");

export const authHeaders = (json = true) => ({
  Authorization: `Bearer ${getToken()}`,
  ...(json ? { "Content-Type": "application/json" } : {}),
});

export const toDate = (value) => {
  if (!value) return new Date().toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
};

export const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

export const extractTaxFromGstRows = (gstDetails = []) => {
  const findLedger = (name) =>
    gstDetails.find((g) => g.LedgerName === name || g.ledger === name) || {};
  const cgst = findLedger("CGST");
  const sgst = findLedger("SGST");
  const igst = findLedger("IGST");
  return {
    cgst_rate: parseFloat(cgst.rate) || 0,
    cgst_amount: parseFloat(cgst.amount) || 0,
    sgst_rate: parseFloat(sgst.rate) || 0,
    sgst_amount: parseFloat(sgst.amount) || 0,
    igst_rate: parseFloat(igst.rate) || 0,
    igst_amount: parseFloat(igst.amount) || 0,
  };
};

export const mapItemsToApi = (items = [], nameField = "itemname") =>
  items
    .filter((item) => item[nameField] || item.description || item.name)
    .map((item, index) => {
      const quantity = parseNonNegative(item.quantity || item.qty);
      const rate = parseNonNegative(item.rate);
      const amount =
        item.amount !== "" && item.amount !== undefined && item.amount !== null
          ? parseNonNegative(item.amount)
          : calcItemAmount(quantity, rate);
      return {
        description: item[nameField] || item.description || item.name,
        hsn_sac: item.hsnSac || item.hsn_sac || null,
        quantity,
        unit: item.unit || "nos",
        rate,
        per: item.unit || item.per || "nos",
        amount,
        sl_no: index + 1,
      };
    });

export const createVoucherApi = (resource) => {
  const base = `${BASE_URL}${resource}/`;

  const getAll = async () => {
    const res = await fetch(base, { headers: authHeaders(false) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || `Failed to fetch ${resource}`);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  const getById = async (id) => {
    const res = await fetch(`${base}${id}`, { headers: authHeaders(false) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Record not found");
    return data?.data ?? data;
  };

  const create = async (payload) => {
    const res = await fetch(base, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Create failed");
    return data;
  };

  const update = async (id, payload) => {
    const res = await fetch(`${base}${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Update failed");
    return data;
  };

  const remove = async (id) => {
    const res = await fetch(`${base}${id}`, {
      method: "DELETE",
      headers: authHeaders(false),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Delete failed");
    return data;
  };

  const approve = async (id, remarks) => {
    const res = await fetch(`${base}${id}/approve`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ remarks }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Approve failed");
    return data;
  };

  const reject = async (id, remarks) => {
    const res = await fetch(`${base}${id}/reject`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ remarks }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Reject failed");
    return data;
  };

  const pushToTally = async (id) => {
    const res = await fetch(`${base}${id}/tally-push`, {
      method: "PATCH",
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Tally push failed");
    return data;
  };

  const retryTallyPush = async (id) => {
    const res = await fetch(`${base}${id}/tally-push/retry`, {
      method: "PATCH",
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Tally retry failed");
    return data;
  };

  return {
    getAll,
    getById,
    create,
    update,
    remove,
    approve,
    reject,
    pushToTally,
    retryTallyPush,
  };
};

export { approvalToStatus, tallyToLabel };
