import * as React from "react"

import { cn } from "@/lib/utils"

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

/**
 * Atelier Editorial textarea. Same recessed well, hairline border and square
 * edge as `Input` — see design.md § Shape and depth.
 *
 * Eight states: default, hover, focus-visible, active, disabled, loading,
 * error, success — the last three via `data-state` or `aria-invalid`, so
 * react-hook-form call sites need no new props. The focus ring comes from the
 * global `:focus-visible` rule in globals.css and is never animated.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-20 w-full rounded-control border border-atelier-rule-strong bg-atelier-paper-2 px-3 py-2 text-fl-sm text-atelier-ink",
          "transition-colors duration-fl-fast ease-fl-out",
          "placeholder:text-atelier-ink-3",
          "hover:border-atelier-ink-3",
          "focus-visible:border-atelier-accent",
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
Textarea.displayName = "Textarea"

export { Textarea }
