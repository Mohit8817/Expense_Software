import { parseBankAccountIdForApi } from "./companyBankUtils";

const BASE_URL = import.meta.env.VITE_BACKEND_API_URL;
const getToken = () => localStorage.getItem("token");

const authHeaders = (json = true) => ({
  Authorization: `Bearer ${getToken()}`,
  ...(json ? { "Content-Type": "application/json" } : {}),
});

const toDate = (value) => {
  if (!value) return new Date().toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
};

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

export const formatCompanyAddress = (company) => {
  if (!company) return "";
  return [company.address, company.city, `${company.state} - ${company.zipcode}`]
    .filter(Boolean)
    .join(", ");
};

export const getCompanyStateCode = (company) => {
  if (company?.state_code) return company.state_code;
  if (company?.gst && company.gst.length >= 2) return company.gst.substring(0, 2);
  return "";
};

const parseBankIfscBranch = (value) => {
  if (!value) return { BankBranch: "", BankIfsc: "" };
  const parts = value.split(" / ");
  if (parts.length >= 2) {
    return { BankBranch: parts[0], BankIfsc: parts.slice(1).join(" / ") };
  }
  return { BankBranch: "", BankIfsc: value };
};

const formatBankIfscBranch = (branch, ifsc) =>
  [branch, ifsc].filter(Boolean).join(" / ") || null;

export const mapCompanyToVendorFields = (company) => ({
  VendorCompanyId: String(company.id),
  VendorName: company.name || "",
  VendorAddress: formatCompanyAddress(company),
  Vendorgstin: company.gst || "",
  VendorState: company.state || "",
  VendorStateCode: getCompanyStateCode(company),
  VendorCIN: company.cin || "",
  VendorEmail: company.email || "",
});

export const mapCompanyToConsigneeFields = (company) => ({
  ConsigneeCompanyId: String(company.id),
  ConsigneeName: company.name || "",
  ConsigneeAddress: formatCompanyAddress(company),
  ConsigneeGstin: company.gst || "",
  ConsigneeState: company.state || "",
  ConsigneeStateCode: getCompanyStateCode(company),
  ConsigneeEmail: company.email || "",
});

export const mapCompanyToBuyerFields = (company) => ({
  BuyerCompanyId: String(company.id),
  CompanyName: company.name || "",
  CompanyAddress: formatCompanyAddress(company),
  CompanyGstin: company.gst || "",
  CompanyState: company.state || "",
  CompanyStateCode: getCompanyStateCode(company),
  CompanyPAN: company.pan || "",
  CompanyEmail: company.email || "",
});

export const approvalToStatus = (approval) => {
  if (approval === "APPROVED") return "Posted";
  if (approval === "REJECTED") return "Cancelled";
  return "Draft";
};

export const tallyToLabel = (status) => {
  if (status === "PUSHED") return "Pushed";
  if (status === "FAILED") return "Failed";
  return "Not Pushed";
};

export const mapPurchaseToList = (p) => ({
  id: p.id,
  PurchaseNo: p.invoice_no,
  PurchaseDate: formatDate(p.invoice_date),
  InvoiceType: p.invoice_type || "Tax Invoice",
  IRN: p.irn || "",
  PONo: p.buyers_order_no || "",
  VendorName: p.seller_name,
  VendorGstin: p.seller_gstin || "",
  BuyerName: p.buyer_name || "",
  ConsigneeName: p.consignee_name || "",
  ItemCount: Array.isArray(p.items) ? p.items.length : 0,
  PurchaseAmount: Number(p.total_amount) || 0,
  Vendorgstin: p.seller_gstin || "",
  status: approvalToStatus(p.approval_status),
  approval_status: p.approval_status,
  tally_push_status: p.tally_push_status,
  tallyLabel: tallyToLabel(p.tally_push_status),
  raw: p,
});

