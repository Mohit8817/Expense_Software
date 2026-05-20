import { Router } from "express";
import { InterventionReport,PaidExpenseReport,UserwiseExpenseReport,} from "../controllers/report.controller.js";
const router = Router();

router.get("/intervention-report",  InterventionReport);
router.get("/paid-expense-report",  PaidExpenseReport);

router.get("/userwise-expense-report",checkPermission("userwise_expense_report"),  UserwiseExpenseReport);

export default router;