/* Hallmark · genre: editorial · macrostructure: 08 Photographic · design-system: design.md · designed-as-app */ "use client";

import { useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CspImage as Image } from "@/components/ui/csp-image";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { cn } from "@/lib/utils";
import { safeMotion, AnimatePresence, useReducedMotion } from "@/components/ui/motion-safe";
import { ColorSwatch } from "@/components/ui/color-swatch";
import { toast } from "@/components/ui/csp-toast";
import { getApiErrorMessage } from "@/lib/api-error-contract";
import { AsyncState } from "@/components/ui/AsyncState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DrenchBand,
  EditorialHeading,
  EditorialSection,
  Rule,
  SpecLedger,
} from "@/components/ui/editorial";

const CURATED_COMBINATIONS = [
  {
    id: "sage_ivory",
    name: "Soft Sage & Ivory",
    nameVi: "Xanh Rêu & Trắng Ngà",
    theme: "Palette 1 - Bình Yên",
    themeEn: "Palette 1 - Tranquil",
    mainHex: "#4A6741",
    accentHex: "#F5F0E8",
    ceilingHex: "#FFFFFF",
    descriptionVi: "Sự kết hợp giữa xanh rêu đất mộc mạc và trắng ngà ấm áp, mang lại sự bình yên, thư thái.",
    descriptionEn: "A rustic sage green paired with warm ivory white, delivering serene tranquility.",
    images: {
      facade: "/facade_sage.webp",
      living: "/living_sage.webp",
      bedroom: "/bedroom_sage.webp",
      kitchen: "/kitchen_sage.webp"
    }
  },
  {
    id: "beige_cream",
    name: "Warm Beige & Cream",
    nameVi: "Be Cát & Kem Vani",
    theme: "Palette 2 - Ấm Áp",
    themeEn: "Palette 2 - Cozy Warmth",
    mainHex: "#D4C4A8",
    accentHex: "#F3E5D0",
    ceilingHex: "#FFFFFF",
    descriptionVi: "Tông màu trung tính be cát ấm kết hợp kem vani ngọt ngào tạo cảm giác rộng rãi, dễ chịu.",
    descriptionEn: "Earth-toned sandy beige combined with sweet vanilla cream for a spacious, cozy look.",
    images: {
      facade: "/facade_beige.webp",
      living: "/living_beige.webp",
      bedroom: "/bedroom_beige.webp",
      kitchen: "/kitchen_beige.webp"
    }
  },
  {
    id: "terracotta_oak",
    name: "Terracotta & Warm Oak",
    nameVi: "Cam Đất & Gỗ Sồi Ấm",
    theme: "Palette 3 - Sang Trọng",
    themeEn: "Palette 3 - Premium Earthy",
    mainHex: "#CC7722",
    accentHex: "#6F4E37",
    ceilingHex: "#FFFFFF",
    descriptionVi: "Màu cam đất ấm kết hợp sắc nâu gỗ sồi sang trọng mang đậm tinh thần kiến trúc hiện đại.",
    descriptionEn: "Warm terracotta earth tones styled with premium oak wood brown for a timeless design.",
    images: {
      facade: "/facade_terracotta.webp",
      living: "/living_terracotta.webp",
      bedroom: "/bedroom_terracotta.webp",
      kitchen: "/kitchen_terracotta.webp"
    }
  },
  {
    id: "grey_charcoal",
    name: "Mist Grey & Charcoal",
    nameVi: "Xám Sương & Than Củi",
    theme: "Palette 4 - Hiện Đại",
    themeEn: "Palette 4 - Architectural",
    mainHex: "#E2E5E6",
    accentHex: "#333333",
    ceilingHex: "#FFFFFF",
    descriptionVi: "Sự tương phản sắc nét giữa xám sương mù và xám than củi đậm chất đô thị tối giản.",
    descriptionEn: "A sharp contrast of mist grey and deep charcoal slate, perfect for modern minimalism.",
    images: {
      facade: "/facade_grey.webp",
      living: "/living_grey.webp",
      bedroom: "/bedroom_grey.webp",
      kitchen: "/kitchen_grey.webp"
    }
  },
  {
    id: "ocean_sand",
    name: "Ocean Breeze & Sand",
    nameVi: "Xanh Biển & Cát Ấm",
    theme: "Palette 5 - Thư Thái",
    themeEn: "Palette 5 - Coastal Breeze",
    mainHex: "#859FAD",
    accentHex: "#E5DDD0",
    ceilingHex: "#FFFFFF",
    descriptionVi: "Không gian mang hơi gió biển khơi mát mẻ từ xanh pastel dịu và sắc cát ấm bình yên.",
    descriptionEn: "A cool ocean breeze style with soft pastel blue paired with peaceful sand beige.",
    images: {
      facade: "/facade_p5.webp",
      living: "/living_p5.webp",
      bedroom: "/bedroom_p5.webp",
      kitchen: "/kitchen_p5.webp"
    }
  },
  {
    id: "classic_gold",
    name: "Classic Gold & Olive",
    nameVi: "Vàng Cổ Điển & Xanh Rêu",
    theme: "Palette 6 - Cổ Điển",
    themeEn: "Palette 6 - Classic Antique",
    mainHex: "#E5B25D",
    accentHex: "#6B705C",
    ceilingHex: "#FFFFFF",
    descriptionVi: "Sự kết hợp hoài cổ, ấm cúng và đầy tính nghệ thuật giữa vàng mù tạt cổ điển và xanh ô-liu trầm ấm.",
    descriptionEn: "A nostalgic, warm and artistic combination of classic mustard gold and warm olive green.",
    images: {
      facade: "/facade_p6.webp",
      living: "/living_p6.webp",
      bedroom: "/bedroom_p6.webp",
      kitchen: "/kitchen_p6.webp"
    }
  }
];

