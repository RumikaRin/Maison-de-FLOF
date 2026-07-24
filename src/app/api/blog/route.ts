import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { parsePagination, PaginationError } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  try {
    const rateLimitRes = await rateLimit(request);
    if (!rateLimitRes.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const {
      page,
      limit,
      requested: isPaginationRequested,
    } = parsePagination(searchParams);

    const queryOptions: any = {
      where: { isActive: true },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: "desc" }
    };

    if (isPaginationRequested) {
      queryOptions.skip = (page - 1) * limit;
      queryOptions.take = limit;
    }

    const [blogs, total] = await Promise.all([
      db.blog.findMany(queryOptions) as Promise<any[]>,
      isPaginationRequested ? db.blog.count({ where: { isActive: true } }) : Promise.resolve(0)
    ]);

    const adapted = blogs.map((b) => ({
      id: b.id,
      title: b.title,
      titleEn: b.titleEn || b.title,
      slug: b.slug,
      summary: b.summary,
      summaryEn: b.summaryEn || b.summary,
      content: b.content,
      contentEn: b.contentEn || b.content,
      image: b.image || "https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=800",
      category: "Xu Hướng Thiết Kế",
      categoryEn: "Design Trends",
      author: b.author?.name || "Maison de FLOF",
      readTime: "5 phút đọc / 5 min read",
      createdAt: b.createdAt.toISOString().split("T")[0]
    }));

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
    if (error instanceof PaginationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Failed to fetch blogs:", error);
    return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 });
  }
}
