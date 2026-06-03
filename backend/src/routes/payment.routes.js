import { Router } from "express";
import { createAdvanceExpenseValidator ,settlementExpensesValidator} from "../validators/payment.validator.js";
import { checkPermission } from "../middlewares/checkPermission.js";
import { createAdvanceExpense, getpaymentExpenses,settlementExpenses } from "../controllers/payment.controller.js";

import upload from "../middlewares/uploads.js";
const router = Router();

router.post(
    "/create-advance-expense",
    upload.single("doc_file"),
    createAdvanceExpenseValidator,
    createAdvanceExpense
);
router.get("/view", getpaymentExpenses);

router.post("/settlement-expense", settlementExpensesValidator, settlementExpenses);
export default router;

