import mongoose, { Schema, Document } from "mongoose";

export interface IEmployee extends Document {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  hourlyRate: number;
}

const EmployeeSchema: Schema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    hourlyRate: { type: Number, required: true },
  },
  { timestamps: true }
);

const Employee = mongoose.model<IEmployee>("Employee", EmployeeSchema);
export default Employee;
