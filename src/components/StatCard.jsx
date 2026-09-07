import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatCard({ icon: Icon, label, value, tone = "default", onClick }) {
  const tones = {
    default: "bg-primary/10 text-primary",
    danger: "bg-red-50 text-red-600",
    warning: "bg-amber-50 text-amber-600",
    success: "bg-emerald-50 text-emerald-600",
    neutral: "bg-slate-100 text-slate-600",
  };
  return (
    <Card
      onClick={onClick}
      className={cn("transition-shadow", onClick && "cursor-pointer hover:shadow-md")}
    >
      <CardContent className="flex items-center gap-4 pt-5">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", tones[tone])}>
          {Icon && <Icon className="h-5 w-5" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground truncate">{label}</p>
          <p className="text-2xl font-semibold leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
