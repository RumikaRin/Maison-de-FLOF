import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    "",
    "/products",
    "/colors",
    "/color-visualizer",
    "/find-dealer",
    "/blog",
    "/quote-request",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  try {
    const [products, blogs] = await Promise.all([
      db.paint.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      db.blog.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    ]);
    return [
      ...staticPages,
      ...products.map((product) => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.9,
      })),
      ...blogs.map((blog) => ({
        url: `${baseUrl}/blog/${blog.slug}`,
        lastModified: blog.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ];
  } catch (error) {
    console.error("Sitemap database query failed:", error);
    return staticPages;
  }
}
