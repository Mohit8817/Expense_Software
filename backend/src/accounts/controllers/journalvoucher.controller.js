import { createJournalVoucherHandlers } from "../utils/journalVoucherBase.js";

const buildJournalVoucherData = (body) => ({
  voucher_no: body.voucher_no,
  voucher_date: body.voucher_date,
  voucher_type: body.voucher_type || "Journal Voucher",
  from_company_id: body.from_company_id ? Number(body.from_company_id) : null,
  company_name: body.company_name,
  company_address: body.company_address,
  company_state: body.company_state,
  company_state_code: body.company_state_code,
  company_cin: body.company_cin || null,
  company_email: body.company_email || null,
  payee_type: body.payee_type || "COMPANY",
  payee_company_id: body.payee_company_id ? Number(body.payee_company_id) : null,
  payee_employee_id: body.payee_employee_id ? Number(body.payee_employee_id) : null,
  payee_name: body.payee_name || null,
  payee_address: body.payee_address || null,
  payee_state: body.payee_state || null,
  payee_state_code: body.payee_state_code || null,
  payee_gstin: body.payee_gstin || null,
  payee_email: body.payee_email || null,
  payee_designation: body.payee_designation || null,
  narration: body.narration || null,
  on_account_of: body.on_account_of || null,
  total_debit: body.total_debit,
  total_credit: body.total_credit,
  authorised_signatory_name: body.authorised_signatory_name || null,
  authorised_signatory_designation: body.authorised_signatory_designation || null,
});

const handlers = createJournalVoucherHandlers({
  buildData: buildJournalVoucherData,
});

export const {
  create: createJournalVoucher,
  getAll: getAllJournalVouchers,
  getById: getJournalVoucherById,
  update: updateJournalVoucher,
  remove: deleteJournalVoucher,
  approve: approveJournalVoucher,
  reject: rejectJournalVoucher,
  pushToTally: pushJournalVoucherToTally,
  retryTallyPush: retryJournalVoucherTallyPush,
} = handlers;
