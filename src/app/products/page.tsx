import { Metadata } from "next";
import { db } from "@/lib/db";
import { ProductsClient } from "@/components/features/product/ProductsClient";

export const metadata: Metadata = {
  title: "Sản phẩm sơn nước - Maison de FLOF",
  description: "Khám phá danh mục các sản phẩm sơn nước chất lượng cao tại Maison de FLOF.",
};

export default async function ProductsPage() {
  const [paints, categories, suppliers] = await Promise.all([
    db.paint.findMany({
      where: { isActive: true },
      include: {
        category: { select: { id: true, name: true, nameEn: true, slug: true } },
        supplier: { select: { id: true, name: true, slug: true, logo: true, website: true } },
        colors: { select: { color: { select: { code: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, nameEn: true, slug: true },
      orderBy: { sortOrder: "asc" }
    }),
    db.supplier.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, logo: true, website: true },
      orderBy: { name: "asc" }
    })
  ]);

  const mappedProducts = paints.map((product) => ({
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
    colors: product.colors.map((link: any) => link.color.code),
  }));

  return (
    <ProductsClient
      initialPaints={mappedProducts}
      initialCategories={categories}
      initialSuppliers={suppliers}
    />
  );
}
