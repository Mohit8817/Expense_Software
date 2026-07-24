import {
  formatCompanyAddress,
  getCompanyStateCode,
  approvalToStatus,
  tallyToLabel,
} from "./purchaseApi";
import { parseBankAccountIdForApi } from "./companyBankUtils";
import {
  uploadDocumentForScan,
  findCompanyByParty,
  mergeNonEmpty,
  mapInvoiceItems,
  mapGstDetails,
} from "./aiScanUtils";

const BASE_URL = import.meta.env.VITE_BACKEND_API_URL;
const getToken = () => localStorage.getItem("token");

const authHeaders = (json = true) => ({
  Authorization: `Bearer ${getToken()}`,
  ...(json ? { "Content-Type": "application/json" } : {}),
});

const toDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
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

export const mapCompanyToSellerFields = (company) => ({
  SellerCompanyId: String(company.id),
  CompanyName: company.name || "",
  CompanyAddress: formatCompanyAddress(company),
  CompanyGstin: company.gst || "",
  CompanyState: company.state || "",
  CompanyStateCode: getCompanyStateCode(company),
  CompanyCIN: company.cin || "",
  CompanyEmail: company.email || "",
});

export const mapCompanyToSalesConsigneeFields = (company) => ({
  ConsigneeCompanyId: String(company.id),
  ConsigneeName: company.name || "",
  ConsigneeAddress: formatCompanyAddress(company),
  ConsigneeGstin: company.gst || "",
  ConsigneeState: company.state || "",
  ConsigneeStateCode: getCompanyStateCode(company),
  ConsigneeEmail: company.email || "",
});

export const mapCompanyToCustomerFields = (company) => ({
  CustomerCompanyId: String(company.id),
  CustomerName: company.name || "",
  BuyerAddress: formatCompanyAddress(company),
  customergstin: company.gst || "",
  BuyerState: company.state || "",
  BuyerStateCode: getCompanyStateCode(company),
  BuyerPAN: company.pan || "",
  BuyerEmail: company.email || "",
});

export const mapSalesToList = (s) => ({
  id: s.id,
  InvoiceNo: s.invoice_no,
  InvoiceDate: formatDate(s.invoice_date),
  InvoiceType: s.invoice_type || "Tax Invoice",
  IRN: s.irn || "",
  CustomerName: s.buyer_name,
  CustomerGstin: s.buyer_gstin || "",
  ConsigneeName: s.consignee_name || "",
  SellerName: s.seller_name,
  SellerGstin: s.seller_gstin || "",
  ItemCount: Array.isArray(s.items) ? s.items.length : 0,
  BillAmount: Number(s.total_amount) || 0,
  GstAmount: Number(s.total_tax_amount) || 0,
  status: approvalToStatus(s.approval_status),
  approval_status: s.approval_status,
  tally_push_status: s.tally_push_status,
  tallyLabel: tallyToLabel(s.tally_push_status),
  raw: s,
});

