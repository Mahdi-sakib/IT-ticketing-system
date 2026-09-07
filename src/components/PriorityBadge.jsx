import React from "react";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIORITY_COLORS, PRIORITY_LABELS } from "@/lib/ticketConstants";

export default function PriorityBadge({ priority, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        PRIORITY_COLORS[priority] || "bg-secondary text-secondary-foreground border-border",
        className
      )}
    >
      {priority === "critical" && <Flame className="h-3 w-3" />}
      {PRIORITY_LABELS[priority] || priority}
    </span>
  );
}
