import assert from "node:assert/strict";
import test from "node:test";
import { calculatePaint } from "../src/lib/paint-calculator.ts";
import { checkoutSchema } from "../src/lib/order-validation.ts";

test("paint calculator subtracts doors and windows and rounds liters up", () => {
  const result = calculatePaint({
    length: 5,
    width: 4,
    height: 3,
    doors: 1,
    windows: 1,
    coats: 2,
    coverage: 10,
  });
  assert.equal(result.totalArea, 51);
  assert.equal(result.litersNeeded, 11);
  assert.deepEqual(result.cans, { "1L": 11, "5L": 3, "18L": 1 });
});

test("checkout validation rejects empty orders and invalid shipping data", () => {
  const parsed = checkoutSchema.safeParse({
    items: [],
    paymentMethod: "COD",
    shipping: {
      fullName: "A",
      phone: "1",
      addressLine1: "",
      district: "",
      province: "",
    },
  });
  assert.equal(parsed.success, false);
});
