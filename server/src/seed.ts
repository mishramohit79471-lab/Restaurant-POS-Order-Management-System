import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDb } from "./config/db";
import { env } from "./config/env";
import { User } from "./models/User";
import { MenuItem } from "./models/MenuItem";
import { Order } from "./models/Order";
import { Counter } from "./models/Counter";

const menu = [
  ["Paneer Tikka", "Starters", 280], ["Veg Spring Rolls", "Starters", 180], ["Chicken 65", "Starters", 320],
  ["Hara Bhara Kebab", "Starters", 240], ["Butter Chicken", "Mains", 380], ["Dal Makhani", "Mains", 260],
  ["Paneer Butter Masala", "Mains", 320], ["Veg Biryani", "Mains", 290], ["Chicken Biryani", "Mains", 350],
  ["Garlic Naan", "Breads", 70], ["Butter Roti", "Breads", 40], ["Masala Dosa", "South Indian", 160],
  ["Margherita Pizza", "Pizza", 340], ["Peri Peri Fries", "Sides", 150], ["Gulab Jamun", "Desserts", 110],
  ["Brownie with Ice Cream", "Desserts", 190], ["Masala Chai", "Beverages", 50], ["Fresh Lime Soda", "Beverages", 90],
  ["Cold Coffee", "Beverages", 140], ["Mango Lassi", "Beverages", 120],
] as const;

const statuses = ["pending", "preparing", "ready", "completed"] as const;
const rnd = (n: number) => Math.floor(Math.random() * n);

async function seed() {
  await connectDb();
  await Promise.all([Counter.deleteMany({}), User.deleteMany({}), MenuItem.deleteMany({}), Order.deleteMany({})]);

  await User.create([
    { name: "Aarav Admin", email: "admin@dineflow.com", passwordHash: await bcrypt.hash("Admin@123", 10), role: "admin" },
    { name: "Sana Staff", email: "staff@dineflow.com", passwordHash: await bcrypt.hash("Staff@123", 10), role: "staff" },
  ]);

  const items = await MenuItem.create(
    menu.map(([name, category, price]) => ({ name, category, price, description: `${name} prepared fresh to order.` }))
  );

  const orders = [];
  let num = 1000;
  for (let day = 6; day >= 0; day--) {
    const count = day === 0 ? 14 : 10 + rnd(12);
    for (let i = 0; i < count; i++) {
      const lines = Array.from({ length: 1 + rnd(4) }, () => items[rnd(items.length)]);
      const orderItems = lines.map((m) => ({ menuItem: m._id, name: m.name, price: m.price, quantity: 1 + rnd(3) }));
      const subtotal = orderItems.reduce((s, l) => s + l.price * l.quantity, 0);
      const tax = Math.round(subtotal * env.taxRate * 100) / 100;
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - day);
      createdAt.setHours(11 + rnd(11), rnd(60), 0, 0);
      if (createdAt > new Date()) createdAt.setTime(Date.now() - rnd(3 * 3600_000));
      const status = day === 0 ? statuses[rnd(4)] : "completed";
      const dineIn = Math.random() > 0.35;
      orders.push({
        orderNumber: num++,
        type: dineIn ? "dine-in" : "takeaway",
        tableNumber: dineIn ? `T${1 + rnd(12)}` : undefined,
        items: orderItems, subtotal, discount: 0, tax, total: subtotal + tax, status,
        paymentMethod: status === "completed" ? (Math.random() > 0.5 ? "upi" : "cash") : undefined,
        paymentStatus: status === "completed" ? "paid" : "unpaid",
        createdAt, updatedAt: createdAt,
      });
    }
  }
  await Order.insertMany(orders);
  await Counter.create({ _id: "order", seq: num - 1 });
  console.log(`Seeded 2 users, ${items.length} menu items, ${orders.length} orders`);
  await mongoose.disconnect();
}

seed().catch((e) => { console.error(e.message); process.exit(1); });
