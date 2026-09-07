import React from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";

export default function Conversation({ comments }) {
  const { user } = useAuth();
  const visible = comments.filter((c) => !c.is_internal);

  if (!visible.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No messages yet. Start the conversation below.</p>;
  }

  return (
    <div className="space-y-4">
      {visible.map((c) => {
        const mine = c.author_id === user?.id;
        return (
          <div key={c.id} className={cn("flex gap-3", mine && "flex-row-reverse")}>
            <Avatar name={c.author_name} size="sm" />
            <div className={cn("max-w-[75%] rounded-lg px-3 py-2 text-sm", mine ? "bg-primary text-primary-foreground" : "bg-secondary")}>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-semibold opacity-80">{c.author_name}</span>
                {c.author_role !== "employee" && (
                  <Badge variant={mine ? "secondary" : "default"} className="h-4 px-1.5 py-0 text-[10px]">
                    IT
                  </Badge>
                )}
              </div>
              <p className="whitespace-pre-wrap">{c.body}</p>
              {c.attachment_name && (
                <p className="mt-1 text-xs underline opacity-80">📎 {c.attachment_name}</p>
              )}
              <p className="mt-1 text-[10px] opacity-60">{formatDate(c.created_date)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
