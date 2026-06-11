import { Router } from "express";
import {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  addPurchase,
  getPurchases,
  addPurchasePayment,
  addService,
  addServicePayment,
  getCustomerHistory,
} from "../controllers/customerController";

const router = Router();

router.post("/", createCustomer);
router.get("/", getCustomers);
router.get("/:id", getCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

// רכישות (מוצרים / פאות)
router.post("/:customerId/purchase", addPurchase);
router.get("/:customerId/purchases", getPurchases);
router.post("/:customerId/purchases/:purchaseId/payments", addPurchasePayment);

// שירותים שבוצעו
router.post("/:customerId/services", addService);
router.post("/:customerId/services/:serviceRecordId/payments", addServicePayment);

// היסטוריה מלאה (רכישות + שירותים)
router.get("/:customerId/history", getCustomerHistory);

export default router;
