import { VNPay, ignoreLogger, HashAlgorithm } from "vnpay";

type VnpayEnv = Partial<
    Record<"NODE_ENV" | "VNPAY_TMN_CODE" | "VNPAY_HASH_SECRET" | "VNPAY_HOST" | "VNPAY_TEST_MODE", string>
>;

export function resolveVnpayConfig(env: VnpayEnv = process.env) {
    const isProduction = env.NODE_ENV === "production";
    const tmnCode = env.VNPAY_TMN_CODE || (isProduction ? "" : "SANDBOX_TMN_CODE");
    const secureSecret = env.VNPAY_HASH_SECRET || (isProduction ? "" : "SANDBOX_HASH_SECRET");

    if (isProduction && (!tmnCode || !secureSecret)) {
        throw new Error("VNPAY_TMN_CODE and VNPAY_HASH_SECRET are required in production");
    }

    return {
        tmnCode,
        secureSecret,
        vnpayHost: env.VNPAY_HOST || "https://sandbox.vnpayment.vn",
        testMode: env.VNPAY_TEST_MODE ? env.VNPAY_TEST_MODE !== "false" : !isProduction,
    };
}

export function createVnpayInstance(env: VnpayEnv = process.env) {
    return new VNPay({
        ...resolveVnpayConfig(env),
        hashAlgorithm: HashAlgorithm.SHA512,
        enableLog: env.NODE_ENV !== "production",
        loggerFn: ignoreLogger,
    });
}

let cachedVnpayInstance: VNPay | null = null;

export function getVnpayInstance() {
    if (!cachedVnpayInstance) {
        cachedVnpayInstance = createVnpayInstance();
    }

    return cachedVnpayInstance;
}
