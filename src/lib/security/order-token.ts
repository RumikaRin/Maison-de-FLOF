import crypto from "crypto";

export function createOrderAccessToken(orderId: string, orderNumber: string): string {
  const secret = process.env.AUTH_SECRET || "flof-order-token-fallback-key";
  return crypto.createHmac("sha256", secret).update(`${orderId}:${orderNumber}`).digest("hex");
}

export function verifyOrderAccessToken(orderId: string, orderNumber: string, token: string): boolean {
  if (!token || typeof token !== "string") return false;
  try {
    const expected = createOrderAccessToken(orderId, orderNumber);
    if (token.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}
