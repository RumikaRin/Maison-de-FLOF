import { HomeClient } from "@/components/features/home/HomeClient";
import { Metadata } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Maison de FLOF - Sắc màu nghệ thuật",
  description: "Kiến tạo không gian sống đậm chất nghệ thuật với hàng ngàn màu sơn từ Maison de FLOF.",
};

async function getHomePageData() {
  const [products, colors, blogs] = await Promise.all([
    db.paint.findMany({
      where: { isActive: true },
      include: {
        category: { select: { id: true, name: true, nameEn: true, slug: true } },
        supplier: { select: { id: true, name: true, slug: true, logo: true, website: true } },
        colors: { select: { color: { select: { code: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.paintColor.findMany({
      include: {
        collection: true,
      },
      orderBy: { code: "asc" }
    }),
    db.blog.findMany({
      where: { isActive: true },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: "desc" }
    })
  ]);

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
    images: product.images,
    isFeatured: product.isFeatured,
    soldCount: product.soldCount,
    colors: product.colors.map((link) => link.color.code),
  }));

  const mappedBlogs = blogs.map((b) => ({
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

  return { mappedProducts, colors, mappedBlogs };
}

export default async function HomePage() {
  const { mappedProducts, colors, mappedBlogs } = await getHomePageData();

  return <HomeClient initialPaints={mappedProducts} initialColors={colors} initialBlogs={mappedBlogs} />;
}
