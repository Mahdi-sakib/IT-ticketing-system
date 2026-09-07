import React from "react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

export function Avatar({ name, className, size = "md" }) {
  const sizes = { sm: "h-7 w-7 text-[10px]", md: "h-9 w-9 text-xs", lg: "h-12 w-12 text-sm" };
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-primary/10 font-semibold text-primary",
        sizes[size],
        className
      )}
    >
      {initials(name || "?")}
    </div>
  );
}
