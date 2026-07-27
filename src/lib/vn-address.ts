/**
 * Vietnamese administrative units for address forms.
 *
 * Source: public/data/vn-provinces.json, generated from the official open API
 * by tools/generate-vn-provinces.mjs. Post-2025-merger structure: 34
 * provinces/cities with wards (phường/xã) as the second level — the
 * district (quận/huyện) tier was abolished in the 07/2025 reform, so ward is
 * what a current shipping address carries.
 *
 * The dataset is fetched from the public folder rather than bundled: 65KB of
 * names would bloat every checkout visit's JS, while a static JSON request is
 * cached by the browser and the CDN.
 */

export type VnProvince = {
  /** Full official name, e.g. "Thành phố Hà Nội". */
  n: string;
  /** Ward names under this province, e.g. "Phường Ba Đình". */
  w: string[];
};

let cache: VnProvince[] | null = null;
let inflight: Promise<VnProvince[]> | null = null;

export async function loadVnProvinces(): Promise<VnProvince[]> {
  if (cache) return cache;
  if (!inflight) {
    inflight = fetch("/data/vn-provinces.json")
      .then((res) => {
        if (!res.ok) throw new Error(`vn-provinces ${res.status}`);
        return res.json() as Promise<VnProvince[]>;
      })
      .then((data) => {
        cache = data;
        return data;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Case- and diacritic-insensitive contains, so "hn"/"ha noi" both match. */
export function matchesVnName(name: string, query: string): boolean {
  if (!query) return true;
  return normalize(name).includes(normalize(query));
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");
}
