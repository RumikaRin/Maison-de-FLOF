import { db } from "../db.ts";
import { getFallbackProducts, getFallbackColors } from "../commerce/catalog-fallback-data.ts";

let cachedCatalogText: string | null = null;
let cachedStats: { productCount: number; colorCount: number; isFallback: boolean } | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function formatPaintType(type: string): string {
  switch (type) {
    case "INTERIOR":
      return "Sơn nội thất";
    case "EXTERIOR":
      return "Sơn ngoại thất";
    case "PRIMER":
      return "Sơn lót kháng kiềm";
    case "WATERPROOF":
      return "Sơn chống thấm";
    case "WOOD":
      return "Sơn gỗ";
    case "METAL":
      return "Sơn kim loại";
    case "SPECIALTY":
      return "Sơn hiệu ứng đặc biệt";
    default:
      return type;
  }
}

export function formatFinish(finish: string): string {
  switch (finish) {
    case "MATTE":
      return "Bề mặt mờ cổ điển";
    case "EGGSHELL":
      return "Bề mặt bóng mờ (vỏ trứng)";
    case "SATIN":
      return "Bề mặt lụa sang trọng";
    case "SEMI_GLOSS":
      return "Bán bóng nhẹ";
    case "GLOSS":
      return "Bóng cao cấp rực rỡ";
    default:
      return finish;
  }
}

export async function fetchLiveOrFallbackCatalog() {
  try {
    const [paints, colors] = await Promise.all([
      db.paint.findMany({
        where: { isActive: true },
        include: {
          category: { select: { name: true, nameEn: true } },
          colors: {
            include: {
              color: { select: { code: true, name: true, hex: true, toneFamily: true } },
            },
            take: 6,
          },
        },
        orderBy: [{ isFeatured: "desc" }, { soldCount: "desc" }],
        take: 40,
      }),
      db.paintColor.findMany({
        where: { isPopular: true },
        select: { code: true, name: true, hex: true, colorFamily: true },
        take: 20,
      }),
    ]);

    if (paints.length > 0) {
      return {
        isFallback: false,
        products: paints.map((p) => ({
          sku: p.sku,
          name: p.name,
          category: p.category?.name || formatPaintType(p.paintType),
          paintType: formatPaintType(p.paintType),
          finish: formatFinish(p.finish),
          volume: `${p.volume}${p.volumeUnit}`,
          price: Number(p.price),
          discountPercent: p.discountPercent || 0,
          coverage: p.coverage ? `${Number(p.coverage)} m²/lít/lớp` : "8-10 m²/lít (2 lớp)",
          coatsRequired: p.coatsRequired,
          features: p.features || p.description || "",
          colors: p.colors.map((c) => `${c.color.code} (${c.color.name})`).join(", "),
        })),
        colors: colors.map((c) => `${c.code} - ${c.name} (${c.colorFamily})`),
      };
    }
  } catch (error) {
    // Database fallback if offline or during testing
    console.warn("[AI Catalog] Database query fallback:", error instanceof Error ? error.message : String(error));
  }

  // Use fallback catalog
  const fallbackPaints = getFallbackProducts();
  const fallbackColors = getFallbackColors();

  return {
    isFallback: true,
    products: fallbackPaints.map((p) => ({
      sku: p.sku,
      name: p.name,
      category: p.category?.name || formatPaintType(p.paintType),
      paintType: formatPaintType(p.paintType),
      finish: formatFinish(p.finish),
      volume: `${p.volume}${p.volumeUnit}`,
      price: Number(p.price),
      discountPercent: p.discountPercent || 0,
      coverage: `${p.coverage} m²/lít/lớp`,
      coatsRequired: p.coatsRequired,
      features: p.description || "",
      colors: p.colors.join(", "),
    })),
    colors: fallbackColors.map((c) => `${c.code} - ${c.name}`),
  };
}

export function compileCatalogToMarkdown(data: Awaited<ReturnType<typeof fetchLiveOrFallbackCatalog>>): string {
  const productRows = data.products
    .map((p) => {
      const priceText = p.price > 0 ? `${p.price.toLocaleString("vi-VN")} đ` : "Liên hệ báo giá";
      const promoText = p.discountPercent > 0 ? ` (Đang ưu đãi -${p.discountPercent}%)` : "";
      return `- **${p.name}** (SKU: \`${p.sku}\`) | Loại: ${p.paintType} | Độ bóng: ${p.finish} | Quy cách: ${p.volume} | Giá niêm yết: **${priceText}**${promoText} | Định mức: ${p.coverage} | Số lớp: ${p.coatsRequired} lớp.${p.features ? ` Tính năng: ${p.features}.` : ""}${p.colors ? ` Mã màu tiêu biểu: ${p.colors}.` : ""}`;
    })
    .join("\n");

  const colorsText = data.colors.length > 0 ? `\n\n**Mã màu Jotun thịnh hành:** ${data.colors.join("; ")}.` : "";

  return `### DANH MỤC SẢN PHẨM & BẢNG GIÁ SƠN JOTUN TẠI MAISON DE FLOF:\n${productRows}${colorsText}`;
}

export async function getCachedCatalogKnowledge(forceRefresh = false): Promise<string> {
  const now = Date.now();
  if (!forceRefresh && cachedCatalogText && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedCatalogText;
  }

  const data = await fetchLiveOrFallbackCatalog();
  cachedCatalogText = compileCatalogToMarkdown(data);
  cachedStats = {
    productCount: data.products.length,
    colorCount: data.colors.length,
    isFallback: data.isFallback,
  };
  lastCacheTime = now;
  return cachedCatalogText;
}

export async function getCatalogStats(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedStats && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedStats;
  }
  await getCachedCatalogKnowledge(forceRefresh);
  return cachedStats || { productCount: 0, colorCount: 0, isFallback: false };
}
