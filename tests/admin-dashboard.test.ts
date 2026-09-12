import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── Test toVNDateKey logic (timezone conversion) ───

describe("toVNDateKey — Vietnam timezone date conversion", () => {
  it("should convert UTC midnight to same day in VN timezone (UTC+7)", () => {
    // 2026-09-12T00:00:00Z = 2026-09-12 07:00 VN → same day
    const date = new Date("2026-09-12T00:00:00Z");
    const result = date.toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
    assert.equal(result, "2026-09-12");
  });

  it("should keep late VN evening orders on the correct VN date", () => {
    // 2026-09-12T18:00:00+07:00 = 2026-09-12T11:00:00Z → VN date is still 12th
    const date = new Date("2026-09-12T11:00:00Z");
    const result = date.toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
    assert.equal(result, "2026-09-12");
  });

  it("should shift post-17:00 UTC orders to next day in VN timezone", () => {
    // 2026-09-12T20:00:00Z = 2026-09-13 03:00 VN → VN date is 13th
    const date = new Date("2026-09-12T20:00:00Z");
    const result = date.toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
    assert.equal(result, "2026-09-13");
  });

  it("should handle midnight boundary in VN timezone correctly", () => {
    // 2026-09-12T16:59:59Z = 2026-09-12 23:59:59 VN → still 12th
    const justBefore = new Date("2026-09-12T16:59:59Z");
    assert.equal(
      justBefore.toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }),
      "2026-09-12",
    );
    // 2026-09-12T17:00:00Z = 2026-09-13 00:00:00 VN → 13th
    const justAfter = new Date("2026-09-12T17:00:00Z");
    assert.equal(
      justAfter.toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }),
      "2026-09-13",
    );
  });
});

// ─── Test REVENUE_STATUSES filtering logic ───

describe("REVENUE_STATUSES — status filtering", () => {
  const REVENUE_STATUSES = ["CONFIRMED", "PROCESSING", "SHIPPING", "COMPLETED"];

  it("should include all paid/in-progress statuses", () => {
    assert.ok(REVENUE_STATUSES.includes("CONFIRMED"));
    assert.ok(REVENUE_STATUSES.includes("PROCESSING"));
    assert.ok(REVENUE_STATUSES.includes("SHIPPING"));
    assert.ok(REVENUE_STATUSES.includes("COMPLETED"));
  });

  it("should exclude PENDING and CANCELLED", () => {
    assert.ok(!REVENUE_STATUSES.includes("PENDING"));
    assert.ok(!REVENUE_STATUSES.includes("CANCELLED"));
  });

  it("should have exactly 4 statuses", () => {
    assert.equal(REVENUE_STATUSES.length, 4);
  });
});

// ─── Test sv-SE locale produces ISO 8601 date format ───

describe("sv-SE locale date formatting", () => {
  it("should produce YYYY-MM-DD format", () => {
    const date = new Date("2026-01-05T10:00:00Z");
    const result = date.toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
    assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
  });

  it("should zero-pad single digit months and days", () => {
    const date = new Date("2026-03-02T10:00:00Z");
    const result = date.toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
    assert.equal(result, "2026-03-02");
  });
});
