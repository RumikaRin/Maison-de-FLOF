import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ApiError, apiErrorResponse, requirePermission, requireUser } from "@/lib/api-auth";
import { orderStatusSchema } from "@/lib/order-validation";
import { canTransitionOrderStatus, type OrderStatusValue } from "@/lib/commerce";
import { sendOrderStatusEmail } from "@/lib/email";
import { createAuditLog } from "@/lib/audit";
import { requiresPaidBeforeFulfillment } from "@/lib/payment-policy";
import { cancelOrderWithRestock } from "@/services/order-lifecycle.service";
import { EmailDeliveryError } from "@/lib/email-delivery";

export async function GET(
  request: NextRequest,
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
    return apiErrorResponse(error, request);
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
    if (!canTransitionOrderStatus(order.status as OrderStatusValue, parsed.data.status)) {
      throw new ApiError(
        409,
        `Không thể chuyển đơn hàng từ ${order.status} sang ${parsed.data.status}`,
      );
    }

    // TRANSFER + VNPAY must be PAID before any fulfillment transition
    if (
      requiresPaidBeforeFulfillment(order.paymentMethod) &&
      parsed.data.status !== "CANCELLED" &&
      order.payment?.status !== "PAID"
    ) {
      throw new ApiError(
        409,
        "Đơn chuyển khoản/VNPay phải được xác nhận thanh toán trước khi xử lý",
      );
    }
    if (parsed.data.status === "CANCELLED" && order.payment?.status === "PAID") {
      throw new ApiError(409, "Phải hoàn tiền trước khi hủy đơn đã thanh toán");
    }

    await db.$transaction(async (tx) => {
      if (parsed.data.status === "CANCELLED") {
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
            changedByEmail: staff.email,
            note: "Hủy đơn bởi nhân viên",
          },
        );
      } else {
        const updated = await tx.order.updateMany({
          where: { id: order.id, status: order.status },
          data: { status: parsed.data.status },
        });
        if (updated.count !== 1) {
          throw new ApiError(409, "Đơn hàng vừa được cập nhật bởi yêu cầu khác");
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
      }

      await createAuditLog(tx, {
        actor: staff,
        action: "ORDER_STATUS_CHANGED",
        entityType: "Order",
        entityId: order.id,
        beforeData: { status: order.status },
        afterData: { status: parsed.data.status },
      });
    });

    try {
      await sendOrderStatusEmail(
        order.customer.user.email,
        order.orderNumber,
        parsed.data.status,
      );
    } catch (error) {
      console.error(
        "Order status email delivery failed:",
        error instanceof EmailDeliveryError ? error.code : "UNKNOWN_ERROR",
      );
    }
    return NextResponse.json({ success: true, status: parsed.data.status });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}
