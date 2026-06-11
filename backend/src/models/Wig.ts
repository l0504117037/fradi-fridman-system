import mongoose, { Schema, Document, Types } from "mongoose";

export interface IWig extends Document {
  code?: string; // קוד/מק"ט שאת קובעת בעצמך, בנוסף ל-id האוטומטי
  name: string;
  color?: string;
  size?: string;
  price: number;
  quantity: number;
  warrantyTime: number; // חודשים
  supplier?: Types.ObjectId;
}

const WigSchema: Schema = new Schema(
  {
    code: { type: String },
    name: { type: String, required: true },
    color: { type: String },
    size: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    warrantyTime: { type: Number, required: true },
    supplier: { type: Schema.Types.ObjectId, ref: "Supplier" },
  },
  { timestamps: true }
);

const Wig = mongoose.model<IWig>("Wig", WigSchema);
export default Wig;
