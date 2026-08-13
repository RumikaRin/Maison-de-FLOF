import * as React from "react";

import { cn } from "@/lib/utils";
import type { DrenchColor } from "./DrenchBand";

const EDGE_TEXT_CLASS: Record<DrenchColor, string> = {
  sage: "text-atelier-sage",
  clay: "text-atelier-clay",
  slate: "text-atelier-slate",
  ochre: "text-atelier-ochre",
  espresso: "text-atelier-espresso",
};

export type BandEdgeProps = {
  /** The drench band this edge flows into — its colour fills the wave. */
  color: DrenchColor;
  /** Background class matching the section above, e.g. `bg-atelier-paper-2`. */
  className?: string;
};

/**
 * A hand-built Tier-B enrichment (design.md § Per-page allowances, Marketing
 * only): the top edge of a drench band drawn as an irregular painted wave with
 * two echo lines above it, the way a loaded brush leaves ridge lines at the
 * edge of a stroke. Purely decorative, static, token-coloured via
 * `currentColor` — use at most once per page so it stays an accent.
 *
 * Place it directly above the matching `DrenchBand`; `className` carries the
 * background of the section it hands off from.
 */
export function BandEdge({ color, className }: BandEdgeProps) {
  return (
    <div aria-hidden="true" className={cn("overflow-hidden", EDGE_TEXT_CLASS[color], className)}>
      <svg
        viewBox="0 0 1440 72"
        preserveAspectRatio="none"
        className="block h-10 w-full md:h-[4.5rem]"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Echo ridge lines — thin strokes tracking the wave irregularly. */}
        <path
          d="M0 28 C 90 14, 170 40, 260 30 S 430 8, 530 26 S 700 46, 800 30 S 950 6, 1060 22 S 1240 44, 1330 26 S 1410 14, 1440 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          d="M0 40 C 100 28, 180 50, 280 42 S 460 22, 560 38 S 720 56, 830 42 S 980 20, 1090 34 S 1260 54, 1350 38 S 1420 28, 1440 32"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        {/* The band itself arriving — a filled wave whose crest varies. */}
        <path
          d="M0 56 C 110 44, 200 64, 300 58 S 480 38, 590 52 S 760 70, 870 56 S 1020 36, 1130 48 S 1290 66, 1380 52 L 1440 48 L 1440 72 L 0 72 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
