import { db } from "@/lib/db";
import { ProductClient } from "@/components/features/product/ProductClient";
import { Metadata } from "next";
import { getFallbackColors, getFallbackProducts } from "@/lib/catalog-fallback-data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await db.paint.findUnique({
      where: { slug },
      select: { name: true, nameEn: true, description: true, descriptionEn: true }
    });

    if (product) {
      return {
        title: `${product.name} - Maison de FLOF`,
        description: product.description || `Buy ${product.name} at Maison de FLOF.`,
      };
    }
  } catch {
    // fallback below
  }

  const fallback = getFallbackProducts().find((p) => p.slug === slug) || getFallbackProducts()[0];
  return {
    title: `${fallback.name} - Maison de FLOF`,
    description: fallback.description || `Buy ${fallback.name} at Maison de FLOF.`,
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let product: any = null;
  let relatedProducts: any[] = [];
  let colorsData: any[] = [];
  let reviewsData: any[] = [];

  try {
    product = await db.paint.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true, nameEn: true, slug: true } },
        supplier: { select: { id: true, name: true, slug: true, logo: true, website: true } },
        colors: { include: { color: true } },
      },
    });

    if (product && product.isActive) {
      relatedProducts = await db.paint.findMany({
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

      colorsData = await db.paintColor.findMany({
        include: { collection: true },
        orderBy: { code: "asc" }
      });

      reviewsData = await db.review.findMany({
        where: { paintId: product.id },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" }
      }) as any[];
    }
  } catch {
    const fallbacks = getFallbackProducts();
    const found = fallbacks.find((p) => p.slug === slug) || fallbacks[0];
    product = {
      ...found,
      isActive: true,
      colors: [],
      colorDetails: [],
    };
    colorsData = getFallbackColors();
  }

  if (!product || !product.isActive) {
    return <ProductClient initialProduct={null} initialRelatedPaints={[]} initialColorCatalog={[]} initialReviews={[]} />;
  }

  const mappedProduct = {
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
      return list.length > 0 ? list : ["/product_interior.webp"];
    })(),
    isFeatured: product.isFeatured,
    soldCount: product.soldCount,
    colors: (product.colors || []).map((link: any) => link?.color?.code || link),
    colorDetails: (product.colors || []).map((link: any) => link?.color || link),
  };

  const mappedRelated = relatedProducts.map((related) => ({
    ...related,
    nameEn: related.nameEn || related.name,
    price: Number(related.price),
    volume: Number(related.volume),
    colors: (related.colors || []).map((link: any) => link?.color?.code || link),
  }));

  const mappedReviews = reviewsData.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    adminReply: r.adminReply,
    author: r.user?.name || "Khách hàng",
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt || "")
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": mappedProduct.name,
    "image": mappedProduct.images[0] || "",
    "description": mappedProduct.description || "",
    "sku": mappedProduct.sku,
    "offers": {
      "@type": "Offer",
      "url": `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/products/${mappedProduct.slug}`,
      "priceCurrency": "VND",
      "price": mappedProduct.price,
      "availability": mappedProduct.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductClient
        initialProduct={mappedProduct}
        initialRelatedPaints={mappedRelated}
        initialColorCatalog={colorsData}
        initialReviews={mappedReviews}
      />
    </>
  );
}
