import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const product = await db.paint.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true, nameEn: true, slug: true } },
      supplier: { select: { id: true, name: true, slug: true, logo: true, website: true } },
      colors: { include: { color: true } },
    },
  });
  if (!product?.isActive) {
    return Response.json({ error: "Product not found" }, { status: 404 });
  }

  const relatedProducts = await db.paint.findMany({
    where: {
      isActive: true,
      id: { not: product.id },
      OR: [
        { categoryId: product.categoryId },
        ...(product.supplierId ? [{ supplierId: product.supplierId }] : []),
      ],
    },
    select: {
      id: true,
      sku: true,
      name: true,
      nameEn: true,
      slug: true,
      categoryId: true,
      supplierId: true,
      supplier: { select: { name: true } },
      price: true,
      discountPercent: true,
      stock: true,
      images: true,
      volume: true,
      volumeUnit: true,
      paintType: true,
      finish: true,
      colors: { select: { color: { select: { code: true } } } },
    },
    orderBy: [{ soldCount: "desc" }, { createdAt: "desc" }],
    take: 3,
  });

  return Response.json({
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
    colorDetails: product.colors.map((link) => link.color),
    relatedProducts: relatedProducts.map((related) => ({
      ...related,
      nameEn: related.nameEn || related.name,
      price: Number(related.price),
      volume: Number(related.volume),
      colors: related.colors.map((link) => link.color.code),
    })),
  });
}
