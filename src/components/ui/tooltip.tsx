"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

interface TooltipProps {
  children: React.ReactNode
}

const Tooltip: React.FC<TooltipProps> = ({ children }) => {
  const [open, setOpen] = React.useState(false)

  // We find children that are TooltipTrigger or TooltipContent
  let trigger: React.ReactNode = null
  let content: React.ReactNode = null

  React.Children.forEach(children, child => {
    if (React.isValidElement(child)) {
      if (child.type === TooltipTrigger) {
        trigger = child
      } else if (child.type === TooltipContent) {
        content = child
      }
    }
  })

  // Clone trigger to pass event handlers
  const clonedTrigger = React.isValidElement(trigger)
    ? React.cloneElement(trigger as React.ReactElement<any>, {
        onMouseEnter: () => setOpen(true),
        onMouseLeave: () => setOpen(false),
        onFocus: () => setOpen(true),
        onBlur: () => setOpen(false),
      })
    : null

  return (
    <div className="relative inline-block">
      {clonedTrigger}
      {open && content}
    </div>
  )
}

interface TooltipTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

const TooltipTrigger: React.FC<TooltipTriggerProps> = ({ children, asChild, ...props }) => {
  return (
    <div className="inline-block" {...props}>
      {children}
    </div>
  )
}

interface TooltipContentProps {
  className?: string
  children: React.ReactNode
}

/**
 * A tooltip visibly floats above the page — one of the two surfaces design.md
 * allows a shadow on. Dark editorial field, square edge, no blur.
 */
const TooltipContent: React.FC<TooltipContentProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        "absolute bottom-full left-1/2 z-50 mb-fl-2xs -translate-x-1/2 whitespace-nowrap rounded-surface bg-atelier-espresso px-fl-xs py-fl-3xs text-fl-sm text-atelier-on-dark shadow-md",
        className
      )}
      {...props}
    >
      {children}
      <div className="absolute left-1/2 top-full -mt-1 -translate-x-1/2 border-4 border-transparent border-t-atelier-espresso" />
    </div>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
