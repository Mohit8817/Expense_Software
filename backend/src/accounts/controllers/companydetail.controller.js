import { PrismaClient } from "@prisma/client";
import { DATA_STATUS_TALLY, resolveDataStatus } from "../constants/dataStatus.js";
import {
  ATTACHMENT_DOCUMENT_TYPES,
  deleteAttachmentsForDocument,
} from "../utils/attachmentUtils.js";
import {
  mapCompanyDetailToTally,
  mapTallyToCompanyDetail,
} from "../utils/companyTallyMapper.js";

const prisma = new PrismaClient();

const companyInclude = { bank_accounts: { orderBy: [{ is_primary: "desc" }, { id: "asc" }] } };

const isTallyPayload = (body = {}) =>
  body.CompanyName != null ||
  body.LedgerName != null ||
  body.LedgerCode != null ||
  body.AddLine1 != null;

const prepareRequestBody = (rawBody) => {
  if (!isTallyPayload(rawBody)) return rawBody;

  const mapped = mapTallyToCompanyDetail(rawBody);
  const merged = { ...mapped, ...rawBody };

  if (!merged.short_name?.trim()) {
    merged.short_name = merged.code?.trim() || merged.name?.trim()?.slice(0, 10) || "";
  }
  if (merged.city == null) merged.city = "";
  if (merged.status == null) merged.status = 1;

  return merged;
};

const normalizeCompanyInput = (body) => {
  const addLine1 = body.add_line1?.trim() || body.address?.trim() || "";
  const name = body.name?.trim() || "";

  return {
    name,
    ledger_name: body.ledger_name?.trim() || name,
    short_name: body.short_name?.trim() || "",
    gst: body.gst?.trim() || null,
    pan: body.pan?.trim() || null,
    tan: body.tan?.trim() || null,
    cin: body.cin?.trim() || null,
    email: body.email?.trim() || null,
    state_code: body.state_code?.trim() || null,
    address: addLine1,
    add_line1: addLine1 || null,
    add_line2: body.add_line2?.trim() || null,
    add_line3: body.add_line3?.trim() || null,
    city: body.city?.trim() || "",
    state: body.state?.trim() || "",
    country: body.country?.trim() || "India",
    zipcode: body.zipcode != null && body.zipcode !== "" ? Number(body.zipcode) : null,
    contact_person: body.contact_person?.trim() || null,
    contact_number: body.contact_number?.trim() || null,
    ledger_group: body.ledger_group?.trim() || null,
    code: body.code?.trim() || "",
    status: body.status != null ? Number(body.status) : 1,
  };
};

const mapBankAccountInput = (bank) => ({
  bank_name: bank.bank_name || "",
  ac_no: bank.ac_no || "",
  branch_name: bank.branch_name || "",
  ifsc_code: bank.ifsc_code || "",
  is_primary: !!bank.is_primary,
});

const syncBankAccounts = async (companyDetailId, bank_accounts) => {
  if (!Array.isArray(bank_accounts)) return;

  await prisma.companyBankAccount.deleteMany({
    where: { company_detail_id: companyDetailId },
  });

  if (bank_accounts.length === 0) return;

  const hasPrimary = bank_accounts.some((b) => b.is_primary);
  await prisma.companyBankAccount.createMany({
    data: bank_accounts
      .filter((b) => b.bank_name || b.ac_no)
      .map((bank, index) => ({
        company_detail_id: companyDetailId,
        ...mapBankAccountInput(bank),
        is_primary: hasPrimary ? !!bank.is_primary : index === 0,
      })),
  });
};

async function sendToTally(record) {
  return mapCompanyDetailToTally(record);
}

const canMutateRecord = (existing, req) =>
  existing.approval_status === "PENDING" || resolveDataStatus(req) === DATA_STATUS_TALLY;

