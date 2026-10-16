
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

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true,
  })
);

// Parse JSON request bodies
app.use(express.json());

// Root route
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "DineFlow API is running successfully!",
    health: "/api/health",
  });
});

// Health check route
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "OK",
    message: "Server is healthy",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);

// Handle unknown routes
app.use(notFound);

// Centralized error handler
app.use(errorHandler);
