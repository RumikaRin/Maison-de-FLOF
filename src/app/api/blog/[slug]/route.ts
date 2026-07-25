import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonApiError } from "@/lib/api-error-contract";
import { findPublishedBlogWithRelated } from "@/services/blog.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const result = await findPublishedBlogWithRelated(db, slug);
  if (!result) {
    return jsonApiError(request, 404, "NOT_FOUND", "Article not found");
  }

  return NextResponse.json({
    ...result.blog,
    relatedBlogs: result.relatedBlogs,
  });
}