type VisualizerRoom = {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  baseImage: string;
};

type PaletteEntry = {
  zone: string;
  colorCode: string;
  hex: string;
};

type VisualizerDesign = {
  id: string;
  roomId: string;
  name: string;
  palette: PaletteEntry[];
  updatedAt: string;
  room: {
    id: string;
    slug: string;
    name: string;
    nameEn: string;
  };
};

export function VisualizerClient() {
  const { language } = useLanguageStore();
  const t = useTrans(language);
  const { status: sessionStatus } = useSession();
  const reduceMotion = useReducedMotion();

  const [rooms, setRooms] = useState<VisualizerRoom[]>([]);
  const [roomStatus, setRoomStatus] = useState<"loading" | "ready" | "error">("loading");
  const [activeRoomId, setActiveRoomId] = useState("");
  const [selectedComboId, setSelectedComboId] = useState("sage_ivory");
  const [mounted, setMounted] = useState(false);
  const [designs, setDesigns] = useState<VisualizerDesign[]>([]);
  const [designName, setDesignName] = useState("");
  const [designNames, setDesignNames] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(false);

  const loadRooms = useCallback(async () => {
    setRoomStatus("loading");
    try {
      const response = await fetch("/api/visualizer/rooms");
      if (!response.ok) throw new Error("ROOMS_UNAVAILABLE");
      const body = (await response.json()) as { data: VisualizerRoom[] };
      setRooms(body.data);
      setActiveRoomId((current) => current || body.data[0]?.id || "");
      setRoomStatus("ready");
    } catch {
      setRoomStatus("error");
    }
  }, []);

  const loadDesigns = useCallback(async () => {
    if (sessionStatus !== "authenticated") return;
    try {
      const response = await fetch("/api/visualizer/designs");
      if (!response.ok) throw new Error("DESIGNS_UNAVAILABLE");
      const body = (await response.json()) as { data: VisualizerDesign[] };
      setDesigns(body.data);
      setDesignNames(
        Object.fromEntries(body.data.map((design) => [design.id, design.name])),
      );
    } catch {
      toast.error(
        language === "vi"
          ? "Không thể tải thiết kế đã lưu."
          : "Saved designs could not be loaded.",
      );
    }
  }, [language, sessionStatus]);

  useEffect(() => {
    setMounted(true);
    void loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    void loadDesigns();
  }, [loadDesigns]);

  if (!mounted) return null;
  if (roomStatus === "loading") {
    return (
      <div className="min-h-[70vh] bg-atelier-paper px-fl-sm pt-fl-3xl">
        <AsyncState
          status="loading"
          title={
            language === "vi"
              ? "Đang tải không gian phối màu…"
              : "Loading visualizer rooms…"
          }
        />
      </div>
    );
  }
  if (roomStatus === "error") {
    return (
      <div className="min-h-[70vh] bg-atelier-paper px-fl-sm pt-fl-3xl">
        <AsyncState
          status="error"
          title={
            language === "vi"
              ? "Không thể tải không gian phối màu"
              : "Visualizer rooms could not be loaded"
          }
          retryLabel={language === "vi" ? "Thử lại" : "Retry"}
          onRetry={() => void loadRooms()}
        />
      </div>
    );
  }
  if (rooms.length === 0) {
    return (
      <div className="min-h-[70vh] bg-atelier-paper px-fl-sm pt-fl-3xl">
        <AsyncState
          status="empty"
          title={
            language === "vi"
              ? "Chưa có không gian phối màu khả dụng"
              : "No visualizer rooms are available"
          }
        />
      </div>
    );
  }

  const activeRoom = rooms.find((room) => room.id === activeRoomId) ?? rooms[0];
  const currentCombo = CURATED_COMBINATIONS.find(c => c.id === selectedComboId) || CURATED_COMBINATIONS[0];

  // Wall color values matching active combo
  const wallMainColor = currentCombo.mainHex;
  const wallAccentColor = currentCombo.accentHex;
  const ceilingColor = currentCombo.ceilingHex;

  // Active pre-rendered image path
  const imageSrc =
    currentCombo.images[activeRoom.slug as keyof typeof currentCombo.images] ??
    activeRoom.baseImage;

  const handleReset = () => {
    setSelectedComboId("sage_ivory");
  };

  const surfaces = [
    { value: "wallMain" as const, label: t.paintWallMain, color: wallMainColor },
    { value: "wallAccent" as const, label: t.paintWallAccent, color: wallAccentColor },
    { value: "ceiling" as const, label: t.paintCeiling, color: ceilingColor },
  ];

  const currentPalette: PaletteEntry[] = surfaces.map((surface) => ({
    zone: surface.value,
    colorCode: `${currentCombo.id}-${surface.value}`,
    hex: surface.color,
  }));

  async function saveDesign() {
    if (sessionStatus !== "authenticated") {
      setLoginPrompt(true);
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/visualizer/designs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          roomId: activeRoom.id,
          name:
            designName.trim() ||
            (language === "vi" ? "Thiết kế mới" : "New design"),
          palette: currentPalette,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(body, "Không thể lưu thiết kế"),
        );
      }
      setDesignName("");
      toast.success(language === "vi" ? "Đã lưu thiết kế." : "Design saved.");
      await loadDesigns();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể lưu thiết kế",
      );
    } finally {
      setSaving(false);
    }
  }

  function openDesign(design: VisualizerDesign) {
    setActiveRoomId(design.roomId);
    const main = design.palette.find((entry) => entry.zone === "wallMain")?.hex;
    const accent = design.palette.find((entry) => entry.zone === "wallAccent")?.hex;
    const match = CURATED_COMBINATIONS.find(
      (combo) => combo.mainHex === main && combo.accentHex === accent,
    );
    if (match) setSelectedComboId(match.id);
  }

  async function renameDesign(design: VisualizerDesign) {
    const name = designNames[design.id]?.trim();
    if (!name) return;
    const response = await fetch(`/api/visualizer/designs/${design.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) {
      toast.error(language === "vi" ? "Không thể đổi tên." : "Rename failed.");
      return;
    }
    toast.success(language === "vi" ? "Đã đổi tên thiết kế." : "Design renamed.");
    await loadDesigns();
  }

  async function removeDesign(design: VisualizerDesign) {
    const response = await fetch(`/api/visualizer/designs/${design.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      toast.error(language === "vi" ? "Không thể xóa thiết kế." : "Delete failed.");
      return;
    }
    toast.success(language === "vi" ? "Đã xóa thiết kế." : "Design deleted.");
    await loadDesigns();
  }

  return (
    <div className="min-h-screen bg-atelier-paper text-atelier-ink">

      {/* Photographic fold — the room photograph is the hero; text sits on it,
          left-biased. The load fade is motion primitive 1 of 2 for this page. */}
      <section className="fl-photo-fold fl-photo-plate flex min-h-[420px] w-full items-end overflow-hidden bg-atelier-espresso md:h-[56vh] md:max-h-[640px]">
        <safeMotion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          <Image
            src="/facade_sage.webp"
            alt={
              language === "vi"
                ? "Mặt tiền nhà sơn màu xanh rêu"
                : "House facade painted in sage green"
            }
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
            <p className="fl-label">
              {language === "vi" ? "Công cụ số" : "Digital tool"}
            </p>
            <h1 className="fl-display mt-fl-xs text-fl-display-s text-atelier-on-dark">
              {language === "vi" ? "Công cụ phối màu" : "Colour visualizer"}
            </h1>
            <p className="fl-measure-tight mt-fl-md text-fl-md text-atelier-on-dark">
              {language === "vi"
                ? "Tìm màu sắc hoàn hảo cho ngôi nhà của bạn chỉ bằng một cú chạm — thử trên phòng mẫu trước khi mua."
                : "Find the ideal palette for your home in a tap — preview on sample rooms before you buy."}
            </p>
          </div>
        </div>
      </section>

      {/* Narrow text fold between photographs — left-biased, never centred */}
      <EditorialSection rhythm="tight">
        <p className="fl-measure max-w-3xl text-fl-md text-atelier-ink-2">
          {language === "vi"
            ? "Trải nghiệm không gian sống chân thực với các tùy chọn phối màu sơn thực tế được phối sắc tỉ mỉ. Thay đổi màu sắc trên các bức tường, mặt tiền kiến trúc một cách thông minh và chiêm ngưỡng các thiết kế thực tế."
            : "Experience realistic living spaces with dual-color combination presets from our premium collection. Intelligently update architectural details and view real-world paint coordinates."}
        </p>
      </EditorialSection>

      {/* Workspace — one large room stage dominates; controls sit on hairlines */}
      <EditorialSection rhythm="base" id="interactive-tool" className="border-t border-atelier-rule">
        <div className="max-w-2xl">
          <EditorialHeading as="h2" scale="3xl" label={t.visualizerStageLabel}>
            {language === "vi" ? "Màu sắc ngôi nhà bạn" : "Colors of your house"}
          </EditorialHeading>
          <p className="fl-measure-tight mt-fl-sm text-fl-sm text-atelier-ink-2">
            {language === "vi"
              ? "Thử nghiệm các bộ phối màu sơn thực tế được dựng 3D sắc nét. Chọn bộ màu để thay đổi không gian."
              : "Experiment with photo-realistic pre-rendered palettes. Pick a preset to repaint the space."}
          </p>
        </div>

        <div className="mt-fl-lg grid grid-cols-1 items-start gap-y-fl-lg lg:grid-cols-12 lg:gap-x-fl-lg">
          {/* Stage — 8 of 12 */}
          <div className="lg:col-span-8">
            {/* Room switcher — restrained editorial controls on a hairline */}
            <div className="flex flex-wrap items-baseline justify-between gap-x-fl-md gap-y-fl-2xs border-b border-atelier-rule pb-fl-2xs">
              <div
                role="group"
                aria-label={t.selectSpace}
                className="no-scrollbar -mx-1 flex gap-fl-md overflow-x-auto px-1"
              >
                {rooms.map((room) => {
                  const isActive = activeRoomId === room.id;
                  return (
                    <button
                      key={room.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => {
                        setActiveRoomId(room.id);
                      }}
                      className={cn( "min-h-11 shrink-0 whitespace-nowrap border-b-2 pb-fl-3xs text-fl-sm transition-colors duration-fl-fast ease-fl-out md:min-h-6",
                        isActive
                          ? "border-atelier-ink font-medium text-atelier-ink"
                          : "border-transparent text-atelier-ink-2 hover:text-atelier-ink",
                      )}
                    >
                      {language === "vi" ? room.name : room.nameEn}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={handleReset}
                aria-label={language === "vi" ? "Đặt lại bảng màu" : "Reset palette"}
                className="min-h-11 shrink-0 whitespace-nowrap text-fl-sm text-atelier-ink-2 underline decoration-1 underline-offset-4 transition-colors duration-fl-fast ease-fl-out hover:text-atelier-ink md:min-h-6"
              >
                {language === "vi" ? "Đặt lại" : "Reset"}
              </button>
            </div>

            {/* The stage. State crossfade — motion primitive 2 of 2 for this page. */}
            <div className="relative mt-fl-sm aspect-[4/3] w-full overflow-hidden rounded-surface bg-atelier-paper-2 sm:aspect-[16/10]">
              <AnimatePresence mode="wait">
                <safeMotion.div
                  key={`${activeRoom.id}-${currentCombo.id}`}
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.24 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={imageSrc}
                    alt={activeRoom.name}
                    fill
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    className="object-cover"
                  />
                </safeMotion.div>
              </AnimatePresence>
            </div>

            {/* Caption under the plate, editorial-figure style — no floating chip */}
            <div className="flex flex-wrap items-baseline justify-between gap-fl-2xs border-b border-atelier-rule py-fl-xs">
              <p className="text-fl-sm text-atelier-ink">
                {language === "vi"
                  ? `${activeRoom.name} · ${currentCombo.nameVi}`
                  : `${activeRoom.nameEn} · ${currentCombo.name}`}
              </p>
              <p className="fl-label">
                {language === "vi" ? currentCombo.theme : currentCombo.themeEn}
              </p>
            </div>

            {/* Current shades — flat ledger keyed to the selected palette */}
            <SpecLedger
              className="mt-fl-sm border-t-0"
              columns={4}
              rows={[
                ...surfaces.map((surface) => ({
                  label: surface.label,
                  value: (
                    <span className="inline-flex items-center gap-fl-2xs">
                      <ColorSwatch
                        color={surface.color}
                        className="fl-swatch h-4 w-4 shrink-0 rounded-swatch"
                      />
                      <span className="tabular-nums">{surface.color}</span>
                    </span>
                  ),
                })),
                {
                  label: language === "vi" ? "Bộ phối" : "Palette",
                  value: language === "vi" ? currentCombo.nameVi : currentCombo.name,
                },
              ]}
            />
          </div>

          {/* Controls — 4 of 12, restrained rows on hairlines, no nested cards */}
          <div className="lg:col-span-4">
            <p className="fl-label">{t.visualizerPalettesLabel}</p>
            <div className="mt-fl-2xs flex flex-col">
              {CURATED_COMBINATIONS.map((combo) => {
                const isActive = selectedComboId === combo.id;
                return (
                  <button
                    key={combo.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setSelectedComboId(combo.id)}
                    className="flex min-h-11 flex-col gap-fl-2xs border-b border-atelier-rule py-fl-xs text-left"
                  >
                    <span className="flex items-center gap-fl-2xs">
                      <ColorSwatch
                        color={combo.mainHex}
                        className={cn( "h-8 w-8 shrink-0 rounded-swatch transition-shadow duration-fl-fast ease-fl-out",
                          isActive
                            ? "shadow-[0_0_0_2px_var(--fl-ink)]"
                            : "shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]",
                        )}
                      />
                      <ColorSwatch
                        color={combo.accentHex}
                        className={cn( "h-8 w-8 shrink-0 rounded-swatch transition-shadow duration-fl-fast ease-fl-out",
                          isActive
                            ? "shadow-[0_0_0_2px_var(--fl-ink)]"
                            : "shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]",
                        )}
                      />
                      <span
                        className={cn( "ml-fl-2xs min-w-0 truncate text-fl-sm",
                          isActive
                            ? "font-medium text-atelier-ink"
                            : "text-atelier-ink-2",
                        )}
                      >
                        {language === "vi" ? combo.nameVi : combo.name}
                      </span>
                    </span>
                    <span className="fl-label">
                      {language === "vi" ? combo.theme : combo.themeEn}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-fl-xs text-fl-sm text-atelier-ink-2">
              {language === "vi"
                ? currentCombo.descriptionVi
                : currentCombo.descriptionEn}
            </p>

            {/* Saved designs — same hairline vocabulary */}
            <div className="mt-fl-lg border-t border-atelier-rule-strong pt-fl-sm">
              <h3 className="font-serif text-fl-lg text-atelier-ink">
                {language === "vi" ? "Thiết kế của tôi" : "My designs"}
              </h3>
              <div className="mt-fl-xs flex gap-fl-2xs">
                <Input
                  value={designName}
                  onChange={(event) => setDesignName(event.target.value)}
                  maxLength={80}
                  placeholder={language === "vi" ? "Tên thiết kế" : "Design name"}
                  aria-label={language === "vi" ? "Tên thiết kế mới" : "New design name"}
                  className="min-w-0 flex-1"
                />
                <Button
                  type="button"
                  disabled={saving}
                  data-state={saving ? "loading" : undefined}
                  onClick={() => void saveDesign()}
                  className="shrink-0"
                >
                  {language === "vi" ? "Lưu" : "Save"}
                </Button>
              </div>

              {loginPrompt && sessionStatus !== "authenticated" ? (
                <div className="mt-fl-sm border-l-2 border-atelier-rule-strong pl-fl-sm text-fl-sm text-atelier-ink-2">
                  <p>
                    {language === "vi"
                      ? "Bạn có thể thử phối màu với tư cách khách. Hãy đăng nhập để lưu thiết kế."
                      : "Guests can experiment freely. Sign in to save this design."}
                  </p>
                  <Link
                    href="/login?callbackUrl=/color-visualizer"
                    className="mt-fl-2xs inline-flex min-h-11 items-center whitespace-nowrap font-medium text-atelier-accent underline decoration-1 underline-offset-4 transition-[text-decoration-thickness] duration-fl-fast ease-fl-out hover:decoration-2 md:min-h-6"
                  >
                    {language === "vi" ? "Đăng nhập" : "Sign in"}
                  </Link>
                </div>
              ) : null}

              {sessionStatus === "authenticated" ? (
                <div className="mt-fl-sm" aria-label="Saved visualizer designs">
                  {designs.length === 0 ? (
                    <p className="text-fl-sm text-atelier-ink-2">
                      {language === "vi"
                        ? "Chưa có thiết kế đã lưu."
                        : "No saved designs yet."}
                    </p>
                  ) : (
                    designs.map((design) => (
                      <div
                        key={design.id}
                        className="border-b border-atelier-rule py-fl-xs"
                      >
                        <button
                          type="button"
                          onClick={() => openDesign(design)}
                          className="min-h-11 text-left text-fl-sm font-medium text-atelier-accent underline decoration-1 underline-offset-4 transition-[text-decoration-thickness] duration-fl-fast ease-fl-out hover:decoration-2 md:min-h-6"
                        >
                          {language === "vi" ? "Mở" : "Open"} · {design.room.name}
                        </button>
                        <div className="mt-fl-2xs flex flex-wrap gap-fl-2xs">
                          <Input
                            value={designNames[design.id] ?? design.name}
                            onChange={(event) =>
                              setDesignNames((current) => ({
                                ...current,
                                [design.id]: event.target.value,
                              }))
                            }
                            maxLength={80}
                            aria-label={`${language === "vi" ? "Tên thiết kế" : "Design name"} ${design.name}`}
                            className="min-w-0 flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void renameDesign(design)}
                            aria-label={`${language === "vi" ? "Đổi tên" : "Rename"} ${design.name}`}
                          >
                            {language === "vi" ? "Đổi tên" : "Rename"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void removeDesign(design)}
                            aria-label={`${language === "vi" ? "Xóa" : "Delete"} ${design.name}`}
                            className="text-atelier-danger"
                          >
                            {language === "vi" ? "Xóa" : "Delete"}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </EditorialSection>

      {/* Showroom — the section is drenched in a real paint colour (clay).
          The single drench band on this page. */}
      <DrenchBand color="clay" className="py-fl-3xl md:py-fl-4xl">
        <div className="mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,1.5rem)]">
          <div className="grid grid-cols-1 items-center gap-y-fl-lg lg:grid-cols-12 lg:gap-x-fl-lg">
            <div className="lg:col-span-5">
              <p className="fl-label">Showroom</p>
              <h2 className="fl-display mt-fl-xs text-fl-3xl">
                {language === "vi"
                  ? "Xem trực tiếp màu sơn tại showroom"
                  : "See the colours in person"}
              </h2>
              <p className="fl-measure-tight mt-fl-md text-fl-sm ">
                {language === "vi"
                  ? "Đến trực tiếp các đại lý ủy quyền của Maison de FLOF để trải nghiệm hệ thống cây màu, quạt màu chuẩn xác nhất dưới nhiều điều kiện ánh sáng thực tế. Đội ngũ chuyên gia của chúng tôi sẵn sàng hỗ trợ bạn lựa chọn dòng sơn tối ưu và tiến hành pha màu sơn tự động ngay tại quầy."
                  : "Visit Maison de FLOF authorized dealers to view real color cards, swatches, and fan decks under various lighting conditions. Our showroom advisors will help you select matching paint categories and tint them instantly."}
              </p>
              <div className="mt-fl-lg">
                {/* On a drench the action flips to the band ink — teal is invisible here */}
                <Link
                  href="/find-dealer"
                  className="inline-flex min-h-11 items-center whitespace-nowrap rounded-control bg-atelier-on-dark px-fl-lg py-fl-xs text-fl-sm font-medium text-atelier-espresso transition-opacity duration-fl-fast ease-fl-out hover:opacity-90 md:min-h-10"
                >
                  {language === "vi" ? "Tìm đại lý gần nhất" : "Find the nearest showroom"}
                </Link>
              </div>
            </div>
            <div className="lg:col-span-7">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-surface">
                <Image
                  src="https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=800"
                  alt={
                    language === "vi"
                      ? "Trải nghiệm màu sơn tại showroom Maison de FLOF"
                      : "Maison de FLOF showroom colour experience"
                  }
                  fill
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className="object-cover"
                />
              </div>
              <Rule className="mt-fl-sm" />
              <p className="mt-fl-2xs text-fl-xs ">
                {language === "vi"
                  ? "Khối này được sơn màu đất nung — một sắc độ thật trong bảng màu FLOF."
                  : "This section is painted in a real clay shade from the FLOF range."}
              </p>
            </div>
          </div>
        </div>
      </DrenchBand>

    </div>
  );
}
