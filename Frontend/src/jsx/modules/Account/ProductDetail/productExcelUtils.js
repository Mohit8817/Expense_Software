import * as XLSX from "xlsx";

export const PRODUCT_IMPORT_COLUMNS = [
  { key: "name", label: "Product Name", required: true },
  { key: "desc", label: "Description", required: true },
  { key: "hsn_sac", label: "HSN/SAC", required: false },
  { key: "units", label: "Units", required: false },
  { key: "status", label: "Status", required: false },
];

const SAMPLE_ROWS = [
  {
    "Product Name": "Sample Widget",
    Description: "Sample product for import",
    "HSN/SAC": "84713010",
    Units: "nos",
    Status: "Active",
  },
  {
    "Product Name": "Sample Raw Material",
    Description: "Another sample row — delete before importing",
    "HSN/SAC": "39269099",
    Units: "kg",
    Status: "Active",
  },
];

const HEADER_MAP = {
  "product name": "name",
  name: "name",
  description: "desc",
  desc: "desc",
  "hsn/sac": "hsn_sac",
  hsn_sac: "hsn_sac",
  hsn: "hsn_sac",
  sac: "hsn_sac",
  units: "units",
  unit: "units",
  status: "status",
};

const parseStatus = (value) => {
  if (value == null || value === "") return 1;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "active", "yes", "true"].includes(normalized)) return 1;
  if (["0", "inactive", "no", "false"].includes(normalized)) return 0;
  return 1;
};

const normalizeRow = (raw) => {
  const normalized = {};
  Object.entries(raw).forEach(([key, value]) => {
    const mapped = HEADER_MAP[String(key).trim().toLowerCase()];
    if (mapped) normalized[mapped] = value != null ? String(value).trim() : "";
  });

  return {
    name: normalized.name || "",
    desc: normalized.desc || "",
    hsn_sac: normalized.hsn_sac || "",
    units: normalized.units || "",
    status: parseStatus(normalized.status),
  };
};

const isEmptyRow = (row) => !row.name && !row.desc && !row.hsn_sac && !row.units;

export const downloadProductImportSample = () => {
  const worksheet = XLSX.utils.json_to_sheet(SAMPLE_ROWS);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
  XLSX.writeFile(workbook, "Product_Import_Sample.xlsx");
};

export const parseProductExcelFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          reject(new Error("Excel file has no sheets"));
          return;
        }
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        const products = rows.map(normalizeRow).filter((row) => !isEmptyRow(row));
        resolve(products);
      } catch {
        reject(new Error("Could not read Excel file. Use the sample format."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });

export const validateImportProducts = (products) => {
  const errors = [];
  products.forEach((product, index) => {
    const row = index + 2;
    if (!product.name) errors.push({ row, message: "Product Name is required" });
    if (!product.desc) errors.push({ row, message: "Description is required" });
  });
  return errors;
};
