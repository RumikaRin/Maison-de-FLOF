import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { parsePagination } from "@/lib/pagination";
import { apiErrorResponse } from "@/lib/api-auth";
import { jsonApiError } from "@/lib/api-error-contract";
import { serializePublicBlog } from "@/services/blog.service";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const rateLimitRes = await rateLimit(request);
    if (!rateLimitRes.success) {
      return jsonApiError(
        request,
        429,
        "TOO_MANY_REQUESTS",
        "Too many requests",
      );
    }

    const { searchParams } = new URL(request.url);
    const {
      page,
      limit,
      requested: isPaginationRequested,
    } = parsePagination(searchParams);

    const queryOptions = {
      where: { isActive: true },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      ...(isPaginationRequested
        ? { skip: (page - 1) * limit, take: limit }
        : {}),
    } satisfies Prisma.BlogFindManyArgs;

    const [blogs, total] = await Promise.all([
      db.blog.findMany(queryOptions),
      isPaginationRequested ? db.blog.count({ where: { isActive: true } }) : Promise.resolve(0)
    ]);

    const adapted = blogs.map(serializePublicBlog);

    if (isPaginationRequested) {
      return NextResponse.json({
        data: adapted,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }, {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      });
    }

    return NextResponse.json(adapted, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    return apiErrorResponse(error, request);
  }
}
