import * as React from "react";

import { cn } from "@/lib/utils";

/** The four real paint values a band may take. See design.md § Theme. */
export type DrenchColor = "sage" | "clay" | "slate" | "ochre" | "espresso";

const DRENCH_CLASS: Record<DrenchColor, string> = {
  sage: "fl-drench-sage",
  clay: "fl-drench-clay",
  slate: "fl-drench-slate",
  ochre: "fl-drench-ochre",
  espresso: "fl-drench-espresso",
};

export type DrenchBandProps = React.HTMLAttributes<HTMLElement> & {
  color: DrenchColor;
  /** Render as `section` (default) or `div` when already inside a section. */
  as?: "section" | "div";
};

/**
 * A full-bleed colour-drenched section — the strongest move in this system.
 * The page is painted, it does not describe paint. See design.md § Extracted DNA.
 *
 * The band owns its own ink, rule colour and focus-ring colour via the
 * `.fl-drench-*` custom-property blocks in globals.css, so descendants inherit
 * correct contrast without per-element overrides. Teal must never be used
 * inside a band.
 *
 * Constraints the caller is responsible for (design.md § Theme):
 * - 2–3 bands per Marketing page, at most 1 on Catalogue, none on Content/App.
 * - Never two adjacent bands of the same colour.
 */
export function DrenchBand({
  color,
  as: Tag = "section",
  className,
  children,
  ...props
}: DrenchBandProps) {
  return (
    <Tag className={cn("fl-drench", DRENCH_CLASS[color], className)} {...props}>
      {children}
    </Tag>
  );
}
