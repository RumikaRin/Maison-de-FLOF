import {
  getFallbackCategories,
  getFallbackColors,
  getFallbackProducts,
  getFallbackSuppliers,
} from "./catalog-fallback-data.ts";
import { writeOperationalLog } from "./operations/log.ts";

type ProductsPageDatabase = {
  paint: {
    findMany: (query: any) => Promise<any[]>;
  };
  category: {
    findMany: (query: any) => Promise<any[]>;
  };
  supplier: {
    findMany: (query: any) => Promise<any[]>;
  };
};

type ColorsPageDatabase = {
  paintColor: {
    findMany: (query: any) => Promise<any[]>;
  };
};

function logCatalogFallback(page: string, _error: unknown) {
  if (process.env.NODE_ENV === "production") {
    writeOperationalLog("warn", "catalog.database_fallback", {
      page,
      fallback: "static",
    });
  }
}

function mapProducts(products: any[]) {
  return products.map((product) => ({
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
    colors: product.colors.map((link: any) => link.color.code),
  }));
}

export async function getProductsPageData(database: ProductsPageDatabase) {
  try {
    const [paints, categories, suppliers] = await Promise.all([
      database.paint.findMany({
        where: { isActive: true },
        include: {
          category: { select: { id: true, name: true, nameEn: true, slug: true } },
          supplier: { select: { id: true, name: true, slug: true, logo: true, website: true } },
          colors: { select: { color: { select: { code: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      database.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true, nameEn: true, slug: true },
        orderBy: { sortOrder: "asc" },
      }),
      database.supplier.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true, logo: true, website: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      source: "database" as const,
      commerceAvailable: true,
      mappedProducts: mapProducts(paints),
      categories,
      suppliers,
    };
  } catch (error) {
    logCatalogFallback("products", error);

    return {
      source: "fallback" as const,
      commerceAvailable: false,
      mappedProducts: getFallbackProducts(),
      categories: getFallbackCategories(),
      suppliers: getFallbackSuppliers(),
    };
  }
}

export function mapColors(colors: any[]) {
  return colors.map((color) => ({
    id: color.id,
    code: color.code,
    name: color.name,
    nameEn: color.nameEn || color.name,
    hex: color.hex,
    rgb: color.rgb || "",
    hsl: color.hsl || "",
    toneFamily: color.toneFamily,
    colorFamily: color.colorFamily,
    isPopular: color.isPopular,
    isTrending: color.isTrending,
    previewImage: color.previewImage || "",
    collection: color.collection
      ? {
          id: color.collection.id,
          name: color.collection.name,
          nameEn: color.collection.nameEn || color.collection.name,
          slug: color.collection.slug,
          year: color.collection.year,
        }
      : null,
  }));
}

export async function getColorsPageData(database: ColorsPageDatabase) {
  try {
    const colors = await database.paintColor.findMany({
      include: {
        collection: true,
      },
      orderBy: { code: "asc" },
    });

    return mapColors(colors);
  } catch (error) {
    logCatalogFallback("colors", error);

    return getFallbackColors();
  }
}
