/** Helpers for company bank accounts on purchase/sales forms */

export const getCompanyBankAccounts = (company) => {
  if (Array.isArray(company?.bank_accounts) && company.bank_accounts.length > 0) {
    return company.bank_accounts;
  }
  return [];
};

export const getPrimaryBankAccount = (company) => {
  const accounts = getCompanyBankAccounts(company);
  if (!accounts.length) return null;
  return accounts.find((a) => a.is_primary) || accounts[0];
};

export const mapBankAccountToFormFields = (bank) => ({
  BankAccountId: bank?.id != null ? String(bank.id) : "",
  BankName: bank?.bank_name || "",
  BankAccountNo: bank?.ac_no || "",
  BankBranch: bank?.branch_name || "",
  BankIfsc: bank?.ifsc_code || "",
});

export const BANK_FIELDS_CLEAR = {
  BankAccountId: "",
  BankName: "",
  BankAccountNo: "",
  BankBranch: "",
  BankIfsc: "",
};

export const parseBankAccountIdForApi = (id) => {
  if (!id || String(id).startsWith("legacy-")) return null;
  const num = Number(id);
  return Number.isNaN(num) ? null : num;
};

export const formatBankAccountLabel = (bank) => {
  if (!bank) return "";
  const parts = [bank.bank_name, bank.ac_no].filter(Boolean);
  if (bank.ifsc_code) parts.push(bank.ifsc_code);
  return parts.join(" · ");
};
