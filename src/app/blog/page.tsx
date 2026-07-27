/* Hallmark · genre: editorial · macrostructure: 11 Catalogue · design-system: design.md · designed-as-app */
import { Metadata } from "next";
import { db } from "@/lib/db";
import {
  PUBLIC_BLOG_CARD_SELECT,
  serializePublicBlogCard,
  type PublicBlogCard,
} from "@/services/blog.service";
import { BlogListingClient } from "@/components/features/blog/BlogListingClient";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Blog - Maison de FLOF",
  description:
    "Xu hướng phối màu thời thượng và cẩm nang thi công sơn nước chuyên nghiệp từ Maison de FLOF.",
};

export default async function BlogListingPage() {
  let blogs: PublicBlogCard[];
  try {
    const rawBlogs = await db.blog.findMany({
      where: { isActive: true },
      select: PUBLIC_BLOG_CARD_SELECT,
      orderBy: { createdAt: "desc" },
    });
    blogs = rawBlogs.map(serializePublicBlogCard);
  } catch {
    blogs = [];
  }

  return <BlogListingClient initialBlogs={blogs} />;
}
