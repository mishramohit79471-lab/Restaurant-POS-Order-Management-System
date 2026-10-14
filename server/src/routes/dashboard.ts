import { Router } from "express";
import { env } from "../config/env";
import { Order } from "../models/Order";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(requireAuth);

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const today = startOfDay(new Date());
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6);

    const [todayAgg, salesByDay, popular, recent] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: today } } },
        { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: weekStart } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: env.timezone } },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: weekStart } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            quantity: { $sum: "$items.quantity" },
            revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 5 },
      ]),
      Order.find().sort({ createdAt: -1 }).limit(6).lean(),
    ]);

    const t = todayAgg[0] ?? { revenue: 0, orders: 0 };

    // Fill missing days so the chart always has 7 points.
    const map = new Map(salesByDay.map((d) => [d._id as string, d]));
    const sales = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const key = dayKey(d);
      const row = map.get(key);
      return { date: key, revenue: row?.revenue ?? 0, orders: row?.orders ?? 0 };
    });

    res.json({
      today: {
        revenue: t.revenue,
        orders: t.orders,
        averageOrderValue: t.orders ? Math.round((t.revenue / t.orders) * 100) / 100 : 0,
      },
      sales,
      popularDishes: popular.map((p) => ({ name: p._id, quantity: p.quantity, revenue: p.revenue })),
      recentOrders: recent.map((o) => ({
        id: String(o._id),
        orderNumber: o.orderNumber,
        type: o.type,
        tableNumber: o.tableNumber,
        total: o.total,
        status: o.status,
        itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
        createdAt: o.createdAt,
      })),
    });
  })
);

export default router;
