import express from "express";
import upload from "../../middlewares/uploads.js";
import { checkPermission } from "../../middlewares/checkPermission.js";
import {
  createSales,
  getAllSales,
  getSalesById,
  updateSales,
  deleteSales,
  approveSales,
  rejectSales,
  pushSalesToTally,
  retrySalesTallyPush,
} from "../controllers/sales.controller.js";
import { scanSalesBill } from "../controllers/documentScan.controller.js";

const router = express.Router();

router.post("/scan-bill", checkPermission("create_sales_invoice"), upload.single("bill"), scanSalesBill);
router.post("/", checkPermission("create_sales_invoice"), createSales);
router.get("/", checkPermission("view_sales_invoice"), getAllSales);
router.get("/:id", checkPermission("view_sales_invoice"), getSalesById);
router.put("/:id", checkPermission("edit_sales_invoice"), updateSales);
router.delete("/:id", checkPermission("delete_sales_invoice"), deleteSales);
router.patch("/:id/approve", checkPermission("edit_sales_invoice"), approveSales);
router.patch("/:id/reject", checkPermission("edit_sales_invoice"), rejectSales);
router.patch("/:id/tally-push", checkPermission("edit_sales_invoice"), pushSalesToTally);
router.patch("/:id/tally-push/retry", checkPermission("edit_sales_invoice"), retrySalesTallyPush);

export default router;
