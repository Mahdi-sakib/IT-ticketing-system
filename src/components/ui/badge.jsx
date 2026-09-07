import React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-secondary text-secondary-foreground border-border",
    outline: "bg-white text-foreground border-border",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
