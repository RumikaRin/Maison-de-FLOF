import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parsePagination } from "@/lib/pagination";
import { apiErrorResponse } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const {
      page,
      limit,
      requested: isPaginationRequested,
    } = parsePagination(searchParams);

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
    return apiErrorResponse(error, request);
  }
}
