/**
 * Shared mapping helpers for Credit Note, Debit Note, and Delivery Challan.
 * Form fields use PascalCase (same convention as Purchase/Sales).
 * API payloads use snake_case (Prisma column names).
 */
import {
  formatCompanyAddress,
  getCompanyStateCode,
} from "../../purchaseApi";
import { calcItemAmount, calcGstAmountFromRate, parseNonNegative } from "./numberInputUtils";

export const emptyItem = () => ({
  productId: "",
  itemname: "",
  hsnSac: "",
  quantity: "",
  unit: "nos",
  rate: "",
  amount: "",
});

export const emptyGst = () => ({ LedgerName: "", rate: "", amount: "" });

export const emptyTaxBreakup = () => ({
  hsnSac: "",
  taxableValue: "",
  cgstRate: "",
  cgstAmount: "",
  sgstRate: "",
  sgstAmount: "",
  igstRate: "",
  igstAmount: "",
  totalTaxAmount: "",
});

export const SELLER_CLEAR = {
  SellerCompanyId: "",
  SellerName: "",
  SellerAddress: "",
  SellerGstin: "",
  SellerState: "",
  SellerStateCode: "",
  SellerCIN: "",
  SellerEmail: "",
  SellerPAN: "",
};

export const CONSIGNEE_CLEAR = {
  ConsigneeCompanyId: "",
  ConsigneeName: "",
  ConsigneeAddress: "",
  ConsigneeGstin: "",
  ConsigneeState: "",
  ConsigneeStateCode: "",
  ConsigneeEmail: "",
};

export const BUYER_CLEAR = {
  BuyerCompanyId: "",
  BuyerName: "",
  BuyerAddress: "",
  BuyerGstin: "",
  BuyerState: "",
  BuyerStateCode: "",
  BuyerPAN: "",
  BuyerEmail: "",
};

export const mapCompanyToSellerFields = (company) => ({
  SellerCompanyId: String(company.id),
  SellerName: company.name || "",
  SellerAddress: formatCompanyAddress(company),
  SellerGstin: company.gst || "",
  SellerState: company.state || "",
  SellerStateCode: getCompanyStateCode(company),
  SellerCIN: company.cin || "",
  SellerEmail: company.email || "",
  SellerPAN: company.pan || "",
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
  BuyerName: company.name || "",
  BuyerAddress: formatCompanyAddress(company),
  BuyerGstin: company.gst || "",
  BuyerState: company.state || "",
  BuyerStateCode: getCompanyStateCode(company),
  BuyerPAN: company.pan || "",
  BuyerEmail: company.email || "",
});

export const mapSellerFromRecord = (r) => ({
  SellerCompanyId: r.seller_company_id ? String(r.seller_company_id) : "",
  SellerName: r.seller_name || "",
  SellerAddress: r.seller_address || "",
  SellerGstin: r.seller_gstin || "",
  SellerState: r.seller_state || "",
  SellerStateCode: r.seller_state_code || "",
  SellerCIN: r.seller_cin || "",
  SellerEmail: r.seller_email || "",
  SellerPAN: r.seller_pan || "",
});

export const mapConsigneeFromRecord = (r) => ({
  ConsigneeCompanyId: r.consignee_company_id ? String(r.consignee_company_id) : "",
  ConsigneeName: r.consignee_name || "",
  ConsigneeAddress: r.consignee_address || "",
  ConsigneeGstin: r.consignee_gstin || "",
  ConsigneeState: r.consignee_state || "",
  ConsigneeStateCode: r.consignee_state_code || "",
  ConsigneeEmail: r.consignee_email || "",
});

export const mapBuyerFromRecord = (r) => ({
  BuyerCompanyId: r.buyer_company_id ? String(r.buyer_company_id) : "",
  BuyerName: r.buyer_name || "",
  BuyerAddress: r.buyer_address || "",
  BuyerGstin: r.buyer_gstin || "",
  BuyerState: r.buyer_state || "",
  BuyerStateCode: r.buyer_state_code || "",
  BuyerPAN: r.buyer_pan || "",
  BuyerEmail: r.buyer_email || "",
});

export const mapSellerToPayload = (formData) => ({
  seller_company_id: formData.SellerCompanyId ? Number(formData.SellerCompanyId) : null,
  seller_name: formData.SellerName || "Seller",
  seller_address: formData.SellerAddress || "Address",
  seller_gstin: formData.SellerGstin || "NA",
  seller_state: formData.SellerState || "State",
  seller_state_code: formData.SellerStateCode || "00",
  seller_cin: formData.SellerCIN || null,
  seller_email: formData.SellerEmail || null,
  seller_pan: formData.SellerPAN || null,
});

export const mapConsigneeToPayload = (formData) => ({
  consignee_company_id: formData.ConsigneeCompanyId ? Number(formData.ConsigneeCompanyId) : null,
  consignee_name: formData.ConsigneeName || null,
  consignee_address: formData.ConsigneeAddress || null,
  consignee_gstin: formData.ConsigneeGstin || null,
  consignee_state: formData.ConsigneeState || null,
  consignee_state_code: formData.ConsigneeStateCode || null,
  consignee_email: formData.ConsigneeEmail || null,
});

