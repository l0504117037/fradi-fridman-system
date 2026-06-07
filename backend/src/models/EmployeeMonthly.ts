import mongoose, { Schema, Document } from "mongoose";
import { IEmployee } from "./Employee";

export interface IEmployeeMonthly extends Document {
  employee: IEmployee["_id"];
  date: Date;
  hoursWorked: number;
  salaryDue: number;
  salaryPaid: number;
}

const EmployeeMonthlySchema: Schema = new Schema(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: { type: Date, required: true },
    hoursWorked: { type: Number, required: true },
    salaryDue: { type: Number, required: true },
    salaryPaid: { type: Number, required: true },
  },
  { timestamps: true }
);

// למנוע כפילות של אותו חודש לאותה עובדת
EmployeeMonthlySchema.index(
  { employee: 1, date: 1 },
  { unique: true }
);
const EmployeeMonthly = mongoose.model<IEmployeeMonthly>(
  "EmployeeMonthly",
  EmployeeMonthlySchema
);

export default EmployeeMonthly;
