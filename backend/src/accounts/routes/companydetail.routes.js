import express from "express";
import upload from "../../middlewares/uploads.js";
import { checkPermission } from "../../middlewares/checkPermission.js";
import {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  getCompanyTallyFormat,
  approveCompany,
  rejectCompany,
  pushCompanyToTally,
  retryCompanyTallyPush,
} from "../controllers/companydetail.controller.js";
import { scanCompanyDocument } from "../controllers/documentScan.controller.js";

const router = express.Router();

router.post("/scan-document", checkPermission("create_company_master"), upload.single("bill"), scanCompanyDocument);
router.post("/create", checkPermission("create_company_master"), createCompany);
router.get("/all", checkPermission("view_company_master"), getCompanies);
router.get("/:id/tally", checkPermission("view_company_master"), getCompanyTallyFormat);
router.get("/:id", checkPermission("view_company_master"), getCompanyById);
router.put("/update/:id", checkPermission("edit_company_master"), updateCompany);
router.delete("/delete/:id", checkPermission("delete_company_master"), deleteCompany);
router.patch("/:id/approve", checkPermission("edit_company_master"), approveCompany);
router.patch("/:id/reject", checkPermission("edit_company_master"), rejectCompany);
router.patch("/:id/tally-push", checkPermission("edit_company_master"), pushCompanyToTally);
router.patch("/:id/tally-push/retry", checkPermission("edit_company_master"), retryCompanyTallyPush);

export default router;
