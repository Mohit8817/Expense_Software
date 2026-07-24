/** Numeric field helpers for voucher forms (qty, rate, GST, tax breakup). */

export const NON_NEGATIVE_NUMERIC_FIELDS = new Set([
  "quantity",
  "rate",
  "amount",
  "rate",
  "amount",
  "taxableValue",
  "cgstRate",
  "cgstAmount",
  "sgstRate",
  "sgstAmount",
  "igstRate",
  "igstAmount",
  "totalTaxAmount",
]);

export const parseNonNegative = (value) => {
  const num = parseFloat(value);
  if (Number.isNaN(num) || num < 0) return 0;
  return num;
};

/** Sanitize while typing — allows empty, blocks negatives. */
export const sanitizeNonNegativeInput = (value) => {
  if (value === "" || value === null || value === undefined) return "";
  const str = String(value);
  if (str === "-" || str.startsWith("-")) return "0";
  const num = parseFloat(str);
  if (!Number.isNaN(num) && num < 0) return "0";
  return str;
};

/** Clamp on blur — empty stays empty unless defaultZero. */
export const finalizeNonNegativeInput = (value, defaultZero = false) => {
  if (value === "" || value === null || value === undefined) {
    return defaultZero ? "0" : "";
  }
  const num = parseFloat(value);
  if (Number.isNaN(num) || num < 0) return "0";
  return String(num);
};

export const calcItemAmount = (quantity, rate) => {
  const qty = parseNonNegative(quantity);
  const r = parseNonNegative(rate);
  return Number((qty * r).toFixed(2));
};

export const calcGstAmountFromRate = (itemsTotal, rate) => {
  const total = parseNonNegative(itemsTotal);
  const r = parseNonNegative(rate);
  return Number(((total * r) / 100).toFixed(2));
};

export const blockNegativeNumberKeys = (e) => {
  if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
    e.preventDefault();
  }
};
