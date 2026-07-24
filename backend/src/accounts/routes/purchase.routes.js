import express from "express";
import upload from "../../middlewares/uploads.js";
import { checkPermission } from "../../middlewares/checkPermission.js";
import {
  createPurchase,
  getAllPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
  approvePurchase,
  rejectPurchase,
  pushPurchaseToTally,
  retryTallyPush,
} from "../controllers/purchase.controller.js";
import { scanPurchaseBill } from "../controllers/documentScan.controller.js";

const router = express.Router();

router.post("/scan-bill", checkPermission("create_purchase_invoice"), upload.single("bill"), scanPurchaseBill);
router.post("/", checkPermission("create_purchase_invoice"), createPurchase);
router.get("/", checkPermission("view_purchase_invoice"), getAllPurchases);
router.get("/:id", checkPermission("view_purchase_invoice"), getPurchaseById);
router.put("/:id", checkPermission("edit_purchase_invoice"), updatePurchase);
router.delete("/:id", checkPermission("delete_purchase_invoice"), deletePurchase);
router.patch("/:id/approve", checkPermission("edit_purchase_invoice"), approvePurchase);
router.patch("/:id/reject", checkPermission("edit_purchase_invoice"), rejectPurchase);
router.patch("/:id/tally-push", checkPermission("edit_purchase_invoice"), pushPurchaseToTally);
router.patch("/:id/tally-push/retry", checkPermission("edit_purchase_invoice"), retryTallyPush);

export default router;
