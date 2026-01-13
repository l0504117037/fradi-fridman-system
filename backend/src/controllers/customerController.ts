import { Request, Response } from "express";
import Customer from "../models/Customer";
import Product from "../models/Product";


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



//הוסף מוצר ללקוח

export const addPurchase = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const { productId, pricePaid, date } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    customer.purchases.push({
      product: product._id,
      pricePaid,
      date: date ? new Date(date) : new Date(),
    });

    // שומר ומבצע populate באותו מסמך בלי קריאה נוספת ל־DB
    await customer.save();
    await customer.populate("purchases.product");

    res.status(201).json({ products: customer.purchases });
  } catch (err) {
    if (err instanceof Error) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Unknown error" });
    }
  }
};

// GET /api/customers/:customerId/purchases
export const getPurchases = async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findById(req.params.customerId).populate("purchases.product");
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    // עטיפה בתוך אובייקט עם מפתח "products"
    res.json({ products: customer.purchases });
  } catch (err) {
    if (err instanceof Error) res.status(500).json({ error: err.message });
  }
};




 export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}