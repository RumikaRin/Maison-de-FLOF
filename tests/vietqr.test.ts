import assert from "node:assert/strict";
import test from "node:test";
import { generateVietQrUrl, DEFAULT_VIETQR_CONFIG } from "../src/lib/vietqr.ts";

test("generates valid VietQR url with default bank configuration", () => {
  const url = generateVietQrUrl({
    amount: 1500000,
    orderNumber: "FLOF-ABC-123",
  });

  assert.ok(url.startsWith("https://img.vietqr.io/image/vietcombank-1028372615-compact2.png"));
  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get("amount"), "1500000");
  assert.equal(parsed.searchParams.get("addInfo"), "FLOF-ABC-123");
  assert.equal(parsed.searchParams.get("accountName"), DEFAULT_VIETQR_CONFIG.accountName);
});

test("supports custom bank parameters and rounds decimal amounts", () => {
  const url = generateVietQrUrl({
    bankId: "tcb",
    accountNo: "987654321",
    accountName: "CUSTOM SHOP",
    amount: 250000.75,
    orderNumber: "ORD-999",
  });

  assert.ok(url.startsWith("https://img.vietqr.io/image/tcb-987654321-compact2.png"));
  assert.ok(url.includes("amount=250001"));
  assert.ok(url.includes("addInfo=ORD-999"));
});
