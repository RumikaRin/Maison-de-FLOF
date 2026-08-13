/* Hallmark · genre: editorial · section: H6 Photographic fold · knobs: image=full-bleed 72vh, caption=lower-left, text=left-bias · design-system: design.md · designed-as-app */

import { CspImage as Image } from "@/components/ui/csp-image";
import { HeroContent, HeroMetadataBar } from "./HeroContent";

/**
 * H6 Photographic fold — the room photograph is the hero. Text sits on it,
 * left-biased, never centred. Deliberately NOT full viewport height so the
 * product editorial below stays reachable (design spec § Hero).
 *
 * Converted to pure React Server Component (RSC) with isolated leaf Client Components
 * for maximum HTML streaming efficiency and reduced JS bundle footprint.
 */
export function HeroSection() {
  return (
    <>
      <section className="fl-photo-fold fl-photo-plate flex min-h-[620px] w-full items-end overflow-hidden bg-atelier-espresso md:h-[80vh] md:max-h-[860px]">
        {/* Full-bleed media — the one hero load transition the system allows */}
        <div className="absolute inset-0">
          <Image
            src="/generated/hero-cinematic.jpg"
            alt="Maison de FLOF — Không gian sống với màu sơn cao cấp"
            fill
            priority
            fetchPriority="high"
            quality={82}
            sizes="100vw"
            className="fl-photo-zoomout fl-photo-zoomout-soft object-cover object-center"
          />
          {/* Legibility scrim, bottom-left weighted like a printed caption field */}
          <div aria-hidden="true" className="fl-photo-scrim" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,1.5rem)] pb-fl-2xl pt-fl-4xl md:pb-[4rem] md:pt-[12rem]">
          <HeroContent />
        </div>
      </section>

      {/* Plate line — hairline technical metadata strip */}
      <HeroMetadataBar />
    </>
  );
}
