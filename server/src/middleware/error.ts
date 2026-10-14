import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/HttpError";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ message: "Route not found" });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: err.issues[0]?.message ?? "Invalid input",
      errors: err.issues,
    });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
}
