import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email },
      include: {
        customer: {
          include: {
            orders: {
              include: {
                items: {
                  include: {
                    paint: true
                  }
                }
              },
              orderBy: { createdAt: "desc" }
            }
          }
        }
      }
    });

    if (!user || !user.customer) {
      return NextResponse.json([]);
    }

    // Adapt database orders to match frontend order history schema
    const adapted = user.customer.orders.map((o) => ({
      id: o.orderNumber,
      date: o.createdAt.toISOString().split("T")[0],
      userEmail: email,
      customer: user.name || "Nguyễn Văn Khách",
      items: o.items.map((i) => `${i.paint?.name || 'Sản phẩm'} x ${i.quantity}`).join(", "),
      total: Number(o.total),
      status: o.status
    }));

    return NextResponse.json(adapted);
  } catch (error) {
    console.error("GET orders failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, items, total, paymentMethod, discount, shippingFee, note } = body;

    if (!email || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email },
      include: { customer: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let customer = user.customer;
    if (!customer) {
      customer = await db.customer.create({
        data: { userId: user.id }
      });
    }

    const orderNumber = `FLOF-${Math.floor(100000 + Math.random() * 900000)}`;

    const createdOrder = await db.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        subtotal: total - (shippingFee || 0) + (discount || 0),
        discount: discount || 0,
        shippingFee: shippingFee || 0,
        total: total,
        paymentMethod: paymentMethod || "COD",
        note: note || "",
        status: "PROCESSING",
        items: {
          create: items.map((item: any) => ({
            paintId: item.paintId || "paint-1",
            colorId: item.colorId || null,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity
          }))
        }
      }
    });

    return NextResponse.json({
      success: true,
      orderId: orderNumber,
      total: Number(createdOrder.total)
    });
  } catch (error) {
    console.error("POST order failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
