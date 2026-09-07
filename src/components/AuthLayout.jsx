import React from "react";
import { LifeBuoy } from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/lib/app-params";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary p-6">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <LifeBuoy className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold">{APP_NAME}</h1>
        <p className="text-sm text-muted-foreground">{APP_TAGLINE}</p>
      </div>
      <div className="w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
    </div>
  );
}
