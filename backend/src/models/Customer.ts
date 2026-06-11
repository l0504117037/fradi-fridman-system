import mongoose, { Schema, Document, Types } from "mongoose";
import { IProduct } from "./Product";
import { IWig } from "./Wig";
import { IService } from "./Service";

// תשלום בודד (לרכישה או לשירות)
export interface IPayment {
  amount: number;
  date: Date;
}

// רכישת מוצר או פאה
export interface IPurchase {
  _id: Types.ObjectId;
  itemType: "Product" | "Wig";
  item: Types.ObjectId | IProduct | IWig;
  totalPrice: number;
  payments: IPayment[];
  date: Date;
  warrantyEnd?: Date;
}

// שירות שבוצע (חפיפה, סירוק, שיפוץ וכו')
export interface IServiceRecord {
  _id: Types.ObjectId;
  service: Types.ObjectId | IService;
  price: number;
  payments: IPayment[];
  date: Date;
  note?: string;
}

export interface ICustomer extends Document {
  firstname: string;
  lastname: string;
  phone: string;
  mail: string;
  purchases: Types.DocumentArray<IPurchase>;
  services: Types.DocumentArray<IServiceRecord>;
}

const PaymentSchema: Schema = new Schema(
  {
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PurchaseSchema: Schema = new Schema({
  itemType: { type: String, enum: ["Product", "Wig"], required: true },
  item: { type: Schema.Types.ObjectId, required: true, refPath: "itemType" },
  totalPrice: { type: Number, required: true },
  payments: [PaymentSchema],
  date: { type: Date, default: Date.now },
  warrantyEnd: { type: Date },
});

const ServiceRecordSchema: Schema = new Schema({
  service: { type: Schema.Types.ObjectId, ref: "Service", required: true },
  price: { type: Number, required: true },
  payments: [PaymentSchema],
  date: { type: Date, default: Date.now },
  note: { type: String },
});

const CustomerSchema: Schema = new Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    phone: { type: String, required: true },
    mail: { type: String, required: true, unique: true },
    purchases: [PurchaseSchema],
    services: [ServiceRecordSchema],
  },
  { timestamps: true }
);

const Customer = mongoose.model<ICustomer>("Customer", CustomerSchema);

export default Customer;
