import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

// env.ts validates variables at import time, so set them before loading billing.
process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/test";
process.env.JWT_SECRET ??= "test-secret";
process.env.TAX_RATE = "0.05";

let b: typeof import("./billing");
before(async () => {
  b = await import("./billing");
});

describe("round2", () => {
  it("rounds to 2 decimals without floating point drift", () => {
    assert.equal(b.round2(1.005), 1.01);
    assert.equal(b.round2(0.1 + 0.2), 0.3);
    assert.equal(b.round2(25.2), 25.2);
  });
});

describe("computeTotals", () => {
  it("adds tax to the subtotal when there is no discount", () => {
    assert.deepEqual(b.computeTotals(560), { subtotal: 560, discount: 0, taxRate: 0.05, tax: 28, total: 588 });
  });

  it("charges tax on the discounted amount", () => {
    const t = b.computeTotals(560, 56);
    assert.equal(t.tax, 25.2); // 5% of 504, not of 560
    assert.equal(t.total, 529.2);
  });

  it("handles a 100% discount", () => {
    const t = b.computeTotals(560, 560);
    assert.equal(t.tax, 0);
    assert.equal(t.total, 0);
  });

  it("rounds tax to the nearest paisa", () => {
    const t = b.computeTotals(99.99);
    assert.equal(t.tax, 5);
    assert.equal(t.total, 104.99);
  });

  it("rejects a discount larger than the subtotal", () => {
    assert.throws(() => b.computeTotals(100, 100.01), { status: 400 });
  });

  it("rejects a negative discount", () => {
    assert.throws(() => b.computeTotals(100, -1), { status: 400 });
  });
});

describe("resolveDiscount", () => {
  it("returns 0 for no discount", () => {
    assert.equal(b.resolveDiscount(560, { discountType: "none", discountValue: 50 }), 0);
    assert.equal(b.resolveDiscount(560, { discountType: "percent", discountValue: 0 }), 0);
  });

  it("calculates percentage discounts", () => {
    assert.equal(b.resolveDiscount(560, { discountType: "percent", discountValue: 10 }), 56);
    assert.equal(b.resolveDiscount(333, { discountType: "percent", discountValue: 7.5 }), 24.98);
  });

  it("passes flat amounts through, rounded", () => {
    assert.equal(b.resolveDiscount(560, { discountType: "amount", discountValue: 49.999 }), 50);
  });

  it("rejects percentages over 100", () => {
    assert.throws(() => b.resolveDiscount(560, { discountType: "percent", discountValue: 101 }), { status: 400 });
  });
});
