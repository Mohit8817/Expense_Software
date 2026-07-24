import express from "express";
import { checkPermission } from "../../middlewares/checkPermission.js";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  importProducts,
} from "../controllers/productdetail.controller.js";

const router = express.Router();

router.post("/create", checkPermission("create_product_master"), createProduct);
router.post("/import", checkPermission("create_product_master"), importProducts);
router.get("/all", checkPermission("view_product_master"), getProducts);
router.get("/:id", checkPermission("view_product_master"), getProductById);
router.put("/update/:id", checkPermission("edit_product_master"), updateProduct);
router.delete("/delete/:id", checkPermission("delete_product_master"), deleteProduct);

export default router;
