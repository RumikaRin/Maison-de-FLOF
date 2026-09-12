import { z } from "zod";

export const checkoutSchema = z.object({
  items: z.array(
    z.object({
      paintId: z.string().min(1),
      colorId: z.string().min(1).optional().nullable(),
      quantity: z.number().int().min(1).max(100),
    }),
  ).min(1).max(50),
  couponCode: z.string().trim().max(50).optional(),
  paymentMethod: z.enum(["COD", "TRANSFER", "VNPAY"]).default("COD"),
  note: z.string().trim().max(1000).optional(),
  shipping: z.object({
    fullName: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(8).max(20),
    addressLine1: z.string().trim().min(3).max(255),
    addressLine2: z.string().trim().max(255).optional(),
    district: z.string().trim().min(2).max(120),
    province: z.string().trim().min(2).max(120),
  }),
});

export const orderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPING",
    "COMPLETED",
    "CANCELLED",
  ]),
});

export const couponValidationSchema = z.object({
  code: z.string().trim().min(1).max(50),
  subtotal: z.number().nonnegative(),
});
