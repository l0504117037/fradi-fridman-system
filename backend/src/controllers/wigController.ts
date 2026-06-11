import { Request, Response } from "express";
import Wig from "../models/Wig";

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  return String(err);
};

// Create
export const createWig = async (req: Request, res: Response) => {
  try {
    const wig = new Wig(req.body);
    const saved = await wig.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: getErrorMessage(err) });
  }
};

// Read all
export const getWigs = async (_req: Request, res: Response) => {
  try {
    const wigs = await Wig.find().populate("supplier");
    res.json(wigs);
  } catch (err) {
    res.status(500).json({ error: getErrorMessage(err) });
  }
};

// Read one
export const getWig = async (req: Request, res: Response) => {
  try {
    const wig = await Wig.findById(req.params.id).populate("supplier");
    if (!wig) return res.status(404).json({ error: "Wig not found" });
    res.json(wig);
  } catch (err) {
    res.status(500).json({ error: getErrorMessage(err) });
  }
};

// Update
export const updateWig = async (req: Request, res: Response) => {
  try {
    const updated = await Wig.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Wig not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: getErrorMessage(err) });
  }
};

// Delete
export const deleteWig = async (req: Request, res: Response) => {
  try {
    const deleted = await Wig.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Wig not found" });
    res.json({ message: "Wig deleted" });
  } catch (err) {
    res.status(500).json({ error: getErrorMessage(err) });
  }
};
