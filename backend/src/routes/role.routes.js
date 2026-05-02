import { Router } from "express";
import {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
  assignPermissionsToRole,
  getMyPermissions
} from "../controllers/role.controller.js";

const router = Router();

router.post("/create-roles", createRole);
router.get("/get-roles", getRoles);

// ✅ ADD THESE
router.get("/get-role/:id", getRoleById);
router.put("/update-role/:id", updateRole);
router.delete("/delete-role/:id", deleteRole);

// ✅ PERMISSION
router.post("/assign-permissions", assignPermissionsToRole);
router.get("/my-permissions", getMyPermissions);


export default router;