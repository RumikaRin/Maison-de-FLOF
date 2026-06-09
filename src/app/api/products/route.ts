import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const products = await db.paint.findMany({
      include: {
        category: true,
        supplier: true,
        colors: {
          include: { color: true }
        }
      },
      where: { isActive: true },
      orderBy: { createdAt: "desc" }
    });

    const adapted = products.map((p) => ({
      ...p,
      price: Number(p.price),
      costPrice: Number(p.costPrice),
      coverage: p.coverage ? Number(p.coverage) : 0,
      volume: Number(p.volume),
      colors: p.colors.map((c) => c.color.code)
    }));

    return NextResponse.json(adapted);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
