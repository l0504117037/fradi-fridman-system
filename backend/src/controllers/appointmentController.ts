import { Request, Response } from "express";
import { Types } from "mongoose";
import Appointment, { ActionKind, IAppointment } from "../models/Appointment";
import Customer, { ICustomer } from "../models/Customer";
import Product from "../models/Product";
import Wig from "../models/Wig";
import Service from "../models/Service";
import { addMonths } from "../utils/date";

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  return String(err);
};

interface ActionInput {
  actionKind: ActionKind;
  note?: string;
  // לפעולת רכישה
  itemType?: "Product" | "Wig";
  itemId?: string;
  totalPrice?: number;
  // לפעולת שירות
  serviceId?: string;
  price?: number;
  // משותף
  payment?: { amount: number; date?: string };
}

interface ActionResult {
  actionId: Types.ObjectId;
  actionLabel: string;
  actionPrice: number;
  refItemType: "Product" | "Wig" | "Service";
  refItemId: Types.ObjectId;
}

// יוצר רכישה/שירות חדש אצל הלקוחה (כולל הורדה מהמלאי), ומחזיר את פרטי הקישור לתור
const applyAction = async (customer: ICustomer, actionDate: Date, input: ActionInput): Promise<ActionResult> => {
  const { actionKind, note, itemType, itemId, totalPrice, serviceId, price, payment } = input;

  if (actionKind === "purchase") {
    if (itemType !== "Product" && itemType !== "Wig") {
      throw new Error("itemType must be 'Product' or 'Wig'");
    }

    const item = itemType === "Product" ? await Product.findById(itemId) : await Wig.findById(itemId);
    if (!item) throw new Error(`${itemType} not found`);

    if (item.quantity <= 0) throw new Error("אין במלאי");

    const finalPrice = totalPrice ?? item.price;

    // הורדה מהמלאי
    item.quantity -= 1;
    await item.save();

    customer.purchases.push({
      itemType,
      item: item._id,
      totalPrice: finalPrice,
      payments: payment
        ? [{ amount: payment.amount, date: payment.date ? new Date(payment.date) : actionDate }]
        : [],
      date: actionDate,
      warrantyEnd: addMonths(actionDate, item.warrantyTime),
    } as any);

    const created = customer.purchases[customer.purchases.length - 1];
    return {
      actionId: created._id,
      actionLabel: itemType === "Wig" ? (item as any).name : (item as any).type,
      actionPrice: finalPrice,
      refItemType: itemType,
      refItemId: item._id as Types.ObjectId,
    };
  }

  const service = await Service.findById(serviceId);
  if (!service) throw new Error("Service not found");

  const finalPrice = price ?? service.price;

  customer.services.push({
    service: service._id,
    price: finalPrice,
    payments: payment
      ? [{ amount: payment.amount, date: payment.date ? new Date(payment.date) : actionDate }]
      : [],
    date: actionDate,
    note,
  } as any);

  const created = customer.services[customer.services.length - 1];
  return {
    actionId: created._id,
    actionLabel: service.name,
    actionPrice: finalPrice,
    refItemType: "Service",
    refItemId: service._id as Types.ObjectId,
  };
};

// מסיר רכישה/שירות קיים מהלקוחה, ומחזיר מלאי אם רלוונטי
const removeAction = async (customer: ICustomer, actionKind: ActionKind, actionId: Types.ObjectId) => {
  if (actionKind === "purchase") {
    const purchase = customer.purchases.id(actionId);
    if (purchase) {
      if (purchase.itemType === "Product") {
        await Product.findByIdAndUpdate(purchase.item, { $inc: { quantity: 1 } });
      } else {
        await Wig.findByIdAndUpdate(purchase.item, { $inc: { quantity: 1 } });
      }
      purchase.deleteOne();
    }
  } else {
    const record = customer.services.id(actionId);
    if (record) record.deleteOne();
  }
};

// משלים את refItemType/refItemId לתורים ישנים (שנוצרו לפני הוספת השדות הללו),
// לפי הפריט/השירות המקושר בפועל ברכישה/בשירות אצל הלקוחה
const backfillRefItem = async (appointment: IAppointment) => {
  if (appointment.refItemType && appointment.refItemId) return;

  const customer = await Customer.findById(appointment.customer);
  if (!customer) return;

  if (appointment.actionKind === "purchase") {
    const purchase = customer.purchases.id(appointment.actionId);
    if (purchase) {
      appointment.refItemType = purchase.itemType;
      appointment.refItemId = purchase.item as Types.ObjectId;
      await appointment.save();
    }
  } else {
    const record = customer.services.id(appointment.actionId);
    if (record) {
      appointment.refItemType = "Service";
      appointment.refItemId = record.service as Types.ObjectId;
      await appointment.save();
    }
  }
};

