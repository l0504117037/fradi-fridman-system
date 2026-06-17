import { Request, Response } from "express";
import Customer from "../models/Customer";
import Product from "../models/Product";
import Wig from "../models/Wig";
import Service from "../models/Service";
import Appointment from "../models/Appointment";
import { addMonths } from "../utils/date";

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

// Create
export const createCustomer = async (req: Request, res: Response) => {
  try {
    const customer = new Customer(req.body);
    const saved = await customer.save();
    res.status(201).json(saved);
  } catch (err: unknown) {
    res.status(400).json({ error: getErrorMessage(err) });
  }
};

// Read all
export const getCustomers = async (_req: Request, res: Response) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (err: unknown) {
    res.status(400).json({ error: getErrorMessage(err) });
  }
};

// Read one
export const getCustomer = async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json(customer);
  } catch (err: unknown) {
    res.status(400).json({ error: getErrorMessage(err) });
  }
};

// Update
export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Customer not found" });
    res.json(updated);
  } catch (err: unknown) {
    res.status(400).json({ error: getErrorMessage(err) });
  }
};

// Delete
export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const deleted = await Customer.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Customer not found" });
    res.json({ message: "Customer deleted" });
  } catch (err: unknown) {
    res.status(400).json({ error: getErrorMessage(err) });
  }
};

// =====================================================
// רכישות (מוצרים / פאות)
// =====================================================

// POST /api/customers/:customerId/purchase
// body: { itemType: "Product" | "Wig", itemId, totalPrice?, date?, payment?: { amount, date? } }
export const addPurchase = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const { itemType, itemId, totalPrice, date, payment } = req.body;

    if (itemType !== "Product" && itemType !== "Wig") {
      return res.status(400).json({ error: "itemType must be 'Product' or 'Wig'" });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const item =
      itemType === "Product"
        ? await Product.findById(itemId)
        : await Wig.findById(itemId);

    if (!item) return res.status(404).json({ error: `${itemType} not found` });

    const purchaseDate = date ? new Date(date) : new Date();

    customer.purchases.push({
      itemType,
      item: item._id,
      totalPrice: totalPrice ?? item.price,
      payments: payment
        ? [
            {
              amount: payment.amount,
              date: payment.date ? new Date(payment.date) : purchaseDate,
            },
          ]
        : [],
      date: purchaseDate,
      warrantyEnd: addMonths(purchaseDate, item.warrantyTime),
    } as any);

    await customer.save();
    await customer.populate("purchases.item");

    res.status(201).json({ purchases: customer.purchases });
  } catch (err: unknown) {
    res.status(400).json({ error: getErrorMessage(err) });
  }
};

// GET /api/customers/:customerId/purchases
export const getPurchases = async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findById(req.params.customerId).populate("purchases.item");
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    res.json({ purchases: customer.purchases });
  } catch (err: unknown) {
    res.status(500).json({ error: getErrorMessage(err) });
  }
};

// POST /api/customers/:customerId/purchases/:purchaseId/payments
// body: { amount, date? }
export const addPurchasePayment = async (req: Request, res: Response) => {
  try {
    const { customerId, purchaseId } = req.params;
    const { amount, date } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const purchase = customer.purchases.id(purchaseId);
    if (!purchase) return res.status(404).json({ error: "Purchase not found" });

    purchase.payments.push({
      amount,
      date: date ? new Date(date) : new Date(),
    });

    await customer.save();
    await customer.populate("purchases.item");

    res.status(201).json({ purchase: customer.purchases.id(purchaseId) });
  } catch (err: unknown) {
    res.status(400).json({ error: getErrorMessage(err) });
  }
};

// DELETE /api/customers/:customerId/purchases/:purchaseId
// מוחק רכישה מההיסטוריה, מחזיר מלאי, ומוחק את התור המקושר בלוח השנה
export const deletePurchase = async (req: Request, res: Response) => {
  try {
    const { customerId, purchaseId } = req.params;

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const purchase = customer.purchases.id(purchaseId);
    if (!purchase) return res.status(404).json({ error: "Purchase not found" });

    if (purchase.itemType === "Product") {
      await Product.findByIdAndUpdate(purchase.item, { $inc: { quantity: 1 } });
    } else {
      await Wig.findByIdAndUpdate(purchase.item, { $inc: { quantity: 1 } });
    }

    purchase.deleteOne();
    await customer.save();

    await Appointment.findOneAndDelete({ actionKind: "purchase", actionId: purchaseId });

    res.json({ message: "Purchase deleted" });
  } catch (err: unknown) {
    res.status(400).json({ error: getErrorMessage(err) });
  }
};

