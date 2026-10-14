import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import authRoutes from "./routes/auth";
import dashboardRoutes from "./routes/dashboard";
import menuRoutes from "./routes/menu";
import orderRoutes from "./routes/orders";
import billingRoutes from "./routes/billing";
import reportRoutes from "./routes/reports";
import userRoutes from "./routes/users";
import { errorHandler, notFound } from "./middleware/error";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);

app.use(notFound);
app.use(errorHandler);
