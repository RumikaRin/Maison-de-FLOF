import { VNPay, ignoreLogger, HashAlgorithm } from "vnpay";

export const vnpayInstance = new VNPay({
    tmnCode: process.env.VNPAY_TMN_CODE || "YOUR_TMN_CODE",
    secureSecret: process.env.VNPAY_HASH_SECRET || "YOUR_HASH_SECRET",
    vnpayHost: "https://sandbox.vnpayment.vn",
    testMode: true,
    hashAlgorithm: HashAlgorithm.SHA512,
    enableLog: true,
    loggerFn: ignoreLogger,
});
