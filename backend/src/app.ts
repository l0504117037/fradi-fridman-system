import express from "express";
import testRoutes from "./routes/tast.route";
import customerRoutes from "./routes/customerRoutes";
import productRoutes from "./routes/productRoutes";
import employeeRoutes from "./routes/employeeRoutes";
import employeeMonthlyRoutes from "./routes/employeeMonthlyRoutes";

const app = express();

app.use(express.json());

app.use("/api", testRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);



app.use("/api/employees", employeeRoutes);
app.use("/api/employees-monthly", employeeMonthlyRoutes);

export default app;

