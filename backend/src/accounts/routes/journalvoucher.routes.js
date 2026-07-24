import express from "express";
import upload from "../../middlewares/uploads.js";
import { checkPermission } from "../../middlewares/checkPermission.js";
import {
  createJournalVoucher,
  getAllJournalVouchers,
  getJournalVoucherById,
  updateJournalVoucher,
  deleteJournalVoucher,
  approveJournalVoucher,
  rejectJournalVoucher,
  pushJournalVoucherToTally,
  retryJournalVoucherTallyPush,
} from "../controllers/journalvoucher.controller.js";
import { scanExpenseReceipt } from "../controllers/documentScan.controller.js";

const router = express.Router();

router.post("/scan-receipt", checkPermission("create_journal_voucher"), upload.single("bill"), scanExpenseReceipt);
router.post("/", checkPermission("create_journal_voucher"), createJournalVoucher);
router.get("/", checkPermission("view_journal_voucher"), getAllJournalVouchers);
router.get("/:id", checkPermission("view_journal_voucher"), getJournalVoucherById);
router.put("/:id", checkPermission("edit_journal_voucher"), updateJournalVoucher);
router.delete("/:id", checkPermission("delete_journal_voucher"), deleteJournalVoucher);
router.patch("/:id/approve", checkPermission("edit_journal_voucher"), approveJournalVoucher);
router.patch("/:id/reject", checkPermission("edit_journal_voucher"), rejectJournalVoucher);
router.patch("/:id/tally-push", checkPermission("edit_journal_voucher"), pushJournalVoucherToTally);
router.patch("/:id/tally-push/retry", checkPermission("edit_journal_voucher"), retryJournalVoucherTallyPush);

export default router;