export const mapSalesToForm = (s) => {
  const gstRows = [];
  if (Number(s.cgst_amount) > 0 || Number(s.cgst_rate) > 0) {
    gstRows.push({ LedgerName: "CGST", rate: s.cgst_rate, amount: s.cgst_amount });
  }
  if (Number(s.sgst_amount) > 0 || Number(s.sgst_rate) > 0) {
    gstRows.push({ LedgerName: "SGST", rate: s.sgst_rate, amount: s.sgst_amount });
  }
  if (Number(s.igst_amount) > 0 || Number(s.igst_rate) > 0) {
    gstRows.push({ LedgerName: "IGST", rate: s.igst_rate, amount: s.igst_amount });
  }

  return {
    InvoiceType: s.invoice_type || "Tax Invoice",
    IRN: s.irn || "",
    AckNo: s.ack_no || "",
    AckDate: formatDate(s.ack_date),
    SellerCompanyId: s.seller_company_id ? String(s.seller_company_id) : "",
    CompanyName: s.seller_name || "",
    CompanyAddress: s.seller_address || "",
    CompanyGstin: s.seller_gstin || "",
    CompanyState: s.seller_state || "",
    CompanyStateCode: s.seller_state_code || "",
    CompanyCIN: s.seller_cin || "",
    CompanyEmail: s.seller_email || "",
    BankAccountId: s.seller_bank_account_id ? String(s.seller_bank_account_id) : "",
    BankName: s.bank_name || "",
    BankAccountNo: s.bank_account_no || "",
    ...parseBankIfscBranch(s.bank_ifsc_branch),
    ConsigneeCompanyId: s.consignee_company_id ? String(s.consignee_company_id) : "",
    ConsigneeName: s.consignee_name || "",
    ConsigneeAddress: s.consignee_address || "",
    ConsigneeGstin: s.consignee_gstin || "",
    ConsigneeState: s.consignee_state || "",
    ConsigneeStateCode: s.consignee_state_code || "",
    ConsigneeEmail: s.consignee_email || "",
    CustomerCompanyId: s.buyer_company_id ? String(s.buyer_company_id) : "",
    CustomerName: s.buyer_name || "",
    BuyerAddress: s.buyer_address || "",
    customergstin: s.buyer_gstin || "",
    BuyerState: s.buyer_state || "",
    BuyerStateCode: s.buyer_state_code || "",
    BuyerPAN: s.buyer_pan || "",
    BuyerEmail: s.buyer_email || "",
    CompanyPAN: s.buyer_pan || "",
    InvoiceNo: s.invoice_no || "",
    EWayBillNo: s.eway_bill_no || "",
    InvoiceDate: formatDate(s.invoice_date),
    DeliveryNote: s.delivery_note || "",
    ModeTermsOfPayment: s.mode_of_payment || "",
    ReferenceNoDate: s.reference_no || "",
    OtherReferences: s.other_references || "",
    BuyersOrderNo: s.buyers_order_no || "",
    BuyersOrderDate: formatDate(s.reference_date),
    DispatchDocNo: s.dispatch_doc_no || "",
    DeliveryNoteDate: formatDate(s.delivery_note_date),
    DispatchedThrough: s.dispatched_through || "",
    Destination: s.destination || "",
    BillOfLadingNo: s.bill_of_lading_no || "",
    MotorVehicleNo: s.motor_vehicle_no || "",
    TermsOfDelivery: s.terms_of_delivery || "",
    BillAmount: Number(s.total_amount) || "",
    AmountInWords: s.amount_in_words || "",
    TaxAmountInWords: s.tax_amount_in_words || "",
    Declaration:
      s.declaration ||
      "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.",
    AuthorisedSignatoryName: s.authorised_signatory_name || "",
    AuthorisedSignatoryDesignation: s.authorised_signatory_designation || "",
    IssuingSignatoryName: s.issuing_signatory_name || "",
    IssuingSignatoryDesignation: s.issuing_signatory_designation || "",
    Jurisdiction: s.jurisdiction || "",
    BillItems: (s.items || []).map((item) => ({
      itemname: item.description,
      hsnSac: item.hsn_sac || "",
      quantity: item.quantity,
      unit: item.unit || "nos",
      rate: item.rate,
      amount: item.amount,
    })),
    GstDetails: gstRows.length
      ? gstRows
      : [{ LedgerName: "IGST", rate: "", amount: "" }],
    status: approvalToStatus(s.approval_status),
    approval_status: s.approval_status,
    tally_push_status: s.tally_push_status,
    tallyLabel: tallyToLabel(s.tally_push_status),
  };
};

