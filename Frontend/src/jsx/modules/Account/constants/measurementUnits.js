/** Common measurement units for purchase / invoice line items */
export const MEASUREMENT_UNITS = [
  "nos",
  "no",
  "pcs",
  "pair",
  "set",
  "dozen",
  "kg",
  "g",
  "mg",
  "quintal",
  "ton",
  "mt",
  "ltr",
  "ml",
  "mtr",
  "cm",
  "mm",
  "km",
  "ft",
  "inch",
  "yd",
  "sqm",
  "sqft",
  "sqcm",
  "cft",
  "cum",
  "box",
  "pkt",
  "bag",
  "roll",
  "bundle",
  "carton",
  "bottle",
  "can",
  "drum",
  "barrel",
  "sheet",
  "coil",
  "slab",
  "lot",
  "job",
  "hr",
  "day",
  "month",
  "year",
  "kWh",
  "unit",
];

export const getUnitSelectOptions = (...extraUnits) => {
  const options = new Set(MEASUREMENT_UNITS);
  extraUnits
    .filter(Boolean)
    .map((u) => String(u).trim())
    .filter(Boolean)
    .forEach((u) => options.add(u));
  return Array.from(options);
};
