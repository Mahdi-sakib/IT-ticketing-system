import React from "react";
import { cn } from "@/lib/utils";

export const Checkbox = React.forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    type="checkbox"
    className={cn("h-4 w-4 rounded border-border text-primary focus:ring-primary/40", className)}
    {...props}
  />
));
Checkbox.displayName = "Checkbox";
