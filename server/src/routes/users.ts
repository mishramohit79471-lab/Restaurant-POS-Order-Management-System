import { Router } from "express";
import bcrypt from "bcryptjs";
import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { User } from "../models/User";
import { requireAuth, requireRole } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../utils/HttpError";

const router = Router();
router.use(requireAuth, requireRole("admin"));

const serialize = (u: any) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  role: u.role,
  active: u.active,
  createdAt: u.createdAt,
});

const password = z.string().min(8, "Password must be at least 8 characters").max(72);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const users = await User.find().sort({ createdAt: 1 }).lean();
    res.json({ users: users.map(serialize) });
  })
);

const createSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password,
  role: z.enum(["admin", "staff"]),
});

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { password: pw, ...data } = createSchema.parse(req.body);
    if (await User.exists({ email: data.email })) throw new HttpError(409, "A user with this email already exists");
    const user = await User.create({ ...data, passwordHash: await bcrypt.hash(pw, 10) });
    res.status(201).json({ user: serialize(user) });
  })
);

const patchSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60).optional(),
  role: z.enum(["admin", "staff"]).optional(),
  active: z.boolean().optional(),
  password: password.optional(),
});

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!isValidObjectId(id)) throw new HttpError(400, "Invalid user id");
    const { password: pw, ...data } = patchSchema.parse(req.body);

    // Prevents an admin from locking everyone out of user management.
    if (id === req.user!.id && (data.role === "staff" || data.active === false)) {
      throw new HttpError(400, "You can't deactivate or demote your own account");
    }

    const update: Record<string, unknown> = { ...data };
    if (pw) update.passwordHash = await bcrypt.hash(pw, 10);
    if (Object.keys(update).length === 0) throw new HttpError(400, "Nothing to update");

    const user = await User.findByIdAndUpdate(id, { $set: update }, { returnDocument: "after" }).lean();
    if (!user) throw new HttpError(404, "User not found");
    res.json({ user: serialize(user) });
  })
);

export default router;
