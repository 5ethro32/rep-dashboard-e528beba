
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800",
        outline: "text-foreground",
        warning:
          "border-transparent bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 dark:text-amber-100 hover:from-amber-600 hover:to-amber-700",
        success:
          "border-transparent bg-gradient-to-r from-emerald-500 to-emerald-600 text-emerald-950 dark:text-emerald-100 hover:from-emerald-600 hover:to-emerald-700",
        info:
          "border-transparent bg-gradient-to-r from-blue-500 to-blue-600 text-blue-950 dark:text-blue-100 hover:from-blue-600 hover:to-blue-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
