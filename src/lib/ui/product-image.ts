/** Canonical placeholder when a paint has no image in the database. */
export const DEFAULT_PRODUCT_IMAGE = "/product_interior.webp";

/**
 * First usable product image, or the shared default.
 * Keeps homepage cards, catalog, cart, and product detail in sync.
 */
export function getProductImage(images?: string[] | null): string {
  if (!Array.isArray(images)) return DEFAULT_PRODUCT_IMAGE;
  const first = images.find((src) => typeof src === "string" && src.trim().length > 0);
  return first?.trim() || DEFAULT_PRODUCT_IMAGE;
}
