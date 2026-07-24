import express from "express";
import { checkPermission } from "../../middlewares/checkPermission.js";
import {
  createDeliveryChallan,
  getAllDeliveryChallans,
  getDeliveryChallanById,
  updateDeliveryChallan,
  deleteDeliveryChallan,
  approveDeliveryChallan,
  rejectDeliveryChallan,
  pushDeliveryChallanToTally,
  retryDeliveryChallanTallyPush,
} from "../controllers/deliverychallan.controller.js";

const router = express.Router();

router.post("/", checkPermission("create_delivery_challan"), createDeliveryChallan);
router.get("/", checkPermission("view_delivery_challan"), getAllDeliveryChallans);
router.get("/:id", checkPermission("view_delivery_challan"), getDeliveryChallanById);
router.put("/:id", checkPermission("edit_delivery_challan"), updateDeliveryChallan);
router.delete("/:id", checkPermission("delete_delivery_challan"), deleteDeliveryChallan);
router.patch("/:id/approve", checkPermission("edit_delivery_challan"), approveDeliveryChallan);
router.patch("/:id/reject", checkPermission("edit_delivery_challan"), rejectDeliveryChallan);
router.patch("/:id/tally-push", checkPermission("edit_delivery_challan"), pushDeliveryChallanToTally);
router.patch("/:id/tally-push/retry", checkPermission("edit_delivery_challan"), retryDeliveryChallanTallyPush);

export default router;
