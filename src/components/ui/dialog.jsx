import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dialog({ open, onOpenChange, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onOpenChange?.(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange?.(false)} />
      {children}
    </div>
  );
}

export function DialogContent({ className, children, onClose }) {
  return (
    <div
      className={cn(
        "relative z-10 w-full max-w-lg rounded-lg bg-white p-5 shadow-lg max-h-[90vh] overflow-y-auto",
        className
      )}
    >
      {onClose && (
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      )}
      {children}
    </div>
  );
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn("mb-4 flex flex-col gap-1", className)} {...props} />;
}

export function DialogTitle({ className, ...props }) {
  return <h2 className={cn("text-lg font-semibold", className)} {...props} />;
}

export function DialogDescription({ className, ...props }) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function DialogFooter({ className, ...props }) {
  return <div className={cn("mt-5 flex justify-end gap-2", className)} {...props} />;
}
