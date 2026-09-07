import React, { useEffect, useState } from "react";
import { Clock, ShieldAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { slaState } from "@/lib/ticketConstants";

function countdown(dueDate) {
  const diff = new Date(dueDate).getTime() - Date.now();
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  const label = `${h}h ${m}m`;
  return diff < 0 ? `-${label}` : label;
}

export default function SlaBadge({ dueDate, status, className }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((v) => v + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const state = slaState(dueDate, status);
  const styles = {
    ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    breached: "bg-red-50 text-red-700 border-red-200",
    met: "bg-slate-100 text-slate-600 border-slate-200",
  };
  const Icon = state === "breached" ? ShieldAlert : state === "met" ? ShieldCheck : Clock;

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", styles[state], className)}>
      <Icon className="h-3 w-3" />
      {state === "met" ? "Within SLA" : countdown(dueDate)}
    </span>
  );
}
