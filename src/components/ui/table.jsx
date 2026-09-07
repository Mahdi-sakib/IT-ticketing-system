import React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full text-sm", className)} {...props} />
    </div>
  );
}
export function TableHeader({ className, ...props }) {
  return <thead className={cn("border-b border-border bg-secondary/50", className)} {...props} />;
}
export function TableBody({ className, ...props }) {
  return <tbody className={cn("divide-y divide-border", className)} {...props} />;
}
export function TableRow({ className, ...props }) {
  return <tr className={cn("hover:bg-secondary/40", className)} {...props} />;
}
export function TableHead({ className, ...props }) {
  return (
    <th
      className={cn("h-10 px-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap", className)}
      {...props}
    />
  );
}
export function TableCell({ className, ...props }) {
  return <td className={cn("px-3 py-2.5 align-middle whitespace-nowrap", className)} {...props} />;
}
