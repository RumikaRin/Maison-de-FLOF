import { getFallbackColors, getFallbackProducts } from "./catalog-fallback-data.ts";
import { getProductImage } from "./product-image.ts";
import type { CatalogAvailability } from "./catalog-result.ts";
import { writeOperationalLog } from "./operations/log.ts";

type HomePageDatabase = {
  paint: {
    findMany: (query: any) => Promise<any[]>;
  };
  paintColor: {
    findMany: (query: any) => Promise<any[]>;
  };
  blog: {
    findMany: (query: any) => Promise<any[]>;
  };
};

type HomePageData = CatalogAvailability & {
  mappedProducts: any[];
  colors: any[];
  mappedBlogs: any[];
};

function getFallbackHomePageData(): HomePageData {
  return {
    source: "fallback",
    commerceAvailable: false,
    mappedProducts: getFallbackProducts(),
    colors: getFallbackColors(),
    mappedBlogs: [],
  };
}

function mapHomePageData(products: any[], colors: any[], blogs: any[]): HomePageData {
  const mappedProducts = products.map((product) => ({
    id: product.id,
    sku: product.sku,
    name: product.name,
    nameEn: product.nameEn || product.name,
    slug: product.slug,
    categoryId: product.categoryId,
    category: product.category,
    supplierId: product.supplierId,
    supplier: product.supplier,
    description: product.description || "",
    descriptionEn: product.descriptionEn || product.description || "",
    features: product.features || "",
    featuresEn: product.featuresEn || product.features || "",
    application: product.application || "",
    specifications: product.specifications || "",
    coverage: product.coverage ? Number(product.coverage) : 0,
    coatsRequired: product.coatsRequired,
    dryingTime: product.dryingTime || "",
    paintType: product.paintType,
    finish: product.finish,
    surfaces: product.surfaces,
    volume: Number(product.volume),
    volumeUnit: product.volumeUnit,
    price: Number(product.price),
    discountPercent: product.discountPercent,
    stock: product.stock,
    images: (() => {
      const list = Array.isArray(product.images)
        ? product.images.filter((src: unknown) => typeof src === "string" && src.trim().length > 0)
        : [];
      return list.length > 0 ? list : [getProductImage(null)];
    })(),
    isFeatured: product.isFeatured,
    soldCount: product.soldCount,
    colors: product.colors.map((link: any) => link.color.code),
  }));

  const mappedBlogs = blogs.map((blog) => ({
    id: blog.id,
    title: blog.title,
    titleEn: blog.titleEn || blog.title,
    slug: blog.slug,
    summary: blog.summary,
    summaryEn: blog.summaryEn || blog.summary,
    content: blog.content,
    contentEn: blog.contentEn || blog.content,
    image: blog.image || "https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=800",
    category: "Xu Hướng Thiết Kế",
    categoryEn: "Design Trends",
    author: blog.author?.name || "Maison de FLOF",
    readTime: "5 phút đọc / 5 min read",
    createdAt: blog.createdAt.toISOString().split("T")[0],
  }));

  return {
    source: "database",
    commerceAvailable: true,
    mappedProducts,
    colors,
    mappedBlogs,
  };
}

export async function getHomePageData(database: HomePageDatabase): Promise<HomePageData> {
  try {
    const [products, colors, blogs] = await Promise.all([
      database.paint.findMany({
        where: { isActive: true },
        include: {
          category: { select: { id: true, name: true, nameEn: true, slug: true } },
          supplier: { select: { id: true, name: true, slug: true, logo: true, website: true } },
          colors: { select: { color: { select: { code: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      database.paintColor.findMany({
        include: {
          collection: true,
        },
        orderBy: { code: "asc" },
        take: 36,
      }),
      database.blog.findMany({
        where: { isActive: true },
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
    ]);

    return mapHomePageData(products, colors, blogs);
  } catch {
    if (process.env.NODE_ENV === "production") {
      writeOperationalLog("warn", "home.database_fallback", {
        fallback: "static",
      });
    }

    return getFallbackHomePageData();
  }
}
