import { Schema, model } from "mongoose";

const menuItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, default: "" },
    available: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const MenuItem = model("MenuItem", menuItemSchema);
