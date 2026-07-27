/* Hallmark · genre: editorial · macrostructure: 11 Catalogue · design-system: design.md · designed-as-app */
import { Metadata } from "next";
import { db } from "@/lib/db";
import { serializePublicBlog } from "@/services/blog.service";
import { BlogListingClient } from "@/components/features/blog/BlogListingClient";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Blog - Maison de FLOF",
  description:
    "Xu hướng phối màu thời thượng và cẩm nang thi công sơn nước chuyên nghiệp từ Maison de FLOF.",
};

export default async function BlogListingPage() {
  let blogs: ReturnType<typeof serializePublicBlog>[];
  try {
    const rawBlogs = await db.blog.findMany({
      where: { isActive: true },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    blogs = rawBlogs.map(serializePublicBlog);
  } catch {
    blogs = [];
  }

  return <BlogListingClient initialBlogs={blogs} />;
}
