import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ApiError, apiErrorResponse, requirePermission, requireUser } from "@/lib/api-auth";
import { orderStatusSchema } from "@/lib/order-validation";
import { canTransitionOrderStatus } from "@/lib/commerce";
import { sendOrderStatusEmail } from "@/lib/email";
import { createAuditLog } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  try {
    const user = await requireUser();
    const { orderNumber } = await params;
    const isStaff = user.role === "ADMIN" || user.role === "STAFF";
    const order = await db.order.findFirst({
      where: {
        orderNumber,
        customer: isStaff ? undefined : { user: { email: user.email } },
      },
      include: {
        customer: { include: { user: true } },
        address: true,
        items: { include: { paint: true } },
        statusHistory: { orderBy: { createdAt: "asc" } },
        payment: true,
      },
    });
    if (!order) throw new ApiError(404, "Không tìm thấy đơn hàng");

    return NextResponse.json({
      id: order.orderNumber,
      customer: order.shippingName || order.address?.fullName || order.customer.user.name,
      email: order.shippingEmail || order.customer.user.email,
      phone: order.shippingPhone || order.address?.phone || order.customer.user.phone,
      address: order.shippingAddress
        ? [order.shippingAddress, order.shippingDistrict, order.shippingProvince].filter(Boolean).join(", ")
        : order.address
          ? [order.address.addressLine1, order.address.addressLine2, order.address.district, order.address.province].filter(Boolean).join(", ")
          : "",
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      shippingFee: Number(order.shippingFee),
      total: Number(order.total),
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.payment?.status || "PENDING",
      paymentTransactionCode: order.payment?.transactionCode || "",
      note: order.note || "",
      items: order.items.map((item) => ({
        id: item.id,
        paintId: item.paintId,
        name: item.productName || item.paint.name,
        sku: item.productSku || item.paint.sku,
        colorName: item.colorName || "",
        colorCode: item.colorCode || "",
        quantity: item.quantity,
        price: Number(item.price),
        total: Number(item.total),
      })),
      statusHistory: order.statusHistory.map((history) => ({
        previousStatus: history.previousStatus,
        newStatus: history.newStatus,
        changedByEmail: history.changedByEmail,
        note: history.note || "",
        createdAt: history.createdAt.toISOString(),
      })),
      createdAt: order.createdAt.toISOString(),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  try {
    const staff = await requirePermission("ORDER_UPDATE");
    const parsed = orderStatusSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(400, "Trạng thái đơn hàng không hợp lệ");
    }

    const { orderNumber } = await params;
    const order = await db.order.findUnique({
      where: { orderNumber },
      include: { items: true, customer: { include: { user: true } }, payment: true },
    });
    if (!order) throw new ApiError(404, "Không tìm thấy đơn hàng");
    if (order.status === parsed.data.status) {
      return NextResponse.json({ success: true, status: order.status });
    }
    if (!canTransitionOrderStatus(order.status, parsed.data.status)) {
      throw new ApiError(
        409,
        `Không thể chuyển đơn hàng từ ${order.status} sang ${parsed.data.status}`,
      );
    }
    if (
      order.paymentMethod === "TRANSFER" &&
      parsed.data.status !== "CANCELLED" &&
      order.payment?.status !== "PAID"
    ) {
      throw new ApiError(409, "Đơn chuyển khoản phải được xác nhận thanh toán trước");
    }
    if (parsed.data.status === "CANCELLED" && order.payment?.status === "PAID") {
      throw new ApiError(409, "Phải hoàn tiền trước khi hủy đơn đã thanh toán");
    }

    await db.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: { id: order.id, status: order.status },
        data: { status: parsed.data.status },
      });
      if (updated.count !== 1) {
        throw new ApiError(409, "Đơn hàng vừa được cập nhật bởi yêu cầu khác");
      }

      if (parsed.data.status === "CANCELLED") {
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
            type: "ADJUSTMENT",
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
      }

      if (parsed.data.status === "COMPLETED") {
        await tx.customer.update({
          where: { id: order.customerId },
          data: { totalSpent: { increment: order.total } },
        });
        if (order.paymentMethod === "COD") {
          await tx.payment.updateMany({
            where: { orderId: order.id, status: "PENDING" },
            data: {
              status: "PAID",
              paidAt: new Date(),
              confirmedBy: staff.email,
            },
          });
        }
      }
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          previousStatus: order.status,
          newStatus: parsed.data.status,
          changedByEmail: staff.email,
        },
      });
      await createAuditLog(tx, {
        actor: staff,
        action: "ORDER_STATUS_CHANGED",
        entityType: "Order",
        entityId: order.id,
        beforeData: { status: order.status },
        afterData: { status: parsed.data.status },
      });
    });

    await sendOrderStatusEmail(order.customer.user.email, order.orderNumber, parsed.data.status);
    return NextResponse.json({ success: true, status: parsed.data.status });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
