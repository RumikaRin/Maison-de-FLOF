import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, apiErrorResponse, requirePermission, requireStaff } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit";

const articleSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3).max(250),
  titleEn: z.string().trim().max(250).optional(),
  summary: z.string().trim().min(3).max(2000),
  summaryEn: z.string().trim().max(2000).optional(),
  category: z.string().trim().min(2).max(120),
  categoryEn: z.string().trim().min(2).max(120),
  image: z.string().trim().url().optional().or(z.literal("")),
});

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function serializeArticle(article: {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  summary: string;
  summaryEn: string | null;
  content: string;
  contentEn: string | null;
  image: string | null;
  category: string;
  categoryEn: string;
  createdAt: Date;
  author: { name: string | null };
}) {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    titleEn: article.titleEn || article.title,
    summary: article.summary,
    summaryEn: article.summaryEn || article.summary,
    content: article.content,
    contentEn: article.contentEn || article.content,
    image: article.image || "",
    category: article.category,
    categoryEn: article.categoryEn,
    author: article.author.name || "FLOF Editor",
    readTime: "5 phút",
    createdAt: article.createdAt.toISOString().split("T")[0],
  };
}

export async function GET() {
  try {
    await requireStaff();
    const articles = await db.blog.findMany({
      include: { author: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(articles.map(serializeArticle));
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const staff = await requirePermission("CATALOG_MANAGE");
    const parsed = articleSchema.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(400, "Thông tin bài viết không hợp lệ");
    const author = await db.user.findUnique({ where: { email: staff.email } });
    if (!author) throw new ApiError(404, "Không tìm thấy tác giả");
    const article = await db.blog.create({
      data: {
        title: parsed.data.title,
        titleEn: parsed.data.titleEn,
        slug: `${slugify(parsed.data.title)}-${Date.now().toString(36)}`,
        summary: parsed.data.summary,
        summaryEn: parsed.data.summaryEn,
        category: parsed.data.category,
        categoryEn: parsed.data.categoryEn,
        content: parsed.data.summary,
        contentEn: parsed.data.summaryEn || parsed.data.summary,
        image: parsed.data.image || null,
        authorId: author.id,
      },
      include: { author: true },
    });
    await createAuditLog(db, {
      actor: staff,
      action: "ARTICLE_CREATED",
      entityType: "Blog",
      entityId: article.id,
      afterData: { title: article.title, slug: article.slug },
    });
    return NextResponse.json(serializeArticle(article), { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const staff = await requirePermission("CATALOG_MANAGE");
    const parsed = articleSchema.safeParse(await request.json());
    if (!parsed.success || !parsed.data.id) {
      throw new ApiError(400, "Thông tin bài viết không hợp lệ");
    }
    const article = await db.blog.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.title,
        titleEn: parsed.data.titleEn,
        summary: parsed.data.summary,
        summaryEn: parsed.data.summaryEn,
        category: parsed.data.category,
        categoryEn: parsed.data.categoryEn,
        image: parsed.data.image || null,
      },
      include: { author: true },
    });
    await createAuditLog(db, {
      actor: staff,
      action: "ARTICLE_UPDATED",
      entityType: "Blog",
      entityId: article.id,
      afterData: { title: article.title, isActive: article.isActive },
    });
    return NextResponse.json(serializeArticle(article));
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const staff = await requirePermission("CATALOG_MANAGE");
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new ApiError(400, "Thiếu mã bài viết");
    await db.blog.delete({ where: { id } });
    await createAuditLog(db, {
      actor: staff,
      action: "ARTICLE_DELETED",
      entityType: "Blog",
      entityId: id,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
