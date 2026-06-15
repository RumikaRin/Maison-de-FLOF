import { db } from "@/lib/db";
import { BlogClient } from "@/components/features/blog/BlogClient";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const blog = await db.blog.findUnique({
    where: { slug },
    select: { title: true, titleEn: true, summary: true, summaryEn: true, image: true }
  });

  if (!blog) {
    return {
      title: "Article Not Found - Maison de FLOF",
      description: "This article does not exist.",
    };
  }

  return {
    title: `${blog.title} - Maison de FLOF`,
    description: blog.summary || `Read ${blog.title} at Maison de FLOF.`,
    openGraph: {
      images: blog.image ? [blog.image] : [],
    }
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const blog = await db.blog.findUnique({
    where: { slug },
    include: { author: true },
  });

  if (!blog || !blog.isActive) {
    return <BlogClient initialBlog={null} initialRelatedBlogs={[]} />;
  }

  const mappedBlog = {
    id: blog.id,
    title: blog.title,
    titleEn: blog.titleEn || blog.title,
    slug: blog.slug,
    summary: blog.summary,
    summaryEn: blog.summaryEn || blog.summary,
    content: blog.content,
    contentEn: blog.contentEn || blog.content,
    image: blog.image || "/room_inspiration.png",
    category: "Xu Hướng Thiết Kế",
    categoryEn: "Design Trends",
    author: blog.author?.name || "Maison de FLOF",
    readTime: "5 phút đọc / 5 min read",
    createdAt: blog.createdAt.toISOString().split("T")[0],
  };

  // We can fetch related blogs here. For now just passing empty array since old code didn't actually fetch them.
  const relatedBlogs: any[] = [];

  return (
    <BlogClient
      initialBlog={mappedBlog}
      initialRelatedBlogs={relatedBlogs}
    />
  );
}
