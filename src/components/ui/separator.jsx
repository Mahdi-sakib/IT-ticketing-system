import React from "react";
import { cn } from "@/lib/utils";

export function Separator({ className, orientation = "horizontal" }) {
  return (
    <div
      className={cn(
        orientation === "horizontal" ? "h-px w-full" : "w-px h-full",
        "bg-border",
        className
      )}
    />
  );
}
