import { Request, Response } from "express";
import Employee from "../models/Employee";
import EmployeeMonthly from "../models/EmployeeMonthly";

// Create employee
export const createEmployee = async (req: Request, res: Response) => {
  try {
    const employee = new Employee(req.body);
    const saved = await employee.save();
    res.status(201).json(saved);
  } catch (err) {
    if (err instanceof Error) {
      res.status(400).json({ error: err.message });
    }
  }
};

// Get all employees
export const getEmployees = async (_req: Request, res: Response) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    }
  }
};

// Get employee by ID
export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.json(employee);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    }
  }
};

// Update employee
// export const updateEmployee = async (req: Request, res: Response) => {
//   try {
//     const updated = await Employee.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true }
//     );
//     if (!updated) {
//       return res.status(404).json({ error: "Employee not found" });
//     }
//     res.json(updated);
//   } catch (err) {
//     if (err instanceof Error) {
//       res.status(400).json({ error: err.message });
//     }
//   }
// };
export const updateEmployee = async (req: Request, res: Response) => {
  try {
    // קודם מעדכנים את פרטי העובד
    const updated = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // אם השכר השעתי השתנה, מעדכנים את כל הרשומות החודשיות של העובד
    if (req.body.hourlyRate !== undefined) {
      const records = await EmployeeMonthly.find({ employee: updated._id });
      for (const rec of records) {
        rec.salaryDue = rec.hoursWorked * req.body.hourlyRate;
        await rec.save();
      }
    }

    res.json(updated);
  } catch (err) {
    if (err instanceof Error) res.status(400).json({ error: err.message });
  }
};

// Delete employee
export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const deleted = await Employee.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.json({ message: "Employee deleted" });
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    }
  }
};
