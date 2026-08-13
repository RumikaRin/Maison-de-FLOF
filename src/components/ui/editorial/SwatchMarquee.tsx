"use client";

import { ColorSwatch } from "@/components/ui/color-swatch";

export type SwatchMarqueeItem = {
  code: string;
  name: string;
  hex: string;
};

export type SwatchMarqueeProps = {
  items: SwatchMarqueeItem[];
  /** Background class matching the section it sits on. */
  className?: string;
};

/**
 * A slim hairline-bounded strip of real catalogue colours drifting slowly
 * sideways (studied from luxury-furniture.aura.build's marquee, carried with
 * honest content — every cell is a real shade, name and code). The track holds
 * the list twice and travels -50% for a seamless loop; the second copy is
 * aria-hidden. Max one per page. Reduced-motion stops the drift and the first
 * copy reads as a static index.
 */
export function SwatchMarquee({ items, className }: SwatchMarqueeProps) {
  if (items.length < 4) return null;

  const cells = (hidden: boolean) => (
    <div
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center"
    >
      {items.map((item) => (
        <span
          key={`${hidden ? "b" : "a"}-${item.code}`}
          className="flex items-center gap-fl-2xs pr-fl-xl"
        >
          <ColorSwatch
            color={item.hex}
            className="fl-swatch h-4 w-4 shrink-0 rounded-swatch"
          />
          <span className="fl-label whitespace-nowrap">
            {item.name} · {item.code}
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div className={`fl-marquee border-y border-atelier-rule py-fl-xs ${className ?? ""}`}>
      <div className="fl-marquee-track">
        {cells(false)}
        {cells(true)}
      </div>
    </div>
  );
}
