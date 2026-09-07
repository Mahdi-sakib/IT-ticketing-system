import React from "react";
import { cn } from "@/lib/utils";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/ticketConstants";

export default function StatusBadge({ status, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_COLORS[status] || "bg-secondary text-secondary-foreground border-border",
        className
      )}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}
