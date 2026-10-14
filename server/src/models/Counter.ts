import { Schema, model } from "mongoose";

const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const Counter = model("Counter", counterSchema);

/**
 * Atomically returns the next number for a named sequence (safe under concurrent checkouts).
 * `currentMax` reports the highest number already in use; the counter is lifted to it first,
 * so it can never hand out a number that exists, even if the counter was reset or went stale.
 */
export async function nextSequence(name: string, currentMax: () => Promise<number>): Promise<number> {
  const max = await currentMax();
  try {
    await Counter.updateOne({ _id: name, seq: { $lt: max } }, { $set: { seq: max } }, { upsert: true });
  } catch (e) {
    // Duplicate key on upsert means the counter exists and is already >= max (or another request raced us).
    if ((e as { code?: number }).code !== 11000) throw e;
  }
  const doc = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true }
  );
  return doc!.seq;
}
