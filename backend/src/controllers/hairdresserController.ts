import { Request, Response } from "express";
import Hairdresser from "../models/Hairdresser";
import HairdresserSale from "../models/HairdresserSale";
import Wig from "../models/Wig";

const err = (e: unknown) => (e instanceof Error ? e.message : String(e));

export const getHairdressers = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const filter = search
      ? { $or: [
          { firstName: { $regex: search, $options: "i" } },
          { lastName:  { $regex: search, $options: "i" } },
          { phone:     { $regex: search, $options: "i" } },
        ]}
      : {};
    res.json(await Hairdresser.find(filter));
  } catch (e) { res.status(500).json({ error: err(e) }); }
};

export const getHairdresserById = async (req: Request, res: Response) => {
  try {
    const h = await Hairdresser.findById(req.params.id);
    if (!h) return res.status(404).json({ error: "לא נמצאה פאנית" });
    res.json(h);
  } catch (e) { res.status(500).json({ error: err(e) }); }
};

export const getHairdresserDetail = async (req: Request, res: Response) => {
  try {
    const hairdresser = await Hairdresser.findById(req.params.id);
    if (!hairdresser) return res.status(404).json({ error: "לא נמצאה פאנית" });
    const sales = await HairdresserSale.find({ hairdresser: req.params.id })
      .populate("wig")
      .sort({ date: -1 });
    res.json({ hairdresser, sales });
  } catch (e) { res.status(500).json({ error: err(e) }); }
};

export const createHairdresser = async (req: Request, res: Response) => {
  try {
    const h = await new Hairdresser(req.body).save();
    res.status(201).json(h);
  } catch (e) { res.status(400).json({ error: err(e) }); }
};

export const updateHairdresser = async (req: Request, res: Response) => {
  try {
    const h = await Hairdresser.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!h) return res.status(404).json({ error: "לא נמצאה פאנית" });
    res.json(h);
  } catch (e) { res.status(400).json({ error: err(e) }); }
};

export const deleteHairdresser = async (req: Request, res: Response) => {
  try {
    const h = await Hairdresser.findByIdAndDelete(req.params.id);
    if (!h) return res.status(404).json({ error: "לא נמצאה פאנית" });
    res.json({ message: "נמחקה" });
  } catch (e) { res.status(500).json({ error: err(e) }); }
};

export const addSale = async (req: Request, res: Response) => {
  try {
    const { wigId, totalPrice, date, payment, note } = req.body;
    const wig = await Wig.findById(wigId);
    if (!wig) return res.status(404).json({ error: "פאה לא נמצאה" });
    if (wig.quantity <= 0) return res.status(400).json({ error: "אין במלאי" });

    wig.quantity -= 1;
    await wig.save();

    const payments = payment?.amount > 0
      ? [{ amount: payment.amount, date: payment.date ? new Date(payment.date) : new Date() }]
      : [];

    const sale = await new HairdresserSale({
      hairdresser: req.params.id,
      wig: wigId,
      totalPrice,
      date: date ? new Date(date) : new Date(),
      payments,
      note,
    }).save();

    const populated = await sale.populate("wig");
    res.status(201).json(populated);
  } catch (e) { res.status(400).json({ error: err(e) }); }
};

export const addPayment = async (req: Request, res: Response) => {
  try {
    const sale = await HairdresserSale.findById(req.params.saleId);
    if (!sale) return res.status(404).json({ error: "מכירה לא נמצאה" });
    const { amount, date } = req.body;
    sale.payments.push({ amount, date: date ? new Date(date) : new Date() });
    await sale.save();
    res.json(sale);
  } catch (e) { res.status(400).json({ error: err(e) }); }
};

export const deleteSale = async (req: Request, res: Response) => {
  try {
    const sale = await HairdresserSale.findByIdAndDelete(req.params.saleId);
    if (!sale) return res.status(404).json({ error: "מכירה לא נמצאה" });
    await Wig.findByIdAndUpdate(sale.wig, { $inc: { quantity: 1 } });
    res.json({ message: "נמחקה" });
  } catch (e) { res.status(500).json({ error: err(e) }); }
};
