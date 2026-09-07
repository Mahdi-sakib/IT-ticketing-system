import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import TicketTable from "@/components/TicketTable";
import { useAuth } from "@/lib/AuthContext";
import { Tickets } from "@/api/entities";
import { useLiveQuery } from "@/lib/query-client";
import { TICKET_STATUSES, STATUS_LABELS } from "@/lib/ticketConstants";

export default function MyTickets() {
  const { user } = useAuth();
  const [tickets] = useLiveQuery(() => (user ? Tickets.filter({ requester_id: user.id }, "-created_date") : []), [user?.id]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const filtered = tickets.filter((t) => {
    if (status && t.status !== status) return false;
    if (search && !`${t.subject} ${t.display_id}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">My Tickets</h1>
        <Link to="/tickets/new">
          <Button>
            <Plus className="h-4 w-4" /> New Ticket
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search by subject or ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select className="w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {TICKET_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <TicketTable tickets={filtered} />
        </CardContent>
      </Card>
    </div>
  );
}
