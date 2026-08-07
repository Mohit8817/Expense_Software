import { PrismaClient } from "@prisma/client";
import {
  createJournalVoucherHandlers,
  validateEntries,
  mapEntry,
} from "../utils/journalVoucherBase.js";
import { DATA_STATUS_TALLY, resolveDataStatus } from "../constants/dataStatus.js";
import {
  normalizeJournalVoucherPayload,
  extractTallyExpenseRecords,
  isTallyExpenseBatchRequest,
  describeTallyExpenseBodyIssue,
} from "../utils/tallyPayloadUtils.js";

const prisma = new PrismaClient();

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

const journalInclude = { entries: { orderBy: { sl_no: "asc" } } };

async function createJournalVoucherRecord(req, rawRecord) {
  const company_id = req.user?.company_id;
  const user_id = req.user?.id;
  const fromTally = resolveDataStatus(req) === DATA_STATUS_TALLY;

  const { entries, DebitLedgers, CreditLedgers, ...rest } = rawRecord || {};

  const normalized = normalizeJournalVoucherPayload(
    rest,
    DebitLedgers ?? [],
    CreditLedgers ?? [],
    entries ?? [],
    company_id
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

  const existing = await prisma.journalVoucher.findUnique({
    where: { voucher_no: payload.voucher_no },
  });
  if (existing) {
    const err = new Error("A journal voucher with this number already exists");
    err.status = 409;
    throw err;
  }

  return prisma.journalVoucher.create({
    data: {
      ...buildJournalVoucherData(payload),
      company_id,
      user_id,
      data_status: resolveDataStatus(req),
      ...(fromTally && {
        approval_status: "APPROVED",
        approval_date: new Date(),
        tally_push_status: "PUSHED",
      }),
      entries: { create: normalized.entries.map(mapEntry) },
    },
    include: journalInclude,
  });
}

export const createJournalVoucher = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    const user_id = req.user?.id;

    if (!company_id || !user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const records = extractTallyExpenseRecords(req.body);
    const isBatch = isTallyExpenseBatchRequest(req.body);

    if (!records.length) {
      return res.status(400).json({
        message: "No expense records found in request body",
        hint: describeTallyExpenseBodyIssue(req.body),
        example: {
          data: [
            {
              company_id: "KLKURJA",
              VoucherNo: "JV0089",
              VoucherDate: "02/Jul/2026",
              Narration: "Office expense",
              DebitLedgers: [{ LedgerName: "Rent Expense", Amount: 5000 }],
              CreditLedgers: [{ LedgerName: "HDFC Bank", Amount: 5000 }],
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
          const voucher = await createJournalVoucherRecord(req, record);
          created.push(voucher);
        } catch (error) {
          errors.push({
            VoucherNo: voucherRef,
            message: error.message,
          });
        }
      }

      if (!created.length) {
        return res.status(400).json({
          message: "No expense vouchers were created",
          data: [],
          errors,
        });
      }

      return res.status(201).json({
        message: `${created.length} expense voucher(s) created successfully`,
        data: created,
        ...(errors.length > 0 && { errors }),
      });
    }

    const voucher = await createJournalVoucherRecord(req, records[0]);

    return res.status(201).json({
      message: "Journal voucher created successfully",
      data: voucher,
    });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({ message: error.message });
  }
};

const handlers = createJournalVoucherHandlers({
  buildData: buildJournalVoucherData,
});

export const {
  getAll: getAllJournalVouchers,
  getById: getJournalVoucherById,
  update: updateJournalVoucher,
  remove: deleteJournalVoucher,
  approve: approveJournalVoucher,
  reject: rejectJournalVoucher,
  pushToTally: pushJournalVoucherToTally,
  retryTallyPush: retryJournalVoucherTallyPush,
} = handlers;
