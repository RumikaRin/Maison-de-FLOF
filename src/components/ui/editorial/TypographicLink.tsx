import Link from "next/link";
import * as React from "react";

import { cn } from "@/lib/utils";

export type TypographicLinkProps = Omit<
  React.ComponentPropsWithoutRef<typeof Link>,
  "children"
> & {
  children: React.ReactNode;
  /** `↗` for anything that leaves the current context. */
  arrow?: "→" | "↗" | "none";
};

/**
 * The C3 secondary action: the word, an arrow, and a 1px underline that draws
 * across on hover or focus. No box, no fill. See design.md § CTA voice.
 *
 * Inside a `.fl-drench` band it inherits the band's ink, because teal is
 * invisible on a drench.
 *
 * Kept on one line deliberately — two-line clickable text fails Hallmark
 * gate 49.
 */
export function TypographicLink({
  className,
  children,
  arrow = "→",
  ...props
}: TypographicLinkProps) {
  return (
    <Link
      className={cn(
        "group inline-flex min-h-11 items-center gap-2 whitespace-nowrap text-fl-sm font-medium md:min-h-6",
        "text-atelier-accent",
        "transition-opacity duration-fl-fast ease-fl-out active:opacity-80",
        "[.fl-drench_&]:text-current",
        className,
      )}
      {...props}
    >
      <span className="fl-underline">{children}</span>
      {arrow === "none" ? null : (
        <span
          aria-hidden="true"
          className="no-underline transition-transform duration-fl-fast ease-fl-out group-hover:translate-x-0.5 motion-reduce:transform-none"
        >
          {arrow}
        </span>
      )}
    </Link>
  );
}
