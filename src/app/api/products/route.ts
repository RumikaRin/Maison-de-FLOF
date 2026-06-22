import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const rateLimitRes = await rateLimit(request);
    if (!rateLimitRes.success) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    
    let page = 1;
    let limit = 20;
    
    if (pageParam) page = parseInt(pageParam);
    if (limitParam) limit = parseInt(limitParam);

    const isPaginationRequested = !!pageParam || !!limitParam;

    const queryOptions: any = {
      where: { isActive: true },
      include: {
        category: { select: { id: true, name: true, nameEn: true, slug: true } },
        supplier: { select: { id: true, name: true, slug: true, logo: true, website: true } },
        colors: { select: { color: { select: { code: true } } } },
      },
      orderBy: { createdAt: "desc" },
    };

    if (isPaginationRequested) {
      queryOptions.skip = (page - 1) * limit;
      queryOptions.take = limit;
    }

    const [products, total] = await Promise.all([
      db.paint.findMany(queryOptions) as Promise<any[]>,
      isPaginationRequested ? db.paint.count({ where: { isActive: true } }) : Promise.resolve(0)
    ]);

    const mapped = products.map((product) => ({
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

    if (isPaginationRequested) {
      return Response.json({
        data: mapped,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }, {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      });
    }

    return Response.json(mapped, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return Response.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
