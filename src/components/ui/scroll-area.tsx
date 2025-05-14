
import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

interface ScrollAreaProps extends 
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  orientation?: "vertical" | "horizontal" | "both";
  viewportRef?: React.RefObject<HTMLDivElement>;
}

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  ScrollAreaProps
>(({ className, children, orientation = "vertical", viewportRef, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport 
      ref={viewportRef} 
      className="h-full w-full rounded-[inherit] [&>div]:h-full">
      {children}
    </ScrollAreaPrimitive.Viewport>
    {orientation === "vertical" || orientation === "both" ? (
      <ScrollBar orientation="vertical" />
    ) : null}
    {orientation === "horizontal" || orientation === "both" ? (
      <ScrollBar orientation="horizontal" />
    ) : null}
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-1.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-1.5 flex-col border-t border-t-transparent p-[1px]",
      "hover:w-2 data-[orientation=vertical]:hover:w-2 data-[orientation=horizontal]:hover:h-2 transition-all duration-150 opacity-50 hover:opacity-100",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border/50 hover:bg-border/70 transition-colors duration-150" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
