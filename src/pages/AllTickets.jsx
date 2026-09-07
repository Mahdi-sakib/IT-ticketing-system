import React, { useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import TicketTable from "@/components/TicketTable";
import { Tickets, Users } from "@/api/entities";
import { useLiveQuery } from "@/lib/query-client";
import { TICKET_STATUSES, STATUS_LABELS, PRIORITIES, PRIORITY_LABELS, CATEGORIES } from "@/lib/ticketConstants";

export default function AllTickets() {
  const [tickets] = useLiveQuery(() => Tickets.list("-created_date"), []);
  const [agents] = useLiveQuery(() => Users.filter({ role: "agent" }), []);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [agent, setAgent] = useState("");

  const filtered = tickets.filter((t) => {
    if (status && t.status !== status) return false;
    if (priority && t.priority !== priority) return false;
    if (category && t.category !== category) return false;
    if (agent === "unassigned" && t.assigned_agent_id) return false;
    if (agent && agent !== "unassigned" && t.assigned_agent_id !== agent) return false;
    if (search && !`${t.subject} ${t.display_id} ${t.requester_name}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">All Tickets</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} of {tickets.length} tickets</p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-5">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search subject, ID, requester..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select className="w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {TICKET_STATUSES.map((s) => (<option key={s} value={s}>{STATUS_LABELS[s]}</option>))}
          </Select>
          <Select className="w-36" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => (<option key={p} value={p}>{PRIORITY_LABELS[p]}</option>))}
          </Select>
          <Select className="w-44" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
          </Select>
          <Select className="w-40" value={agent} onChange={(e) => setAgent(e.target.value)}>
            <option value="">All agents</option>
            <option value="unassigned">Unassigned</option>
            {agents.map((a) => (<option key={a.id} value={a.id}>{a.full_name}</option>))}
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
