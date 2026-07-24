import express from "express";
import { checkPermission } from "../../middlewares/checkPermission.js";
import {
  createCreditNote,
  getAllCreditNotes,
  getCreditNoteById,
  updateCreditNote,
  deleteCreditNote,
  approveCreditNote,
  rejectCreditNote,
  pushCreditNoteToTally,
  retryCreditNoteTallyPush,
} from "../controllers/creditnote.controller.js";

const router = express.Router();

router.post("/", checkPermission("create_credit_note"), createCreditNote);
router.get("/", checkPermission("view_credit_note"), getAllCreditNotes);
router.get("/:id", checkPermission("view_credit_note"), getCreditNoteById);
router.put("/:id", checkPermission("edit_credit_note"), updateCreditNote);
router.delete("/:id", checkPermission("delete_credit_note"), deleteCreditNote);
router.patch("/:id/approve", checkPermission("edit_credit_note"), approveCreditNote);
router.patch("/:id/reject", checkPermission("edit_credit_note"), rejectCreditNote);
router.patch("/:id/tally-push", checkPermission("edit_credit_note"), pushCreditNoteToTally);
router.patch("/:id/tally-push/retry", checkPermission("edit_credit_note"), retryCreditNoteTallyPush);

export default router;
