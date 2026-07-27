/* Hallmark · genre: editorial · section: store overview · knobs: continuous editorial list on hairlines, lead image=8/4, quote=T1-style margin · design-system: design.md · designed-as-app */
"use client";

import { useLanguageStore } from "@/store/language-store";
import {
  EditorialSection,
  EditorialHeading,
  Rule,
  TypographicLink,
} from "@/components/ui/editorial";
import { SliceImage } from "@/components/ui/slice-image";
import { DotField } from "@/components/ui/dot-field";

/**
 * Store overview — the buying paths as one continuous editorial list on
 * hairline rules, with a single lead image. No repeated card grid, no icon
 * tiles (design spec § Store overview).
 */
export function StoreOverviewSection() {
  const { language } = useLanguageStore();

  const paths = [
    {
      titleVi: "Catalog sơn đầy đủ",
      titleEn: "The full paint catalogue",
      bodyVi:
        "Nội thất, ngoại thất, lót, chống thấm — kèm finish và thông số coverage.",
      bodyEn:
        "Interior, exterior, primers, waterproofing — with finish and coverage specs.",
      href: "/products",
      ctaVi: "Vào cửa hàng",
      ctaEn: "Enter the store",
    },
    {
      titleVi: "Màu và chất lượng",
      titleEn: "Colour and quality",
      bodyVi:
        "Hơn 1000 mã màu, visualizer phòng mẫu, sản phẩm chính hãng có theo dõi tồn.",
      bodyEn:
        "1000+ colour codes, a room visualizer, authentic stock with inventory tracking.",
      href: "/colors",
      ctaVi: "Xem bảng màu",
      ctaEn: "Browse colours",
    },
    {
      titleVi: "Mua online linh hoạt",
      titleEn: "Flexible online buying",
      bodyVi:
        "Giỏ hàng, mã giảm giá, COD / chuyển khoản / VNPay demo, theo dõi đơn trong hồ sơ.",
      bodyEn:
        "Cart, coupons, COD / transfer / VNPay demo, order tracking in your profile.",
      href: "/quote-request",
      ctaVi: "Báo giá công trình",
      ctaEn: "Project quote",
    },
    {
      titleVi: "Đại lý gần bạn",
      titleEn: "Dealers near you",
      bodyVi:
        "Bản đồ đại lý ủy quyền theo tỉnh/thành — mua online hoặc ghé cửa hàng.",
      bodyEn:
        "An authorised dealer map by province — buy online or visit in person.",
      href: "/find-dealer",
      ctaVi: "Tìm đại lý",
      ctaEn: "Find a dealer",
    },
  ];

  return (
    <EditorialSection rhythm="base" frame className="fl-rise bg-atelier-paper" id="store-overview">
      <DotField
        dotRadius={1}
        dotSpacing={28}
        cursorRadius={160}
        bulgeStrength={18}
        waveAmplitude={2}
        gradientFrom="rgba(46, 42, 36, 0.05)"
        gradientTo="rgba(46, 42, 36, 0.03)"
      />
      <div className="relative grid grid-cols-1 gap-y-fl-lg lg:grid-cols-12 lg:gap-x-fl-lg">
        {/* Lead column — heading + one lead image, 8 of 12 */}
        <div className="lg:col-span-8">
          <EditorialHeading
            as="h2"
            scale="3xl"
            label={language === "vi" ? "Tổng quan cửa hàng" : "Store overview"}
          >
            {language === "vi"
              ? "Chọn đúng đường mua sơn cho bạn"
              : "Choose the right way to buy paint"}
          </EditorialHeading>

          <figure className="mt-fl-lg">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-surface bg-atelier-paper-2">
              <SliceImage
                src="/generated/hero-cinematic.jpg"
                alt={
                  language === "vi"
                    ? "Không gian sống với sơn FLOF"
                    : "A living space with FLOF paint"
                }
                sizes="(min-width: 1024px) 60vw, 100vw"
              />
            </div>
            <figcaption className="mt-fl-2xs border-b border-atelier-rule pb-fl-xs">
              <span className="fl-label">
                {language === "vi"
                  ? "Showroom số + thương mại điện tử"
                  : "Digital showroom + e-commerce"}
              </span>
            </figcaption>
          </figure>

          <blockquote className="fl-measure mt-fl-md font-serif text-fl-xl text-atelier-ink">
            {language === "vi"
              ? "“Chọn màu không còn là đoán mò — bạn thấy trước, rồi mới mua.”"
              : "“Choosing colour is no longer guesswork — you preview, then buy.”"}
          </blockquote>
        </div>

        {/* Index column — the four buying paths as a continuous list, 4 of 12 */}
        <div className="lg:col-span-4 lg:border-l lg:border-atelier-rule lg:pl-fl-lg">
          <ol className="flex flex-col">
            {paths.map((path) => (
              <li key={path.href} className="border-b border-atelier-rule py-fl-md first:pt-0">
                <h3 className="font-serif text-fl-lg text-atelier-ink">
                  {language === "vi" ? path.titleVi : path.titleEn}
                </h3>
                <p className="mt-fl-2xs text-fl-sm text-atelier-ink-2">
                  {language === "vi" ? path.bodyVi : path.bodyEn}
                </p>
                <TypographicLink href={path.href} className="mt-fl-xs">
                  {language === "vi" ? path.ctaVi : path.ctaEn}
                </TypographicLink>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <Rule className="mt-fl-xl" weight="strong" />
    </EditorialSection>
  );
}
