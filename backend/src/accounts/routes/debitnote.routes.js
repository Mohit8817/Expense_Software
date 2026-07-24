import express from "express";
import { checkPermission } from "../../middlewares/checkPermission.js";
import {
  createDebitNote,
  getAllDebitNotes,
  getDebitNoteById,
  updateDebitNote,
  deleteDebitNote,
  approveDebitNote,
  rejectDebitNote,
  pushDebitNoteToTally,
  retryDebitNoteTallyPush,
} from "../controllers/debitnote.controller.js";

const router = express.Router();

router.post("/", checkPermission("create_debit_note"), createDebitNote);
router.get("/", checkPermission("view_debit_note"), getAllDebitNotes);
router.get("/:id", checkPermission("view_debit_note"), getDebitNoteById);
router.put("/:id", checkPermission("edit_debit_note"), updateDebitNote);
router.delete("/:id", checkPermission("delete_debit_note"), deleteDebitNote);
router.patch("/:id/approve", checkPermission("edit_debit_note"), approveDebitNote);
router.patch("/:id/reject", checkPermission("edit_debit_note"), rejectDebitNote);
router.patch("/:id/tally-push", checkPermission("edit_debit_note"), pushDebitNoteToTally);
router.patch("/:id/tally-push/retry", checkPermission("edit_debit_note"), retryDebitNoteTallyPush);

export default router;
