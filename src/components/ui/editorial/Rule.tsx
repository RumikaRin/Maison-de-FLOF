import * as React from "react";

import { cn } from "@/lib/utils";

export type RuleProps = React.HTMLAttributes<HTMLHRElement> & {
  /** `strong` darkens the hairline for a major boundary. */
  weight?: "hairline" | "strong";
};

/**
 * The section boundary of this system. See design.md § Extracted DNA:
 * "Hairline rules separate sections — cards do not."
 *
 * Inside a `.fl-drench` band the rule flips to the band's own light stroke,
 * handled by the `.fl-drench .fl-rule` selector in globals.css.
 */
export function Rule({ className, weight = "hairline", ...props }: RuleProps) {
  return (
    <hr
      className={cn("fl-rule", weight === "strong" && "fl-rule-strong", className)}
      {...props}
    />
  );
}
