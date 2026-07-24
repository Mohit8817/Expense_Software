import express from "express";
import upload from "../../middlewares/uploads.js";
import {
  deleteAttachment,
  getAttachments,
  uploadAttachments,
} from "../controllers/attachment.controller.js";
import { checkAttachmentPermission, checkDeleteAttachmentPermission } from "../middlewares/checkAttachmentPermission.js";

const router = express.Router();

router.get("/:documentType/:documentId", checkAttachmentPermission("view"), getAttachments);
router.post(
  "/:documentType/:documentId",
  checkAttachmentPermission("edit"),
  upload.array("files", 20),
  uploadAttachments
);
router.delete("/file/:id", checkDeleteAttachmentPermission, deleteAttachment);

export default router;
