import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateCartWeightKg,
  detectRegion,
  calculateCarrierQuotes,
} from "../src/lib/logistics-calculator.ts";

test("calculateCartWeightKg calculates weight based on volume and density", () => {
  const items = [
    { paint: { volume: 5 }, quantity: 2 }, // 5 * 1.3 * 2 = 13kg
    { paint: { volume: 1 }, quantity: 3 }, // 1 * 1.3 * 3 = 3.9kg
  ];
  const weight = calculateCartWeightKg(items);
  assert.equal(weight, 16.9);
});

test("detectRegion distinguishes intra-city, intra-region, and inter-region", () => {
  assert.equal(detectRegion("Thành phố Hà Nội"), "INTRA_CITY");
  assert.equal(detectRegion("Ha Noi"), "INTRA_CITY");
  assert.equal(detectRegion("Tỉnh Hải Dương"), "INTRA_REGION");
  assert.equal(detectRegion("Thành phố Hải Phòng"), "INTRA_REGION");
  assert.equal(detectRegion("Thành phố Hồ Chí Minh"), "INTER_REGION");
  assert.equal(detectRegion("Tỉnh Bình Dương"), "INTER_REGION");
});

test("calculateCarrierQuotes returns quotes for all 3 carriers sorted by price", () => {
  const items = [{ paint: { volume: 1 }, quantity: 1 }]; // ~1.3kg <= 3kg base
  const result = calculateCarrierQuotes(items, "Thành phố Hà Nội");

  assert.equal(result.quotes.length, 3);
  const carrierIds = result.quotes.map((q) => q.carrierId);
  assert.ok(carrierIds.includes("GHTK"));
  assert.ok(carrierIds.includes("GHN"));
  assert.ok(carrierIds.includes("VIETTEL_POST"));

  // Check intra-city base rates for <=3kg: VTP (20k), GHTK (22k), GHN (24k)
  const vtp = result.quotes.find((q) => q.carrierId === "VIETTEL_POST")!;
  const ghtk = result.quotes.find((q) => q.carrierId === "GHTK")!;
  const ghn = result.quotes.find((q) => q.carrierId === "GHN")!;

  assert.equal(vtp.estimatedFee, 20000);
  assert.equal(ghtk.estimatedFee, 22000);
  assert.equal(ghn.estimatedFee, 24000);

  // Sorted ascending by price
  assert.equal(result.cheapestCarrierId, "VIETTEL_POST");
  assert.equal(result.quotes[0].carrierId, "VIETTEL_POST");
});

test("calculateCarrierQuotes scales with heavy freight for distant inter-region delivery", () => {
  const items = [{ paint: { volume: 18 }, quantity: 2 }]; // 18 * 1.3 * 2 = 46.8kg -> ~47kg
  const result = calculateCarrierQuotes(items, "Thành phố Hồ Chí Minh");

  assert.equal(result.regionType, "INTER_REGION");
  assert.ok(result.totalWeightKg > 40);

  result.quotes.forEach((q) => {
    assert.ok(q.estimatedFee > 40000);
    assert.ok(q.estimatedDays.length > 0);
    assert.equal(q.isApiReady, false);
  });
});