export const mapPurchaseToForm = (p) => ({
  InvoiceType: p.invoice_type || "Tax Invoice",
  IRN: p.irn || "",
  AckNo: p.ack_no || "",
  AckDate: formatDate(p.ack_date),
  VendorCompanyId: p.seller_company_id ? String(p.seller_company_id) : "",
  VendorName: p.seller_name || "",
  VendorAddress: p.seller_address || "",
  Vendorgstin: p.seller_gstin || "",
  VendorState: p.seller_state || "",
  VendorStateCode: p.seller_state_code || "",
  VendorCIN: p.seller_cin || "",
  VendorEmail: p.seller_email || "",
  BankAccountId: p.vendor_bank_account_id ? String(p.vendor_bank_account_id) : "",
  BankName: p.bank_name || "",
  BankAccountNo: p.bank_account_no || "",
  ...(parseBankIfscBranch(p.bank_ifsc_branch)),
  ConsigneeCompanyId: p.consignee_company_id ? String(p.consignee_company_id) : "",
  ConsigneeName: p.consignee_name || "",
  ConsigneeAddress: p.consignee_address || "",
  ConsigneeGstin: p.consignee_gstin || "",
  ConsigneeState: p.consignee_state || "",
  ConsigneeStateCode: p.consignee_state_code || "",
  ConsigneeEmail: p.consignee_email || "",
  BuyerCompanyId: p.buyer_company_id ? String(p.buyer_company_id) : "",
  CompanyName: p.buyer_name || "",
  CompanyAddress: p.buyer_address || "",
  CompanyGstin: p.buyer_gstin || "",
  CompanyState: p.buyer_state || "",
  CompanyStateCode: p.buyer_state_code || "",
  CompanyPAN: p.buyer_pan || "",
  CompanyEmail: p.buyer_email || "",
  PurchaseNo: p.invoice_no || "",
  EWayBillNo: p.eway_bill_no || "",
  PurchaseDate: formatDate(p.invoice_date),
  DeliveryNote: p.delivery_note || "",
  ModeTermsOfPayment: p.mode_of_payment || "",
  ReferenceNoDate: p.reference_no || "",
  OtherReferences: p.other_references || "",
  PONo: p.buyers_order_no || "",
  PODate: formatDate(p.reference_date),
  DispatchDocNo: p.dispatch_doc_no || "",
  DeliveryNoteDate: formatDate(p.delivery_note_date),
  DispatchedThrough: p.dispatched_through || "",
  Destination: p.destination || "",
  BillOfLadingNo: p.bill_of_lading_no || "",
  MotorVehicleNo: p.motor_vehicle_no || "",
  TermsOfDelivery: p.terms_of_delivery || "",
  PurchaseAmount: Number(p.total_amount) || "",
  AmountInWords: p.amount_in_words || "",
  TaxAmountInWords: p.tax_amount_in_words || "",
  Declaration: p.declaration || "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.",
  AuthorisedSignatoryName: p.authorised_signatory_name || "",
  AuthorisedSignatoryDesignation: p.authorised_signatory_designation || "",
  IssuingSignatoryName: p.issuing_signatory_name || "",
  IssuingSignatoryDesignation: p.issuing_signatory_designation || "",
  Jurisdiction: p.jurisdiction || "",
  PurchaseItems: (p.items || []).map((item) => ({
    itemname: item.description,
    hsnSac: item.hsn_sac || "",
    quantity: item.quantity,
    unit: item.unit || "no",
    rate: item.rate,
    amount: item.amount,
  })),
  GstDetails: (p.gst_details || []).length
    ? p.gst_details.map((g) => ({
        LedgerName: g.ledger_name,
        rate: g.rate,
        amount: g.amount,
      }))
    : [{ LedgerName: "IGST", rate: p.igst_rate || "", amount: p.igst_amount || "" }],
  status: approvalToStatus(p.approval_status),
  approval_status: p.approval_status,
  tally_push_status: p.tally_push_status,
  tallyLabel: tallyToLabel(p.tally_push_status),
});

