import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { writeOperationalLog } from "@/lib/operations/log";
import { localizedPath, SUPPORTED_LOCALES } from "@/lib/locale";
import {
  COLOR_FAMILY_VALUES,
  PRODUCT_CATEGORIES,
} from "@/lib/constants/color-families";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
export const dynamic = "force-dynamic";

function localizedEntries(
  path: string,
  options: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">,
) {
  const languages = Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [
      locale,
      `${baseUrl}${localizedPath(path, locale)}`,
    ]),
  );
  return SUPPORTED_LOCALES.map((locale) => ({
    ...options,
    url: languages[locale],
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    "",
    "/products",
    "/colors",
    "/color-visualizer",
    "/find-dealer",
    "/blog",
    "/quote-request",
  ].flatMap((path) =>
    localizedEntries(path || "/", {
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    }),
  );

  const categoryPages = PRODUCT_CATEGORIES.flatMap((cat) =>
    localizedEntries(`/products?category=${cat.slug}`, {
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }),
  );

  const colorFamilyPages = COLOR_FAMILY_VALUES.flatMap((family) =>
    localizedEntries(`/colors?family=${family}`, {
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }),
  );

  try {
    const [products, blogs, collections] = await Promise.all([
      db.paint.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      db.blog.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      db.colorCollection.findMany({ where: { isActive: true }, select: { slug: true, createdAt: true } }),
    ]);
    return [
      ...staticPages,
      ...categoryPages,
      ...colorFamilyPages,
      ...products.flatMap((product) =>
        localizedEntries(`/products/${product.slug}`, {
          lastModified: product.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.9,
        }),
      ),
      ...blogs.flatMap((blog) =>
        localizedEntries(`/blog/${blog.slug}`, {
          lastModified: blog.updatedAt,
          changeFrequency: "monthly" as const,
          priority: 0.7,
        }),
      ),
      ...collections.flatMap((collection) =>
        localizedEntries(`/colors?collection=${collection.slug}`, {
          lastModified: collection.createdAt,
          changeFrequency: "monthly" as const,
          priority: 0.75,
        }),
      ),
    ];
  } catch {
    writeOperationalLog("warn", "sitemap.database_fallback", {
      fallback: "static",
    });
    return [...staticPages, ...categoryPages, ...colorFamilyPages];
  }
}
