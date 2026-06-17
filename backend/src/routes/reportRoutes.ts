import { Router } from "express";
import { getMonthlySummary, getYearlySummary } from "../controllers/reportController";

const router = Router();

router.get("/monthly-summary", getMonthlySummary);
router.get("/yearly-summary", getYearlySummary);

export default router;
