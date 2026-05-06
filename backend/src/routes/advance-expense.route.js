import { Router } from "express";
import {  createAdvanceExpenseValidator} from "../validators/advance-expense.validator.js";
import { checkPermission } from "../middlewares/checkPermission.js";
import { createAdvanceExpense, getAdvanceExpenses } from "../controllers/advance-expense.controller.js";

import upload from "../middlewares/uploads.js";
const router = Router();


router.post("/create", checkPermission("create_advance_expense"), createAdvanceExpenseValidator, upload.single("doc_file"), createAdvanceExpense);
router.get("/view", checkPermission("view_advance_expenses"), getAdvanceExpenses);
export default router;