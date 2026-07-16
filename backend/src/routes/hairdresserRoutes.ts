import { Router } from "express";
import {
  getHairdressers,
  getHairdresserById,
  getHairdresserDetail,
  createHairdresser,
  updateHairdresser,
  deleteHairdresser,
  addSale,
  addPayment,
  deleteSale,
} from "../controllers/hairdresserController";

const router = Router();

router.get("/",           getHairdressers);
router.get("/:id",        getHairdresserById);
router.get("/:id/detail", getHairdresserDetail);
router.post("/",          createHairdresser);
router.put("/:id",        updateHairdresser);
router.delete("/:id",     deleteHairdresser);

router.post("/:id/sales",                   addSale);
router.post("/:id/sales/:saleId/payments",  addPayment);
router.delete("/:id/sales/:saleId",         deleteSale);

export default router;
