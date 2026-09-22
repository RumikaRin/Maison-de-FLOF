export type CouponInput = {
  type: "PERCENTAGE" | "FIXED";
  value: number | string | { toString(): string };
  minSpend: number | string | { toString(): string };
  maxSpend: number | string | { toString(): string } | null;
};

export type CouponAvailability = CouponInput & {
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  usageLimit: number | null;
  usageCount: number;
};

export type OrderStatusValue =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPING"
  | "COMPLETED"
  | "CANCELLED";

export const FREE_SHIPPING_THRESHOLD = 500_000;
export const DEFAULT_SHIPPING_FEE = 50_000;

const allowedTransitions: Record<OrderStatusValue, OrderStatusValue[]> = {
  PENDING: ["CONFIRMED", "PROCESSING", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPING", "COMPLETED", "CANCELLED"],
  SHIPPING: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function calculateCouponDiscount(coupon: CouponInput | null, subtotal: number) {
  if (!coupon || subtotal < Number(coupon.minSpend)) return 0;
  const rawDiscount =
    coupon.type === "PERCENTAGE"
      ? subtotal * (Number(coupon.value) / 100)
      : Number(coupon.value);
  const cappedDiscount =
    coupon.maxSpend === null ? rawDiscount : Math.min(rawDiscount, Number(coupon.maxSpend));
  return Math.min(subtotal, Math.max(0, Math.round(cappedDiscount)));
}

export function isCouponUsable(coupon: CouponAvailability | null, subtotal: number, now = new Date()) {
  return Boolean(
    coupon &&
      coupon.isActive &&
      coupon.startDate <= now &&
      coupon.endDate >= now &&
      subtotal >= Number(coupon.minSpend) &&
      (coupon.usageLimit === null || coupon.usageCount < coupon.usageLimit),
  );
}

export function calculateShippingFee(subtotal: number) {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;
}

export function canTransitionOrderStatus(from: OrderStatusValue, to: OrderStatusValue) {
  return from === to || allowedTransitions[from].includes(to);
}
