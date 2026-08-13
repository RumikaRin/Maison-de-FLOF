/* Hallmark · genre: editorial · macrostructure: 08 Photographic · design-system: design.md · designed-as-app */ "use client";

import { useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { CspImage as Image } from "@/components/ui/csp-image";
import dynamic from "next/dynamic";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/ui/custom-select";
import { safeMotion, useReducedMotion } from "@/components/ui/motion-safe";
import { AsyncState } from "@/components/ui/AsyncState";
import { DrenchBand, Rule } from "@/components/ui/editorial";
import { cn } from "@/lib/utils";

const DealerMap = dynamic(() => import("@/components/maps/dealer-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-atelier-paper-2 text-fl-sm text-atelier-ink-2">
      Đang tải bản đồ...
    </div>
  ),
});

interface Dealer {
  id: string;
  name: string;
  nameEn: string;
  phone: string;
  email: string;
  address: string;
  addressEn: string;
  province: string;
  district: string;
  brand: string;
  lng: number;
  lat: number;
}

export default function FindDealerPage() {
  const { language } = useLanguageStore();
  const t = useTrans(language);
  const reduceMotion = useReducedMotion();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [selectedProvince, setSelectedProvince] = useState("Tất cả / All");
  const [selectedBrand, setSelectedBrand] = useState("Tất cả / All");
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">( "loading",
  );
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  const [mapViewport, setMapViewport] = useState({
    center: [105.787, 21.027] as [number, number],
    zoom: 11,
    bearing: 0,
    pitch: 0
  });

  const loadDealers = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await fetch("/api/dealers");
      if (!response.ok) throw new Error("DEALERS_FETCH_FAILED");
      const data = (await response.json()) as Dealer[];
      if (!Array.isArray(data)) throw new Error("DEALERS_RESPONSE_INVALID");
      setDealers(data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    void loadDealers();
  }, [loadDealers]);

  const provinces = ["Tất cả / All", ...Array.from(new Set(dealers.map((dealer) => dealer.province)))];
  const brands = ["Tất cả / All", ...Array.from(new Set(dealers.map((dealer) => dealer.brand)))];

  useEffect(() => {
    if (selectedProvince === "Hà Nội") {
      setMapViewport({ center: [105.787, 21.027], zoom: 11, bearing: 0, pitch: 0 });
    } else if (selectedProvince === "Hồ Chí Minh") {
      setMapViewport({ center: [106.735, 10.81], zoom: 11, bearing: 0, pitch: 0 });
    } else if (selectedProvince === "Đà Nẵng") {
      setMapViewport({ center: [108.2215, 16.0601], zoom: 11, bearing: 0, pitch: 0 });
    }
  }, [selectedProvince]);

  const handleDealerClick = (dl: Dealer) => {
    setMapViewport({ center: [dl.lng, dl.lat], zoom: 13.5, bearing: 0, pitch: 0 });
    setMobileView("map");
  };

  const filteredDealers = dealers.filter((d) => {
    const matchesProvince = selectedProvince === "Tất cả / All" || d.province === selectedProvince;
    const matchesBrand = selectedBrand === "Tất cả / All" || d.brand === selectedBrand;
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProvince && matchesBrand && matchesSearch;
  });

  // Hoisted so the loading, error and empty branches below keep the page's
  // identity. Previously they short-circuited and the fold never rendered.
  // Photographic fold — the showroom photograph is the hero; text sits on it,
  // left-biased. The load fade is the one motion primitive here.
  const hero = (
        <section className="fl-photo-fold fl-photo-plate flex min-h-[420px] w-full items-end overflow-hidden bg-atelier-espresso md:h-[52vh] md:max-h-[600px]">
          <safeMotion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <Image
              src="/showroom_hero.webp"
              alt={language === "vi" ? "Showroom sơn cao cấp" : "Premium paint showroom"}
              fill
              priority
              // A 1024x1024 source cropped to a wide band is already below 2x
              // here; quality 92 keeps next/image from softening it further.
              quality={92}
              sizes="100vw"
              // Soft drift: a 1024x1024 source cannot afford the full 14%
              // parallax crop on top of the wide-band crop it already takes.
              className="fl-photo-parallax fl-photo-parallax-soft object-cover object-center"
            />
            {/* Legibility scrim, bottom-left weighted like a printed caption field */}
            <div aria-hidden="true" className="fl-photo-scrim" />
          </safeMotion.div>

          <div className="relative z-10 mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,1.5rem)] pb-fl-xl pt-fl-3xl">
            <div className="max-w-2xl text-left text-atelier-on-dark">
              <p className="fl-label">{t.dealerNetworkLabel}</p>
              <h1 className="fl-display mt-fl-xs text-fl-display-s text-atelier-on-dark">
                {language === "vi" ? "Tìm đại lý gần nhất" : "Find the nearest dealer"}
              </h1>
              <p className="fl-measure-tight mt-fl-md text-fl-md text-atelier-on-dark">
                {language === "vi"
                  ? "Tìm kiếm các đại lý ủy quyền chính hãng trên toàn quốc. Nhận tư vấn trực tiếp từ đội ngũ chuyên gia."
                  : "Search authorized paint dealers nationwide. Get direct advice from our expert team."}
              </p>

              {/* Caption row — technical metadata, lower-left, like a plate caption */}
              <div className="mt-fl-xl flex flex-wrap items-center gap-x-fl-lg gap-y-fl-2xs border-t border-atelier-rule-on-dark pt-fl-xs">
                <span className="fl-label">
                  {language === "vi" ? "100% sơn chính hãng" : "100% genuine paint"}
                </span>
                <span className="fl-label">
                  {language === "vi" ? "Giá niêm yết công khai" : "Transparent pricing"}
                </span>
                <span className="fl-label">
                  {language === "vi" ? "Pha màu máy tính" : "Computer tinting"}
                </span>
              </div>
            </div>
          </div>
        </section>
  );

  if (!mounted) return null;
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-atelier-paper text-atelier-ink">
        {hero}
        <div className="mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,1.5rem)] py-fl-2xl">
        <AsyncState
          status="loading"
          title={language === "vi" ? "Đang tải đại lý" : "Loading dealers"}
        />
        </div>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="min-h-screen bg-atelier-paper text-atelier-ink">
        {hero}
        <div className="mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,1.5rem)] py-fl-2xl">
        <AsyncState
          status="error"
          title={
            language === "vi"
              ? "Không thể tải danh sách đại lý"
              : "Unable to load dealers"
          }
          description={
            language === "vi"
              ? "Kết nối tạm thời gián đoạn. Vui lòng thử lại."
              : "The connection was interrupted. Please retry."
          }
          retryLabel={language === "vi" ? "Thử lại" : "Retry"}
          onRetry={() => void loadDealers()}
        />
        </div>
      </div>
    );
  }
  if (dealers.length === 0) {
    return (
      <div className="min-h-screen bg-atelier-paper text-atelier-ink">
        {hero}
        <div className="lg:border-x lg:border-atelier-rule mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,1.5rem)] py-fl-2xl">
        <AsyncState
          status="empty"
          title={language === "vi" ? "Chưa có đại lý" : "No dealers yet"}
          description={
            language === "vi"
              ? "Danh sách đại lý sẽ xuất hiện khi dữ liệu được cập nhật."
              : "Dealers will appear after catalog data is updated."
          }
        />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-atelier-paper text-atelier-ink">

      {hero}

      {/* Locator — filters and rows on hairlines, the map as the working plate */}
      <section className="py-fl-xl md:py-fl-2xl">
        <div className="lg:border-x lg:border-atelier-rule mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,1.5rem)]">

          {/* Filter row — retuned inputs on one line, no card chrome */}
          <div className="flex flex-col gap-fl-sm md:flex-row md:items-center">
            <div className="relative w-full md:max-w-sm">
              <Input
                type="text"
                placeholder={language === "vi" ? "Tìm tên đại lý hoặc địa chỉ..." : "Search dealer name or address..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label={language === "vi" ? "Tìm đại lý" : "Search dealers"}
                className="pr-10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label={language === "vi" ? "Xóa từ khóa" : "Clear search"}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-atelier-ink-3 transition-colors duration-fl-fast ease-fl-out hover:text-atelier-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="w-full md:max-w-[220px]">
              <CustomSelect
                value={selectedProvince}
                onValueChange={setSelectedProvince}
                options={provinces.map((p) => ({
                  value: p,
                  label:
                    p === "Tất cả / All"
                      ? language === "vi" ? "Tất cả tỉnh thành" : "All provinces"
                      : p,
                }))}
              />
            </div>
            <div className="w-full md:max-w-[220px]">
              <CustomSelect
                value={selectedBrand}
                onValueChange={setSelectedBrand}
                options={brands.map((b) => ({
                  value: b,
                  label:
                    b === "Tất cả / All"
                      ? language === "vi" ? "Tất cả thương hiệu" : "All brands"
                      : b,
                }))}
              />
            </div>
            <span className="fl-label whitespace-nowrap md:ml-auto">
              {filteredDealers.length} {language === "vi" ? "đại lý" : "dealers"}
            </span>
          </div>
          <Rule className="mt-fl-sm" weight="strong" />

          {/* Mobile: List / Map toggle — C1 outlined rectangular chips */}
          <div
            role="group"
            aria-label={language === "vi" ? "Chế độ xem" : "View mode"}
            className="mt-fl-sm flex gap-fl-2xs lg:hidden"
          >
            <button
              type="button"
              aria-pressed={mobileView === "list"}
              onClick={() => setMobileView("list")}
              className={cn( "min-h-11 whitespace-nowrap rounded-control border px-fl-sm text-fl-sm transition-colors duration-fl-fast ease-fl-out",
                mobileView === "list"
                  ? "border-atelier-ink font-medium text-atelier-ink"
                  : "border-atelier-rule-strong text-atelier-ink-2",
              )}
            >
              {language === "vi" ? "Danh sách" : "List"}
            </button>
            <button
              type="button"
              aria-pressed={mobileView === "map"}
              onClick={() => setMobileView("map")}
              className={cn( "min-h-11 whitespace-nowrap rounded-control border px-fl-sm text-fl-sm transition-colors duration-fl-fast ease-fl-out",
                mobileView === "map"
                  ? "border-atelier-ink font-medium text-atelier-ink"
                  : "border-atelier-rule-strong text-atelier-ink-2",
              )}
            >
              {language === "vi" ? "Bản đồ" : "Map"}
            </button>
          </div>

          {/* Split view — hairline dealer rows beside the map plate */}
          <div className="mt-fl-md grid grid-cols-1 items-start gap-fl-lg lg:grid-cols-12">

            {/* Dealer index */}
            <div
              className={cn( "flex-col lg:col-span-5 lg:flex lg:max-h-[600px] lg:overflow-y-auto lg:pr-fl-2xs",
                mobileView === "map" ? "hidden lg:flex" : "flex",
              )}
            >
              {filteredDealers.length > 0 ? (
                filteredDealers.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => handleDealerClick(d)}
                    className="cursor-pointer border-b border-atelier-rule py-fl-sm text-left transition-colors duration-fl-fast ease-fl-out hover:bg-atelier-paper-2"
                  >
                    <div className="flex items-baseline justify-between gap-fl-sm">
                      <h3 className="min-w-0 font-serif text-fl-md text-atelier-ink">
                        {language === "vi" ? d.name : (d.nameEn || d.name)}
                      </h3>
                      <span className="fl-label shrink-0">{d.brand}</span>
                    </div>
                    <p className="mt-fl-2xs text-fl-sm text-atelier-ink-2">
                      {language === "vi" ? d.address : (d.addressEn || d.address)}
                    </p>
                    <p className="mt-fl-3xs text-fl-sm tabular-nums text-atelier-ink-2">
                      {d.phone}
                    </p>
                    <div
                      className="mt-fl-xs flex flex-wrap items-center gap-x-fl-lg gap-y-fl-2xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a
                        href={`tel:${d.phone}`}
                        className="inline-flex min-h-11 items-center whitespace-nowrap text-fl-sm font-medium text-atelier-accent underline decoration-1 underline-offset-4 transition-[text-decoration-thickness] duration-fl-fast ease-fl-out hover:decoration-2 md:min-h-6"
                      >
                        {language === "vi" ? "Gọi ngay" : "Call"}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDealerClick(d)}
                        className="inline-flex min-h-11 items-center whitespace-nowrap text-fl-sm text-atelier-ink-2 underline decoration-1 underline-offset-4 transition-colors duration-fl-fast ease-fl-out hover:text-atelier-ink md:min-h-6"
                      >
                        {language === "vi" ? "Xem bản đồ" : "View map"}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                /* Intentional editorial empty state: a rule, a line of copy, one action. */
                <div className="border-t border-atelier-rule-strong pt-fl-md">
                  <p className="fl-display text-fl-2xl text-atelier-ink">
                    {language === "vi" ? "Không tìm thấy đại lý" : "No dealers found"}
                  </p>
                  <p className="mt-fl-2xs text-fl-sm text-atelier-ink-2">{t.noDealersFound}</p>
                  <button
                    type="button"
                    onClick={() => { setSelectedProvince("Tất cả / All"); setSelectedBrand("Tất cả / All"); setSearchQuery(""); }}
                    className="mt-fl-sm inline-flex min-h-11 items-center whitespace-nowrap text-fl-sm font-medium text-atelier-accent underline decoration-1 underline-offset-4 transition-[text-decoration-thickness] duration-fl-fast ease-fl-out hover:decoration-2 md:min-h-6"
                  >
                    {language === "vi" ? "Xóa bộ lọc" : "Clear filters"}
                  </button>
                </div>
              )}
            </div>

            {/* Map plate */}
            <div
              className={cn( "relative overflow-hidden rounded-surface border border-atelier-rule lg:col-span-7",
                mobileView === "list" ? "hidden lg:block" : "block",
              )}
            >
              <div className="h-[360px] sm:h-[440px] lg:h-[600px]">
                <DealerMap dealers={filteredDealers} language={language} viewport={mapViewport} />
              </div>

              {/* Mobile: back to list overlay button — floats above the map,
                  one of the two surfaces design.md allows a shadow on. */}
              {mobileView === "map" && (
                <button
                  type="button"
                  onClick={() => setMobileView("list")}
                  className="absolute bottom-fl-sm left-1/2 z-10 inline-flex min-h-11 -translate-x-1/2 items-center whitespace-nowrap rounded-control bg-atelier-paper px-fl-md text-fl-sm font-medium text-atelier-ink shadow-lg lg:hidden"
                >
                  {language === "vi" ? "Về danh sách" : "Back to list"}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quote strip — the one drench band on this page, painted slate. */}
      <DrenchBand color="slate" className="py-fl-xl">
        <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-fl-sm px-[clamp(1rem,4vw,1.5rem)] md:flex-row md:items-end md:justify-between">
          <p className="fl-display max-w-2xl text-fl-2xl">{t.dealerQuoteBandTitle}</p>
          <Link
            href="/quote-request"
            className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-control bg-atelier-on-dark px-fl-lg py-fl-xs text-fl-sm font-medium text-atelier-espresso transition-opacity duration-fl-fast ease-fl-out hover:opacity-90 md:min-h-10"
          >
            {t.dealerQuoteBandCta}
          </Link>
        </div>
      </DrenchBand>
    </div>
  );
}
