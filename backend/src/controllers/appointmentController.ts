import { Request, Response } from "express";
import { Types } from "mongoose";
import Appointment from "../models/Appointment";
import Customer from "../models/Customer";
import Product from "../models/Product";
import Wig from "../models/Wig";
import Service from "../models/Service";
import { addMonths } from "../utils/date";

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  return String(err);
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
    const {
      customer: customerId,
      date,
      time,
      note,
      status,
      actionKind,
      itemType,
      itemId,
      totalPrice,
      serviceId,
      price,
      payment,
    } = req.body;

    if (actionKind !== "purchase" && actionKind !== "service") {
      return res.status(400).json({ error: "actionKind must be 'purchase' or 'service'" });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const actionDate = date ? new Date(date) : new Date();

    let actionId: Types.ObjectId;
    let actionLabel: string;
    let actionPrice: number;

    if (actionKind === "purchase") {
      if (itemType !== "Product" && itemType !== "Wig") {
        return res.status(400).json({ error: "itemType must be 'Product' or 'Wig'" });
      }

      const item = itemType === "Product" ? await Product.findById(itemId) : await Wig.findById(itemId);
      if (!item) return res.status(404).json({ error: `${itemType} not found` });

      const finalPrice = totalPrice ?? item.price;

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
      actionId = created._id;
      actionLabel = itemType === "Wig" ? (item as any).name : (item as any).type;
      actionPrice = finalPrice;
    } else {
      const service = await Service.findById(serviceId);
      if (!service) return res.status(404).json({ error: "Service not found" });

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
      actionId = created._id;
      actionLabel = service.name;
      actionPrice = finalPrice;
    }

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
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: getErrorMessage(err) });
  }
};

// Update
export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const updated = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("customer");
    if (!updated) return res.status(404).json({ error: "Appointment not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: getErrorMessage(err) });
  }
};

// Delete
export const deleteAppointment = async (req: Request, res: Response) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Appointment not found" });
    res.json({ message: "Appointment deleted" });
  } catch (err) {
    res.status(500).json({ error: getErrorMessage(err) });
  }
};
