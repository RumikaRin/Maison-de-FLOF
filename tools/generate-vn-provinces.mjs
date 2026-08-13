/**
 * Regenerates public/data/vn-provinces.json from the official open API
 * (provinces.open-api.vn, v2 = post-2025-merger structure: 34 provinces,
 * wards as the second level — the district tier was abolished 07/2025).
 *
 * Usage: node tools/generate-vn-provinces.mjs
 */
const res = await fetch("https://provinces.open-api.vn/api/v2/?depth=2");
if (!res.ok) throw new Error(`API ${res.status}`);
const provinces = await res.json();
const trimmed = provinces.map((p) => ({
  n: p.name,
  w: (p.wards ?? []).map((w) => w.name),
}));
const { writeFileSync } = await import("node:fs");
writeFileSync(
  new URL("../public/data/vn-provinces.json", import.meta.url),
  JSON.stringify(trimmed),
);
console.log(
  `wrote ${trimmed.length} provinces, ${trimmed.reduce((s, p) => s + p.w.length, 0)} wards`,
);
