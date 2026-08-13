"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(e.target.checked)
      }
    }

    return (
      <label className="relative inline-flex min-h-11 cursor-pointer select-none items-center md:min-h-10">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          className="sr-only peer"
          ref={ref}
          {...props}
        />
        {/* Square-edged track: the atelier control radius, not a pill. */}
        <div className={cn(
          "relative h-6 w-11 rounded-control border-2 border-transparent bg-atelier-paper-3",
          "transition-colors duration-fl-fast ease-fl-out",
          "peer-checked:bg-atelier-accent",
          "peer-hover:bg-atelier-rule-strong peer-[:checked:hover]:bg-atelier-accent-hover",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-45",
          className
        )}>
          <div className={cn(
            "absolute left-0.5 top-0.5 h-5 w-5 rounded-control border border-atelier-rule-strong bg-atelier-paper",
            "transition-transform duration-fl-fast ease-fl-out",
            checked ? "transform translate-x-5" : "transform translate-x-0"
          )} />
        </div>
      </label>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
