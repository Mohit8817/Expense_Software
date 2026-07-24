import express from "express";
import upload from "../../middlewares/uploads.js";
import { checkPermission } from "../../middlewares/checkPermission.js";
import {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} from "../controllers/companydetail.controller.js";
import { scanCompanyDocument } from "../controllers/documentScan.controller.js";

const router = express.Router();

router.post("/scan-document", checkPermission("create_company_master"), upload.single("bill"), scanCompanyDocument);
router.post("/create", checkPermission("create_company_master"), createCompany);
router.get("/all", checkPermission("view_company_master"), getCompanies);
router.get("/:id", checkPermission("view_company_master"), getCompanyById);
router.put("/update/:id", checkPermission("edit_company_master"), updateCompany);
router.delete("/delete/:id", checkPermission("delete_company_master"), deleteCompany);

export default router;
