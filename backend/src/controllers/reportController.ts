import { Request, Response } from "express";
import Customer from "../models/Customer";
import Product, { IProduct } from "../models/Product";
import Wig, { IWig } from "../models/Wig";
import Service, { IService } from "../models/Service";
import Supplier from "../models/Supplier";
import EmployeeMonthly from "../models/EmployeeMonthly";

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  return String(err);
};

interface MonthlySummaryEntry {
  month: string; // YYYY-MM
  itemName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  paid: number;
  remaining: number;
}

const monthKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const addEntry = (
  map: Map<string, MonthlySummaryEntry>,
  month: string,
  itemName: string,
  unitPrice: number,
  totalPrice: number,
  paid: number
) => {
  const key = `${month}|${itemName}`;
  const entry = map.get(key) ?? { month, itemName, unitPrice, quantity: 0, totalPrice: 0, paid: 0, remaining: 0 };
  entry.quantity += 1;
  entry.totalPrice += totalPrice;
  entry.paid += paid;
  entry.remaining = entry.totalPrice - entry.paid;
  map.set(key, entry);
};

const toSortedArray = (map: Map<string, MonthlySummaryEntry>): MonthlySummaryEntry[] =>
  Array.from(map.values()).sort((a, b) => {
    if (a.month !== b.month) return b.month.localeCompare(a.month);
    return a.itemName.localeCompare(b.itemName, "he");
  });

// סיכום לפי חודש (לוח שנה לועזי) ופריט: עבור כל מוצר / פאה / שירות -
// מחיר ליחידה, כמות, סה"כ, כמה שולם וכמה נשאר לתשלום, מצטבר על פני כל הלקוחות
export const getMonthlySummary = async (_req: Request, res: Response) => {
  try {
    const customers = await Customer.find().select("purchases services");

    const productIds = new Set<string>();
    const wigIds = new Set<string>();
    const serviceIds = new Set<string>();

    for (const customer of customers) {
      for (const purchase of customer.purchases) {
        const id = String(purchase.item);
        if (purchase.itemType === "Product") productIds.add(id);
        else wigIds.add(id);
      }
      for (const record of customer.services) {
        serviceIds.add(String(record.service));
      }
    }

    const [products, wigs, services] = await Promise.all([
      Product.find({ _id: { $in: Array.from(productIds) } }).select("type price"),
      Wig.find({ _id: { $in: Array.from(wigIds) } }).select("name price"),
      Service.find({ _id: { $in: Array.from(serviceIds) } }).select("name price"),
    ]);

    const productMap = new Map<string, IProduct>(products.map((p) => [String(p._id), p]));
    const wigMap = new Map<string, IWig>(wigs.map((w) => [String(w._id), w]));
    const serviceMap = new Map<string, IService>(services.map((s) => [String(s._id), s]));

    const productsMap = new Map<string, MonthlySummaryEntry>();
    const wigsMap = new Map<string, MonthlySummaryEntry>();
    const servicesMap = new Map<string, MonthlySummaryEntry>();

    for (const customer of customers) {
      for (const purchase of customer.purchases) {
        const isProduct = purchase.itemType === "Product";
        const map = isProduct ? productsMap : wigsMap;
        const ref = isProduct ? productMap.get(String(purchase.item)) : wigMap.get(String(purchase.item));
        const itemName = ref ? (isProduct ? (ref as IProduct).type : (ref as IWig).name) : "לא ידוע";
        const unitPrice = ref?.price ?? 0;
        const paid = purchase.payments.reduce((sum, p) => sum + p.amount, 0);
        addEntry(map, monthKey(purchase.date), itemName, unitPrice, purchase.totalPrice, paid);
      }

      for (const record of customer.services) {
        const ref = serviceMap.get(String(record.service));
        const serviceName = ref?.name ?? "לא ידוע";
        const unitPrice = ref?.price ?? 0;
        const paid = record.payments.reduce((sum, p) => sum + p.amount, 0);
        addEntry(servicesMap, monthKey(record.date), serviceName, unitPrice, record.price, paid);
      }
    }

    res.json({
      products: toSortedArray(productsMap),
      wigs: toSortedArray(wigsMap),
      services: toSortedArray(servicesMap),
    });
  } catch (err) {
    res.status(500).json({ error: getErrorMessage(err) });
  }
};

// ────────────────────────────────────────────────────────────────────
// סיכום שנתי: הכנסות, הוצאות, רווח לפי חודש (בסיס מזומן)
// ────────────────────────────────────────────────────────────────────
interface CategoryEntry {
  label: string;
  amount: number;
  type: "income" | "expense";
}

interface MonthEntry {
  income: number;
  expenses: number;
  profit: number;
  categories: Map<string, CategoryEntry>;
}

export const getYearlySummary = async (_req: Request, res: Response) => {
  try {
    const monthMap = new Map<string, MonthEntry>();

    const getOrCreate = (month: string): MonthEntry => {
      if (!monthMap.has(month))
        monthMap.set(month, { income: 0, expenses: 0, profit: 0, categories: new Map() });
      return monthMap.get(month)!;
    };

    const addAmount = (
      month: string,
      type: "income" | "expense",
      label: string,
      amount: number
    ) => {
      const entry = getOrCreate(month);
      if (type === "income") entry.income += amount;
      else entry.expenses += amount;
      entry.profit = entry.income - entry.expenses;
      const cat = entry.categories.get(label);
      if (cat) cat.amount += amount;
      else entry.categories.set(label, { label, amount, type });
    };

    // הכנסות מלקוחות (לפי תאריך תשלום)
    const customers = await Customer.find().select("purchases services");
    for (const customer of customers) {
      for (const purchase of customer.purchases) {
        const label = purchase.itemType === "Wig" ? "פאות - מכירות" : "מוצרים";
        for (const payment of purchase.payments) {
          addAmount(monthKey(payment.date), "income", label, payment.amount);
        }
      }
      for (const record of customer.services) {
        for (const payment of record.payments) {
          addAmount(monthKey(payment.date), "income", "שירותים", payment.amount);
        }
      }
    }

    // הוצאות לספקים (תשלומים בלבד)
    const suppliers = await Supplier.find().select("name transactions");
    for (const supplier of suppliers) {
      for (const tx of supplier.transactions) {
        if (tx.type === "payment") {
          addAmount(monthKey(tx.date), "expense", `ספקים - ${supplier.name}`, tx.amount);
        }
      }
    }

    // הוצאות שכר עובדים
    const employeeMonthly = await EmployeeMonthly.find().select("date salaryPaid");
    for (const em of employeeMonthly) {
      if (em.salaryPaid > 0) {
        addAmount(monthKey(em.date), "expense", "משכורות", em.salaryPaid);
      }
    }

    const months = Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        profit: data.profit,
        categories: Array.from(data.categories.values()).sort((a, b) => {
          if (a.type !== b.type) return a.type === "income" ? -1 : 1;
          return b.amount - a.amount;
        }),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    res.json({ months });
  } catch (err) {
    res.status(500).json({ error: getErrorMessage(err) });
  }
};
