import { checkPermission } from "../../middlewares/checkPermission.js";
import { ATTACHMENT_PERMISSIONS } from "../../constants/accountPermissions.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Check permission for file attachments based on document type in URL.
 * GET  → view permission
 * POST → edit permission
 */
export const checkAttachmentPermission = (action) => {
  return (req, res, next) => {
    const type = String(req.params.documentType || "").toUpperCase();
    const permKey = ATTACHMENT_PERMISSIONS[type]?.[action];

    if (!permKey) {
      return res.status(400).json({ message: `Unknown document type: ${type}` });
    }

    return checkPermission(permKey)(req, res, next);
  };
};

/** DELETE /file/:id — look up attachment first, then check edit permission */
export const checkDeleteAttachmentPermission = async (req, res, next) => {
  try {
    const company_id = req.user?.company_id;
    const existing = await prisma.documentAttachment.findFirst({
      where: { id: Number(req.params.id), company_id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    const permKey = ATTACHMENT_PERMISSIONS[existing.document_type]?.edit;
    if (!permKey) {
      return res.status(400).json({ message: "Unknown document type" });
    }

    return checkPermission(permKey)(req, res, next);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
