import { Router } from "express";
import {
  createAppointment,
  getAppointments,
  getAppointment,
  updateAppointment,
  deleteAppointment,
} from "../controllers/appointmentController";

const router = Router();

router.post("/", createAppointment);
router.get("/", getAppointments); // תומך ב-?start=YYYY-MM-DD&end=YYYY-MM-DD לתצוגת שבוע
router.get("/:id", getAppointment);
router.put("/:id", updateAppointment);
router.delete("/:id", deleteAppointment);

export default router;
