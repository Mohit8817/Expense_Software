import { Router } from "express";
import { checkPermission } from "../middlewares/checkPermission.js";
import { InterventionReport,PaidExpenseReport,UserwiseExpenseReport,UserwisePaidSummary} from "../controllers/report.controller.js";
const router = Router();

router.get("/intervention-report",  InterventionReport);
router.get("/paid-expense-report",  PaidExpenseReport);

router.get("/userwise-expense-report",checkPermission("userwise_expense_report"),  UserwiseExpenseReport);
router.get('/userwise-paid-expense-summary', UserwisePaidSummary);
export default router;