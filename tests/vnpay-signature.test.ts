/**
 * Regression guard for the VNPay signature bypass.
 *
 * The gateway library returns two independent flags: `isVerified` (HMAC-SHA512
 * signature check) and `isSuccess` (response code == 00). The service used to
 * surface only `isSuccess`, so a forged callback carrying vnp_ResponseCode=00
 * with no valid signature would mark an order paid. This pins that both flags
 * are surfaced and that the callback routes gate on the signature.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = path.join(import.meta.dirname, "..");
const read = (p: string) => readFileSync(path.join(ROOT, p), "utf8");

test("the payment verification result carries the signature flag", () => {
  const iface = read("src/services/payment.service.ts");
  assert.match(iface, /isVerified:\s*boolean/, "PaymentVerificationResult must expose isVerified");
});

test("the VNPay service forwards isVerified from the library, not just isSuccess", () => {
  const service = read("src/services/vnpay.service.ts");
  const occurrences = service.match(/isVerified:\s*verify\.isVerified/g) ?? [];
  assert.equal(
    occurrences.length,
    2,
    "both verifyReturn and verifyIpn must forward verify.isVerified",
  );
});

test("the IPN route rejects an unverified signature before doing anything", () => {
  const ipn = read("src/app/api/vnpay/ipn/route.ts");
  // The signature guard must appear, and it must come before the paid mutation.
  const guardAt = ipn.indexOf("result.isVerified");
  // The call site, not the import line.
  const mutateAt = ipn.indexOf("await markPaymentPaidAndConfirmOrder");
  assert.ok(guardAt > 0, "IPN must check result.isVerified");
  assert.ok(mutateAt > 0 && guardAt < mutateAt, "the signature check must precede the payment mutation");
});

test("the return route requires a verified signature before marking paid", () => {
  const ret = read("src/app/api/vnpay/return/route.ts");
  assert.match(
    ret,
    /result\.isVerified\s*&&\s*result\.isSuccess/,
    "the return handler must require isVerified && isSuccess before mutating",
  );
});
