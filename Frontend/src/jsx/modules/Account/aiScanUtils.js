const BASE_URL = import.meta.env.VITE_BACKEND_API_URL;
const getToken = () => localStorage.getItem("token");

export const uploadDocumentForScan = async (endpoint, file, fieldName = "bill") => {
  const formData = new FormData();
  formData.append(fieldName, file);

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Scan failed");
  return data.data;
};

export const norm = (value) => (value || "").trim().toLowerCase();
export const normGst = (value) => (value || "").replace(/\s/g, "").toUpperCase();

export const mergeNonEmpty = (base, overlay) => {
  const out = { ...base };
  Object.entries(overlay || {}).forEach(([key, value]) => {
    if (value != null && String(value).trim() !== "") out[key] = value;
  });
  return out;
};

export const findCompanyByParty = (companies, party) => {
  if (!party) return null;
  if (party.gstin) {
    const byGst = companies.find((c) => normGst(c.gst) === normGst(party.gstin));
    if (byGst) return byGst;
  }
  if (party.name) {
    const name = norm(party.name);
    const byName = companies.find(
      (c) => norm(c.name) === name || norm(c.name).includes(name) || name.includes(norm(c.name))
    );
    if (byName) return byName;
  }
  return null;
};

export const findProductForRow = (products, row) => {
  const desc = norm(row.description);
  if (!desc) return null;

  const exact = products.find((p) => norm(p.name) === desc);
  if (exact) return exact;

  const partial = products.find(
    (p) => norm(p.name).includes(desc) || desc.includes(norm(p.name))
  );
  if (partial) return partial;

  if (row.hsn_sac) {
    const byHsn = products.find((p) => normGst(p.hsn_sac) === normGst(row.hsn_sac));
    if (byHsn) return byHsn;
  }

  return null;
};

export const mapInvoiceItems = (scan, products, emptyItem) =>
  (scan.items || [])
    .filter((row) => row?.description)
    .map((row) => {
      const product = findProductForRow(products, row);
      const qty = Number(row.quantity) || 0;
      const rate = Number(row.rate) || 0;
      const amount = Number(row.amount) || qty * rate;
      return {
        productId: product ? String(product.id) : "",
        itemname: row.description || "",
        hsnSac: row.hsn_sac || product?.hsn_sac || "",
        quantity: qty ? String(qty) : "",
        unit: row.unit || product?.units || "nos",
        rate: rate ? String(rate) : "",
        amount: amount ? String(amount) : "",
      };
    });

export const mapGstDetails = (scan, emptyGst) => {
  const gstDetails = (scan.gst_details || [])
    .filter((g) => g?.ledger_name)
    .map((g) => ({
      LedgerName: g.ledger_name,
      rate: g.rate != null ? String(g.rate) : "",
      amount: g.amount != null ? String(g.amount) : "",
    }));
  return gstDetails.length ? gstDetails : [emptyGst()];
};

const CATEGORY_LEDGER_MAP = {
  Travelling: "Travelling Expenses",
  Office: "Office Expenses",
  Conveyance: "Conveyance",
  Accommodation: "Accomodation Charges",
  Purchase: "Purchase Account",
};

export const expenseCategoryToLedger = (hint) => CATEGORY_LEDGER_MAP[hint] || "Office Expenses";

export const paymentModeToLedger = (mode) => {
  const map = { CASH: "Cash", UPI: "UPI", BANK: "HDFC Bank", NEFT: "HDFC Bank", RTGS: "HDFC Bank", CHEQUE: "HDFC Bank" };
  return map[mode] || "Bank";
};
