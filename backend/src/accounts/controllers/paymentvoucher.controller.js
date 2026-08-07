import { PrismaClient } from "@prisma/client";
import {
  createPaymentVoucherHandlers,
  validateEntries,
  mapEntry,
} from "../utils/paymentVoucherBase.js";
import { DATA_STATUS_TALLY, resolveDataStatus } from "../constants/dataStatus.js";
import {
  normalizePaymentPayload,
  extractTallyPaymentRecords,
  isTallyPaymentBatchRequest,
  describeTallyPaymentBodyIssue,
} from "../utils/tallyPayloadUtils.js";
import {
  listLinkOptions,
  fetchLinkDocument,
  getDocumentBalance,
} from "../utils/paymentLinkUtils.js";

const prisma = new PrismaClient();

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

const paymentInclude = {
  entries: { orderBy: { sl_no: "asc" } },
  allocations: true,
  journalVoucher: { select: { id: true, voucher_no: true, narration: true } },
};

async function createPaymentVoucherRecord(req, rawRecord) {
  const company_id = req.user?.company_id;
  const user_id = req.user?.id;
  const fromTally = resolveDataStatus(req) === DATA_STATUS_TALLY;

  const { entries, DebitLedgers, CreditLedgers, allocations, ...rest } = rawRecord || {};

  const normalized = normalizePaymentPayload(
    rest,
    DebitLedgers ?? [],
    CreditLedgers ?? [],
    entries ?? []
  );
  const payload = normalized.body;

  if (!payload.voucher_no) {
    throw new Error("voucher_no / VoucherNo is required");
  }

  if (!normalized.entries.length) {
    throw new Error("At least one entry is required in entries / DebitLedgers / CreditLedgers");
  }

  const entryResult = validateEntries(normalized.entries);
  if (entryResult?.status) {
    const err = new Error(entryResult.message);
    err.status = entryResult.status;
    throw err;
  }

  const existing = await prisma.paymentVoucher.findUnique({
    where: { voucher_no: payload.voucher_no },
  });
  if (existing) {
    const err = new Error("A payment voucher with this number already exists");
    err.status = 409;
    throw err;
  }

  return prisma.paymentVoucher.create({
    data: {
      ...buildPaymentVoucherData(payload, entryResult.totalDebit, entryResult.totalCredit),
      company_id,
      user_id,
      data_status: resolveDataStatus(req),
      ...(fromTally && {
        approval_status: "APPROVED",
        approval_date: new Date(),
        tally_push_status: "PUSHED",
      }),
      entries: { create: normalized.entries.map(mapEntry) },
      ...(Array.isArray(allocations) &&
        allocations.length > 0 && {
          allocations: {
            create: allocations.map((row) => ({
              document_type: row.document_type,
              document_id: Number(row.document_id),
              document_no: row.document_no || null,
              document_amount: row.document_amount,
              paid_amount: row.paid_amount,
              allocation_type: row.allocation_type || "PARTIAL",
              remarks: row.remarks || null,
            })),
          },
        }),
    },
    include: paymentInclude,
  });
}

export const createPaymentVoucher = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    const user_id = req.user?.id;

    if (!company_id || !user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const records = extractTallyPaymentRecords(req.body);
    const isBatch = isTallyPaymentBatchRequest(req.body);

    if (!records.length) {
      return res.status(400).json({
        message: "No payment records found in request body",
        hint: describeTallyPaymentBodyIssue(req.body),
        example: {
          data: [
            {
              company_id: "KLKURJA",
              VoucherNo: "0089",
              VoucherDate: "02/Jul/2026",
              Narration: "paid to XYZ and ABC",
              DebitLedgers: [{ LedgerName: "XYZ Imprest A/c", Amount: 13000 }],
              CreditLedgers: [{ LedgerName: "HDFC Bank", Amount: 13000 }],
            },
          ],
        },
      });
    }

    if (isBatch || records.length > 1) {
      const created = [];
      const errors = [];

      for (const record of records) {
        const voucherRef = record.VoucherNo || record.voucher_no || "unknown";
        try {
          const payment = await createPaymentVoucherRecord(req, record);
          created.push(payment);
        } catch (error) {
          errors.push({
            VoucherNo: voucherRef,
            message: error.message,
          });
        }
      }

      if (!created.length) {
        return res.status(400).json({
          message: "No payment vouchers were created",
          data: [],
          errors,
        });
      }

      return res.status(201).json({
        message: `${created.length} payment voucher(s) created successfully`,
        data: created,
        ...(errors.length > 0 && { errors }),
      });
    }

    const payment = await createPaymentVoucherRecord(req, records[0]);

    return res.status(201).json({
      message: "Payment voucher created successfully",
      data: payment,
    });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({ message: error.message });
  }
};

const handlers = createPaymentVoucherHandlers({ buildData: buildPaymentVoucherData });

export const {
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
