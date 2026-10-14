import dotenv from "dotenv";
dotenv.config();

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  port: Number(process.env.PORT ?? 5000),
  mongoUri: required("MONGODB_URI"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000",
  timezone: process.env.TIMEZONE ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  taxRate: Number(process.env.TAX_RATE ?? 0.05),
};
