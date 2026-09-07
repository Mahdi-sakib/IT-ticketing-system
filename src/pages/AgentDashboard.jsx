import React from "react";
import { Link } from "react-router-dom";
import { Ticket, AlertTriangle, ShieldAlert, CheckCircle2, Siren, TrendingUp } from "lucide-react";
import StatCard from "@/components/StatCard";
import TicketTable from "@/components/TicketTable";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TrendChart from "@/components/analytics/TrendChart";
import { useAuth } from "@/lib/AuthContext";
import { useRole } from "@/lib/useRole";
import { Tickets, MajorIncidents } from "@/api/entities";
import { useLiveQuery } from "@/lib/query-client";
import { slaState } from "@/lib/ticketConstants";
import { trendSeries } from "@/lib/analytics";

export default function AgentDashboard() {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [tickets] = useLiveQuery(() => Tickets.list("-created_date"), []);
  const [incidents] = useLiveQuery(() => MajorIncidents.filter({ status: "active" }), []);

  const open = tickets.filter((t) => !["resolved", "closed"].includes(t.status));
  const unassigned = open.filter((t) => !t.assigned_agent_id);
  const mine = open.filter((t) => t.assigned_agent_id === user?.id);
  const breached = open.filter((t) => slaState(t.sla_due_date, t.status) === "breached");
  const resolvedToday = tickets.filter((t) => t.resolved_at?.startsWith(new Date().toISOString().slice(0, 10)));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{isAdmin ? "Operations Overview" : "Agent Dashboard"}</h1>
          <p className="text-sm text-muted-foreground">Real-time view of the IT service desk.</p>
        </div>
        <Link to="/analytics">
          <Button variant="outline">
            <TrendingUp className="h-4 w-4" /> View Full Reports
          </Button>
        </Link>
      </div>

      {incidents.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
          {incidents.map((inc) => (
            <Link key={inc.id} to="/major-incidents" className="flex items-center gap-3 text-sm">
              <Siren className="h-5 w-5 shrink-0 text-red-600" />
              <span className="font-medium text-red-700">Major Incident Active:</span>
              <span className="text-red-700">{inc.title}</span>
              <Badge variant="destructive" className="ml-auto">{inc.severity}</Badge>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard icon={Ticket} label="Open Tickets" value={open.length} />
        <StatCard icon={AlertTriangle} label="Unassigned" value={unassigned.length} tone="warning" />
        <StatCard icon={Ticket} label="My Queue" value={mine.length} />
        <StatCard icon={ShieldAlert} label="SLA Breached" value={breached.length} tone="danger" />
        <StatCard icon={CheckCircle2} label="Resolved Today" value={resolvedToday.length} tone="success" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ticket Volume (14 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={trendSeries(tickets, 14)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Needs Attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {breached.slice(0, 6).map((t) => (
              <Link key={t.id} to={`/tickets/${t.id}`} className="flex items-center justify-between rounded-md border border-border p-2 text-sm hover:bg-secondary">
                <span className="truncate">{t.subject}</span>
                <Badge variant="destructive">SLA</Badge>
              </Link>
            ))}
            {breached.length === 0 && <p className="text-sm text-muted-foreground">No SLA breaches — nice work!</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unassigned Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketTable tickets={unassigned.slice(0, 10)} emptyLabel="No unassigned tickets right now." />
        </CardContent>
      </Card>
    </div>
  );
}
