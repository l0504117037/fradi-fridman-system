import { Request, Response } from "express";
import Product from "../models/Product";

// Create product
export const createProduct = async (req: Request, res: Response) => {
  try {
    const product = new Product(req.body);
    const saved = await product.save();
    res.status(201).json(saved);
  } catch (err) {
    if (err instanceof Error) res.status(400).json({ error: err.message });
  }
};

// Read all products
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const filter = search ? { type: { $regex: search, $options: "i" } } : {};
    const products = await Product.find(filter);
    res.json(products);
  } catch (err) {
    if (err instanceof Error) res.status(500).json({ error: err.message });
  }
};

// Read one product
export const getProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    if (err instanceof Error) res.status(500).json({ error: err.message });
  }
};

// Update product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Product not found" });
    res.json(updated);
  } catch (err) {
    if (err instanceof Error) res.status(400).json({ error: err.message });
  }
};

// Delete product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    if (err instanceof Error) res.status(500).json({ error: err.message });
  }

  
};