export const mapFormToPayload = (formData, purchaseItems, gstDetails) => {
  const itemsTotal = purchaseItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const totalQty = purchaseItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
  const gstTotal = gstDetails.reduce((sum, g) => sum + (parseFloat(g.amount) || 0), 0);
  const igstRow = gstDetails.find((g) => g.LedgerName === "IGST") || gstDetails[0] || {};
  const grandTotal = itemsTotal + gstTotal;

  return {
    invoice_type: formData.InvoiceType || null,
    irn: formData.IRN || `IRN-${Date.now()}`,
    ack_no: formData.AckNo || "NA",
    ack_date: toDate(formData.AckDate),
    invoice_no: formData.PurchaseNo || `PI-${Date.now()}`,
    invoice_date: toDate(formData.PurchaseDate),
    eway_bill_no: formData.EWayBillNo || null,
    delivery_note: formData.DeliveryNote || null,
    mode_of_payment: formData.ModeTermsOfPayment || null,
    reference_no: formData.ReferenceNoDate || null,
    reference_date: formData.PODate ? toDate(formData.PODate) : null,
    buyers_order_no: formData.PONo || null,
    other_references: formData.OtherReferences || null,
    dispatch_doc_no: formData.DispatchDocNo || null,
    delivery_note_date: formData.DeliveryNoteDate ? toDate(formData.DeliveryNoteDate) : null,
    dispatched_through: formData.DispatchedThrough || null,
    destination: formData.Destination || null,
    bill_of_lading_no: formData.BillOfLadingNo || null,
    motor_vehicle_no: formData.MotorVehicleNo || null,
    terms_of_delivery: formData.TermsOfDelivery || null,
    seller_company_id: formData.VendorCompanyId ? Number(formData.VendorCompanyId) : null,
    consignee_company_id: formData.ConsigneeCompanyId ? Number(formData.ConsigneeCompanyId) : null,
    buyer_company_id: formData.BuyerCompanyId ? Number(formData.BuyerCompanyId) : null,
    seller_name: formData.VendorName || "Vendor",
    seller_address: formData.VendorAddress || "Address",
    seller_cin: formData.VendorCIN || null,
    vendor_bank_account_id: parseBankAccountIdForApi(formData.BankAccountId),
    seller_gstin: formData.Vendorgstin || "NA",
    seller_state: formData.VendorState || "State",
    seller_state_code: formData.VendorStateCode || "00",
    seller_email: formData.VendorEmail || null,
    consignee_name: formData.ConsigneeName || null,
    consignee_address: formData.ConsigneeAddress || null,
    consignee_gstin: formData.ConsigneeGstin || null,
    consignee_state: formData.ConsigneeState || null,
    consignee_state_code: formData.ConsigneeStateCode || null,
    consignee_email: formData.ConsigneeEmail || null,
    buyer_name: formData.CompanyName || "Buyer",
    buyer_address: formData.CompanyAddress || "Address",
    buyer_gstin: formData.CompanyGstin || "NA",
    buyer_state: formData.CompanyState || "State",
    buyer_state_code: formData.CompanyStateCode || "00",
    buyer_pan: formData.CompanyPAN || null,
    buyer_email: formData.CompanyEmail || null,
    total_quantity: totalQty || 0,
    taxable_value: itemsTotal,
    igst_rate: parseFloat(igstRow.rate) || 0,
    igst_amount: parseFloat(igstRow.amount) || gstTotal,
    total_tax_amount: gstTotal,
    total_amount: grandTotal,
    amount_in_words: formData.AmountInWords || null,
    tax_amount_in_words: formData.TaxAmountInWords || null,
    bank_name: formData.BankName || null,
    bank_account_no: formData.BankAccountNo || null,
    bank_ifsc_branch: formatBankIfscBranch(formData.BankBranch, formData.BankIfsc),
    declaration: formData.Declaration || null,
    authorised_signatory_name: formData.AuthorisedSignatoryName || null,
    authorised_signatory_designation: formData.AuthorisedSignatoryDesignation || null,
    issuing_signatory_name: formData.IssuingSignatoryName || null,
    issuing_signatory_designation: formData.IssuingSignatoryDesignation || null,
    jurisdiction: formData.Jurisdiction || null,
    gst_details: gstDetails
      .filter((g) => g.LedgerName)
      .map((g) => ({
        ledger_name: g.LedgerName,
        rate: parseFloat(g.rate) || 0,
        amount: parseFloat(g.amount) || 0,
      })),
    items: purchaseItems.map((item) => ({
      description: item.itemname || "Item",
      hsn_sac: item.hsnSac || "",
      quantity: parseFloat(item.quantity) || 0,
      unit: item.unit || "no",
      rate: parseFloat(item.rate) || 0,
      per: item.unit || "no",
      amount: parseFloat(item.amount) || 0,
    })),
  };
};

