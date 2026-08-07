import express from "express";
import { requireDeveloper } from "../middlewares/requireDeveloper.js";
import {
  getTallyManual,
  downloadTallyManual,
} from "../controllers/developer.controller.js";

const router = express.Router();

router.use(requireDeveloper);

router.get("/tally-manual", getTallyManual);
router.get("/tally-manual/download", downloadTallyManual);

export default router;
