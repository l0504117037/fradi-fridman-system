import { Request, Response } from "express";
import Service from "../models/Service";

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  return String(err);
};

// Create
export const createService = async (req: Request, res: Response) => {
  try {
    const service = new Service(req.body);
    const saved = await service.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: getErrorMessage(err) });
  }
};

// Read all
export const getServices = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const filter = search
      ? { $or: [
          { name:        { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ]}
      : {};
    const services = await Service.find(filter);
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: getErrorMessage(err) });
  }
};

// Read one
export const getService = async (req: Request, res: Response) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ error: "Service not found" });
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: getErrorMessage(err) });
  }
};

// Update
export const updateService = async (req: Request, res: Response) => {
  try {
    const updated = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Service not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: getErrorMessage(err) });
  }
};

// Delete
export const deleteService = async (req: Request, res: Response) => {
  try {
    const deleted = await Service.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Service not found" });
    res.json({ message: "Service deleted" });
  } catch (err) {
    res.status(500).json({ error: getErrorMessage(err) });
  }
};