export const getAllPurchases = async () => {
  const res = await fetch(`${BASE_URL}purchase/`, {
    headers: authHeaders(false),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch purchases");
  return Array.isArray(data) ? data.map(mapPurchaseToList) : [];
};

export const getPurchaseById = async (id) => {
  const res = await fetch(`${BASE_URL}purchase/${id}`, {
    headers: authHeaders(false),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Purchase not found");
  return mapPurchaseToForm(data);
};

export const createPurchase = async (payload) => {
  const res = await fetch(`${BASE_URL}purchase/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create purchase");
  return data;
};

export const updatePurchase = async (id, payload) => {
  const res = await fetch(`${BASE_URL}purchase/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update purchase");
  return data;
};

export const deletePurchase = async (id) => {
  const res = await fetch(`${BASE_URL}purchase/${id}`, {
    method: "DELETE",
    headers: authHeaders(false),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete purchase");
  return data;
};

export const approvePurchase = async (id, remarks = "") => {
  const res = await fetch(`${BASE_URL}purchase/${id}/approve`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ remarks }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to approve purchase");
  return data;
};

export const pushPurchaseToTally = async (id) => {
  const res = await fetch(`${BASE_URL}purchase/${id}/tally-push`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to push to Tally");
  return data;
};

export const retryTallyPush = async (id) => {
  const res = await fetch(`${BASE_URL}purchase/${id}/tally-push/retry`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to retry Tally push");
  return data;
};

export const scanPurchaseBill = async (file) => {
  const formData = new FormData();
  formData.append("bill", file);

  const res = await fetch(`${BASE_URL}purchase/scan-bill`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to scan bill");
  return data.data;
};

const norm = (value) => (value || "").trim().toLowerCase();
const normGst = (value) => (value || "").replace(/\s/g, "").toUpperCase();

const mergeNonEmpty = (base, overlay) => {
  const out = { ...base };
  Object.entries(overlay || {}).forEach(([key, value]) => {
    if (value != null && String(value).trim() !== "") out[key] = value;
  });
  return out;
};

const findCompanyByParty = (companies, party) => {
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

const findProductForRow = (products, row) => {
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

const partyToManualFields = (party, prefix) => {
  if (!party) return {};
  const map = {
    [`${prefix}Name`]: party.name || "",
    [`${prefix}Address`]: party.address || "",
    [`${prefix}State`]: party.state || "",
    [`${prefix}StateCode`]: party.state_code || "",
    [`${prefix}Email`]: party.email || "",
  };
  if (prefix === "Vendor") {
    map.Vendorgstin = party.gstin || "";
    map.VendorCIN = party.cin || "";
    map.BankName = party.bank_name || "";
    map.BankAccountNo = party.bank_account_no || "";
    map.BankBranch = party.bank_branch || "";
    map.BankIfsc = party.bank_ifsc || "";
  } else if (prefix === "Company") {
    map.CompanyGstin = party.gstin || "";
    map.CompanyPAN = party.pan || "";
  } else if (prefix === "Consignee") {
    map.ConsigneeGstin = party.gstin || "";
  }
  return map;
};

const resolvePartyFormFields = (party, prefix, company, mapCompanyFn) => {
  const manual = partyToManualFields(party, prefix);
  if (!company) return manual;
  return mergeNonEmpty(mapCompanyFn(company), manual);
};

export const mapScannedBillToPurchaseForm = (scan, companies = [], products = []) => {
  const vendorCo = findCompanyByParty(companies, scan.vendor);
  const buyerCo = findCompanyByParty(companies, scan.buyer);
  const consigneeCo = findCompanyByParty(companies, scan.consignee);

  const vendorFields = resolvePartyFormFields(scan.vendor, "Vendor", vendorCo, mapCompanyToVendorFields);
  const buyerFields = resolvePartyFormFields(scan.buyer, "Company", buyerCo, mapCompanyToBuyerFields);
  const consigneeFields = resolvePartyFormFields(
    scan.consignee,
    "Consignee",
    consigneeCo,
    mapCompanyToConsigneeFields
  );

  const formFields = {
    InvoiceType: scan.invoice_type || "Tax Invoice",
    IRN: scan.irn || "",
    AckNo: scan.ack_no || "",
    AckDate: scan.ack_date || "",
    PurchaseNo: scan.invoice_no || "",
    PurchaseDate: scan.invoice_date || "",
    EWayBillNo: scan.eway_bill_no || "",
    DeliveryNote: scan.delivery_note || "",
    DeliveryNoteDate: scan.delivery_note_date || "",
    ModeTermsOfPayment: scan.mode_of_payment || "",
    ReferenceNoDate: scan.reference_no || scan.reference_date || "",
    PONo: scan.po_no || "",
    PODate: scan.po_date || "",
    OtherReferences: scan.other_references || "",
    DispatchDocNo: scan.dispatch_doc_no || "",
    DispatchedThrough: scan.dispatched_through || "",
    Destination: scan.destination || "",
    BillOfLadingNo: scan.bill_of_lading_no || "",
    MotorVehicleNo: scan.motor_vehicle_no || "",
    TermsOfDelivery: scan.terms_of_delivery || "",
    PurchaseAmount: scan.total_amount != null ? String(scan.total_amount) : "",
    AmountInWords: scan.amount_in_words || "",
    TaxAmountInWords: scan.tax_amount_in_words || "",
    AuthorisedSignatoryName: scan.authorised_signatory_name || "",
    AuthorisedSignatoryDesignation: scan.authorised_signatory_designation || "",
    IssuingSignatoryName: scan.issuing_signatory_name || "",
    IssuingSignatoryDesignation: scan.issuing_signatory_designation || "",
    Jurisdiction: scan.jurisdiction || "",
    ...vendorFields,
    VendorCompanyId: vendorCo ? String(vendorCo.id) : "",
    ...buyerFields,
    BuyerCompanyId: buyerCo ? String(buyerCo.id) : "",
    ...consigneeFields,
    ConsigneeCompanyId: consigneeCo ? String(consigneeCo.id) : "",
  };

  const items = (scan.items || [])
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

  const gstDetails = (scan.gst_details || [])
    .filter((g) => g?.ledger_name)
    .map((g) => ({
      LedgerName: g.ledger_name,
      rate: g.rate != null ? String(g.rate) : "",
      amount: g.amount != null ? String(g.amount) : "",
    }));

  return {
    formFields,
    items: items.length ? items : [{ productId: "", itemname: "", hsnSac: "", quantity: "", unit: "nos", rate: "", amount: "" }],
    gstDetails: gstDetails.length ? gstDetails : [{ LedgerName: "", rate: "", amount: "" }],
    summary: {
      invoiceNo: scan.invoice_no,
      vendorName: scan.vendor?.name,
      buyerName: scan.buyer?.name,
      itemCount: items.length,
      gstCount: gstDetails.length,
      totalAmount: scan.total_amount,
      taxableValue: scan.taxable_value,
    },
  };
};
