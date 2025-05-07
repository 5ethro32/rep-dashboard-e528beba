
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
          ? "bg-transparent border-white text-white border shadow-sm hover:bg-white/10" 
          : "bg-white shadow-inner border-transparent text-gray-700 bg-gradient-to-r from-white to-gray-100 hover:text-finance-red",
        "border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      {children}
    </button>
  )
}
