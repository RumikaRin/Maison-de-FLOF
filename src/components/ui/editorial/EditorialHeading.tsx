import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Display sizes are length-bracketed, per design.md § Typography:
 * `display` for <= 50 chars, `display-s` for 51-90, `3xl` beyond that.
 */
export type HeadingScale = "display" | "display-s" | "3xl" | "2xl";

const SCALE_CLASS: Record<HeadingScale, string> = {
  display: "text-fl-display",
  "display-s": "text-fl-display-s",
  "3xl": "text-fl-3xl",
  "2xl": "text-fl-2xl",
};

export type EditorialHeadingProps = Omit<
  React.HTMLAttributes<HTMLHeadingElement>,
  "children"
> & {
  as?: "h1" | "h2" | "h3" | "h4";
  /** Omit to let the component bracket the size from the text length. */
  scale?: HeadingScale;
  /**
   * Short technical metadata stacked above the heading — colour code, finish,
   * count. Never a decorative numbered eyebrow (`01 · BỘ SƯU TẬP`), which
   * design.md § Notes bans. Always stacks vertically; the tag-left /
   * heading-right split is banned outright (Hallmark gate 54).
   */
  label?: React.ReactNode;
  children: React.ReactNode;
};

/** Bracket the display size from the rendered text length. */
function bracketScale(children: React.ReactNode): HeadingScale {
  const length = typeof children === "string" ? children.length : 0;
  if (length === 0) return "display-s";
  if (length <= 50) return "display";
  if (length <= 90) return "display-s";
  return "3xl";
}

/**
 * A display heading in Playfair Display, roman only. Italic headings are banned
 * globally (design.md § Typography, Hallmark gate 38a) — carry emphasis with
 * weight, the accent colour, or a drawn underline.
 */
export function EditorialHeading({
  as: Tag = "h2",
  scale,
  label,
  className,
  children,
  ...props
}: EditorialHeadingProps) {
  const resolved = scale ?? bracketScale(children);

  return (
    <div className="flex flex-col gap-3">
      {label ? <span className="fl-label">{label}</span> : null}
      <Tag className={cn("fl-display", SCALE_CLASS[resolved], className)} {...props}>
        {children}
      </Tag>
    </div>
  );
}
