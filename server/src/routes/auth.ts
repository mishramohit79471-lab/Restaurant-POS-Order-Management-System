import { Router } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User";
import { env } from "../config/env";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// Slows password guessing: 10 failed sign-ins per IP per 15 minutes (successful logins are not counted).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.LOGIN_RATE_LIMIT ?? 10),
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many failed sign-in attempts. Please try again in 15 minutes." },
});

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

router.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email }).select("+passwordHash");
    const ok = user && user.active && (await bcrypt.compare(password, user.passwordHash));
    if (!user || !ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
    });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!.id);
    if (!user || !user.active) return res.status(401).json({ message: "Account unavailable" });
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  })
);

export default router;
