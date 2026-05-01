import { Router } from "express";
import { InterventionReport} from "../controllers/report.controller.js";
const router = Router();

router.get("/intervention-report",  InterventionReport);

export default router;