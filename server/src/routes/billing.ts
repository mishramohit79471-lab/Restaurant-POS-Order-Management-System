import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { Order } from "../models/Order";
import { env } from "../config/env";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../utils/HttpError";
import { computeTotals, resolveDiscount, round2 } from "../utils/billing";

const router = Router();
router.use(requireAuth);

const STAFF_MAX_DISCOUNT_PCT = 10;

const serialize = (o: any) => ({
  id: String(o._id),
  orderNumber: o.orderNumber,
  type: o.type,
  tableNumber: o.tableNumber,
  customerName: o.customerName,
  items: o.items.map((i: any) => ({ name: i.name, price: i.price, quantity: i.quantity, lineTotal: round2(i.price * i.quantity) })),
  subtotal: o.subtotal,
  discount: o.discount,
  tax: o.tax,
  total: o.total,
  taxRate: env.taxRate,
  status: o.status,
  paymentStatus: o.paymentStatus,
  paymentMethod: o.paymentMethod,
  paidAt: o.paidAt,
  amountTendered: o.amountTendered,
  changeGiven: o.changeGiven,
  upiReference: o.upiReference,
  createdAt: o.createdAt,
});

const receiptMeta = {
  restaurantName: process.env.RESTAURANT_NAME ?? "DineFlow Kitchen",
  address: process.env.RESTAURANT_ADDRESS ?? "",
};

async function loadOrder(idParam: unknown) {
  const id = String(idParam);
  if (!isValidObjectId(id)) throw new HttpError(400, "Invalid order id");
  const order = await Order.findById(id).lean();
  if (!order) throw new HttpError(404, "Order not found");
  return order;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const paid = req.query.status === "paid";
    const orders = await Order.find({ paymentStatus: paid ? "paid" : "unpaid" })
      .sort(paid ? { paidAt: -1, createdAt: -1 } : { createdAt: 1 })
      .limit(100)
      .lean();
    res.json({ orders: orders.map(serialize) });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json({ order: serialize(await loadOrder(req.params.id)), ...receiptMeta });
  })
);

const discountShape = {
  discountType: z.enum(["none", "percent", "amount"]).default("none"),
  discountValue: z.number().min(0, "Discount cannot be negative").default(0),
};

/** Shared by quote and pay so the preview can never disagree with the charge. */
function bill(order: { subtotal: number }, input: { discountType: any; discountValue: number }, role: string) {
  const discount = resolveDiscount(order.subtotal, input);
  if (role !== "admin" && discount > round2((order.subtotal * STAFF_MAX_DISCOUNT_PCT) / 100)) {
    throw new HttpError(403, `Staff can give discounts up to ${STAFF_MAX_DISCOUNT_PCT}%. Ask an admin to approve more.`);
  }
  return computeTotals(order.subtotal, discount);
}

const quoteSchema = z.object({ ...discountShape, amountTendered: z.number().min(0).optional() });

router.post(
  "/:id/quote",
  asyncHandler(async (req, res) => {
    const input = quoteSchema.parse(req.body);
    const order = await loadOrder(req.params.id);
    if (order.paymentStatus === "paid") throw new HttpError(409, "This order is already paid");
    const totals = bill(order, input, req.user!.role);
    const change = input.amountTendered === undefined ? undefined : round2(input.amountTendered - totals.total);
    res.json({ ...totals, change });
  })
);

const paySchema = z.discriminatedUnion("method", [
  z.object({ method: z.literal("cash"), ...discountShape, amountTendered: z.number().min(0, "Enter the cash received") }),
  z.object({ method: z.literal("upi"), ...discountShape, upiReference: z.string().trim().max(40).optional() }),
]);

router.post(
  "/:id/pay",
  asyncHandler(async (req, res) => {
    const input = paySchema.parse(req.body);
    const order = await loadOrder(req.params.id);
    if (order.paymentStatus === "paid") throw new HttpError(409, "This order is already paid");

    const totals = bill(order, input, req.user!.role);
    let amountTendered: number | undefined;
    let changeGiven: number | undefined;
    if (input.method === "cash") {
      if (input.amountTendered < totals.total) throw new HttpError(400, "Cash received is less than the total due");
      amountTendered = input.amountTendered;
      changeGiven = round2(input.amountTendered - totals.total);
    }

    // The paymentStatus filter makes double-submits (two cashiers, double click) safe.
    const paid = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: "unpaid" },
      {
        $set: {
          discount: totals.discount,
          tax: totals.tax,
          total: totals.total,
          paymentStatus: "paid",
          paymentMethod: input.method,
          paidAt: new Date(),
          amountTendered,
          changeGiven,
          upiReference: input.method === "upi" ? input.upiReference || undefined : undefined,
        },
      },
      { returnDocument: "after" }
    ).lean();
    if (!paid) throw new HttpError(409, "This order was just paid by someone else");

    res.json({ order: serialize(paid), ...receiptMeta });
  })
);

export default router;
