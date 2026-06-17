import mongoose, { Schema, Document, Types } from "mongoose";

export type AppointmentStatus = "scheduled" | "done" | "cancelled" | "no-show";
export type ActionKind = "purchase" | "service";

export interface IAppointment extends Document {
  customer: Types.ObjectId;
  date: Date; // היום (ללא שעה)
  time: string; // לדוגמה "10:00" או "10:15"
  status: AppointmentStatus;
  note?: string;
  // קישור לפעולה (רכישה/שירות) שנוצרה אצל הלקוחה יחד עם התור הזה
  actionKind: ActionKind;
  actionId: Types.ObjectId;
  actionLabel: string;
  actionPrice: number;
  // הפריט/השירות המקושר בפועל (מוצר/פאה/שירות) - משמש לעדכון התור
  refItemType?: "Product" | "Wig" | "Service";
  refItemId?: Types.ObjectId;
}

const AppointmentSchema: Schema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    status: {
      type: String,
      enum: ["scheduled", "done", "cancelled", "no-show"],
      default: "scheduled",
    },
    note: { type: String },
    actionKind: { type: String, enum: ["purchase", "service"], required: true },
    actionId: { type: Schema.Types.ObjectId, required: true },
    actionLabel: { type: String, required: true },
    actionPrice: { type: Number, required: true },
    refItemType: { type: String, enum: ["Product", "Wig", "Service"] },
    refItemId: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

const Appointment = mongoose.model<IAppointment>("Appointment", AppointmentSchema);
export default Appointment;
