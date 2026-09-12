/** Payment methods that must be PAID before fulfillment transitions. */
export const PREPAID_PAYMENT_METHODS = new Set(["TRANSFER", "VNPAY"]);

export function requiresPaidBeforeFulfillment(paymentMethod: string | null | undefined) {
  return PREPAID_PAYMENT_METHODS.has((paymentMethod || "").toUpperCase());
}

export function isOnlinePaymentMethod(paymentMethod: string | null | undefined) {
  return (paymentMethod || "").toUpperCase() === "VNPAY";
}

/** Default unpaid VNPay hold window (minutes) — demo-friendly. */
export function getUnpaidOrderTimeoutMinutes(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
) {
  const raw = Number(env.PAYMENT_UNPAID_TIMEOUT_MINUTES || "30");
  if (!Number.isFinite(raw) || raw < 5) return 30;
  return Math.min(raw, 24 * 60);
}
