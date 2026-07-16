import { Request, Response } from "express";
import Customer from "../models/Customer";
import Product, { IProduct } from "../models/Product";
import Wig, { IWig } from "../models/Wig";
import Service, { IService } from "../models/Service";
import Supplier from "../models/Supplier";
import EmployeeMonthly from "../models/EmployeeMonthly";
import HairdresserSale from "../models/HairdresserSale";
import Hairdresser, { IHairdresser } from "../models/Hairdresser";

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

    // fetch all referenced wigs (with category)
    const allWigIds = new Set([...Array.from(wigIds)]);
    const hairdresserSales = await HairdresserSale.find().populate<{ wig: IWig }>("wig");
    for (const hs of hairdresserSales) allWigIds.add(String(hs.wig._id ?? hs.wig));

    const [products, wigs, services] = await Promise.all([
      Product.find({ _id: { $in: Array.from(productIds) } }).select("type price"),
      Wig.find({ _id: { $in: Array.from(allWigIds) } }).select("name price category"),
      Service.find({ _id: { $in: Array.from(serviceIds) } }).select("name price"),
    ]);

    const productMap = new Map<string, IProduct>(products.map((p) => [String(p._id), p]));
    const wigMap = new Map<string, IWig>(wigs.map((w) => [String(w._id), w]));
    const serviceMap = new Map<string, IService>(services.map((s) => [String(s._id), s]));

    const productsMap = new Map<string, MonthlySummaryEntry>();
    const customerWigsMap = new Map<string, MonthlySummaryEntry>();
    const hairdresserWigsMap = new Map<string, MonthlySummaryEntry>();
    const servicesMap = new Map<string, MonthlySummaryEntry>();

    const catLabel = (w: IWig) => w.category === "boutique" ? "בוטיק" : "סטנדרט";

    for (const customer of customers) {
      for (const purchase of customer.purchases) {
        const isProduct = purchase.itemType === "Product";
        if (isProduct) {
          const ref = productMap.get(String(purchase.item));
          const itemName = ref ? ref.type : "לא ידוע";
          const unitPrice = ref?.price ?? 0;
          const paid = purchase.payments.reduce((sum, p) => sum + p.amount, 0);
          addEntry(productsMap, monthKey(purchase.date), itemName, unitPrice, purchase.totalPrice, paid);
        } else {
          const ref = wigMap.get(String(purchase.item));
          const itemName = ref ? `${ref.name} (${catLabel(ref)})` : "לא ידוע";
          const unitPrice = ref?.price ?? 0;
          const paid = purchase.payments.reduce((sum, p) => sum + p.amount, 0);
          addEntry(customerWigsMap, monthKey(purchase.date), itemName, unitPrice, purchase.totalPrice, paid);
        }
      }

      for (const record of customer.services) {
        const ref = serviceMap.get(String(record.service));
        const serviceName = ref?.name ?? "לא ידוע";
        const unitPrice = ref?.price ?? 0;
        const paid = record.payments.reduce((sum, p) => sum + p.amount, 0);
        addEntry(servicesMap, monthKey(record.date), serviceName, unitPrice, record.price, paid);
      }
    }

    for (const hs of hairdresserSales) {
      const wigRef = wigMap.get(String((hs.wig as any)._id ?? hs.wig));
      const itemName = wigRef ? `${wigRef.name} (${catLabel(wigRef)})` : "לא ידוע";
      const unitPrice = wigRef?.price ?? 0;
      const paid = hs.payments.reduce((sum, p) => sum + p.amount, 0);
      addEntry(hairdresserWigsMap, monthKey(hs.date), itemName, unitPrice, hs.totalPrice, paid);
    }

    // ספקים: רכישות vs תשלומים לפי חודש
    const suppliersData = await Supplier.find().select("name transactions");
    const suppliersMap = new Map<string, MonthlySummaryEntry>();
    for (const supplier of suppliersData) {
      for (const tx of supplier.transactions) {
        const key = `${monthKey(tx.date)}|${supplier.name}`;
        const existing = suppliersMap.get(key) ?? {
          month: monthKey(tx.date), itemName: supplier.name,
          unitPrice: 0, quantity: 0, totalPrice: 0, paid: 0, remaining: 0,
        };
        if (tx.type === "purchase") existing.totalPrice += tx.amount;
        else if (tx.type === "payment") existing.paid += tx.amount;
        existing.remaining = existing.totalPrice - existing.paid;
        suppliersMap.set(key, existing);
      }
    }

    // עובדות: שכר לתשלום vs ששולם לפי חודש
    const employeeMonthlyData = await EmployeeMonthly.find()
      .populate<{ employee: { firstName: string; lastName: string; hourlyRate: number } }>("employee")
      .select("employee date hoursWorked salaryDue salaryPaid");
    const employeesMap = new Map<string, MonthlySummaryEntry>();
    for (const em of employeeMonthlyData) {
      const emp = em.employee as any;
      const name = emp ? `${emp.firstName} ${emp.lastName}` : "לא ידוע";
      const key = `${monthKey(em.date)}|${name}`;
      const existing = employeesMap.get(key) ?? {
        month: monthKey(em.date), itemName: name,
        unitPrice: emp?.hourlyRate ?? 0,
        quantity: 0, totalPrice: 0, paid: 0, remaining: 0,
      };
      existing.quantity += em.hoursWorked;
      existing.totalPrice += em.salaryDue;
      existing.paid += em.salaryPaid;
      existing.remaining = existing.totalPrice - existing.paid;
      employeesMap.set(key, existing);
    }

    // סיכום פאניות לפי שם פאנית × קטגוריה
    const hairdresserSalesNamed = await HairdresserSale.find()
      .populate<{ hairdresser: IHairdresser }>("hairdresser")
      .populate<{ wig: IWig }>("wig");
    const hairdressersByCatMap = new Map<string, MonthlySummaryEntry>();
    for (const hs of hairdresserSalesNamed) {
      const h = hs.hairdresser as IHairdresser;
      const name = h ? `${h.firstName} ${h.lastName}` : "לא ידוע";
      const w = hs.wig as IWig;
      const cat = w?.category === "boutique" ? "בוטיק" : "סטנדרט";
      const key = `${monthKey(hs.date)}|${name} — ${cat}`;
      const paid = hs.payments.reduce((s, p) => s + p.amount, 0);
      const e = hairdressersByCatMap.get(key) ?? {
        month: monthKey(hs.date), itemName: `${name} — ${cat}`,
        unitPrice: 0, quantity: 0, totalPrice: 0, paid: 0, remaining: 0,
      };
      e.quantity += 1; e.totalPrice += hs.totalPrice; e.paid += paid; e.remaining = e.totalPrice - e.paid;
      hairdressersByCatMap.set(key, e);
    }

    res.json({
      products: toSortedArray(productsMap),
      customerWigs: toSortedArray(customerWigsMap),
      hairdresserWigs: toSortedArray(hairdresserWigsMap),
      hairdressersByCategory: toSortedArray(hairdressersByCatMap),
      services: toSortedArray(servicesMap),
      suppliers: toSortedArray(suppliersMap),
      employees: toSortedArray(employeesMap),
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
  incomeReceived: number;
  incomeCommitted: number;
  expenses: number;
  profit: number;
  categories: Map<string, CategoryEntry>;
}

export const getYearlySummary = async (_req: Request, res: Response) => {
  try {
    const monthMap = new Map<string, MonthEntry>();

    const getOrCreate = (month: string): MonthEntry => {
      if (!monthMap.has(month))
        monthMap.set(month, { incomeReceived: 0, incomeCommitted: 0, expenses: 0, profit: 0, categories: new Map() });
      return monthMap.get(month)!;
    };

    const addAmount = (
      month: string,
      type: "income" | "expense",
      label: string,
      amount: number
    ) => {
      const entry = getOrCreate(month);
      if (type === "income") entry.incomeReceived += amount;
      else entry.expenses += amount;
      entry.profit = entry.incomeReceived - entry.expenses;
      const cat = entry.categories.get(label);
      if (cat) cat.amount += amount;
      else entry.categories.set(label, { label, amount, type });
    };

    // הכנסות מלקוחות (לפי תאריך תשלום)
    const customers = await Customer.find().select("purchases services");

    // טעינת כל הפאות שנמכרו ללקוחות — לצורך קטגוריה
    const customerWigIds = new Set<string>();
    for (const c of customers)
      for (const p of c.purchases)
        if (p.itemType === "Wig") customerWigIds.add(String(p.item));
    const customerWigArr = await Wig.find({ _id: { $in: Array.from(customerWigIds) } }).select("category");
    const customerWigCatMap = new Map(customerWigArr.map((w) => [String(w._id), w.category]));

    for (const customer of customers) {
      for (const purchase of customer.purchases) {
        if (purchase.itemType === "Wig") {
          const cat = customerWigCatMap.get(String(purchase.item)) === "boutique" ? "בוטיק" : "סטנדרט";
          for (const payment of purchase.payments)
            addAmount(monthKey(payment.date), "income", `פאות לקוחות - ${cat}`, payment.amount);
        } else {
          for (const payment of purchase.payments)
            addAmount(monthKey(payment.date), "income", "מוצרים", payment.amount);
        }
      }
      for (const record of customer.services) {
        for (const payment of record.payments) {
          addAmount(monthKey(payment.date), "income", "שירותים", payment.amount);
        }
      }
    }

    // הכנסות ממכירות פאניות (לפי תאריך תשלום)
    const hairdresserSalesYearly = await HairdresserSale.find().populate<{ wig: IWig }>("wig");
    for (const hs of hairdresserSalesYearly) {
      const cat = (hs.wig as IWig).category === "boutique" ? "בוטיק" : "סטנדרט";
      for (const payment of hs.payments)
        addAmount(monthKey(payment.date), "income", `פאות פאניות - ${cat}`, payment.amount);
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

    // מחויב – הכנסות על בסיס הצטברות (לפי תאריך מכירה/שירות)
    for (const customer of customers) {
      for (const purchase of customer.purchases) {
        const entry = getOrCreate(monthKey(purchase.date));
        entry.incomeCommitted += purchase.totalPrice;
      }
      for (const record of customer.services) {
        const entry = getOrCreate(monthKey(record.date));
        entry.incomeCommitted += record.price;
      }
    }
    for (const hs of hairdresserSalesYearly) {
      const entry = getOrCreate(monthKey(hs.date));
      entry.incomeCommitted += hs.totalPrice;
    }

    const months = Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month,
        incomeReceived: data.incomeReceived,
        incomeCommitted: data.incomeCommitted,
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
