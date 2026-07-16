import mongoose, { Schema, Document, Types } from "mongoose";
import { IHairdresser } from "./Hairdresser";
import { IWig } from "./Wig";

export interface IHairdresserSalePayment {
  amount: number;
  date: Date;
}

export interface IHairdresserSale extends Document {
  hairdresser: IHairdresser["_id"];
  wig: IWig["_id"];
  totalPrice: number;
  date: Date;
  payments: IHairdresserSalePayment[];
  note?: string;
}

const HairdresserSaleSchema: Schema = new Schema(
  {
    hairdresser: { type: Schema.Types.ObjectId, ref: "Hairdresser", required: true },
    wig:         { type: Schema.Types.ObjectId, ref: "Wig", required: true },
    totalPrice:  { type: Number, required: true },
    date:        { type: Date, required: true, default: Date.now },
    payments:    [{ amount: { type: Number, required: true }, date: { type: Date, required: true } }],
    note:        { type: String },
  },
  { timestamps: true }
);

const HairdresserSale = mongoose.model<IHairdresserSale>("HairdresserSale", HairdresserSaleSchema);
export default HairdresserSale;
