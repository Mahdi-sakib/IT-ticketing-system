import React from "react";
import { UserX } from "lucide-react";

export default function UserNotRegisteredError({ email }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-6 text-center">
      <UserX className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium">No account found for {email}</p>
      <p className="text-xs text-muted-foreground">Ask your IT administrator to create an account for you, or register below.</p>
    </div>
  );
}
