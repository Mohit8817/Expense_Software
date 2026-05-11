import { Router } from "express";
import { InterventionReport,PaidExpenseReport} from "../controllers/report.controller.js";
const router = Router();

router.get("/intervention-report",  InterventionReport);
router.get("/paid-expense-report",  PaidExpenseReport);



export default router;