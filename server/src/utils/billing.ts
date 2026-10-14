import { isValidObjectId } from "mongoose";
import { MenuItem } from "../models/MenuItem";
import { env } from "../config/env";
import { HttpError } from "./HttpError";

export interface CartLine {
  menuItemId: string;
  quantity: number;
}

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * The single source of truth for prices and totals. Client-supplied prices are never
 * trusted: every line is re-priced from the database. Tax is applied after discount.
 */
export async function priceCart(lines: CartLine[], discount = 0) {
  const ids = [...new Set(lines.map((l) => l.menuItemId))];
  if (ids.some((id) => !isValidObjectId(id))) throw new HttpError(400, "Invalid menu item in cart");

  const found = await MenuItem.find({ _id: { $in: ids } }).lean();
  const byId = new Map(found.map((m) => [String(m._id), m]));

  const merged = new Map<string, number>();
  for (const l of lines) merged.set(l.menuItemId, (merged.get(l.menuItemId) ?? 0) + l.quantity);

  const items = [...merged].map(([id, quantity]) => {
    const m = byId.get(id);
    if (!m || !m.active) throw new HttpError(400, "An item in your cart is no longer on the menu");
    if (!m.available) throw new HttpError(409, `${m.name} is currently unavailable`);
    return { menuItem: m._id, name: m.name, price: m.price, quantity, lineTotal: round2(m.price * quantity) };
  });

  const subtotal = round2(items.reduce((s, i) => s + i.lineTotal, 0));
  return { items, ...computeTotals(subtotal, discount) };
}

/** Tax is charged on the discounted amount. */
export function computeTotals(subtotal: number, discount = 0) {
  if (discount < 0 || discount > subtotal) throw new HttpError(400, "Discount cannot exceed the subtotal");
  const taxable = round2(subtotal - discount);
  const tax = round2(taxable * env.taxRate);
  return { subtotal, discount: round2(discount), taxRate: env.taxRate, tax, total: round2(taxable + tax) };
}

export type DiscountInput = { discountType: "none" | "percent" | "amount"; discountValue: number };

export function resolveDiscount(subtotal: number, { discountType, discountValue }: DiscountInput) {
  if (discountType === "none" || !discountValue) return 0;
  if (discountType === "percent") {
    if (discountValue > 100) throw new HttpError(400, "Discount cannot exceed 100%");
    return round2((subtotal * discountValue) / 100);
  }
  return round2(discountValue);
}
