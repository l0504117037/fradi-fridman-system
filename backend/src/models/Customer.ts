import mongoose, { Schema, Document, Types } from "mongoose";
import { IProduct } from "./Product";

export interface IPurchase {
  product: Types.ObjectId | IProduct;
  pricePaid: number;
  date: Date;
}


export interface ICustomer extends Document {
  firstname: string;
  lastname: string;
  phone: string;
  mail: string;
  purchases: IPurchase[];
}


const PurchaseSchema: Schema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  pricePaid: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});


const CustomerSchema: Schema = new Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  phone: { type: String, required: true },
  mail: { type: String, required: true, unique: true },
  purchases: [PurchaseSchema],
}, { timestamps: true });

const Customer = mongoose.model<ICustomer>("Customer", CustomerSchema);

export default Customer;
