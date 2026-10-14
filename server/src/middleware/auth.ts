import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/User";

export interface AuthUser {
  id: string;
  role: "admin" | "staff";
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }
  try {
    const payload = jwt.verify(header.slice(7), env.jwtSecret) as AuthUser;
    // Re-read the user so deactivation and role changes apply immediately, not at token expiry.
    const user = await User.findById(payload.id).select("role active").lean();
    if (!user || !user.active) {
      return res.status(401).json({ message: "This account is no longer active. Please sign in again." });
    }
    req.user = { id: String(user._id), role: user.role as AuthUser["role"] };
    next();
  } catch {
    res.status(401).json({ message: "Session expired. Please sign in again." });
  }
}

export const requireRole =
  (...roles: AuthUser["role"][]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to do this" });
    }
    next();
  };
