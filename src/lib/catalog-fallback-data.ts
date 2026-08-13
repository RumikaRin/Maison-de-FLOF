import { COLOR_SWATCHES, FEATURED_PRODUCTS } from "./constants/home-data.ts";

export const fallbackSupplier = {
  id: "maison-de-flof",
  name: "Maison de FLOF",
  slug: "maison-de-flof",
  logo: null,
  website: null,
};

export const fallbackCategory = {
  id: "featured-paints",
  name: "Sơn nổi bật",
  nameEn: "Featured Paints",
  slug: "featured-paints",
};

function toFallbackColorCodes(hexValues: string[]) {
  const codes = hexValues
    .map((hex) => COLOR_SWATCHES.find((color) => color.hex.toLowerCase() === hex.toLowerCase())?.code)
    .filter(Boolean);

  return codes.length > 0 ? codes : ["0001"];
}

export function getFallbackProducts() {
  return FEATURED_PRODUCTS.map((product, index) => ({
    id: product.id,
    sku: product.id.toUpperCase(),
    name: product.name,
    nameEn: product.nameEn || product.name,
    slug: product.id,
    categoryId: fallbackCategory.id,
    category: fallbackCategory,
    supplierId: fallbackSupplier.id,
    supplier: fallbackSupplier,
    description: product.desc,
    descriptionEn: product.descEn || product.desc,
    features: "",
    featuresEn: "",
    application: "",
    specifications: "",
    coverage: 10,
    coatsRequired: 2,
    dryingTime: "",
    paintType: "INTERIOR",
    finish: "MATTE",
    surfaces: ["WALL"],
    volume: Number.parseFloat(product.vol) || 5,
    volumeUnit: "L",
    price: product.price,
    discountPercent: product.tag === "promo" ? 10 : 0,
    stock: 100,
    images: [product.image],
    isFeatured: true,
    soldCount: FEATURED_PRODUCTS.length - index,
    colors: toFallbackColorCodes(product.colors),
  }));
}

export function getFallbackColors() {
  return COLOR_SWATCHES.map((color) => ({
    id: `fallback-${color.code}`,
    code: color.code,
    name: color.name,
    nameEn: color.nameEn,
    hex: color.hex,
    rgb: "",
    hsl: "",
    toneFamily: color.family,
    colorFamily: color.family,
    isPopular: true,
    isTrending: true,
    previewImage: "",
    collection: null,
  }));
}

export function getFallbackCategories() {
  return [fallbackCategory];
}

export function getFallbackSuppliers() {
  return [fallbackSupplier];
}
