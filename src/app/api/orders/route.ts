import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { apiErrorResponse, requireUser } from "@/lib/api-auth";
import { checkoutSchema } from "@/lib/order-validation";
import { processCheckout } from "@/services/checkout.service";
import { getClientIp } from "@/lib/ip";

async function serializeOrders(
  orders: Awaited<ReturnType<typeof getOrders>>,
) {
  const colorIds = orders.flatMap((order) =>
    order.items.flatMap((item) => (item.colorId ? [item.colorId] : [])),
  );
  const colors = colorIds.length
    ? await db.paintColor.findMany({
        where: { id: { in: [...new Set(colorIds)] } },
        select: { id: true, code: true, name: true },
      })
    : [];
  const colorMap = new Map(colors.map((color) => [color.id, color]));

  return orders.map((order) => {
    const structuredItems = order.items.map((item) => {
      const color = item.colorId ? colorMap.get(item.colorId) : undefined;
      return {
        id: item.id,
        paintId: item.paintId,
        name: item.productName || item.paint.name,
        sku: item.productSku || item.paint.sku,
        color:
          item.colorName && item.colorCode
            ? `${item.colorName} (${item.colorCode})`
            : color
              ? `${color.name} (${color.code})`
              : "",
        quantity: item.quantity,
        price: Number(item.price),
        total: Number(item.total),
      };
    });

    return {
      id: order.orderNumber,
      date: order.createdAt.toISOString().split("T")[0],
      userEmail: order.customer.user.email,
      customer: order.shippingName || order.address?.fullName || order.customer.user.name || "Khách hàng",
      phone: order.shippingPhone || order.address?.phone || order.customer.user.phone || "",
      address: order.shippingAddress
        ? [order.shippingAddress, order.shippingDistrict, order.shippingProvince].filter(Boolean).join(", ")
        : order.address
          ? [
              order.address.addressLine1,
              order.address.addressLine2,
              order.address.district,
              order.address.province,
            ]
              .filter(Boolean)
              .join(", ")
          : "",
      items: structuredItems
        .map(
          (item) =>
            `${item.name} x ${item.quantity}${item.color ? `, ${item.color}` : ""}`,
        )
        .join("; "),
      structuredItems,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      shippingFee: Number(order.shippingFee),
      total: Number(order.total),
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentId: order.payment?.id || "",
      paymentStatus: order.payment?.status || "PENDING",
      paymentTransactionCode: order.payment?.transactionCode || "",
      note: order.note || "",
      statusHistory: order.statusHistory.map((history) => ({
        previousStatus: history.previousStatus,
        newStatus: history.newStatus,
        changedByEmail: history.changedByEmail,
        note: history.note || "",
        createdAt: history.createdAt.toISOString(),
      })),
    };
  });
}

function getOrders(where: Prisma.OrderWhereInput) {
  return db.order.findMany({
    where,
    include: {
      address: true,
      customer: { include: { user: true } },
      items: { include: { paint: true } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const requestedEmail = searchParams.get("email");
    const isStaff = user.role === "ADMIN" || user.role === "STAFF";

    const where: Prisma.OrderWhereInput =
      isStaff && !requestedEmail
        ? {}
        : {
            customer: {
              user: {
                email: isStaff && requestedEmail ? requestedEmail : user.email,
              },
            },
          };

    return NextResponse.json(await serializeOrders(await getOrders(where)));
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await requireUser();
    const parsed = checkoutSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dữ liệu đặt hàng không hợp lệ", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const idempotencyKey = request.headers.get("Idempotency-Key");
    const ipAddr = getClientIp(request);
    const returnUrl = new URL("/api/vnpay/return", request.url).toString();

    const result = await processCheckout(input, sessionUser, idempotencyKey, ipAddr, returnUrl);
    
    // Fetch and serialize the created/existing order
    const targetOrderId = result.existingOrderId || result.newOrderId;
    const orderData = await getOrders({ id: targetOrderId });
    const [serializedOrder] = await serializeOrders(orderData);
    
    return NextResponse.json({ 
      success: true, 
      order: serializedOrder,
      paymentUrl: result.paymentUrl 
    }, { status: result.existingOrderId ? 200 : 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
