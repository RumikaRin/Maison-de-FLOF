import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    
    let page = 1;
    let limit = 20;
    
    if (pageParam) page = parseInt(pageParam);
    if (limitParam) limit = parseInt(limitParam);

    const isPaginationRequested = !!pageParam || !!limitParam;

    const queryOptions: any = {
      include: {
        collection: true,
      },
      orderBy: { code: "asc" }
    };

    if (isPaginationRequested) {
      queryOptions.skip = (page - 1) * limit;
      queryOptions.take = limit;
    }

    const [colors, total] = await Promise.all([
      db.paintColor.findMany(queryOptions) as Promise<any[]>,
      isPaginationRequested ? db.paintColor.count() : Promise.resolve(0)
    ]);

    if (isPaginationRequested) {
      return NextResponse.json({
        data: colors,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }, {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      });
    }

    return NextResponse.json(colors, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Failed to fetch colors:", error);
    return NextResponse.json({ error: "Failed to fetch colors" }, { status: 500 });
  }
}

