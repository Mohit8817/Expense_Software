import express from "express";
import { checkPermission } from "../../middlewares/checkPermission.js";
import {
  getAccountDashboard,
  getSalesRegister,
  getPurchaseRegister,
  getVoucherRegister,
  getGstSummary,
  getDocumentLinksReport,
  getSalesInvoiceOptions,
  getPurchaseInvoiceOptions,
  getSalesInvoiceForLink,
  getPurchaseInvoiceForLink,
} from "../controllers/account.controller.js";

const router = express.Router();

router.get("/dashboard", checkPermission("view_account_dashboard"), getAccountDashboard);

router.get("/reports/sales-register", checkPermission("view_account_reports"), getSalesRegister);
router.get("/reports/purchase-register", checkPermission("view_account_reports"), getPurchaseRegister);
router.get("/reports/voucher-register", checkPermission("view_account_reports"), getVoucherRegister);
router.get("/reports/gst-summary", checkPermission("view_account_reports"), getGstSummary);
router.get("/reports/document-links", checkPermission("view_account_reports"), getDocumentLinksReport);

router.get("/links/sales", checkPermission("view_sales_invoice"), getSalesInvoiceOptions);
router.get("/links/purchases", checkPermission("view_purchase_invoice"), getPurchaseInvoiceOptions);
router.get("/links/sales/:id", checkPermission("view_sales_invoice"), getSalesInvoiceForLink);
router.get("/links/purchases/:id", checkPermission("view_purchase_invoice"), getPurchaseInvoiceForLink);

export default router;
