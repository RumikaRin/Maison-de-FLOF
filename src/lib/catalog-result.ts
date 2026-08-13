export type CatalogSource = "database" | "fallback";

export type CatalogAvailability = {
  source: CatalogSource;
  commerceAvailable: boolean;
};

export function canAddCatalogItemToCart(value: CatalogAvailability) {
  return value.source === "database" && value.commerceAvailable;
}
