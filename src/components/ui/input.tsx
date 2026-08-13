import * as React from "react"

import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

/**
 * Atelier Editorial input. Square-edged, recessed well, hairline border.
 * Eight states: default, hover, focus-visible, active, disabled, loading,
 * error, success — the last three via `data-state` or `aria-invalid` so
 * react-hook-form call sites need no new props.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex min-h-11 w-full rounded-control border border-atelier-rule-strong bg-atelier-paper-2 px-3 py-2 text-fl-sm text-atelier-ink md:min-h-10",
          "transition-colors duration-fl-fast ease-fl-out",
          "placeholder:text-atelier-ink-3",
          "hover:border-atelier-ink-3",
          "focus-visible:border-atelier-accent",
          "file:border-0 file:bg-transparent file:text-fl-sm file:font-medium file:text-atelier-ink",
          "disabled:cursor-not-allowed disabled:opacity-45",
          "data-[state=loading]:pointer-events-none data-[state=loading]:opacity-70",
          "aria-[invalid=true]:border-atelier-danger data-[state=error]:border-atelier-danger",
          "data-[state=success]:border-atelier-success",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
