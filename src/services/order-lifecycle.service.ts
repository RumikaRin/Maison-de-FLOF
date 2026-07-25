import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api-auth";
import { canTransitionOrderStatus, type OrderStatusValue } from "@/lib/commerce";
import { writeOperationalLog } from "@/lib/operations/log";

type Tx = Prisma.TransactionClient;

type OrderWithItemsAndPayment = {
  id: string;
  orderNumber: string;
  status: OrderStatusValue;
  couponId: string | null;
  paymentMethod: string;
  items: Array<{ paintId: string; quantity: number }>;
  payment: { id: string; status: string; amount: Prisma.Decimal | number } | null;
};

/**
 * Restock inventory, reverse coupon usage, cancel pending payment, and mark order CANCELLED.
 * Uses conditional updates to stay safe under concurrent requests.
 */
export async function cancelOrderWithRestock(
  tx: Tx,
  order: OrderWithItemsAndPayment,
  options: { changedByEmail: string; note: string },
) {
  if (order.status === "CANCELLED") {
    return { alreadyCancelled: true as const };
  }
  if (!canTransitionOrderStatus(order.status, "CANCELLED")) {
    throw new ApiError(409, `Không thể hủy đơn ở trạng thái ${order.status}`);
  }

  const updated = await tx.order.updateMany({
    where: { id: order.id, status: order.status },
    data: { status: "CANCELLED" },
  });
  if (updated.count !== 1) {
    throw new ApiError(409, "Đơn hàng vừa được cập nhật bởi yêu cầu khác");
  }

  for (const item of order.items) {
    const decremented = await tx.paint.updateMany({
      where: { id: item.paintId, soldCount: { gte: item.quantity } },
      data: {
        stock: { increment: item.quantity },
        soldCount: { decrement: item.quantity },
      },
    });
    if (decremented.count === 0) {
      await tx.paint.update({
        where: { id: item.paintId },
        data: { stock: { increment: item.quantity } },
      });
    }
  }

  await tx.inventoryTransaction.createMany({
    data: order.items.map((item) => ({
      paintId: item.paintId,
      type: "ADJUSTMENT" as const,
      quantity: item.quantity,
      reason: `Hoàn kho do hủy đơn ${order.orderNumber}`,
      referenceId: order.id,
    })),
  });

  if (order.couponId) {
    await tx.coupon.updateMany({
      where: { id: order.couponId, usageCount: { gt: 0 } },
      data: { usageCount: { decrement: 1 } },
    });
  }

  await tx.payment.updateMany({
    where: { orderId: order.id, status: "PENDING" },
    data: { status: "CANCELLED" },
  });

  await tx.orderStatusHistory.create({
    data: {
      orderId: order.id,
      previousStatus: order.status,
      newStatus: "CANCELLED",
      changedByEmail: options.changedByEmail,
      note: options.note,
    },
  });

  return { alreadyCancelled: false as const };
}

/**
 * Mark payment PAID (if still PENDING), confirm order when still PENDING,
 * and optionally enqueue order confirmation email (for VNPay after pay).
 */
