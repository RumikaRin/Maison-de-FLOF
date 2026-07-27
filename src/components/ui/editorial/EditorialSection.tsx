import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Section padding is deliberately unequal across a page — equal padding on
 * every section is the templated tell (design.md § Spacing). Callers pick a
 * rhythm value per section rather than reaching for one blanket class.
 */
export type SectionRhythm = "tight" | "base" | "generous";

const RHYTHM_CLASS: Record<SectionRhythm, string> = {
  tight: "py-fl-xl md:py-fl-2xl",
  base: "py-fl-2xl md:py-fl-3xl",
  generous: "py-fl-3xl md:py-fl-4xl",
};

export type EditorialSectionProps = React.HTMLAttributes<HTMLElement> & {
  rhythm?: SectionRhythm;
  /** `bleed` lets a child image or band run to the viewport edge. */
  bleed?: boolean;
  /**
   * `frame` draws the drafting-grid: two vertical hairlines at the container
   * edges, running the section's full height including its padding. Applied to
   * consecutive paper sections they read as one continuous drawing frame
   * (design.md § Structure devices). Desktop only — at small widths the lines
   * sit 1rem from the screen edge and read as clutter.
   */
  frame?: boolean;
  as?: "section" | "div";
};

/**
 * The 12-column editorial container. Padding-inline is clamped so content never
 * kisses the screen edge (design.md § Spacing).
 */
export function EditorialSection({
  rhythm = "base",
  bleed = false,
  frame = false,
  as: Tag = "section",
  className,
  children,
  ...props
}: EditorialSectionProps) {
  return (
    <Tag className={cn(RHYTHM_CLASS[rhythm], frame && "relative", className)} {...props}>
      {frame ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-full max-w-[100rem] -translate-x-1/2 border-x border-atelier-rule lg:block"
        />
      ) : null}
      <div
        className={cn(
          "mx-auto w-full max-w-[100rem]",
          !bleed && "px-[clamp(1rem,4vw,1.5rem)]",
        )}
      >
        {children}
      </div>
    </Tag>
  );
}
