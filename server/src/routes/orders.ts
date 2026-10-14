import { Router } from "express";
import { z } from "zod";
import { Order } from "../models/Order";
import { nextSequence } from "../models/Counter";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { priceCart } from "../utils/billing";
import { HttpError } from "../utils/HttpError";
import { isValidObjectId } from "mongoose";

const router = Router();
router.use(requireAuth);

const cartSchema = z.object({
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().min(1, "Quantity must be at least 1").max(50, "Quantity too large"),
      })
    )
    .min(1, "Add at least one item"),
});

const orderSchema = cartSchema
  .extend({
    type: z.enum(["dine-in", "takeaway"]),
    tableNumber: z.string().trim().max(10).optional(),
    customerName: z.string().trim().max(60).optional(),
  })
  .refine((o) => o.type !== "dine-in" || !!o.tableNumber, {
    message: "Table number is required for dine-in orders",
    path: ["tableNumber"],
  });

// Totals preview for the cart. Same code path as checkout, so the numbers always match.
router.post(
  "/quote",
  asyncHandler(async (req, res) => {
    const { items } = cartSchema.parse(req.body);
    res.json(await priceCart(items));
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = orderSchema.parse(req.body);
    const bill = await priceCart(input.items);

    const order = await Order.create({
      orderNumber: await nextSequence("order", async () => {
        const last = await Order.findOne().sort({ orderNumber: -1 }).select("orderNumber").lean();
        return last?.orderNumber ?? 999;
      }),
      type: input.type,
      tableNumber: input.type === "dine-in" ? input.tableNumber : undefined,
      customerName: input.customerName || undefined,
      items: bill.items.map(({ menuItem, name, price, quantity }) => ({ menuItem, name, price, quantity })),
      subtotal: bill.subtotal,
      discount: bill.discount,
      tax: bill.tax,
      total: bill.total,
      createdBy: req.user!.id,
    });

    res.status(201).json({
      order: { id: order.id, orderNumber: order.orderNumber, total: order.total, status: order.status },
    });
  })
);

const NEXT_STATUS = { pending: "preparing", preparing: "ready", ready: "completed" } as const;

const serialize = (o: any) => ({
  id: String(o._id),
  orderNumber: o.orderNumber,
  type: o.type,
  tableNumber: o.tableNumber,
  customerName: o.customerName,
  items: o.items.map((i: any) => ({ name: i.name, quantity: i.quantity })),
  total: o.total,
  status: o.status,
  createdAt: o.createdAt,
  updatedAt: o.updatedAt,
});

// Kitchen board: every open order plus whatever was completed today.
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const orders = await Order.find({
      $or: [{ status: { $ne: "completed" } }, { status: "completed", updatedAt: { $gte: startOfToday } }],
    })
      .sort({ createdAt: 1 })
      .limit(300)
      .lean();
    res.json({ orders: orders.map(serialize) });
  })
);

// Moves an order exactly one step forward. The expected current status guards against
// two staff members updating the same ticket at once.
const statusSchema = z.object({ from: z.enum(["pending", "preparing", "ready"]) });

router.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!isValidObjectId(id)) throw new HttpError(400, "Invalid order id");
    const { from } = statusSchema.parse(req.body);

    const order = await Order.findOneAndUpdate(
      { _id: id, status: from },
      { $set: { status: NEXT_STATUS[from] } },
      { returnDocument: "after" }
    ).lean();

    if (!order) {
      const exists = await Order.exists({ _id: id });
      if (!exists) throw new HttpError(404, "Order not found");
      throw new HttpError(409, "This order was already updated by someone else. Refreshing the board.");
    }
    res.json({ order: serialize(order) });
  })
);

export default router;
