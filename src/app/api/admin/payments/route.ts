import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, apiErrorResponse, requirePermission } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";

const confirmPaymentSchema = z.object({
  paymentId: z.string().min(1),
  transactionCode: z.string().trim().min(3).max(120),
  action: z.enum(["CONFIRM", "REFUND"]).default("CONFIRM"),
});

export async function GET() {
  try {
    await requirePermission("ORDER_READ");
    const payments = await db.payment.findMany({
      include: {
        order: {
          select: {
            orderNumber: true,
            status: true,
            shippingName: true,
            shippingEmail: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return Response.json(
      payments.map((payment) => ({
        ...payment,
        amount: Number(payment.amount),
        createdAt: payment.createdAt.toISOString(),
        paidAt: payment.paidAt?.toISOString() || null,
      })),
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const staff = await requirePermission("PAYMENT_CONFIRM");
    const parsed = confirmPaymentSchema.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(400, "Thông tin đối soát không hợp lệ");

    const payment = await db.payment.findUnique({
      where: { id: parsed.data.paymentId },
      include: { order: true },
    });
    if (!payment) throw new ApiError(404, "Không tìm thấy thanh toán");
    if (payment.method !== "TRANSFER") {
      throw new ApiError(400, "Chỉ đối soát thủ công cho đơn chuyển khoản");
    }
    if (parsed.data.action === "REFUND") {
      if (payment.status === "REFUNDED") {
        return Response.json({ success: true, paymentStatus: payment.status });
      }
      if (payment.status !== "PAID") {
        throw new ApiError(409, "Chỉ có thể hoàn tiền cho thanh toán đã xác nhận");
      }
      await db.$transaction(async (tx) => {
        const refunded = await tx.payment.updateMany({
          where: { id: payment.id, status: "PAID" },
          data: {
            status: "REFUNDED",
            refundCode: parsed.data.transactionCode,
            refundedBy: staff.email,
            refundedAt: new Date(),
          },
        });
        if (refunded.count !== 1) {
          throw new ApiError(409, "Thanh toán vừa được xử lý bởi yêu cầu khác");
        }
        await createAuditLog(tx, {
          actor: staff,
          action: "PAYMENT_REFUNDED",
          entityType: "Payment",
          entityId: payment.id,
          beforeData: { status: payment.status },
          afterData: { status: "REFUNDED", refundCode: parsed.data.transactionCode },
        });
      });
      return Response.json({ success: true, paymentStatus: "REFUNDED", orderStatus: payment.order.status });
    }
    if (payment.order.status === "CANCELLED") {
      throw new ApiError(409, "Không thể xác nhận thanh toán cho đơn đã hủy");
    }
    if (payment.status === "PAID") {
      return Response.json({ success: true, paymentStatus: payment.status });
    }
    if (payment.status !== "PENDING") {
      throw new ApiError(409, `Không thể xác nhận thanh toán ở trạng thái ${payment.status}`);
    }

    const orderStatus = await db.$transaction(async (tx) => {
      const paid = await tx.payment.updateMany({
        where: { id: payment.id, status: "PENDING" },
        data: {
          status: "PAID",
          transactionCode: parsed.data.transactionCode,
          confirmedBy: staff.email,
          paidAt: new Date(),
        },
      });
      if (paid.count !== 1) {
        throw new ApiError(409, "Thanh toán vừa được xử lý bởi yêu cầu khác");
      }

      const confirmedOrder = await tx.order.updateMany({
        where: { id: payment.orderId, status: "PENDING" },
        data: { status: "CONFIRMED" },
      });
      if (confirmedOrder.count === 1) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            previousStatus: "PENDING",
            newStatus: "CONFIRMED",
            changedByEmail: staff.email,
            note: `Đã đối soát chuyển khoản ${parsed.data.transactionCode}`,
          },
        });
      }

      await createAuditLog(tx, {
        actor: staff,
        action: "PAYMENT_CONFIRMED",
        entityType: "Payment",
        entityId: payment.id,
        beforeData: { status: payment.status },
        afterData: {
          status: "PAID",
          transactionCode: parsed.data.transactionCode,
        },
      });
      return confirmedOrder.count === 1 ? "CONFIRMED" : payment.order.status;
    });

    return Response.json({ success: true, paymentStatus: "PAID", orderStatus });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
