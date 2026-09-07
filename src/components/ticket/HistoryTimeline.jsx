import React from "react";
import { History } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function HistoryTimeline({ history }) {
  if (!history.length) {
    return <p className="text-sm text-muted-foreground">No activity recorded yet.</p>;
  }
  return (
    <ol className="relative border-l border-border pl-4">
      {history.map((h) => (
        <li key={h.id} className="mb-4 last:mb-0">
          <span className="absolute -left-[9px] mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary/10">
            <History className="h-2.5 w-2.5 text-primary" />
          </span>
          <p className="text-sm">{h.action}</p>
          <p className="text-xs text-muted-foreground">
            {h.actor_name} · {formatDate(h.created_date)}
          </p>
        </li>
      ))}
    </ol>
  );
}
