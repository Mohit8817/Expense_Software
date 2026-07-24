import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const ATTACHMENT_DOCUMENT_TYPES = {
  PURCHASE: "PURCHASE",
  SALES: "SALES",
  CREDIT_NOTE: "CREDIT_NOTE",
  DEBIT_NOTE: "DEBIT_NOTE",
  DELIVERY_CHALLAN: "DELIVERY_CHALLAN",
  JOURNAL_VOUCHER: "JOURNAL_VOUCHER",
  PAYMENT_VOUCHER: "PAYMENT_VOUCHER",
  COMPANY: "COMPANY",
  PRODUCT: "PRODUCT",
};

const MODEL_TO_ATTACHMENT_TYPE = {
  purchase: ATTACHMENT_DOCUMENT_TYPES.PURCHASE,
  sales: ATTACHMENT_DOCUMENT_TYPES.SALES,
  creditNote: ATTACHMENT_DOCUMENT_TYPES.CREDIT_NOTE,
  debitNote: ATTACHMENT_DOCUMENT_TYPES.DEBIT_NOTE,
  deliveryChallan: ATTACHMENT_DOCUMENT_TYPES.DELIVERY_CHALLAN,
  journalVoucher: ATTACHMENT_DOCUMENT_TYPES.JOURNAL_VOUCHER,
  paymentVoucher: ATTACHMENT_DOCUMENT_TYPES.PAYMENT_VOUCHER,
};

export const attachmentTypeForModel = (modelName) => MODEL_TO_ATTACHMENT_TYPE[modelName] || null;

export const mapAttachment = (row) => ({
  id: row.id,
  document_type: row.document_type,
  document_id: row.document_id,
  file_name: row.file_name,
  original_name: row.original_name,
  mime_type: row.mime_type,
  file_size: row.file_size,
  createdAt: row.createdAt,
  url: `/uploads/${row.file_name}`,
});

export async function listAttachments(company_id, document_type, document_id) {
  const rows = await prisma.documentAttachment.findMany({
    where: {
      company_id,
      document_type,
      document_id: Number(document_id),
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapAttachment);
}

export async function deleteAttachmentsForDocument(company_id, document_type, document_id) {
  const rows = await prisma.documentAttachment.findMany({
    where: {
      company_id,
      document_type,
      document_id: Number(document_id),
    },
  });

  for (const row of rows) {
    const filePath = path.join(process.cwd(), "uploads", row.file_name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  await prisma.documentAttachment.deleteMany({
    where: {
      company_id,
      document_type,
      document_id: Number(document_id),
    },
  });
}
