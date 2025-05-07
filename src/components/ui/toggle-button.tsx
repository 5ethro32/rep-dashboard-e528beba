
import * as React from "react"
import { cn } from "@/lib/utils"

interface ToggleButtonProps {
  checked: boolean;
  onToggle: (checked: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function ToggleButton({ checked, onToggle, children, className }: ToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!checked)}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-medium transition-all duration-200",
        checked 
          ? "bg-gradient-to-r from-finance-red to-finance-red/80 text-white border-transparent shadow hover:from-finance-red/90 hover:to-finance-red/70" 
          : "bg-gray-100/80 shadow-inner border border-gray-200 text-gray-700 hover:bg-gray-200/80",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      {children}
    </button>
  )
}
