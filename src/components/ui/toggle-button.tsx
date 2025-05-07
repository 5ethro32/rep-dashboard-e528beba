
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
        "inline-flex items-center justify-center rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200",
        "border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        checked 
          ? "bg-gradient-to-r from-finance-red to-rose-700 border-transparent text-white shadow-sm font-medium"
          : "bg-transparent border-white/20 text-white/70 hover:bg-white/5 hover:text-white",
        className
      )}
    >
      {children}
    </button>
  )
}
