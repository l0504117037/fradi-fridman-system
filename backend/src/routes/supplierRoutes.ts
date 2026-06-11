import { Router } from "express";
import {
  createSupplier,
  getSuppliers,
  getSupplier,
  updateSupplier,
  deleteSupplier,
  addTransaction,
} from "../controllers/supplierController";

const router = Router();

router.post("/", createSupplier);
router.get("/", getSuppliers);
router.get("/:id", getSupplier);
router.put("/:id", updateSupplier);
router.delete("/:id", deleteSupplier);

// תנועות מול הספק (קנייה / החזרה / תשלום)
router.post("/:id/transactions", addTransaction);

export default router;
