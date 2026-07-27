/**
 * The canonical colour-family vocabulary for the catalogue.
 *
 * `value` must match the `colorFamily` stored on a colour record — it is the
 * filter key used by `/colors` and by the header colour panel's
 * `/colors?family=<value>` deep link.
 *
 * `swatch` is a representative indicator for the family, not a product colour.
 * It exists so the panel can show a real chip instead of a text-only list; the
 * name is always rendered alongside it, because colour is never the sole
 * carrier of information (design.md § Accessibility floor).
 *
 * `labelKey` points at `src/lib/dictionary.ts` so no copy is hardcoded.
 */
export const COLOR_FAMILIES = [
  { value: "white", labelKey: "colorFamilyWhite", swatch: "#F5F0E8" },
  { value: "beige", labelKey: "colorFamilyBeige", swatch: "#D4C4A8" },
  { value: "yellow", labelKey: "colorFamilyYellow", swatch: "#F2E2A6" },
  { value: "orange", labelKey: "colorFamilyOrange", swatch: "#CC7722" },
  { value: "red", labelKey: "colorFamilyRed", swatch: "#976256" },
  { value: "blue", labelKey: "colorFamilyBlue", swatch: "#AEC6CF" },
  { value: "green", labelKey: "colorFamilyGreen", swatch: "#7E9D73" },
  { value: "grey", labelKey: "colorFamilyGrey", swatch: "#6E6E6E" },
  { value: "brown", labelKey: "colorFamilyBrown", swatch: "#7A6E60" },
] as const;

export const COLOR_FAMILY_VALUES: string[] = COLOR_FAMILIES.map((family) => family.value);

/** Product ranges the catalogue already filters on via `/products?category=`. */
export const PRODUCT_CATEGORIES = [
  { slug: "son-noi-that", labelKey: "footerCatInterior" },
  { slug: "son-ngoai-that", labelKey: "footerCatExterior" },
  { slug: "son-lot", labelKey: "footerCatPrimer" },
  { slug: "son-chong-tham", labelKey: "footerCatWaterproof" },
] as const;
