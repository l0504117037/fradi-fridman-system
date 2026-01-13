import express from "express";
import testRoutes from "./routes/tast.route";
import customerRoutes from "./routes/customerRoutes";
import productRoutes from "./routes/productRoutes";

const app = express();

app.use(express.json());

app.use("/api", testRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
export default app;

