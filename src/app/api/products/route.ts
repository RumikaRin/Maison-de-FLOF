import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MOCK_PAINTS } from "@/lib/mock-data";

export async function GET() {
  try {
    const products = await db.paint.findMany({
      include: {
        category: true,
        supplier: true,
        colors: {
          include: {
            color: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    if (products.length === 0) {
      return NextResponse.json(MOCK_PAINTS);
    }

    // Adapt database schema relations to matches frontend paint schema model
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
    console.error("Failed to fetch products from DB, falling back to mock:", error);
    return NextResponse.json(MOCK_PAINTS);
  }
}
