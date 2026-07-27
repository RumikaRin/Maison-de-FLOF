import * as React from "react"
import { cn } from "@/lib/utils"

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>

/**
 * Atelier Editorial field label. Body-weight ink at the 14px floor — the 11px
 * uppercase `.fl-label` treatment is reserved for technical metadata
 * (design.md § Typography), never for a form label.
 */
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-fl-sm font-medium leading-none text-atelier-ink",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-45",
        className
      )}
      {...props}
    />
  )
)
Label.displayName = "Label"

export { Label }
