import { Router } from "express";
import {
  createWig,
  getWigs,
  getWig,
  updateWig,
  deleteWig,
} from "../controllers/wigController";

const router = Router();

router.post("/", createWig);
router.get("/", getWigs);
router.get("/:id", getWig);
router.put("/:id", updateWig);
router.delete("/:id", deleteWig);

export default router;
