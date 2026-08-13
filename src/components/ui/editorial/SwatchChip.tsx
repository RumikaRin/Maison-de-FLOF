import * as React from "react";

import { ColorSwatch } from "@/components/ui/color-swatch";
import { cn } from "@/lib/utils";

export type SwatchChipProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  /** The paint value. Painted through `ColorSwatch`, which validates the hex. */
  hex: string;
  name: string;
  /** NCS / brand code. Rendered as technical metadata. */
  code?: string;
  selected?: boolean;
  /** `chip` shows the colour only; `labelled` always shows name + code. */
  layout?: "chip" | "labelled";
};

/**
 * A hard-edged colour chip, like a real paint sample. Radius 0 by design
 * (design.md § Shape).
 *
 * The colour is painted with `ColorSwatch` (an SVG `fill`) rather than an inline
 * style, because the app ships a strict nonce-based CSP — see
 * `tests/no-inline-style.test.ts`.
 *
 * Colour is never the sole carrier of information (design.md § Accessibility
 * floor): the `labelled` layout renders name and code visibly, and the `chip`
 * layout still exposes both to assistive technology through `aria-label`.
 */
export function SwatchChip({
  hex,
  name,
  code,
  selected = false,
  layout = "labelled",
  className,
  ...props
}: SwatchChipProps) {
  const description = code ? `${name} · ${code}` : name;

  return (
    <button
      type="button"
      aria-label={description}
      aria-pressed={selected}
      className={cn(
        "group flex min-h-11 flex-col text-left transition-transform duration-fl-fast active:scale-[0.98] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-atelier-accent",
        layout === "chip" && "h-11 w-11 md:h-10 md:w-10",
        className,
      )}
      {...props}
    >
      <ColorSwatch
        color={hex}
        // The swatch sits above the page plane — one of the two places
        // design.md allows a shadow.
        className={cn(
          "block w-full rounded-swatch transition-shadow duration-fl-fast ease-fl-out",
          layout === "chip" ? "h-full" : "aspect-[4/3]",
          selected ? "fl-swatch-selected" : "fl-swatch",
        )}
      />
      {layout === "labelled" ? (
        <span className="mt-fl-2xs flex flex-col gap-0.5">
          <span className="text-fl-sm text-atelier-ink">{name}</span>
          {code ? <span className="fl-label">{code}</span> : null}
        </span>
      ) : null}
    </button>
  );
}
