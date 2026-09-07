import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const Ctx = createContext(null);

export function DropdownMenu({ children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <Ctx.Provider value={{ open, setOpen }}>
      <div className="relative inline-block" ref={ref}>
        {children}
      </div>
    </Ctx.Provider>
  );
}

export function DropdownMenuTrigger({ children, asChild }) {
  const { open, setOpen } = useContext(Ctx);
  const onClick = (e) => {
    e.stopPropagation();
    setOpen(!open);
  };
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onClick });
  }
  return <button onClick={onClick}>{children}</button>;
}

export function DropdownMenuContent({ align = "end", className, children }) {
  const { open } = useContext(Ctx);
  if (!open) return null;
  return (
    <div
      className={cn(
        "absolute z-40 mt-1 min-w-[10rem] rounded-md border border-border bg-white p-1 shadow-md",
        align === "end" ? "right-0" : "left-0",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({ className, onClick, ...props }) {
  const { setOpen } = useContext(Ctx);
  return (
    <button
      type="button"
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-secondary",
        className
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-border" />;
}
