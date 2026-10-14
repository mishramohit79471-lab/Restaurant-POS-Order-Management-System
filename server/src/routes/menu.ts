import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { MenuItem } from "../models/MenuItem";
import { requireAuth, requireRole } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../utils/HttpError";

const router = Router();
router.use(requireAuth);

const serialize = (m: any) => ({
  id: String(m._id),
  name: m.name,
  description: m.description,
  category: m.category,
  price: m.price,
  available: m.available,
  active: m.active,
});

// POS view: active items only; unavailable ones are still returned so they show as sold out.
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const items = await MenuItem.find({ active: true }).sort({ category: 1, name: 1 }).lean();
    res.json({ items: items.map(serialize) });
  })
);

// Management view: includes deactivated items.
router.get(
  "/all",
  asyncHandler(async (_req, res) => {
    const items = await MenuItem.find().sort({ category: 1, name: 1 }).lean();
    res.json({ items: items.map(serialize) });
  })
);

const itemSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  category: z.string().trim().min(2, "Category is required").max(40),
  price: z.number({ message: "Price must be a number" }).min(0, "Price cannot be negative").max(100000),
  description: z.string().trim().max(200).optional().default(""),
});

router.post(
  "/",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const data = itemSchema.parse(req.body);
    const dup = await MenuItem.exists({ name: new RegExp(`^${data.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"), active: true });
    if (dup) throw new HttpError(409, `“${data.name}” is already on the menu`);
    const item = await MenuItem.create(data);
    res.status(201).json({ item: serialize(item) });
  })
);

const patchSchema = itemSchema.partial().extend({
  description: z.string().trim().max(200).optional(), // no default: an absent field must stay absent
  available: z.boolean().optional(),
  active: z.boolean().optional(),
});

// Staff may only flip availability (e.g. "sold out"); everything else is admin-only.
router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!isValidObjectId(id)) throw new HttpError(400, "Invalid menu item id");
    const data = patchSchema.parse(req.body);

    const onlyAvailability = Object.keys(data).every((k) => k === "available");
    if (req.user!.role !== "admin" && !onlyAvailability) {
      throw new HttpError(403, "Only admins can edit menu items");
    }
    if (Object.keys(data).length === 0) throw new HttpError(400, "Nothing to update");

    const item = await MenuItem.findByIdAndUpdate(id, { $set: data }, { returnDocument: "after" }).lean();
    if (!item) throw new HttpError(404, "Menu item not found");
    res.json({ item: serialize(item) });
  })
);

export default router;
