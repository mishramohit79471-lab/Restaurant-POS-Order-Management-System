import mongoose from "mongoose";
import { env } from "./env";

export async function connectDb() {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 8000 });
  console.log("MongoDB connected");
}
