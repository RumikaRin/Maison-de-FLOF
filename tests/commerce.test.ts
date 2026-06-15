import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateCouponDiscount,
  calculateShippingFee,
  canTransitionOrderStatus,
  isCouponUsable,
} from "../src/lib/commerce.ts";

test("coupon percentage honors maximum discount", () => {
  assert.equal(
    calculateCouponDiscount(
      { type: "PERCENTAGE", value: 20, minSpend: 100_000, maxSpend: 50_000 },
      1_000_000,
    ),
    50_000,
  );
});

test("coupon never discounts more than subtotal", () => {
  assert.equal(
    calculateCouponDiscount(
      { type: "FIXED", value: 500_000, minSpend: 0, maxSpend: null },
      300_000,
    ),
    300_000,
  );
});

test("coupon availability enforces dates and usage limit", () => {
  const coupon = {
    type: "PERCENTAGE" as const,
    value: 10,
    minSpend: 100_000,
    maxSpend: null,
    isActive: true,
    startDate: new Date("2026-01-01T00:00:00Z"),
    endDate: new Date("2026-12-31T23:59:59Z"),
    usageLimit: 2,
    usageCount: 1,
  };
  assert.equal(isCouponUsable(coupon, 200_000, new Date("2026-06-09T00:00:00Z")), true);
  assert.equal(isCouponUsable({ ...coupon, usageCount: 2 }, 200_000, new Date("2026-06-09T00:00:00Z")), false);
});

test("shipping and order transition rules protect commerce flow", () => {
  assert.equal(calculateShippingFee(499_999), 50_000);
  assert.equal(calculateShippingFee(500_000), 0);
  assert.equal(canTransitionOrderStatus("PENDING", "CONFIRMED"), true);
  assert.equal(canTransitionOrderStatus("COMPLETED", "CANCELLED"), false);
});
