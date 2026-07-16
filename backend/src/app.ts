import express from "express";
import testRoutes from "./routes/tast.route";
import customerRoutes from "./routes/customerRoutes";
import productRoutes from "./routes/productRoutes";
import employeeRoutes from "./routes/employeeRoutes";
import employeeMonthlyRoutes from "./routes/employeeMonthlyRoutes";
import supplierRoutes from "./routes/supplierRoutes";
import serviceRoutes from "./routes/serviceRoutes";
import wigRoutes from "./routes/wigRoutes";
import appointmentRoutes from "./routes/appointmentRoutes";
import reportRoutes from "./routes/reportRoutes";
import hairdresserRoutes from "./routes/hairdresserRoutes";

const app = express();

app.use(express.json());

app.use("/api", testRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/wigs", wigRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/hairdressers", hairdresserRoutes);



app.use("/api/employees", employeeRoutes);
app.use("/api/employees-monthly", employeeMonthlyRoutes);

export default app;

