import assert from "node:assert/strict";
import test from "node:test";
import { isSafeAiBaseUrl } from "../src/lib/chat/ai-service.ts";
import {
  createOrderAccessToken,
  verifyOrderAccessToken,
} from "../src/lib/security/order-token.ts";
import { calculateCouponDiscount } from "../src/lib/commerce.ts";
import { VNPayService } from "../src/services/vnpay.service.ts";
import { deleteBlobImage } from "../src/lib/storage/blob-storage.ts";

test("order access token signs and verifies order ownership securely", () => {
  const token = createOrderAccessToken("order-123", "FLOF-2026-001");
  assert.ok(typeof token === "string" && token.length === 64);
  assert.equal(
    verifyOrderAccessToken("order-123", "FLOF-2026-001", token),
    true,
  );
  assert.equal(
    verifyOrderAccessToken("order-999", "FLOF-2026-001", token),
    false,
  );
  assert.equal(
    verifyOrderAccessToken("order-123", "FLOF-2026-002", token),
    false,
  );
  assert.equal(
    verifyOrderAccessToken("order-123", "FLOF-2026-001", "invalid-token"),
    false,
  );
  assert.equal(verifyOrderAccessToken("order-123", "FLOF-2026-001", ""), false);
});

test("isSafeAiBaseUrl prevents SSRF to internal metadata and invalid protocols", () => {
  assert.equal(isSafeAiBaseUrl("http://169.254.169.254/latest/meta-data"), false);
  assert.equal(isSafeAiBaseUrl("file:///etc/passwd"), false);
  assert.equal(isSafeAiBaseUrl("javascript:alert(1)"), false);
  assert.equal(isSafeAiBaseUrl("https://api.openai.com/v1"), true);
});

test("VNPayService creates payment URL with custom txnRef and parses orderId", () => {
  const service = new VNPayService();
  const url = service.createPaymentUrl({
    orderId: "order_abc",
    amount: 100000,
    ipAddr: "127.0.0.1",
    returnUrl: "http://localhost:3000/callback",
    orderInfo: "Test Order",
  });
  assert.ok(url.includes("vnp_TxnRef=order_abc_"));

  // Verify return with new format (orderId_timestamp)
  const resultWithTimestamp = service.verifyReturn({
    vnp_TxnRef: "order_abc_1710000000",
    vnp_Amount: "10000000",
    vnp_ResponseCode: "00",
    vnp_SecureHash: "mock",
  });
  assert.equal(resultWithTimestamp.orderId, "order_abc");

  // Verify return with legacy plain orderId
  const resultPlain = service.verifyReturn({
    vnp_TxnRef: "order_xyz",
    vnp_Amount: "5000000",
    vnp_ResponseCode: "00",
    vnp_SecureHash: "mock",
  });
  assert.equal(resultPlain.orderId, "order_xyz");
});

test("deleteBlobImage refuses deleting blobs outside flof/ prefix", async () => {
  await assert.rejects(
    () => deleteBlobImage("other-project/image.png"),
    /Cannot delete blob outside flof\/ folder/,
  );
  await assert.rejects(
    () => deleteBlobImage("malicious.png"),
    /Cannot delete blob outside flof\/ folder/,
  );
});

test("calculateCouponDiscount calculates correct discount amounts", () => {
  // Percentage with cap
  assert.equal(
    calculateCouponDiscount(
      { type: "PERCENTAGE", value: 10, minSpend: 100_000, maxSpend: 50_000 },
      1_000_000,
    ),
    50_000,
  );
  // Fixed discount
  assert.equal(
    calculateCouponDiscount(
      { type: "FIXED", value: 50_000, minSpend: 200_000, maxSpend: null },
      500_000,
    ),
    50_000,
  );
  // Below minSpend
  assert.equal(
    calculateCouponDiscount(
      { type: "FIXED", value: 50_000, minSpend: 200_000, maxSpend: null },
      150_000,
    ),
    0,
  );
});
