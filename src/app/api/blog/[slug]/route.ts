import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonApiError } from "@/lib/api-error-contract";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const blog = await db.blog.findUnique({
    where: { slug },
    include: { author: true },
  });
  if (!blog || !blog.isActive) {
    return jsonApiError(request, 404, "NOT_FOUND", "Article not found");
  }

  return NextResponse.json({
    id: blog.id,
    title: blog.title,
    titleEn: blog.titleEn || blog.title,
    slug: blog.slug,
    summary: blog.summary,
    summaryEn: blog.summaryEn || blog.summary,
    content: blog.content,
    contentEn: blog.contentEn || blog.content,
    image: blog.image || "/room_inspiration.webp",
    category: "Xu Hướng Thiết Kế",
    categoryEn: "Design Trends",
    author: blog.author.name || "Maison de FLOF",
    readTime: "5 phút đọc / 5 min read",
    createdAt: blog.createdAt.toISOString().split("T")[0],
  });
}
