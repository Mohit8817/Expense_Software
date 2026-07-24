import { PrismaClient } from "@prisma/client";
import {
  ATTACHMENT_DOCUMENT_TYPES,
  deleteAttachmentsForDocument,
} from "../utils/attachmentUtils.js";

const prisma = new PrismaClient();

const companyInclude = { bank_accounts: { orderBy: [{ is_primary: "desc" }, { id: "asc" }] } };

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

export const createCompany = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    const user_id = req.user?.id;
    const {
      name,
      short_name,
      gst,
      pan,
      tan,
      cin,
      email,
      state_code,
      address,
      city,
      state,
      zipcode,
      code,
      status,
      bank_accounts,
    } = req.body;

    if (!company_id || !user_id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!name || !short_name || !address || !city || !state || !zipcode || !code) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing.",
      });
    }

    const company = await prisma.companyDetail.create({
      data: {
        company_id,
        user_id,
        name,
        short_name,
        gst: gst || null,
        pan: pan || null,
        tan: tan || null,
        cin: cin || null,
        email: email || null,
        state_code: state_code || null,
        address,
        city,
        state,
        zipcode: Number(zipcode),
        code,
        status: status != null ? Number(status) : 0,
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

    const companies = await prisma.companyDetail.findMany({
      where: { company_id },
      include: companyInclude,
      orderBy: { id: "desc" },
    });

    return res.status(200).json({ success: true, data: companies });
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

    return res.status(200).json({ success: true, data: company });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    const { id } = req.params;
    const {
      name,
      short_name,
      gst,
      pan,
      tan,
      cin,
      email,
      state_code,
      address,
      city,
      state,
      zipcode,
      code,
      status,
      bank_accounts,
    } = req.body;

    const company = await prisma.companyDetail.findFirst({
      where: { id: Number(id), company_id },
    });

    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found." });
    }

    await prisma.companyDetail.update({
      where: { id: Number(id) },
      data: {
        ...(name != null && { name }),
        ...(short_name != null && { short_name }),
        ...(gst !== undefined && { gst: gst || null }),
        ...(pan !== undefined && { pan: pan || null }),
        ...(tan !== undefined && { tan: tan || null }),
        ...(cin !== undefined && { cin: cin || null }),
        ...(email !== undefined && { email: email || null }),
        ...(state_code !== undefined && { state_code: state_code || null }),
        ...(address != null && { address }),
        ...(city != null && { city }),
        ...(state != null && { state }),
        ...(zipcode != null && { zipcode: Number(zipcode) }),
        ...(code != null && { code }),
        ...(status != null && { status: Number(status) }),
      },
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
