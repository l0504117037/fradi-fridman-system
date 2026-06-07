import { Router } from "express";
import {
    createEmployeeMonthly,
    
    getEmployeeMonthlyByEmployee,
    updateEmployeeMonthly,
    deleteEmployeeMonthly,
    getAllEmployeeMonthlyGrouped,
} from "../controllers/employeeMonthlyController";

const router = Router();

router.post("/", createEmployeeMonthly);
router.get("/", getAllEmployeeMonthlyGrouped);
router.get("/employee/:employeeId", getEmployeeMonthlyByEmployee);
router.put("/update-by-employee", updateEmployeeMonthly);
router.delete("/:id", deleteEmployeeMonthly);


export default router;
