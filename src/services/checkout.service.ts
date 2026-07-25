import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api-auth";
import { checkoutSchema } from "@/lib/order-validation";
import {
  calculateCouponDiscount,
  calculateShippingFee,
  isCouponUsable,
} from "@/lib/commerce";
import { hashCheckoutRequest, isValidIdempotencyKey } from "@/lib/idempotency";
import { z } from "zod";
import { paymentService } from "./vnpay.service";

type CheckoutDependencies = {
  database?: typeof db;
};

export async function processCheckout(
  input: z.infer<typeof checkoutSchema>,
  sessionUser: { id: string; email: string },
  idempotencyKey: string | null,
  ipAddr: string = "127.0.0.1",
  returnUrl: string = "",
  dependencies: CheckoutDependencies = {},
) {
  const database = dependencies.database ?? db;

  if (!isValidIdempotencyKey(idempotencyKey)) {
    throw new ApiError(400, "Thiếu hoặc sai Idempotency-Key");
  }

  const requestHash = hashCheckoutRequest(input);
  
  // 1. Check Idempotency
  const existingIdempotency = await database.checkoutIdempotency.findUnique({
    where: { key: idempotencyKey! },
  });

  if (existingIdempotency) {
    if (
      existingIdempotency.userId !== sessionUser.id ||
      existingIdempotency.requestHash !== requestHash
    ) {
      throw new ApiError(409, "Idempotency-Key đã được sử dụng cho yêu cầu khác");
    }
    if (!existingIdempotency.orderId) {
      throw new ApiError(409, "Yêu cầu đặt hàng đang được xử lý");
    }
    // Return existing order ID to caller to serialize
    return { existingOrderId: existingIdempotency.orderId };
  }

  // 2. Validate Products & Stock
  const requestedPaintIds = [...new Set(input.items.map((item: any) => item.paintId))];
  const paints = await database.paint.findMany({
    where: { id: { in: requestedPaintIds as string[] }, isActive: true },
    include: { colors: { include: { color: true } } },
  });
  const paintMap = new Map(paints.map((paint) => [paint.id, paint]));

  if (paints.length !== requestedPaintIds.length) {
    throw new ApiError(400, "Một hoặc nhiều sản phẩm không còn tồn tại");
  }

  const orderItems = input.items.map((item: any) => {
    const paint = paintMap.get(item.paintId);
    if (!paint) throw new ApiError(400, "Sản phẩm không hợp lệ");
    if (item.colorId && !paint.colors.some((link) => link.colorId === item.colorId)) {
      throw new ApiError(400, `Màu đã chọn không áp dụng cho ${paint.name}`);
    }

    const price = Math.round(
      Number(paint.price) * (1 - (paint.discountPercent || 0) / 100),
    );
    const selectedColor = item.colorId
      ? paint.colors.find((link) => link.colorId === item.colorId)?.color
      : null;
    return {
      paintId: paint.id,
      colorId: item.colorId || null,
      productName: paint.name,
      productSku: paint.sku,
      colorName: selectedColor?.name || null,
      colorCode: selectedColor?.code || null,
      quantity: item.quantity,
      price,
      total: price * item.quantity,
    };
  });

  const stockByPaint: Record<string, number> = orderItems.reduce((result: Record<string, number>, item: any) => {
    result[item.paintId] = (result[item.paintId] || 0) + item.quantity;
    return result;
  }, {} as Record<string, number>);
  
  // 3. Calculate Totals & Discounts
  const subtotal = orderItems.reduce((sum: number, item: any) => sum + item.total, 0);
  const normalizedCouponCode = input.couponCode?.trim().toUpperCase();
  const now = new Date();
  
  const coupon = normalizedCouponCode
    ? await database.coupon.findUnique({ where: { code: normalizedCouponCode } })
    : null;

  if (normalizedCouponCode && !isCouponUsable(coupon, subtotal, now)) {
    throw new ApiError(400, "Mã giảm giá không hợp lệ hoặc đã hết hạn");
  }

  const discount = calculateCouponDiscount(coupon, subtotal);
  const shippingFee = calculateShippingFee(subtotal);
  const total = subtotal - discount + shippingFee;
  const orderNumber = `FLOF-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

  // 4. Transaction: create order, update stock, save idempotency
  let txResult: { orderId: string; orderNumber: string; total: number };
  try {
    txResult = await database.$transaction(async (tx) => {
      await tx.checkoutIdempotency.create({
      data: {
        key: idempotencyKey!,
        userId: sessionUser.id,
        requestHash,
      },
    });

    const user = await tx.user.findUnique({
      where: { email: sessionUser.email },
      include: { customer: true },
    });
    if (!user) throw new ApiError(404, "Không tìm thấy tài khoản");

    const customer =
      user.customer ||
      (await tx.customer.create({ data: { userId: user.id } }));

    for (const [paintId, quantity] of Object.entries(stockByPaint)) {
      const updated = await tx.paint.updateMany({
        where: { id: paintId, isActive: true, stock: { gte: quantity } },
        data: { stock: { decrement: quantity }, soldCount: { increment: quantity } },
      });
      if (updated.count !== 1) {
        const paintName = paintMap.get(paintId)?.name || paintId;
        throw new ApiError(409, `Sản phẩm "${paintName}" không đủ tồn kho`);
      }
    }

    const order = await tx.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        status: "PENDING",
        subtotal,
        discount,
        shippingFee,
        total,
        couponId: coupon?.id,
        note: input.note || "",
        paymentMethod: input.paymentMethod,
        shippingName: input.shipping.fullName,
        shippingPhone: input.shipping.phone,
        shippingEmail: user.email,
        shippingAddress: [input.shipping.addressLine1, input.shipping.addressLine2]
          .filter(Boolean)
          .join(", "),
        shippingDistrict: input.shipping.district,
        shippingProvince: input.shipping.province,
        items: { create: orderItems },
        statusHistory: {
          create: {
            newStatus: "PENDING",
            changedByEmail: sessionUser.email,
            note: "Đơn hàng được tạo",
          },
        },
        payment: {
          create: {
            method: input.paymentMethod,
            status: "PENDING",
            amount: total,
          },
        },
      },
    });

    await tx.checkoutIdempotency.update({
      where: { key: idempotencyKey! },
      data: { orderId: order.id },
    });

    await tx.inventoryTransaction.createMany({
      data: Object.entries(stockByPaint).map(([paintId, quantity]) => ({
        paintId,
        type: "EXPORT",
        quantity: -quantity,
        reason: `Xuất kho cho đơn hàng ${orderNumber}`,
        referenceId: order.id,
        referenceType: "ORDER",
      })),
    });

    if (coupon) {
      const updatedCoupon =
        coupon.usageLimit === null
          ? await tx.coupon.update({
              where: { id: coupon.id },
              data: { usageCount: { increment: 1 } },
            })
          : await tx.coupon.updateMany({
              where: { id: coupon.id, usageCount: { lt: Number(coupon.usageLimit) } },
              data: { usageCount: { increment: 1 } },
            });
      if ("count" in updatedCoupon && updatedCoupon.count !== 1) {
        throw new ApiError(409, "Mã giảm giá vừa hết lượt sử dụng");
      }
    }

    const staffs = await tx.user.findMany({ where: { role: { type: { in: ["ADMIN", "STAFF"] } } }, select: { id: true } });
    if (staffs.length > 0) {
      const notifications = [];
      notifications.push(...staffs.map((s) => ({
        userId: s.id,
        type: "ORDER" as const,
        title: "Đơn hàng mới",
        message: `Khách hàng ${input.shipping.fullName} vừa đặt đơn hàng ${orderNumber} trị giá ${Number(total).toLocaleString("vi-VN")}đ.`,
      })));

      for (const [paintId, qty] of Object.entries(stockByPaint)) {
        const paint = paintMap.get(paintId);
        if (paint && paint.stock - qty <= paint.minStock) {
           notifications.push(...staffs.map((s) => ({
             userId: s.id,
             type: "STOCK" as const,
             title: "Cảnh báo tồn kho",
             message: `Sản phẩm ${paint.name} (SKU: ${paint.sku}) sắp hết hàng (còn ${paint.stock - qty} SP).`,
           })));
        }
      }

      await tx.notification.createMany({ data: notifications });
    }

    // COD / TRANSFER: confirm receipt immediately.
    // VNPAY: wait until payment is PAID (IPN/return) before emailing.
    if (input.paymentMethod !== "VNPAY") {
      await tx.emailOutbox.create({
        data: {
          type: "ORDER_CONFIRMATION",
          payload: {
            email: sessionUser.email,
            fullName: input.shipping.fullName,
            orderNumber,
            total: Number(total),
          },
        },
      });
    }

      return { orderId: order.id, orderNumber: order.orderNumber, total: Number(total) };
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const concurrent = await database.checkoutIdempotency.findUnique({
        where: { key: idempotencyKey! },
      });
      if (
        concurrent?.userId === sessionUser.id &&
        concurrent.requestHash === requestHash &&
        concurrent.orderId
      ) {
        return { existingOrderId: concurrent.orderId };
      }
    }
    throw error;
  }

  let paymentUrl: string | undefined;

  if (input.paymentMethod === "VNPAY") {
    paymentUrl = paymentService.createPaymentUrl({
      orderId: txResult.orderId,
      amount: txResult.total,
      ipAddr,
      returnUrl,
      orderInfo: `Thanh toan don hang ${txResult.orderNumber}`,
    });
  }

  return { newOrderId: txResult.orderId, paymentUrl };
}
