"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/app/lib/utils"

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'checked' | 'onChange'> {
  className?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean | "indeterminate") => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = event.target.checked
      onCheckedChange?.(isChecked)
    }

    return (
      <div 
        className="relative inline-flex items-center cursor-pointer"
        onClick={() => onCheckedChange?.(!checked)}
      >
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-primary bg-transparent ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "checked:bg-primary checked:text-primary-foreground",
            "sr-only",
            className
          )}
          onChange={handleChange}
          {...props}
        />
        <div
          className={cn(
            "h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background transition-colors",
            "flex items-center justify-center",
            checked ? "bg-primary text-primary-foreground" : "bg-transparent"
          )}
        >
          <Check 
            className={cn(
              "h-3 w-3 text-primary-foreground transition-opacity",
              checked ? "opacity-100" : "opacity-0"
            )} 
          />
        </div>
      </div>
    )
  }
)

Checkbox.displayName = "Checkbox"

export { Checkbox }