export const mapBuyerToPayload = (formData) => ({
  buyer_company_id: formData.BuyerCompanyId ? Number(formData.BuyerCompanyId) : null,
  buyer_name: formData.BuyerName || "Buyer",
  buyer_address: formData.BuyerAddress || "Address",
  buyer_gstin: formData.BuyerGstin || "NA",
  buyer_state: formData.BuyerState || "State",
  buyer_state_code: formData.BuyerStateCode || "00",
  buyer_pan: formData.BuyerPAN || null,
  buyer_email: formData.BuyerEmail || null,
});

export const mapItemsFromRecord = (items = []) =>
  items.map((item) => ({
    productId: "",
    itemname: item.description,
    hsnSac: item.hsn_sac || "",
    quantity: item.quantity,
    unit: item.unit || "nos",
    rate: item.rate,
    amount: item.amount,
  }));

export const buildGstDetailsFromRecord = (record) => {
  const rows = [];
  if (Number(record.cgst_amount) > 0 || Number(record.cgst_rate) > 0) {
    rows.push({ LedgerName: "CGST", rate: record.cgst_rate, amount: record.cgst_amount });
  }
  if (Number(record.sgst_amount) > 0 || Number(record.sgst_rate) > 0) {
    rows.push({ LedgerName: "SGST", rate: record.sgst_rate, amount: record.sgst_amount });
  }
  if (Number(record.igst_amount) > 0 || Number(record.igst_rate) > 0) {
    rows.push({ LedgerName: "IGST", rate: record.igst_rate, amount: record.igst_amount });
  }
  return rows.length ? rows : [emptyGst()];
};

export const mapTaxBreakupFromRecord = (rows = []) =>
  rows.length
    ? rows.map((row) => ({
        hsnSac: row.hsn_sac || "",
        taxableValue: row.taxable_value ?? "",
        cgstRate: row.cgst_rate ?? "",
        cgstAmount: row.cgst_amount ?? "",
        sgstRate: row.sgst_rate ?? "",
        sgstAmount: row.sgst_amount ?? "",
        igstRate: row.igst_rate ?? "",
        igstAmount: row.igst_amount ?? "",
        totalTaxAmount: row.total_tax_amount ?? "",
      }))
    : [emptyTaxBreakup()];

export const mapTaxBreakupToPayload = (rows = []) =>
  rows
    .filter((row) => row.hsnSac)
    .map((row) => ({
      hsn_sac: row.hsnSac,
      taxable_value: parseFloat(row.taxableValue) || 0,
      cgst_rate: parseFloat(row.cgstRate) || 0,
      cgst_amount: parseFloat(row.cgstAmount) || 0,
      sgst_rate: parseFloat(row.sgstRate) || 0,
      sgst_amount: parseFloat(row.sgstAmount) || 0,
      igst_rate: parseFloat(row.igstRate) || 0,
      igst_amount: parseFloat(row.igstAmount) || 0,
      total_tax_amount: parseFloat(row.totalTaxAmount) || 0,
    }));

export const computeLineTotals = (items = [], gstDetails = []) => {
  const itemsTotal = items.reduce((sum, item) => {
    const amount =
      item.amount !== "" && item.amount !== undefined && item.amount !== null
        ? parseNonNegative(item.amount)
        : calcItemAmount(item.quantity, item.rate);
    return sum + amount;
  }, 0);
  const totalQty = items.reduce((sum, item) => sum + parseNonNegative(item.quantity), 0);
  const gstTotal = gstDetails.reduce((sum, g) => sum + parseNonNegative(g.amount), 0);
  return {
    itemsTotal: Number(itemsTotal.toFixed(2)),
    totalQty: Number(totalQty.toFixed(2)),
    gstTotal: Number(gstTotal.toFixed(2)),
    grandTotal: Number((itemsTotal + gstTotal).toFixed(2)),
  };
};

export const SELLER_FIELD_CONFIG = [
  { label: "Name", key: "SellerName" },
  { label: "Address", key: "SellerAddress" },
  { label: "GSTIN/UIN", key: "SellerGstin" },
  { label: "State", key: "SellerState" },
  { label: "State Code", key: "SellerStateCode" },
  { label: "CIN", key: "SellerCIN" },
  { label: "PAN", key: "SellerPAN" },
  { label: "Email", key: "SellerEmail" },
];

export const CONSIGNEE_FIELD_CONFIG = [
  { label: "Name", key: "ConsigneeName" },
  { label: "Address", key: "ConsigneeAddress" },
  { label: "GSTIN/UIN", key: "ConsigneeGstin" },
  { label: "State", key: "ConsigneeState" },
  { label: "State Code", key: "ConsigneeStateCode" },
  { label: "Email", key: "ConsigneeEmail" },
];

export const BUYER_FIELD_CONFIG = [
  { label: "Name", key: "BuyerName" },
  { label: "Address", key: "BuyerAddress" },
  { label: "GSTIN/UIN", key: "BuyerGstin" },
  { label: "State", key: "BuyerState" },
  { label: "State Code", key: "BuyerStateCode" },
  { label: "PAN", key: "BuyerPAN" },
  { label: "Email", key: "BuyerEmail" },
];