export const createCompany = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    const user_id = req.user?.id;
    const { bank_accounts, ...rawBody } = req.body;
    const preparedBody = prepareRequestBody(rawBody);
    const input = normalizeCompanyInput(preparedBody);
    const fromTally = resolveDataStatus(req) === DATA_STATUS_TALLY;

    if (!company_id || !user_id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (
      !input.name ||
      !input.short_name ||
      !input.address ||
      !input.state ||
      input.zipcode == null ||
      !input.code
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing.",
      });
    }

    const company = await prisma.companyDetail.create({
      data: {
        company_id,
        user_id,
        ...input,
        data_status: resolveDataStatus(req),
        approval_status: fromTally ? "APPROVED" : "PENDING",
        approval_date: fromTally ? new Date() : null,
        tally_push_status: fromTally ? "PUSHED" : "NOT_PUSHED",
      },
    });

    await syncBankAccounts(company.id, bank_accounts);

    const withBanks = await prisma.companyDetail.findUnique({
      where: { id: company.id },
      include: companyInclude,
    });

    return res.status(201).json({
      success: true,
      message: "Company created successfully.",
      data: withBanks,
      tally: mapCompanyDetailToTally(withBanks),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCompanies = async (req, res) => {
  try {
    const company_id = req.user?.company_id;

    if (!company_id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { approval_status, tally_push_status } = req.query;

    const companies = await prisma.companyDetail.findMany({
      where: {
        company_id,
        ...(approval_status && { approval_status }),
        ...(tally_push_status && { tally_push_status }),
      },
      include: companyInclude,
      orderBy: { id: "desc" },
    });

    return res.status(200).json({ success: true, data: companies });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCompanyTallyFormat = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    const { id } = req.params;

    const company = await prisma.companyDetail.findFirst({
      where: { id: Number(id), company_id },
      include: companyInclude,
    });

    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found." });
    }

    return res.status(200).json({
      success: true,
      data: mapCompanyDetailToTally(company),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCompanyById = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    const { id } = req.params;

    const company = await prisma.companyDetail.findFirst({
      where: { id: Number(id), company_id },
      include: companyInclude,
    });

    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found." });
    }

    return res.status(200).json({
      success: true,
      data: company,
      tally: mapCompanyDetailToTally(company),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    const { id } = req.params;
    const { bank_accounts, ...rawBody } = req.body;
    const preparedBody = prepareRequestBody(rawBody);

    const company = await prisma.companyDetail.findFirst({
      where: { id: Number(id), company_id },
    });

    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found." });
    }

    if (!canMutateRecord(company, req)) {
      return res.status(400).json({
        success: false,
        message: `Company cannot be updated once it is ${company.approval_status}`,
      });
    }

    const input = normalizeCompanyInput({ ...company, ...preparedBody });
    const updateData = {};

    if (preparedBody.name != null) updateData.name = input.name;
    if (preparedBody.ledger_name != null || preparedBody.name != null) {
      updateData.ledger_name = input.ledger_name;
    }
    if (preparedBody.short_name != null) updateData.short_name = input.short_name;
    if (preparedBody.gst !== undefined) updateData.gst = input.gst;
    if (preparedBody.pan !== undefined) updateData.pan = input.pan;
    if (preparedBody.tan !== undefined) updateData.tan = input.tan;
    if (preparedBody.cin !== undefined) updateData.cin = input.cin;
    if (preparedBody.email !== undefined) updateData.email = input.email;
    if (preparedBody.state_code !== undefined) updateData.state_code = input.state_code;
    if (preparedBody.add_line1 != null || preparedBody.address != null) {
      updateData.address = input.address;
      updateData.add_line1 = input.add_line1;
    }
    if (preparedBody.add_line2 !== undefined) updateData.add_line2 = input.add_line2;
    if (preparedBody.add_line3 !== undefined) updateData.add_line3 = input.add_line3;
    if (preparedBody.city != null) updateData.city = input.city;
    if (preparedBody.state != null) updateData.state = input.state;
    if (preparedBody.country !== undefined) updateData.country = input.country;
    if (preparedBody.zipcode != null) updateData.zipcode = input.zipcode;
    if (preparedBody.contact_person !== undefined) updateData.contact_person = input.contact_person;
    if (preparedBody.contact_number !== undefined) updateData.contact_number = input.contact_number;
    if (preparedBody.ledger_group !== undefined) updateData.ledger_group = input.ledger_group;
    if (preparedBody.code != null) updateData.code = input.code;
    if (preparedBody.status != null) updateData.status = input.status;

    await prisma.companyDetail.update({
      where: { id: Number(id) },
      data: updateData,
    });

    if (Array.isArray(bank_accounts)) {
      await syncBankAccounts(Number(id), bank_accounts);
    }

    const updatedCompany = await prisma.companyDetail.findUnique({
      where: { id: Number(id) },
      include: companyInclude,
    });

    return res.status(200).json({
      success: true,
      message: "Company updated successfully.",
      data: updatedCompany,
      tally: mapCompanyDetailToTally(updatedCompany),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    const { id } = req.params;

    const company = await prisma.companyDetail.findFirst({
      where: { id: Number(id), company_id },
    });

    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found." });
    }

    if (!canMutateRecord(company, req)) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete a company that has already been ${company.approval_status}`,
      });
    }

    await deleteAttachmentsForDocument(company_id, ATTACHMENT_DOCUMENT_TYPES.COMPANY, id);

    await prisma.companyDetail.delete({ where: { id: Number(id) } });

    return res.status(200).json({
      success: true,
      message: "Company deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const approveCompany = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    const { id } = req.params;
    const { remarks } = req.body;

    const existing = await prisma.companyDetail.findFirst({
      where: { id: Number(id), company_id },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Company not found." });
    }
    if (existing.approval_status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Company is already ${existing.approval_status}`,
      });
    }

    const approved = await prisma.companyDetail.update({
      where: { id: Number(id) },
      data: {
        approval_status: "APPROVED",
        approval_date: new Date(),
        approval_remarks: remarks || null,
      },
      include: companyInclude,
    });

    return res.status(200).json({
      success: true,
      message: "Company approved successfully.",
      data: approved,
      tally: mapCompanyDetailToTally(approved),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectCompany = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    const { id } = req.params;
    const { remarks } = req.body;

    if (!remarks) {
      return res.status(400).json({
        success: false,
        message: "remarks are required when rejecting a company",
      });
    }

    const existing = await prisma.companyDetail.findFirst({
      where: { id: Number(id), company_id },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Company not found." });
    }
    if (existing.approval_status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Company is already ${existing.approval_status}`,
      });
    }

    const rejected = await prisma.companyDetail.update({
      where: { id: Number(id) },
      data: {
        approval_status: "REJECTED",
        approval_date: new Date(),
        approval_remarks: remarks,
      },
      include: companyInclude,
    });

    return res.status(200).json({
      success: true,
      message: "Company rejected successfully.",
      data: rejected,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const pushCompanyToTally = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    const { id } = req.params;

    const record = await prisma.companyDetail.findFirst({
      where: { id: Number(id), company_id },
      include: companyInclude,
    });

    if (!record) {
      return res.status(404).json({ success: false, message: "Company not found." });
    }
    if (record.approval_status !== "APPROVED") {
      return res.status(400).json({ message: "Only approved companies can be pushed to Tally" });
    }
    if (record.tally_push_status === "PUSHED") {
      return res.status(400).json({ message: "Company has already been pushed to Tally" });
    }

    try {
      await sendToTally(record);
      const updated = await prisma.companyDetail.update({
        where: { id: Number(id) },
        data: { tally_push_status: "PUSHED" },
        include: companyInclude,
      });
      return res.status(200).json({
        success: true,
        message: "Company pushed to Tally successfully",
        data: updated,
        tally: mapCompanyDetailToTally(updated),
      });
    } catch (tallyError) {
      await prisma.companyDetail.update({
        where: { id: Number(id) },
        data: { tally_push_status: "FAILED" },
      });
      return res.status(502).json({ message: "Tally push failed", error: tallyError.message });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const retryCompanyTallyPush = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    const { id } = req.params;

    const record = await prisma.companyDetail.findFirst({
      where: { id: Number(id), company_id },
      include: companyInclude,
    });

    if (!record) {
      return res.status(404).json({ success: false, message: "Company not found." });
    }
    if (record.approval_status !== "APPROVED") {
      return res.status(400).json({ message: "Only approved companies can be pushed to Tally" });
    }
    if (record.tally_push_status !== "FAILED") {
      return res.status(400).json({
        message: `Retry is only allowed for FAILED pushes. Current status: ${record.tally_push_status}`,
      });
    }

    try {
      await sendToTally(record);
      const updated = await prisma.companyDetail.update({
        where: { id: Number(id) },
        data: { tally_push_status: "PUSHED" },
        include: companyInclude,
      });
      return res.status(200).json({
        success: true,
        message: "Company pushed to Tally successfully",
        data: updated,
        tally: mapCompanyDetailToTally(updated),
      });
    } catch (tallyError) {
      return res.status(502).json({ message: "Tally retry push failed", error: tallyError.message });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
