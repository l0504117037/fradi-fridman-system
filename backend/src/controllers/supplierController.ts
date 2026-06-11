import { Request, Response } from "express";
import Supplier, { ISupplierTransaction } from "../models/Supplier";

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  return String(err);
};

// מחשב סיכום: כמה נקנה, כמה הוחזר, כמה שולם, וכמה עוד חייבים לספק
const calcSummary = (transactions: ISupplierTransaction[]) => {
  let totalPurchased = 0;
  let totalReturned = 0;
  let totalPaid = 0;

  for (const t of transactions) {
    if (t.type === "purchase") totalPurchased += t.amount;
    else if (t.type === "return") totalReturned += t.amount;
    else if (t.type === "payment") totalPaid += t.amount;
  }

  const balance = totalPurchased - totalReturned - totalPaid;

  return { totalPurchased, totalReturned, totalPaid, balance };
};

// Create
export const createSupplier = async (req: Request, res: Response) => {
  try {
    const supplier = new Supplier(req.body);
    const saved = await supplier.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: getErrorMessage(err) });
  }
};

// Read all
export const getSuppliers = async (_req: Request, res: Response) => {
  try {
    const suppliers = await Supplier.find();
    const result = suppliers.map((s) => ({
      ...s.toObject(),
      summary: calcSummary(s.transactions),
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: getErrorMessage(err) });
  }
};

// Read one
export const getSupplier = async (req: Request, res: Response) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });
    res.json({
      ...supplier.toObject(),
      summary: calcSummary(supplier.transactions),
    });
  } catch (err) {
    res.status(500).json({ error: getErrorMessage(err) });
  }
};

// Update
export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const updated = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Supplier not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: getErrorMessage(err) });
  }
};

// Delete
export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const deleted = await Supplier.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Supplier not found" });
    res.json({ message: "Supplier deleted" });
  } catch (err) {
    res.status(500).json({ error: getErrorMessage(err) });
  }
};

// הוספת תנועה (קנייה / החזרה / תשלום)
export const addTransaction = async (req: Request, res: Response) => {
  try {
    const { type, amount, date, note } = req.body;

    if (!["purchase", "return", "payment"].includes(type)) {
      return res.status(400).json({ error: "type must be purchase, return or payment" });
    }

    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });

    supplier.transactions.push({
      type,
      amount,
      date: date ? new Date(date) : new Date(),
      note,
    });

    await supplier.save();

    res.status(201).json({
      transactions: supplier.transactions,
      summary: calcSummary(supplier.transactions),
    });
  } catch (err) {
    res.status(400).json({ error: getErrorMessage(err) });
  }
};
