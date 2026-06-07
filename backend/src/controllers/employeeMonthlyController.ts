import { Request, Response } from "express";
import EmployeeMonthly from "../models/EmployeeMonthly";
import Employee from "../models/Employee";


export const createEmployeeMonthly = async (req: Request, res: Response) => {
  try {
    const { employee, hoursWorked, salaryPaid = 0 } = req.body;

    const emp = await Employee.findById(employee);
    if (!emp) return res.status(404).json({ error: "Employee not found" });

    const salaryDue = hoursWorked * emp.hourlyRate;

    const monthly = new EmployeeMonthly({
      employee,
      hoursWorked,
      salaryDue,
      salaryPaid,
      date: req.body.date || new Date(),
    });

    const saved = await monthly.save();
    res.status(201).json(saved);
  } catch (err) {
    if (err instanceof Error) res.status(400).json({ error: err.message });
  }
};



// עדכון לפי תאריך ועובד


// export const updateEmployeeMonthly = async (req: Request, res: Response) => {
//   try {
//     const { employeeId, date, salaryPaid } = req.body;

//     if (!employeeId || !date) {
//       return res.status(400).json({ error: "employeeId and date are required" });
//     }

//     const emp = await Employee.findById(employeeId);
//     if (!emp) return res.status(404).json({ error: "Employee not found" });

//     // יוצרים תאריך שמייצג את החודש בלבד (בלי זמן)
//     const targetDate = new Date(date);
//     targetDate.setDate(1);
//     targetDate.setHours(0, 0, 0, 0);

//     // מחפשים את הרשומה של אותו חודש
//     const record = await EmployeeMonthly.findOne({
//       employee: employeeId,
//       date: {
//         $gte: targetDate,
//         $lt: new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1)
//       }
//     });

//     if (!record) return res.status(404).json({ error: "Monthly record not found" });

//     // עדכון השדות הרצויים
//     if (salaryPaid !== undefined) record.salaryPaid = salaryPaid;

//     // אפשר גם לעדכן hoursWorked או employee ולחשב salaryDue מחדש
//     if (req.body.hoursWorked !== undefined) {
//       record.hoursWorked = req.body.hoursWorked;
//       record.salaryDue = record.hoursWorked * emp.hourlyRate;
//     }

//     await record.save();
//     res.json(record);
//   } catch (err) {
//     if (err instanceof Error) res.status(400).json({ error: err.message });
//   }
// };



export const updateEmployeeMonthly = async (req: Request, res: Response) => {
  try {
    const { employeeId, date, hoursWorked, salaryPaid } = req.body;

    if (!employeeId || !date) {
      return res.status(400).json({ error: "employeeId and date are required" });
    }

    // מוצאים את העובד
    const emp = await Employee.findById(employeeId);
    if (!emp) return res.status(404).json({ error: "Employee not found" });

    // יוצרים תאריך שמייצג את החודש בלבד (בלי זמן)
    const targetDate = new Date(date);
    targetDate.setDate(1);
    targetDate.setHours(0, 0, 0, 0);

    // מחפשים את הרשומה של אותו חודש
    const record = await EmployeeMonthly.findOne({
      employee: employeeId,
      date: {
        $gte: targetDate,
        $lt: new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1),
      },
    });

    if (!record) return res.status(404).json({ error: "Monthly record not found" });

    // עדכון שעות אם נשלחו
    if (hoursWorked !== undefined) {
      record.hoursWorked = hoursWorked;
      record.salaryDue = hoursWorked * emp.hourlyRate; // חישוב salaryDue אוטומטי
    }

    // עדכון salaryPaid אם נשלח
    if (salaryPaid !== undefined) record.salaryPaid = salaryPaid;

    await record.save();
    res.json(record);
  } catch (err) {
    if (err instanceof Error) res.status(400).json({ error: err.message });
  }
};



//לפי חודש ID

// Delete monthly record
export const deleteEmployeeMonthly = async (req: Request, res: Response) => {
  try {
    const deleted = await EmployeeMonthly.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Monthly record not found" });
    }
    res.json({ message: "Monthly record deleted" });
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    }
  }


};

//להביא את כל החודשים של העובד הזה 

export const getEmployeeMonthlyByEmployee = async (
  req: Request,
  res: Response
) => {
  try {
    const employeeId = req.params.employeeId;

    // שולף את העובד
    const emp = await Employee.findById(employeeId);
    if (!emp) return res.status(404).json({ error: "Employee not found" });

    // שולף את כל החודשים של העובד
    const months = await EmployeeMonthly.find({ employee: employeeId }).sort({ date: 1 });

    res.json({
      employee: emp,
      months: months.map((m) => ({
        _id: m._id,
        date: m.date,
        hoursWorked: m.hoursWorked,
        salaryDue: m.salaryDue,
        salaryPaid: m.salaryPaid,
      })),
    });
  } catch (err) {
    if (err instanceof Error) res.status(500).json({ error: err.message });
  }
};

//להביא א תכל החודשים של כל העובדים
// Get all monthly records grouped by employee
export const getAllEmployeeMonthlyGrouped = async (_req: Request, res: Response) => {
  try {
    // שולף את כל הרשומות וממלא את הנתונים של העובד
    const data = await EmployeeMonthly.find().populate("employee");

    // יוצרים מילון שממפה כל עובד למערך החודשים שלו
    const grouped: Record<string, { employee: any; months: any[] }> = {};

    data.forEach((item) => {
      const empId = item.employee._id.toString();

      if (!grouped[empId]) {
        grouped[empId] = {
          employee: item.employee, // כל המידע על העובד
          months: [],
        };
      }

      // מוסיפים את החודש הנוכחי למערך החודשים של העובד
      grouped[empId].months.push({
        _id: item._id,
        date: item.date,
        hoursWorked: item.hoursWorked,
        salaryDue: item.salaryDue,
        satisfiesSalaryPaid: item.salaryPaid,
        // כאן אפשר להוסיף כל שדה אחר מ־EmployeeMonthly
      });
    });

    // ממירים את המילון למערך
    const result = Object.values(grouped);

    res.json(result);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    }
  }
};