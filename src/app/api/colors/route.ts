import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const colors = await db.paintColor.findMany({
      include: {
        collection: true,
      },
      orderBy: { code: "asc" }
    });

    return NextResponse.json(colors);
  } catch (error) {
    console.error("Failed to fetch colors:", error);
    return NextResponse.json({ error: "Failed to fetch colors" }, { status: 500 });
  }
}