export async function markPaymentPaidAndConfirmOrder(options: {
  orderId: string;
  amount?: number;
  transactionCode?: string | null;
  confirmedBy?: string;
  enqueueConfirmationEmail?: boolean;
}) {
  const order = await db.order.findUnique({
    where: { id: options.orderId },
    include: {
      payment: true,
      customer: { include: { user: { select: { email: true, name: true } } } },
    },
  });

  if (!order) {
    return { ok: false as const, code: "ORDER_NOT_FOUND" as const };
  }
  if (!order.payment) {
    return { ok: false as const, code: "PAYMENT_NOT_FOUND" as const };
  }

  if (
    options.amount !== undefined &&
    Number(order.payment.amount) !== Number(options.amount)
  ) {
    return { ok: false as const, code: "INVALID_AMOUNT" as const };
  }

  if (order.payment.status === "PAID") {
    return {
      ok: true as const,
      alreadyPaid: true as const,
      orderStatus: order.status,
      paymentStatus: "PAID" as const,
    };
  }

  if (order.payment.status !== "PENDING") {
    return {
      ok: false as const,
      code: "INVALID_PAYMENT_STATUS" as const,
      paymentStatus: order.payment.status,
    };
  }

  if (order.status === "CANCELLED") {
    return { ok: false as const, code: "ORDER_CANCELLED" as const };
  }

  let transitionedToPaid = false;

  await db.$transaction(async (tx) => {
    const paid = await tx.payment.updateMany({
      where: { id: order.payment!.id, status: "PENDING" },
      data: {
        status: "PAID",
        transactionCode: options.transactionCode || order.payment!.transactionCode,
        paidAt: new Date(),
        confirmedBy: options.confirmedBy || order.payment!.confirmedBy,
      },
    });
    if (paid.count !== 1) {
      return;
    }
    transitionedToPaid = true;

    const confirmed = await tx.order.updateMany({
      where: { id: order.id, status: "PENDING" },
      data: { status: "CONFIRMED" },
    });

    if (confirmed.count === 1) {
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          previousStatus: "PENDING",
          newStatus: "CONFIRMED",
          changedByEmail: options.confirmedBy || "system:vnpay",
          note: options.transactionCode
            ? `Thanh toán thành công (${options.transactionCode})`
            : "Thanh toán thành công",
        },
      });
    }

    if (options.enqueueConfirmationEmail) {
      const email = order.shippingEmail || order.customer.user.email;
      const fullName = order.shippingName || order.customer.user.name || "Khách hàng";
      // Avoid duplicate mails when IPN and return URL race
      const existingEmail = await tx.emailOutbox.findFirst({
        where: {
          type: "ORDER_CONFIRMATION",
          payload: {
            path: ["orderNumber"],
            equals: order.orderNumber,
          },
        },
        select: { id: true },
      });
      if (!existingEmail) {
        await tx.emailOutbox.create({
          data: {
            type: "ORDER_CONFIRMATION",
            payload: {
              email,
              fullName,
              orderNumber: order.orderNumber,
              total: Number(order.total),
            },
          },
        });
      }
    }
  });

  const refreshed = await db.order.findUnique({
    where: { id: order.id },
    include: { payment: true },
  });

  if (refreshed?.payment?.status === "PAID") {
    return {
      ok: true as const,
      alreadyPaid: !transitionedToPaid,
      orderStatus: refreshed.status,
      paymentStatus: "PAID" as const,
    };
  }

  return {
    ok: false as const,
    code: "INVALID_PAYMENT_STATUS" as const,
    paymentStatus: refreshed?.payment?.status || order.payment.status,
  };
}

/**
 * Cancel expired unpaid online orders (VNPay demo holds) and restock.
 */
export async function expireUnpaidOnlineOrders(options?: {
  olderThanMinutes?: number;
  limit?: number;
}) {
  const olderThanMinutes = options?.olderThanMinutes ?? 30;
  const limit = options?.limit ?? 20;
  const cutoff = new Date(Date.now() - olderThanMinutes * 60_000);

  const candidates = await db.order.findMany({
    where: {
      status: "PENDING",
      paymentMethod: "VNPAY",
      createdAt: { lte: cutoff },
      payment: { status: "PENDING" },
    },
    include: {
      items: { select: { paintId: true, quantity: true } },
      payment: true,
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  const results: Array<{ orderId: string; orderNumber: string; status: string }> = [];

  for (const order of candidates) {
    try {
      await db.$transaction(async (tx) => {
        await cancelOrderWithRestock(
          tx,
          {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status as OrderStatusValue,
            couponId: order.couponId,
            paymentMethod: order.paymentMethod,
            items: order.items,
            payment: order.payment,
          },
          {
            changedByEmail: "system:cron",
            note: `Tự động hủy do quá hạn thanh toán VNPay (${olderThanMinutes} phút)`,
          },
        );
      });
      results.push({
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: "CANCELLED",
      });
    } catch {
      writeOperationalLog("error", "order.expiry.failed", {
        orderId: order.id,
        errorCode: "ORDER_EXPIRY_FAILED",
      });
      results.push({
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: "ERROR",
      });
    }
  }

  return { processed: results.length, results };
}
