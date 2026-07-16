import mongoose, { Schema, Document } from "mongoose";

export interface IHairdresser extends Document {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

const HairdresserSchema: Schema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName:  { type: String, required: true },
    phone:     { type: String, required: true },
    email:     { type: String },
  },
  { timestamps: true }
);

const Hairdresser = mongoose.model<IHairdresser>("Hairdresser", HairdresserSchema);
export default Hairdresser;
