import React from "react";
import { Bell, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Notifications } from "@/api/entities";
import { useLiveQuery } from "@/lib/query-client";
import { timeAgo } from "@/lib/utils";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

export default function NotificationCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items] = useLiveQuery(
    () => (user ? Notifications.filter({ user_id: user.id }, "-created_date").slice(0, 12) : []),
    [user?.id]
  );
  const unread = items.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative rounded-md p-2 hover:bg-secondary">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <button
              className="flex items-center gap-1 text-xs text-primary hover:underline"
              onClick={() => items.forEach((n) => Notifications.update(n.id, { read: true }))}
            >
              <Check className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 && <p className="px-2 py-6 text-center text-sm text-muted-foreground">You're all caught up.</p>}
          {items.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={`flex-col items-start gap-0.5 ${!n.read ? "bg-primary/5" : ""}`}
              onClick={() => {
                Notifications.update(n.id, { read: true });
                if (n.ticket_id) navigate(`/tickets/${n.ticket_id}`);
              }}
            >
              <span className="text-sm font-medium">{n.title}</span>
              <span className="line-clamp-2 text-xs text-muted-foreground">{n.body}</span>
              <span className="text-[10px] text-muted-foreground">{timeAgo(n.created_date)}</span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
