import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import {
  ATTACHMENT_DOCUMENT_TYPES,
  deleteAttachmentsForDocument,
  listAttachments,
  mapAttachment,
} from "../utils/attachmentUtils.js";

const prisma = new PrismaClient();

const isValidDocumentType = (type) =>
  Object.values(ATTACHMENT_DOCUMENT_TYPES).includes(String(type).toUpperCase());

export const getAttachments = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    if (!company_id) return res.status(401).json({ message: "Unauthorized" });

    const { documentType, documentId } = req.params;
    if (!isValidDocumentType(documentType)) {
      return res.status(400).json({ message: "Invalid document type" });
    }

    const attachments = await listAttachments(
      company_id,
      documentType.toUpperCase(),
      documentId
    );
    return res.json(attachments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const uploadAttachments = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    const user_id = req.user?.id;
    if (!company_id || !user_id) return res.status(401).json({ message: "Unauthorized" });

    const { documentType, documentId } = req.params;
    if (!isValidDocumentType(documentType)) {
      return res.status(400).json({ message: "Invalid document type" });
    }

    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ message: "At least one file is required" });
    }

    const created = await prisma.$transaction(
      files.map((file) =>
        prisma.documentAttachment.create({
          data: {
            company_id,
            user_id,
            document_type: documentType.toUpperCase(),
            document_id: Number(documentId),
            file_name: file.filename,
            original_name: file.originalname,
            mime_type: file.mimetype || null,
            file_size: file.size || null,
          },
        })
      )
    );

    return res.status(201).json({
      message: `${created.length} file(s) uploaded successfully`,
      data: created.map(mapAttachment),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export const deleteAttachment = async (req, res) => {
  try {
    const company_id = req.user?.company_id;
    if (!company_id) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const existing = await prisma.documentAttachment.findFirst({
      where: { id: Number(id), company_id },
    });

    if (!existing) return res.status(404).json({ message: "Attachment not found" });

    const filePath = path.join(process.cwd(), "uploads", existing.file_name);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.documentAttachment.delete({ where: { id: Number(id) } });
    return res.json({ message: "Attachment deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export { deleteAttachmentsForDocument, ATTACHMENT_DOCUMENT_TYPES };
