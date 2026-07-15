import assert from "node:assert/strict";
import test from "node:test";
import { canTransitionOrderStatus } from "../src/lib/commerce.ts";
import { hashCheckoutRequest, isValidIdempotencyKey } from "../src/lib/idempotency.ts";
import { hasPermission } from "../src/lib/permissions.ts";

test("checkout request hash is stable and changes with the payload", () => {
  const request = { items: [{ paintId: "paint-1", quantity: 1 }], paymentMethod: "COD" };
  assert.equal(hashCheckoutRequest(request), hashCheckoutRequest(request));
  assert.notEqual(hashCheckoutRequest(request), hashCheckoutRequest({ ...request, paymentMethod: "TRANSFER" }));
});

test("idempotency keys reject missing, short, and oversized values", () => {
  assert.equal(isValidIdempotencyKey(null), false);
  assert.equal(isValidIdempotencyKey("short"), false);
  assert.equal(isValidIdempotencyKey("checkout-key-123456789"), true);
  assert.equal(isValidIdempotencyKey("x".repeat(201)), false);
});

test("staff cannot mutate catalog, coupons, media deletion, or users", () => {
  assert.equal(hasPermission("STAFF", "ORDER_UPDATE"), true);
  assert.equal(hasPermission("STAFF", "PAYMENT_CONFIRM"), true);
  assert.equal(hasPermission("STAFF", "INVENTORY_IMPORT"), true);
  assert.equal(hasPermission("STAFF", "CATALOG_MANAGE"), false);
  assert.equal(hasPermission("STAFF", "COUPON_MANAGE"), false);
  assert.equal(hasPermission("STAFF", "MEDIA_DELETE"), false);
  assert.equal(hasPermission("STAFF", "USER_MANAGE"), false);
});

test("admin has all permissions and customers have none", () => {
  assert.equal(hasPermission("ADMIN", "USER_MANAGE"), true);
  assert.equal(hasPermission("ADMIN", "CATALOG_MANAGE"), true);
  assert.equal(hasPermission("CUSTOMER", "ORDER_READ"), false);
});

test("terminal order states cannot produce further side effects", () => {
  assert.equal(canTransitionOrderStatus("COMPLETED", "CANCELLED"), false);
  assert.equal(canTransitionOrderStatus("COMPLETED", "PROCESSING"), false);
  assert.equal(canTransitionOrderStatus("CANCELLED", "PENDING"), false);
  assert.equal(canTransitionOrderStatus("CANCELLED", "COMPLETED"), false);
});

test("pending orders can still be cancelled for unpaid VNPay timeout flow", () => {
  assert.equal(canTransitionOrderStatus("PENDING", "CANCELLED"), true);
  assert.equal(canTransitionOrderStatus("PENDING", "CONFIRMED"), true);
});
