import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  type: string;
  price: number;
  quantity: number;
  warrantyTime: number; // חודשים
}

const ProductSchema: Schema = new Schema({
  type: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  warrantyTime: { type: Number, required: true },
});

const Product = mongoose.model<IProduct>("Product", ProductSchema);
export default Product;
