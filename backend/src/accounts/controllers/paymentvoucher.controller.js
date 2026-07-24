import { createPaymentVoucherHandlers } from "../utils/paymentVoucherBase.js";
import {
  listLinkOptions,
  fetchLinkDocument,
  getDocumentBalance,
} from "../utils/paymentLinkUtils.js";

const buildPaymentVoucherData = (body, totalDebit, totalCredit) => ({
  voucher_no: body.voucher_no,
  voucher_date: body.voucher_date,
  payment_type: body.payment_type || "GENERAL",
  payment_mode: body.payment_mode || "BANK",
  narration: body.narration || null,
  on_account_of: body.on_account_of || null,
  from_company_id: body.from_company_id ? Number(body.from_company_id) : null,
  from_company_name: body.from_company_name || null,
  from_company_address: body.from_company_address || null,
  from_company_gstin: body.from_company_gstin || null,
  payee_type: body.payee_type || "COMPANY",
  payee_employee_id: body.payee_employee_id ? Number(body.payee_employee_id) : null,
  party_company_id: body.party_company_id ? Number(body.party_company_id) : null,
  party_name: body.party_name || null,
  party_gstin: body.party_gstin || null,
  party_address: body.party_address || null,
  journal_voucher_id: body.journal_voucher_id ? Number(body.journal_voucher_id) : null,
  linked_document_type: body.linked_document_type || null,
  linked_document_id: body.linked_document_id ? Number(body.linked_document_id) : null,
  linked_document_no: body.linked_document_no || null,
  linked_document_amount: body.linked_document_amount ?? null,
  bank_account_id: body.bank_account_id ? Number(body.bank_account_id) : null,
  bank_name: body.bank_name || null,
  bank_account_no: body.bank_account_no || null,
  bank_ifsc: body.bank_ifsc || null,
  reference_no: body.reference_no || null,
  cheque_no: body.cheque_no || null,
  cheque_date: body.cheque_date || null,
  total_debit: totalDebit,
  total_credit: totalCredit,
  total_amount: totalDebit,
  authorised_signatory_name: body.authorised_signatory_name || null,
  authorised_signatory_designation: body.authorised_signatory_designation || null,
});

const handlers = createPaymentVoucherHandlers({ buildData: buildPaymentVoucherData });

export const {
  create: createPaymentVoucher,
  getAll: getAllPaymentVouchers,
  getById: getPaymentVoucherById,
  update: updatePaymentVoucher,
  remove: deletePaymentVoucher,
  approve: approvePaymentVoucher,
  reject: rejectPaymentVoucher,
  pushToTally: pushPaymentVoucherToTally,
  retryTallyPush: retryPaymentVoucherTallyPush,
} = handlers;

export const getPaymentLinkOptions = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    if (!company_id) return res.status(401).json({ message: "Unauthorized" });

    const { type } = req.query;
    if (!type) return res.status(400).json({ message: "Document type is required" });

    const rows = await listLinkOptions(company_id, type.toUpperCase());
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const getPaymentLinkDocument = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    if (!company_id) return res.status(401).json({ message: "Unauthorized" });

    const { type, id } = req.params;
    const excludeId = req.query.excludePaymentId;

    const balance = await getDocumentBalance(company_id, type.toUpperCase(), id, excludeId);
    if (!balance) return res.status(404).json({ message: "Posted document not found" });

    const full = await fetchLinkDocument(company_id, type.toUpperCase(), id);
    return res.json(full);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const getPaymentDocumentBalance = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    if (!company_id) return res.status(401).json({ message: "Unauthorized" });

    const { type, id } = req.params;
    const excludeId = req.query.excludePaymentId;

    const balance = await getDocumentBalance(company_id, type.toUpperCase(), id, excludeId);
    if (!balance) return res.status(404).json({ message: "Document not found" });

    return res.json(balance);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};