export const mapFormToPayload = (formData, billItems, gstDetails) => {
  const itemsTotal = billItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const totalQty = billItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
  const gstTotal = gstDetails.reduce((sum, g) => sum + (parseFloat(g.amount) || 0), 0);
  const grandTotal = itemsTotal + gstTotal;

  const cgstRow = gstDetails.find((g) => g.LedgerName === "CGST") || {};
  const sgstRow = gstDetails.find((g) => g.LedgerName === "SGST") || {};
  const igstRow = gstDetails.find((g) => g.LedgerName === "IGST") || {};

  return {
    invoice_type: formData.InvoiceType || null,
    irn: formData.IRN || null,
    ack_no: formData.AckNo || null,
    ack_date: toDate(formData.AckDate),
    invoice_no: formData.InvoiceNo || `SI-${Date.now()}`,
    invoice_date: toDate(formData.InvoiceDate) || new Date().toISOString(),
    eway_bill_no: formData.EWayBillNo || null,
    delivery_note: formData.DeliveryNote || null,
    mode_of_payment: formData.ModeTermsOfPayment || null,
    reference_no: formData.ReferenceNoDate || null,
    reference_date: formData.BuyersOrderDate ? toDate(formData.BuyersOrderDate) : null,
    buyers_order_no: formData.BuyersOrderNo || null,
    other_references: formData.OtherReferences || null,
    dispatch_doc_no: formData.DispatchDocNo || null,
    delivery_note_date: formData.DeliveryNoteDate ? toDate(formData.DeliveryNoteDate) : null,
    dispatched_through: formData.DispatchedThrough || null,
    destination: formData.Destination || null,
    bill_of_lading_no: formData.BillOfLadingNo || null,
    motor_vehicle_no: formData.MotorVehicleNo || null,
    terms_of_delivery: formData.TermsOfDelivery || null,
    seller_company_id: formData.SellerCompanyId ? Number(formData.SellerCompanyId) : null,
    consignee_company_id: formData.ConsigneeCompanyId ? Number(formData.ConsigneeCompanyId) : null,
    buyer_company_id: formData.CustomerCompanyId ? Number(formData.CustomerCompanyId) : null,
    seller_name: formData.CompanyName || "Seller",
    seller_address: formData.CompanyAddress || "Address",
    seller_cin: formData.CompanyCIN || null,
    seller_bank_account_id: parseBankAccountIdForApi(formData.BankAccountId),
    seller_gstin: formData.CompanyGstin || "NA",
    seller_state: formData.CompanyState || "State",
    seller_state_code: formData.CompanyStateCode || "00",
    seller_email: formData.CompanyEmail || null,
    consignee_name: formData.ConsigneeName || null,
    consignee_address: formData.ConsigneeAddress || null,
    consignee_gstin: formData.ConsigneeGstin || null,
    consignee_state: formData.ConsigneeState || null,
    consignee_state_code: formData.ConsigneeStateCode || null,
    consignee_email: formData.ConsigneeEmail || null,
    buyer_name: formData.CustomerName || "Customer",
    buyer_address: formData.BuyerAddress || "Address",
    buyer_gstin: formData.customergstin || "NA",
    buyer_state: formData.BuyerState || "State",
    buyer_state_code: formData.BuyerStateCode || "00",
    buyer_pan: formData.BuyerPAN || formData.CompanyPAN || null,
    buyer_email: formData.BuyerEmail || null,
    total_quantity: totalQty || 0,
    taxable_value: itemsTotal,
    cgst_rate: parseFloat(cgstRow.rate) || 0,
    cgst_amount: parseFloat(cgstRow.amount) || 0,
    sgst_rate: parseFloat(sgstRow.rate) || 0,
    sgst_amount: parseFloat(sgstRow.amount) || 0,
    igst_rate: parseFloat(igstRow.rate) || 0,
    igst_amount: parseFloat(igstRow.amount) || 0,
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
    items: billItems.map((item, index) => ({
      sl_no: index + 1,
      description: item.itemname || "Item",
      hsn_sac: item.hsnSac || "",
      quantity: parseFloat(item.quantity) || 0,
      unit: item.unit || "nos",
      rate: parseFloat(item.rate) || 0,
      per: item.unit || "nos",
      amount: parseFloat(item.amount) || 0,
    })),
  };
};

