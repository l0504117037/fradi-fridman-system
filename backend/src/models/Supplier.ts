import mongoose, { Schema, Document } from "mongoose";

// תנועה מול ספק: קנייה ממנו, החזרה אליו, או תשלום לו
export interface ISupplierTransaction {
  type: "purchase" | "return" | "payment";
  amount: number;
  date: Date;
  note?: string;
}

export interface ISupplier extends Document {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  transactions: ISupplierTransaction[];
}

const SupplierTransactionSchema: Schema = new Schema({
  type: { type: String, enum: ["purchase", "return", "payment"], required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  note: { type: String },
});

const SupplierSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    notes: { type: String },
    transactions: [SupplierTransactionSchema],
  },
  { timestamps: true }
);

const Supplier = mongoose.model<ISupplier>("Supplier", SupplierSchema);
export default Supplier;
