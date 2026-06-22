import assert from "node:assert/strict";
import test from "node:test";
import { resolveVnpayConfig } from "../src/lib/vnpay.ts";

test("VNPay config rejects missing production credentials", () => {
  assert.throws(
    () =>
      resolveVnpayConfig({
        NODE_ENV: "production",
        VNPAY_TMN_CODE: "",
        VNPAY_HASH_SECRET: "",
      }),
    /VNPAY_TMN_CODE and VNPAY_HASH_SECRET/,
  );
});

test("VNPay config uses sandbox by default outside production", () => {
  const config = resolveVnpayConfig({ NODE_ENV: "development" });
  assert.equal(config.tmnCode, "SANDBOX_TMN_CODE");
  assert.equal(config.secureSecret, "SANDBOX_HASH_SECRET");
  assert.equal(config.vnpayHost, "https://sandbox.vnpayment.vn");
  assert.equal(config.testMode, true);
});

test("VNPay config supports explicit production host", () => {
  const config = resolveVnpayConfig({
    NODE_ENV: "production",
    VNPAY_TMN_CODE: "real-tmn",
    VNPAY_HASH_SECRET: "real-secret",
    VNPAY_HOST: "https://pay.vnpay.vn",
    VNPAY_TEST_MODE: "false",
  });
  assert.equal(config.tmnCode, "real-tmn");
  assert.equal(config.secureSecret, "real-secret");
  assert.equal(config.vnpayHost, "https://pay.vnpay.vn");
  assert.equal(config.testMode, false);
});
