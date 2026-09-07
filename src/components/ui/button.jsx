import React from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
  outline: "border border-border bg-white hover:bg-secondary",
  ghost: "hover:bg-secondary",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  link: "text-primary underline-offset-4 hover:underline",
};

const sizes = {
  default: "h-9 px-4 py-2",
  sm: "h-8 px-3 text-sm",
  lg: "h-11 px-6",
  icon: "h-9 w-9 p-0",
};

export const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
