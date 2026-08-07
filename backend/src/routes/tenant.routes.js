import express from "express";
import upload from "../middlewares/uploads.js";
import { checkPermission } from "../middlewares/checkPermission.js";
import {
  getTenants,
  getTenantById,
  getTenantBranding,
  createTenant,
  updateTenant,
  deleteTenant,
} from "../controllers/tenant.controller.js";

const router = express.Router();

router.get("/branding", getTenantBranding);
router.get("/", checkPermission("view_tenant"), getTenants);
router.get("/:id", checkPermission("view_tenant"), getTenantById);
router.post("/", checkPermission("create_tenant"), upload.single("tenant_logo"), createTenant);
router.put("/:id", checkPermission("edit_tenant"), upload.single("tenant_logo"), updateTenant);
router.delete("/:id", checkPermission("delete_tenant"), deleteTenant);

export default router;
