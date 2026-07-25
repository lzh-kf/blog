"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  id?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, id, children, ...props }, ref) => {
    const innerId = id || React.useId()
    return (
      <label
        htmlFor={innerId}
        className={cn(
          "inline-flex items-center gap-2 cursor-pointer select-none",
          className
        )}
      >
        <span className="relative flex size-4 shrink-0 items-center justify-center rounded border border-[#D1D5DB] bg-white transition-colors hover:border-[#1A1A1A] has-checked:border-[#1A1A1A] has-checked:bg-[#1A1A1A]">
          <input
            ref={ref}
            type="checkbox"
            id={innerId}
            className="peer sr-only"
            {...props}
          />
          <Check
            className="pointer-events-none size-3 text-white opacity-0 peer-checked:opacity-100"
            strokeWidth={3}
          />
        </span>
        {children}
      </label>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
