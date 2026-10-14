import { Router } from "express";
import { z } from "zod";
import { Order } from "../models/Order";
import { env } from "../config/env";
import { requireAuth, requireRole } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../utils/HttpError";
import { round2 } from "../utils/billing";

const router = Router();
router.use(requireAuth, requireRole("admin"));

const MAX_DAYS = 366;
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Dates must be in YYYY-MM-DD format");
const querySchema = z.object({ from: dateStr, to: dateStr });

const parseDay = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Revenue means money actually collected: only paid orders count. Unpaid ones are reported separately.
router.get(
  "/sales",
  asyncHandler(async (req, res) => {
    const { from, to } = querySchema.parse(req.query);
    const start = parseDay(from);
    const endExclusive = parseDay(to);
    endExclusive.setDate(endExclusive.getDate() + 1);

    if (Number.isNaN(start.getTime()) || Number.isNaN(endExclusive.getTime())) throw new HttpError(400, "Invalid date");
    if (start >= endExclusive) throw new HttpError(400, "“From” date must be on or before the “To” date");
    const span = Math.round((endExclusive.getTime() - start.getTime()) / 86_400_000);
    if (span > MAX_DAYS) throw new HttpError(400, `Choose a range of ${MAX_DAYS} days or less`);

    const range = { createdAt: { $gte: start, $lt: endExclusive } };
    const paid = { ...range, paymentStatus: "paid" };

    const [byDay, byMethod, topItems, unpaid] = await Promise.all([
      Order.aggregate([
        { $match: paid },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: env.timezone } },
            orders: { $sum: 1 },
            revenue: { $sum: "$total" },
            discount: { $sum: "$discount" },
            tax: { $sum: "$tax" },
          },
        },
      ]),
      Order.aggregate([{ $match: paid }, { $group: { _id: "$paymentMethod", orders: { $sum: 1 }, revenue: { $sum: "$total" } } }]),
      Order.aggregate([
        { $match: paid },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            quantity: { $sum: "$items.quantity" },
            revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 10 },
      ]),
      Order.aggregate([{ $match: { ...range, paymentStatus: "unpaid" } }, { $group: { _id: null, orders: { $sum: 1 }, amount: { $sum: "$total" } } }]),
    ]);

    const map = new Map(byDay.map((d) => [d._id as string, d]));
    const days = [];
    for (let d = new Date(start); d < endExclusive; d.setDate(d.getDate() + 1)) {
      const key = dayKey(d);
      const row = map.get(key);
      days.push({
        date: key,
        orders: row?.orders ?? 0,
        revenue: round2(row?.revenue ?? 0),
        discount: round2(row?.discount ?? 0),
        tax: round2(row?.tax ?? 0),
      });
    }

    const orders = days.reduce((s, d) => s + d.orders, 0);
    const revenue = round2(days.reduce((s, d) => s + d.revenue, 0));
    const method = (m: string) => byMethod.find((x) => x._id === m);

    res.json({
      range: { from, to, days: span },
      totals: {
        orders,
        revenue,
        discount: round2(days.reduce((s, d) => s + d.discount, 0)),
        tax: round2(days.reduce((s, d) => s + d.tax, 0)),
        averageOrderValue: orders ? round2(revenue / orders) : 0,
        cash: { orders: method("cash")?.orders ?? 0, revenue: round2(method("cash")?.revenue ?? 0) },
        upi: { orders: method("upi")?.orders ?? 0, revenue: round2(method("upi")?.revenue ?? 0) },
        unpaid: { orders: unpaid[0]?.orders ?? 0, amount: round2(unpaid[0]?.amount ?? 0) },
      },
      days,
      topItems: topItems.map((t) => ({ name: t._id, quantity: t.quantity, revenue: round2(t.revenue) })),
    });
  })
);

export default router;
