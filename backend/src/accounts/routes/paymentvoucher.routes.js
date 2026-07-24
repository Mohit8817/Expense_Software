import express from "express";
import upload from "../../middlewares/uploads.js";
import { checkPermission } from "../../middlewares/checkPermission.js";
import {
  createPaymentVoucher,
  getAllPaymentVouchers,
  getPaymentVoucherById,
  updatePaymentVoucher,
  deletePaymentVoucher,
  approvePaymentVoucher,
  rejectPaymentVoucher,
  pushPaymentVoucherToTally,
  retryPaymentVoucherTallyPush,
  getPaymentLinkOptions,
  getPaymentLinkDocument,
  getPaymentDocumentBalance,
} from "../controllers/paymentvoucher.controller.js";
import { scanPaymentReceipt } from "../controllers/documentScan.controller.js";

const router = express.Router();

router.get("/links/options", checkPermission("view_payment_voucher"), getPaymentLinkOptions);
router.get("/links/balance/:type/:id", checkPermission("view_payment_voucher"), getPaymentDocumentBalance);
router.get("/links/:type/:id", checkPermission("view_payment_voucher"), getPaymentLinkDocument);

router.post("/scan-receipt", checkPermission("create_payment_voucher"), upload.single("bill"), scanPaymentReceipt);
router.post("/", checkPermission("create_payment_voucher"), createPaymentVoucher);
router.get("/", checkPermission("view_payment_voucher"), getAllPaymentVouchers);
router.get("/:id", checkPermission("view_payment_voucher"), getPaymentVoucherById);
router.put("/:id", checkPermission("edit_payment_voucher"), updatePaymentVoucher);
router.delete("/:id", checkPermission("delete_payment_voucher"), deletePaymentVoucher);
router.patch("/:id/approve", checkPermission("edit_payment_voucher"), approvePaymentVoucher);
router.patch("/:id/reject", checkPermission("edit_payment_voucher"), rejectPaymentVoucher);
router.patch("/:id/tally-push", checkPermission("edit_payment_voucher"), pushPaymentVoucherToTally);
router.patch("/:id/tally-push/retry", checkPermission("edit_payment_voucher"), retryPaymentVoucherTallyPush);

export default router;
