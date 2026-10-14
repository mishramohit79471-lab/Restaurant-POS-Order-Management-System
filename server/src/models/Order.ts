import { Schema, model } from "mongoose";

const orderItemSchema = new Schema(
  {
    menuItem: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: Number, required: true, unique: true },
    type: { type: String, enum: ["dine-in", "takeaway"], required: true },
    tableNumber: { type: String },
    customerName: { type: String },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "completed"],
      default: "pending",
      index: true,
    },
    paymentMethod: { type: String, enum: ["cash", "upi"] },
    paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
    paidAt: { type: Date },
    amountTendered: { type: Number },
    changeGiven: { type: Number },
    upiReference: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });

export const Order = model("Order", orderSchema);
