import { Router } from "express";
import {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  addPurchase,
  getPurchases,
} from "../controllers/customerController";

const router = Router();

router.post("/", createCustomer);
router.get("/", getCustomers);
router.get("/:id", getCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

// Add a purchase to a customer
router.post("/:customerId/purchase", addPurchase);

// Get all purchases of a customer
router.get("/:customerId/purchases", getPurchases);

export default router;
