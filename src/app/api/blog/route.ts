import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const blogs = await db.blog.findMany({
      where: { isActive: true },
      include: { author: true },
      orderBy: { createdAt: "desc" }
    });

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

    return NextResponse.json(adapted);
  } catch (error) {
    console.error("Failed to fetch blogs:", error);
    return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 });
  }
}
