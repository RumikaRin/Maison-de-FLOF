import assert from "node:assert/strict";
import test from "node:test";
import {
  getUnpaidOrderTimeoutMinutes,
  isOnlinePaymentMethod,
  requiresPaidBeforeFulfillment,
} from "../src/lib/payment-policy.ts";
import { isPasswordStrong, passwordSchema } from "../src/lib/password-policy.ts";
import {
  hashResetToken,
  passwordResetIdentifier,
} from "../src/lib/password-reset-token.ts";
import { getRateLimitPolicy } from "../src/lib/security/rate-limit-policy.ts";

test("prepaid methods include TRANSFER and VNPAY but not COD", () => {
  assert.equal(requiresPaidBeforeFulfillment("TRANSFER"), true);
  assert.equal(requiresPaidBeforeFulfillment("VNPAY"), true);
  assert.equal(requiresPaidBeforeFulfillment("vnpay"), true);
  assert.equal(requiresPaidBeforeFulfillment("COD"), false);
  assert.equal(isOnlinePaymentMethod("VNPAY"), true);
  assert.equal(isOnlinePaymentMethod("TRANSFER"), false);
});

test("unpaid order timeout has safe bounds", () => {
  assert.equal(getUnpaidOrderTimeoutMinutes({}), 30);
  assert.equal(getUnpaidOrderTimeoutMinutes({ PAYMENT_UNPAID_TIMEOUT_MINUTES: "45" }), 45);
  assert.equal(getUnpaidOrderTimeoutMinutes({ PAYMENT_UNPAID_TIMEOUT_MINUTES: "1" }), 30);
  assert.equal(getUnpaidOrderTimeoutMinutes({ PAYMENT_UNPAID_TIMEOUT_MINUTES: "99999" }), 24 * 60);
});

test("password policy requires letter and digit", () => {
  assert.equal(isPasswordStrong("short"), false);
  assert.equal(isPasswordStrong("onlyletters"), false);
  assert.equal(isPasswordStrong("12345678"), false);
  assert.equal(isPasswordStrong("Password1"), true);
  assert.equal(passwordSchema.safeParse("Abcd1234").success, true);
});

test("password reset helpers are stable", () => {
  assert.equal(passwordResetIdentifier("  User@Example.COM "), "password-reset:user@example.com");
  assert.equal(hashResetToken("abc"), hashResetToken("abc"));
  assert.notEqual(hashResetToken("abc"), hashResetToken("xyz"));
});

test("rate limit policy covers password reset endpoints", () => {
  assert.equal(getRateLimitPolicy("/api/auth/forgot-password")?.limiter, "auth");
  assert.equal(getRateLimitPolicy("/api/auth/reset-password")?.limiter, "auth");
  assert.equal(getRateLimitPolicy("/api/auth/register")?.limiter, "auth");
});
