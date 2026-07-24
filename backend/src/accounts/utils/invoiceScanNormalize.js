const INDIAN_STATE_CODES = {
  "01": "Jammu & Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  10: "Bihar",
  11: "Sikkim",
  12: "Arunachal Pradesh",
  13: "Nagaland",
  14: "Manipur",
  15: "Mizoram",
  16: "Tripura",
  17: "Meghalaya",
  18: "Assam",
  19: "West Bengal",
  20: "Jharkhand",
  21: "Odisha",
  22: "Chhattisgarh",
  23: "Madhya Pradesh",
  24: "Gujarat",
  25: "Daman & Diu",
  26: "Dadra & Nagar Haveli",
  27: "Maharashtra",
  28: "Andhra Pradesh",
  29: "Karnataka",
  30: "Goa",
  31: "Lakshadweep",
  32: "Kerala",
  33: "Tamil Nadu",
  34: "Puducherry",
  35: "Andaman & Nicobar",
  36: "Telangana",
  37: "Andhra Pradesh (New)",
  38: "Ladakh",
};

function normalizeDate(value) {
  if (!value) return null;
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  const dmy = str.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (dmy) {
    let [, day, month, year] = dmy;
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return null;
}

function normalizeGstin(value) {
  if (!value) return null;
  const gst = String(value).replace(/\s/g, "").toUpperCase();
  return gst.length >= 15 ? gst.slice(0, 15) : gst || null;
}

function stateCodeFromGstin(gstin) {
  const code = normalizeGstin(gstin)?.slice(0, 2);
  return code && /^\d{2}$/.test(code) ? code : null;
}

function enrichParty(party) {
  if (!party || typeof party !== "object") return party;
  const gstin = normalizeGstin(party.gstin);
  const stateCode = party.state_code || stateCodeFromGstin(gstin);
  const state = party.state || (stateCode ? INDIAN_STATE_CODES[stateCode] : null);
  return {
    ...party,
    gstin,
    state_code: stateCode,
    state,
  };
}

function normalizeItem(row) {
  if (!row?.description) return null;
  const qty = Number(row.quantity) || 0;
  const rate = Number(row.rate) || 0;
  const amount = Number(row.amount) || (qty && rate ? qty * rate : 0);
  return {
    description: String(row.description).trim(),
    hsn_sac: row.hsn_sac ? String(row.hsn_sac).trim() : null,
    quantity: qty,
    unit: row.unit ? String(row.unit).trim() : null,
    rate,
    amount,
  };
}

function inferGstDetails(scan) {
  const existing = (scan.gst_details || []).filter((g) => g?.ledger_name);
  if (existing.length) return existing;

  const taxable = Number(scan.taxable_value) || 0;
  const totalTax = Number(scan.total_tax_amount) || 0;
  if (!totalTax) return [];

  const vendorCode = scan.vendor?.state_code || stateCodeFromGstin(scan.vendor?.gstin);
  const buyerCode = scan.buyer?.state_code || stateCodeFromGstin(scan.buyer?.gstin);

  if (vendorCode && buyerCode && vendorCode !== buyerCode) {
    const rate = taxable ? Math.round((totalTax / taxable) * 10000) / 100 : null;
    return [{ ledger_name: "IGST", rate, amount: totalTax }];
  }

  const half = Math.round((totalTax / 2) * 100) / 100;
  const rate = taxable ? Math.round((half / taxable) * 10000) / 100 : null;
  return [
    { ledger_name: "CGST", rate, amount: half },
    { ledger_name: "SGST", rate, amount: totalTax - half },
  ];
}

export function normalizeExtractedBill(scan) {
  if (!scan || typeof scan !== "object") return scan;

  const items = (scan.items || []).map(normalizeItem).filter(Boolean);
  const itemTotal = items.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  const normalized = {
    ...scan,
    invoice_date: normalizeDate(scan.invoice_date),
    ack_date: normalizeDate(scan.ack_date),
    po_date: normalizeDate(scan.po_date),
    reference_date: normalizeDate(scan.reference_date),
    delivery_note_date: normalizeDate(scan.delivery_note_date),
    vendor: enrichParty(scan.vendor),
    buyer: enrichParty(scan.buyer),
    consignee: enrichParty(scan.consignee),
    items,
    taxable_value: Number(scan.taxable_value) || itemTotal || null,
    total_tax_amount: scan.total_tax_amount != null ? Number(scan.total_tax_amount) : null,
    total_amount: scan.total_amount != null ? Number(scan.total_amount) : null,
  };

  normalized.gst_details = inferGstDetails(normalized);

  if (!normalized.total_amount && normalized.taxable_value != null && normalized.total_tax_amount != null) {
    normalized.total_amount = normalized.taxable_value + normalized.total_tax_amount;
  }

  return normalized;
}
