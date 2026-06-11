import mongoose, { Schema, Document } from "mongoose";

export interface IService extends Document {
  name: string;
  price: number;
  duration?: number; // בדקות
  description?: string;
}

const ServiceSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: Number },
    description: { type: String },
  },
  { timestamps: true }
);

const Service = mongoose.model<IService>("Service", ServiceSchema);
export default Service;