export const getAllSales = async () => {
  const res = await fetch(`${BASE_URL}sales/`, { headers: authHeaders(false) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch sales invoices");
  return Array.isArray(data) ? data.map(mapSalesToList) : [];
};

export const getSalesById = async (id) => {
  const res = await fetch(`${BASE_URL}sales/${id}`, { headers: authHeaders(false) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Sales invoice not found");
  return mapSalesToForm(data);
};

export const createSales = async (payload) => {
  const res = await fetch(`${BASE_URL}sales/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create sales invoice");
  return data;
};

export const updateSales = async (id, payload) => {
  const res = await fetch(`${BASE_URL}sales/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update sales invoice");
  return data;
};

export const deleteSales = async (id) => {
  const res = await fetch(`${BASE_URL}sales/${id}`, {
    method: "DELETE",
    headers: authHeaders(false),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete sales invoice");
  return data;
};

export const approveSales = async (id, remarks = "") => {
  const res = await fetch(`${BASE_URL}sales/${id}/approve`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ remarks }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to approve sales invoice");
  return data;
};

export const pushSalesToTally = async (id) => {
  const res = await fetch(`${BASE_URL}sales/${id}/tally-push`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to push to Tally");
  return data;
};

export const retrySalesTallyPush = async (id) => {
  const res = await fetch(`${BASE_URL}sales/${id}/tally-push/retry`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to retry Tally push");
  return data;
};

export const scanSalesBill = async (file) => uploadDocumentForScan("sales/scan-bill", file);

const sellerManualFields = (party) => {
  if (!party) return {};
  return {
    CompanyName: party.name || "",
    CompanyAddress: party.address || "",
    CompanyGstin: party.gstin || "",
    CompanyState: party.state || "",
    CompanyStateCode: party.state_code || "",
    CompanyCIN: party.cin || "",
    CompanyEmail: party.email || "",
    BankName: party.bank_name || "",
    BankAccountNo: party.bank_account_no || "",
    BankBranch: party.bank_branch || "",
    BankIfsc: party.bank_ifsc || "",
  };
};

const customerManualFields = (party) => {
  if (!party) return {};
  return {
    CustomerName: party.name || "",
    BuyerAddress: party.address || "",
    customergstin: party.gstin || "",
    BuyerState: party.state || "",
    BuyerStateCode: party.state_code || "",
    BuyerPAN: party.pan || "",
    BuyerEmail: party.email || "",
  };
};

const consigneeManualFields = (party) => {
  if (!party) return {};
  return {
    ConsigneeName: party.name || "",
    ConsigneeAddress: party.address || "",
    ConsigneeGstin: party.gstin || "",
    ConsigneeState: party.state || "",
    ConsigneeStateCode: party.state_code || "",
    ConsigneeEmail: party.email || "",
  };
};

export const mapScannedBillToSalesForm = (scan, companies = [], products = []) => {
  const sellerCo = findCompanyByParty(companies, scan.vendor);
  const customerCo = findCompanyByParty(companies, scan.buyer);
  const consigneeCo = findCompanyByParty(companies, scan.consignee);

  const sellerFields = sellerCo
    ? mergeNonEmpty(mapCompanyToSellerFields(sellerCo), sellerManualFields(scan.vendor))
    : sellerManualFields(scan.vendor);
  const customerFields = customerCo
    ? mergeNonEmpty(mapCompanyToCustomerFields(customerCo), customerManualFields(scan.buyer))
    : customerManualFields(scan.buyer);
  const consigneeFields = consigneeCo
    ? mergeNonEmpty(mapCompanyToSalesConsigneeFields(consigneeCo), consigneeManualFields(scan.consignee))
    : consigneeManualFields(scan.consignee);

  const emptyItem = () => ({ productId: "", itemname: "", hsnSac: "", quantity: "", unit: "nos", rate: "", amount: "" });
  const emptyGst = () => ({ LedgerName: "", rate: "", amount: "" });
  const items = mapInvoiceItems(scan, products, emptyItem);
  const gstDetails = mapGstDetails(scan, emptyGst);

  return {
    formFields: {
      InvoiceType: scan.invoice_type || "Tax Invoice",
      IRN: scan.irn || "",
      AckNo: scan.ack_no || "",
      AckDate: scan.ack_date || "",
      InvoiceNo: scan.invoice_no || "",
      InvoiceDate: scan.invoice_date || "",
      EWayBillNo: scan.eway_bill_no || "",
      DeliveryNote: scan.delivery_note || "",
      DeliveryNoteDate: scan.delivery_note_date || "",
      ModeTermsOfPayment: scan.mode_of_payment || "",
      ReferenceNoDate: scan.reference_no || "",
      BuyersOrderNo: scan.po_no || "",
      BuyersOrderDate: scan.po_date || "",
      OtherReferences: scan.other_references || "",
      DispatchDocNo: scan.dispatch_doc_no || "",
      DispatchedThrough: scan.dispatched_through || "",
      Destination: scan.destination || "",
      BillOfLadingNo: scan.bill_of_lading_no || "",
      MotorVehicleNo: scan.motor_vehicle_no || "",
      TermsOfDelivery: scan.terms_of_delivery || "",
      BillAmount: scan.total_amount != null ? String(scan.total_amount) : "",
      AmountInWords: scan.amount_in_words || "",
      TaxAmountInWords: scan.tax_amount_in_words || "",
      AuthorisedSignatoryName: scan.authorised_signatory_name || "",
      AuthorisedSignatoryDesignation: scan.authorised_signatory_designation || "",
      IssuingSignatoryName: scan.issuing_signatory_name || "",
      IssuingSignatoryDesignation: scan.issuing_signatory_designation || "",
      Jurisdiction: scan.jurisdiction || "",
      ...sellerFields,
      SellerCompanyId: sellerCo ? String(sellerCo.id) : "",
      ...customerFields,
      CustomerCompanyId: customerCo ? String(customerCo.id) : "",
      ...consigneeFields,
      ConsigneeCompanyId: consigneeCo ? String(consigneeCo.id) : "",
    },
    items: items.length ? items : [emptyItem()],
    gstDetails,
    summary: {
      invoiceNo: scan.invoice_no,
      customerName: scan.buyer?.name,
      itemCount: items.length,
      totalAmount: scan.total_amount,
    },
  };
};

export const scanAndMapSalesBill = async (file, companies, products) => {
  const extracted = await scanSalesBill(file);
  return mapScannedBillToSalesForm(extracted, companies, products);
};