// =====================================================
// שירותים שבוצעו (חפיפה, סירוק, שיפוץ וכו')
// =====================================================

// POST /api/customers/:customerId/services
// body: { serviceId, price?, date?, note?, payment?: { amount, date? } }
export const addService = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const { serviceId, price, date, note, payment } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ error: "Service not found" });

    const serviceDate = date ? new Date(date) : new Date();

    customer.services.push({
      service: service._id,
      price: price ?? service.price,
      payments: payment
        ? [
            {
              amount: payment.amount,
              date: payment.date ? new Date(payment.date) : serviceDate,
            },
          ]
        : [],
      date: serviceDate,
      note,
    } as any);

    await customer.save();
    await customer.populate("services.service");

    res.status(201).json({ services: customer.services });
  } catch (err: unknown) {
    res.status(400).json({ error: getErrorMessage(err) });
  }
};

// POST /api/customers/:customerId/services/:serviceRecordId/payments
// body: { amount, date? }
export const addServicePayment = async (req: Request, res: Response) => {
  try {
    const { customerId, serviceRecordId } = req.params;
    const { amount, date } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const record = customer.services.id(serviceRecordId);
    if (!record) return res.status(404).json({ error: "Service record not found" });

    record.payments.push({
      amount,
      date: date ? new Date(date) : new Date(),
    });

    await customer.save();
    await customer.populate("services.service");

    res.status(201).json({ service: customer.services.id(serviceRecordId) });
  } catch (err: unknown) {
    res.status(400).json({ error: getErrorMessage(err) });
  }
};

// DELETE /api/customers/:customerId/services/:serviceRecordId
// מוחק רשומת שירות מההיסטוריה, ומוחק את התור המקושר בלוח השנה
export const deleteServiceRecord = async (req: Request, res: Response) => {
  try {
    const { customerId, serviceRecordId } = req.params;

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const record = customer.services.id(serviceRecordId);
    if (!record) return res.status(404).json({ error: "Service record not found" });

    record.deleteOne();
    await customer.save();

    await Appointment.findOneAndDelete({ actionKind: "service", actionId: serviceRecordId });

    res.json({ message: "Service record deleted" });
  } catch (err: unknown) {
    res.status(400).json({ error: getErrorMessage(err) });
  }
};

// =====================================================
// היסטוריה מלאה (רכישות + שירותים, ממוין לפי תאריך)
// =====================================================

// GET /api/customers/:customerId/history
export const getCustomerHistory = async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findById(req.params.customerId)
      .populate("purchases.item")
      .populate("services.service");

    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const purchases = customer.purchases.map((p) => {
      const paid = p.payments.reduce((sum, pay) => sum + pay.amount, 0);
      return {
        kind: "purchase" as const,
        _id: p._id,
        itemType: p.itemType,
        item: p.item,
        totalPrice: p.totalPrice,
        paid,
        balance: p.totalPrice - paid,
        payments: p.payments,
        date: p.date,
        warrantyEnd: p.warrantyEnd,
      };
    });

    const services = customer.services.map((s) => {
      const paid = s.payments.reduce((sum, pay) => sum + pay.amount, 0);
      return {
        kind: "service" as const,
        _id: s._id,
        service: s.service,
        price: s.price,
        paid,
        balance: s.price - paid,
        payments: s.payments,
        date: s.date,
        note: s.note,
      };
    });

    const history = [...purchases, ...services].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    res.json({
      customer: {
        _id: customer._id,
        firstname: customer.firstname,
        lastname: customer.lastname,
        phone: customer.phone,
        mail: customer.mail,
      },
      history,
    });
  } catch (err: unknown) {
    res.status(500).json({ error: getErrorMessage(err) });
  }
};
