import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "Email query param is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email },
      include: {
        customer: {
          include: {
            wishlistColors: {
              include: {
                color: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.customer) {
      return NextResponse.json([]);
    }

    const colorCodes = user.customer.wishlistColors.map((wc) => wc.color.code);
    return NextResponse.json(colorCodes);
  } catch (error) {
    console.error("GET favorites failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json({ error: "Missing email or color code" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email },
      include: { customer: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Lazily create customer profile if missing
    let customer = user.customer;
    if (!customer) {
      customer = await db.customer.create({
        data: {
          userId: user.id
        }
      });
    }

    const paintColor = await db.paintColor.findUnique({
      where: { code }
    });

    if (!paintColor) {
      return NextResponse.json({ error: "Paint color not found in database" }, { status: 404 });
    }

    const existing = await db.wishlistColor.findUnique({
      where: {
        customerId_colorId: {
          customerId: customer.id,
          colorId: paintColor.id
        }
      }
    });

    if (existing) {
      await db.wishlistColor.delete({
        where: { id: existing.id }
      });
      return NextResponse.json({ favorited: false, code });
    } else {
      await db.wishlistColor.create({
        data: {
          customerId: customer.id,
          colorId: paintColor.id
        }
      });
      return NextResponse.json({ favorited: true, code });
    }
  } catch (error) {
    console.error("POST favorites failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
