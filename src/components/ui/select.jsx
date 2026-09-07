import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Simple native <select> wrapper — avoids pulling in a full Radix combobox
// while keeping the same shadcn-ish visual language.
export const Select = React.forwardRef(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        "flex h-9 w-full appearance-none rounded-md border border-border bg-white px-3 py-1 pr-8 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        className
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
  </div>
));
Select.displayName = "Select";
