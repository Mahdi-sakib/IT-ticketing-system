import React, { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";

const TabsCtx = createContext(null);

export function Tabs({ defaultValue, value, onValueChange, className, children }) {
  const [internal, setInternal] = useState(defaultValue);
  const active = value !== undefined ? value : internal;
  const setActive = onValueChange || setInternal;
  return (
    <TabsCtx.Provider value={{ active, setActive }}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  );
}

export function TabsList({ className, children }) {
  return (
    <div className={cn("inline-flex items-center gap-1 rounded-md bg-secondary p-1", className)}>{children}</div>
  );
}

export function TabsTrigger({ value, className, children }) {
  const { active, setActive } = useContext(TabsCtx);
  const isActive = active === value;
  return (
    <button
      type="button"
      onClick={() => setActive(value)}
      className={cn(
        "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
        isActive ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children }) {
  const { active } = useContext(TabsCtx);
  if (active !== value) return null;
  return <div className={className}>{children}</div>;
}
