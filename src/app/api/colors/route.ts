import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PALETTE_COLORS } from "@/lib/color-utils";

export async function GET() {
  try {
    const colors = await db.paintColor.findMany({
      orderBy: { code: "asc" }
    });
    
    if (colors.length === 0) {
      return NextResponse.json(PALETTE_COLORS);
    }
    
    return NextResponse.json(colors);
  } catch (error) {
    console.error("Failed to fetch colors from DB, falling back to static palette:", error);
    return NextResponse.json(PALETTE_COLORS);
  }
}
