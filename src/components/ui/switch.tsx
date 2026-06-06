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
      <label className="relative inline-flex items-center cursor-pointer select-none">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          className="sr-only peer"
          ref={ref}
          {...props}
        />
        <div className={cn(
          "w-11 h-6 bg-warm-200 rounded-full transition-colors peer-checked:bg-jotun-teal border-2 border-transparent relative",
          className
        )}>
          <div className={cn(
            "w-5 h-5 bg-white rounded-full shadow-md transition-transform absolute top-0.5 left-0.5",
            checked ? "transform translate-x-5" : "transform translate-x-0"
          )} />
        </div>
      </label>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