// Create - יוצר תור בלוח השנה, ויחד איתו פעולה (רכישה/שירות) חדשה אצל הלקוחה
// body: {
//   customer, date, time, note?, status?,
//   actionKind: "purchase" | "service",
//   // לפעולת רכישה:
//   itemType?, itemId?, totalPrice?,
//   // לפעולת שירות:
//   serviceId?, price?,
//   payment?: { amount, date? }
// }
export const createAppointment = async (req: Request, res: Response) => {
  try {
    const { customer: customerId, date, time, note, status, actionKind, ...actionInput } = req.body;

    if (actionKind !== "purchase" && actionKind !== "service") {
      return res.status(400).json({ error: "actionKind must be 'purchase' or 'service'" });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const actionDate = date ? new Date(date) : new Date();

    const { actionId, actionLabel, actionPrice, refItemType, refItemId } = await applyAction(customer, actionDate, {
      actionKind,
      note,
      ...actionInput,
    });

    await customer.save();

    const appointment = await Appointment.create({
      customer: customer._id,
      date: actionDate,
      time,
      note,
      status: status ?? "scheduled",
      actionKind,
      actionId,
      actionLabel,
      actionPrice,
      refItemType,
      refItemId,
    });

    await appointment.populate("customer");

    res.status(201).json({ appointment, customer });
  } catch (err) {
    res.status(400).json({ error: getErrorMessage(err) });
  }
};

// Read all - אפשר לסנן לפי טווח תאריכים (לתצוגת שבוע): ?start=YYYY-MM-DD&end=YYYY-MM-DD
export const getAppointments = async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;
    const filter: Record<string, unknown> = {};

    if (start || end) {
      const dateFilter: Record<string, Date> = {};
      if (start) dateFilter.$gte = new Date(start as string);
      if (end) dateFilter.$lte = new Date(end as string);
      filter.date = dateFilter;
    }

    const appointments = await Appointment.find(filter)
      .populate("customer")
      .sort({ date: 1, time: 1 });

    await Promise.all(appointments.map((a) => backfillRefItem(a)));

    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: getErrorMessage(err) });
  }
};

// Read one
export const getAppointment = async (req: Request, res: Response) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate("customer");
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });
    await backfillRefItem(appointment);
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: getErrorMessage(err) });
  }
};

// Update - מאפשר לעדכן תאריך/שעה/הערה/סטטוס, וגם את פרטי הפעולה המקושרת (פריט/שירות/מחיר)
// body: כמו ב-createAppointment (כל השדות אופציונליים, customer לא ניתן לשינוי)
export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });

    const customer = await Customer.findById(appointment.customer);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const { date, time, note, status, actionKind, ...actionInput } = req.body;
    const actionDate = date ? new Date(date) : appointment.date;

    if (actionKind) {
      if (actionKind !== "purchase" && actionKind !== "service") {
        return res.status(400).json({ error: "actionKind must be 'purchase' or 'service'" });
      }

      await removeAction(customer, appointment.actionKind, appointment.actionId);

      const result = await applyAction(customer, actionDate, {
        actionKind,
        note: note ?? appointment.note,
        ...actionInput,
      });

      appointment.actionKind = actionKind;
      appointment.actionId = result.actionId;
      appointment.actionLabel = result.actionLabel;
      appointment.actionPrice = result.actionPrice;
      appointment.refItemType = result.refItemType;
      appointment.refItemId = result.refItemId;
    } else if (date) {
      // רק התאריך השתנה - מסנכרנים את תאריך הפעולה המקושרת אצל הלקוחה
      if (appointment.actionKind === "purchase") {
        const purchase = customer.purchases.id(appointment.actionId);
        if (purchase) purchase.date = actionDate;
      } else {
        const record = customer.services.id(appointment.actionId);
        if (record) record.date = actionDate;
      }
    }

    if (date) appointment.date = actionDate;
    if (time !== undefined) appointment.time = time;
    if (note !== undefined) appointment.note = note;
    if (status !== undefined) appointment.status = status;

    await customer.save();
    await appointment.save();
    await appointment.populate("customer");

    res.json({ appointment, customer });
  } catch (err) {
    res.status(400).json({ error: getErrorMessage(err) });
  }
};

// Delete - מוחק את התור, ואת הפעולה (רכישה/שירות) המקושרת אצל הלקוחה, ומחזיר מלאי אם רלוונטי
export const deleteAppointment = async (req: Request, res: Response) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });

    const customer = await Customer.findById(appointment.customer);
    if (customer) {
      await removeAction(customer, appointment.actionKind, appointment.actionId);
      await customer.save();
    }

    await appointment.deleteOne();
    res.json({ message: "Appointment deleted" });
  } catch (err) {
    res.status(500).json({ error: getErrorMessage(err) });
  }
};
