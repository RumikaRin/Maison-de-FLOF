/* Hallmark · genre: editorial · macrostructure: 08 Photographic · design-system: design.md · designed-as-app */
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { safeMotion, AnimatePresence, useReducedMotion } from "@/components/ui/motion-safe";
import { ColorDetailDrawer } from "@/components/ui/color-detail-drawer";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { ColorSwatch } from "@/components/ui/color-swatch";
import { COLOR_FAMILIES, COLOR_FAMILY_VALUES } from "@/lib/constants/color-families";
import { EditorialHeading, Rule } from "@/components/ui/editorial";

interface ColorsClientProps {
  initialColors: any[];
}

export function ColorsClient({ initialColors }: ColorsClientProps) {
  const { language } = useLanguageStore();
  const t = useTrans(language);
  const { status: authStatus } = useSession();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFamily, setSelectedFamily] = useState("all");
  const [selectedTone, setSelectedTone] = useState("all");
  const [selectedColor, setSelectedColor] = useState<any | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [colors] = useState<any[]>(initialColors);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Deep link from the header colour panel: /colors?family=<colorFamily>.
  // The value must match a `colorFamily` in the catalogue, otherwise it is ignored.
  useEffect(() => {
    const family = searchParams.get("family");
    if (family && COLOR_FAMILY_VALUES.includes(family)) setSelectedFamily(family);
  }, [searchParams]);

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetch("/api/profile/favorites")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setFavorites(data);
        })
        .catch((err) => console.error("Failed to load DB wishlist:", err));
      return;
    }

    if (authStatus === "unauthenticated") {
      const saved = localStorage.getItem("sonvn-color-wishlist");
      if (!saved) return;
      try {
        setFavorites(JSON.parse(saved));
      } catch {
        localStorage.removeItem("sonvn-color-wishlist");
      }
    }
  }, [authStatus]);

  const handleToggleFavorite = async (code: string) => {
    const previous = favorites;
    const newFavs = previous.includes(code) ? previous.filter((c) => c !== code) : [...previous, code];
    setFavorites(newFavs);

    if (authStatus !== "authenticated") {
      localStorage.setItem("sonvn-color-wishlist", JSON.stringify(newFavs));
      return;
    }

    try {
      const response = await fetch("/api/profile/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!response.ok) throw new Error("Failed to sync favorite");
    } catch (error) {
      setFavorites(previous);
      console.error(error);
    }
  };

  const filteredColors = colors.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.nameEn && c.nameEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.code.includes(searchQuery);
    const matchesFamily = selectedFamily === "all" || c.colorFamily === selectedFamily;
    const matchesTone = selectedTone === "all" || c.toneFamily === selectedTone;
    return matchesSearch && matchesFamily && matchesTone;
  });

  const toneFamilies = [
    { value: "all", label: language === "vi" ? "Tất cả tông" : "All tones" },
    { value: "warm", label: t.toneWarm },
    { value: "cool", label: t.toneCool },
    { value: "neutral", label: t.toneNeutral },
    { value: "pastel", label: t.tonePastel },
    { value: "bold", label: t.toneBold },
    { value: "earth", label: t.toneEarth },
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-atelier-paper text-atelier-ink">
      <div className="lg:border-x lg:border-atelier-rule mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,1.5rem)] pb-fl-2xl pt-fl-xl md:pt-fl-2xl">
        {/* Page head — label stacked above the heading, left-biased.
            The one load fade this page is allowed. */}
        <safeMotion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.24 }}
        >
          <div className="max-w-2xl">
            <EditorialHeading as="h1" scale="display-s" label={t.colorsCatalogLabel}>
              {t.colorCatalogTitle}
            </EditorialHeading>
            <p className="fl-measure-tight mt-fl-sm text-fl-sm text-atelier-ink-2">
              {t.colorCatalogSub}
            </p>
          </div>

          {/* Family selector — one continuous colour field, not a dropdown in a card.
              Each cell IS its colour; the selected cell grows and carries an ink rule. */}
          <div
            role="group"
            aria-label={t.filterColorFamily}
            className="no-scrollbar mt-fl-lg flex items-end gap-fl-3xs overflow-x-auto"
          >
            <button
              type="button"
              aria-pressed={selectedFamily === "all"}
              onClick={() => setSelectedFamily("all")}
              className="group flex min-w-[88px] flex-1 flex-col text-left"
            >
              <span
                className={cn(
                  "block w-full rounded-swatch border border-atelier-rule bg-atelier-paper-2 transition-[height] duration-fl-base ease-fl-out",
                  selectedFamily === "all" ? "h-20" : "h-12 group-hover:h-16",
                )}
              />
              <span
                className={cn(
                  "mt-fl-2xs block border-t pr-fl-2xs pt-fl-2xs text-fl-xs",
                  selectedFamily === "all"
                    ? "border-atelier-ink font-medium text-atelier-ink"
                    : "border-transparent text-atelier-ink-2",
                )}
              >
                {t.allColors}
              </span>
            </button>
            {COLOR_FAMILIES.map((family) => {
              const isSelected = selectedFamily === family.value;
              return (
                <button
                  key={family.value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedFamily(family.value)}
                  className="group flex min-w-[88px] flex-1 flex-col text-left"
                >
                  <ColorSwatch
                    color={family.swatch}
                    className={cn(
                      "fl-swatch w-full rounded-swatch transition-[height] duration-fl-base ease-fl-out",
                      isSelected ? "h-20" : "h-12 group-hover:h-16",
                    )}
                  />
                  <span
                    className={cn(
                      "mt-fl-2xs block border-t pr-fl-2xs pt-fl-2xs text-fl-xs",
                      isSelected
                        ? "border-atelier-ink font-medium text-atelier-ink"
                        : "border-transparent text-atelier-ink-2",
                    )}
                  >
                    {t[family.labelKey]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tone filter — C1 outlined rectangular chips — plus search on one hairline row */}
          <div className="mt-fl-md flex flex-col gap-fl-sm lg:flex-row lg:items-center lg:justify-between">
            <div
              role="group"
              aria-label={t.filterToneFamily}
              className="no-scrollbar -mx-1 flex gap-fl-2xs overflow-x-auto px-1 lg:flex-wrap lg:overflow-visible"
            >
              {toneFamilies.map((tone) => {
                const isSelected = selectedTone === tone.value;
                return (
                  <button
                    key={tone.value}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedTone(tone.value)}
                    className={cn(
                      "min-h-11 shrink-0 whitespace-nowrap rounded-control border px-fl-sm text-fl-sm transition-colors duration-fl-fast ease-fl-out md:min-h-9",
                      isSelected
                        ? "border-atelier-ink font-medium text-atelier-ink"
                        : "border-atelier-rule-strong text-atelier-ink-2 hover:border-atelier-ink-3 hover:text-atelier-ink",
                    )}
                  >
                    {tone.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-fl-sm lg:w-80 lg:shrink-0">
              <Input
                type="text"
                placeholder={t.searchColorPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label={t.searchColorPlaceholder}
              />
            </div>
          </div>

          <div className="mt-fl-md flex items-baseline justify-between gap-fl-sm">
            <p className="fl-label">
              {filteredColors.length} {language === "vi" ? "màu sắc" : "colours"}
            </p>
          </div>
          <Rule className="mt-fl-2xs" weight="strong" />
        </safeMotion.div>

        {/* Swatch index — hard-edged chips on hairlines, name + code always visible.
            The filter-change crossfade below is the one state crossfade for this page. */}
        <AnimatePresence mode="wait">
          <safeMotion.div
            key={selectedFamily + selectedTone + searchQuery}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.24 }}
          >
            {filteredColors.length > 0 ? (
              <div className="mt-fl-md grid grid-cols-2 gap-x-fl-sm sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {filteredColors.map((color) => {
                  const isFav = favorites.includes(color.code);
                  const colorName = language === "vi" ? color.name : (color.nameEn || color.name);
                  return (
                    <div
                      key={color.code}
                      className="relative flex flex-col border-b border-atelier-rule pb-fl-xs"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        aria-label={
                          language === "vi"
                            ? `Xem chi tiết màu ${colorName}`
                            : `View details for ${colorName}`
                        }
                        className="group flex min-w-0 flex-col gap-fl-2xs pt-fl-xs text-left"
                      >
                        <ColorSwatch
                          color={color.hex}
                          className="fl-swatch aspect-[4/3] w-full rounded-swatch transition-shadow duration-fl-fast ease-fl-out"
                        />
                        <span className="truncate text-fl-sm text-atelier-ink">{colorName}</span>
                        <span className="fl-label">#{color.code}</span>
                      </button>
                      <button
                        type="button"
                        aria-pressed={isFav}
                        aria-label={
                          isFav
                            ? language === "vi"
                              ? `Bỏ màu ${colorName} khỏi yêu thích`
                              : `Remove ${colorName} from favorites`
                            : language === "vi"
                              ? `Lưu màu ${colorName} vào yêu thích`
                              : `Save ${colorName} to favorites`
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(color.code);
                        }}
                        className="absolute right-fl-2xs top-fl-sm flex h-8 w-8 items-center justify-center rounded-control bg-atelier-paper/90 text-atelier-ink-2 transition-colors duration-fl-fast ease-fl-out hover:text-atelier-danger"
                      >
                        <Heart
                          className={cn(
                            "h-3.5 w-3.5",
                            isFav && "fill-[var(--fl-danger)] text-atelier-danger",
                          )}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Intentional editorial empty state: a rule, a line of copy, one action. */
              <div className="mt-fl-lg max-w-md border-t border-atelier-rule-strong pt-fl-md">
                <p className="fl-display text-fl-2xl text-atelier-ink">
                  {language === "vi" ? "Không tìm thấy màu phù hợp" : "No colours match"}
                </p>
                <p className="mt-fl-2xs text-fl-sm text-atelier-ink-2">
                  {language === "vi"
                    ? "Thử đổi nhóm màu, tông màu hoặc từ khóa tìm kiếm."
                    : "Try a different family, tone, or search term."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFamily("all");
                    setSelectedTone("all");
                    setSearchQuery("");
                  }}
                  className="mt-fl-sm inline-flex min-h-11 items-center whitespace-nowrap text-fl-sm font-medium text-atelier-accent underline decoration-1 underline-offset-4 transition-[text-decoration-thickness] duration-fl-fast ease-fl-out hover:decoration-2 md:min-h-6"
                >
                  {language === "vi" ? "Xóa bộ lọc" : "Clear filters"}
                </button>
              </div>
            )}
          </safeMotion.div>
        </AnimatePresence>
      </div>

      {/* Color Detail Side Panel */}
      <ColorDetailDrawer
        selectedColor={selectedColor}
        onClose={() => setSelectedColor(null)}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
        language={language}
      />
    </div>
  );
}
