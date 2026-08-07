/** Map CompanyDetail record to Tally company/ledger master JSON shape. */
export const mapCompanyDetailToTally = (company) => {
  if (!company) return null;

  const addLine1 = company.add_line1 || company.address || "";

  return {
    CompanyName: company.name || "",
    LedgerName: company.ledger_name || company.name || "",
    LedgerCode: company.code || "",
    LedgerGroup: company.ledger_group || "",
    AddLine1: addLine1,
    AddLine2: company.add_line2 || "",
    AddLine3: company.add_line3 || "",
    LedgerPIN: company.zipcode != null ? String(company.zipcode) : "",
    LedState: company.state || "",
    LedCountry: company.country || "India",
    ContactPerson: company.contact_person || "",
    ContactNumber: company.contact_number || "",
    EmailID: company.email || "",
    PanNumber: company.pan || "",
    GSTNumber: company.gst || "",
  };
};

/** Normalize incoming Tally/API payload into CompanyDetail field names. */
export const mapTallyToCompanyDetail = (payload = {}) => {
  const addLine1 = payload.AddLine1 ?? payload.add_line1 ?? payload.address ?? "";

  return {
    name: payload.CompanyName ?? payload.name ?? "",
    ledger_name: payload.LedgerName ?? payload.ledger_name ?? "",
    code: payload.LedgerCode ?? payload.code ?? "",
    ledger_group: payload.LedgerGroup ?? payload.ledger_group ?? "",
    add_line1: addLine1,
    add_line2: payload.AddLine2 ?? payload.add_line2 ?? "",
    add_line3: payload.AddLine3 ?? payload.add_line3 ?? "",
    address: addLine1,
    zipcode: payload.LedgerPIN ?? payload.zipcode ?? "",
    state: payload.LedState ?? payload.state ?? "",
    country: payload.LedCountry ?? payload.country ?? "India",
    contact_person: payload.ContactPerson ?? payload.contact_person ?? "",
    contact_number: payload.ContactNumber ?? payload.contact_number ?? "",
    email: payload.EmailID ?? payload.email ?? "",
    pan: payload.PanNumber ?? payload.pan ?? "",
    gst: payload.GSTNumber ?? payload.gst ?? "",
  };
};
