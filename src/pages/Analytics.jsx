import React, { useMemo, useState } from "react";
import { BarChart3, Ticket, Clock, ShieldCheck, Star, Sparkles, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import StatCard from "@/components/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import TrendChart from "@/components/analytics/TrendChart";
import CategoryBar from "@/components/analytics/CategoryBar";
import StatusPie from "@/components/analytics/StatusPie";
import AgentTable from "@/components/analytics/AgentTable";
import ExportBar from "@/components/analytics/ExportBar";
import { Tickets, Users, CsatResponses } from "@/api/entities";
import { useLiveQuery } from "@/lib/query-client";
import { filterByRange, kpis, trendSeries, byCategory, byStatus, agentPerformance } from "@/lib/analytics";
import { generateExecutiveInsights } from "@/lib/ai";

const INSIGHT_ICONS = { risk: AlertTriangle, positive: CheckCircle2, info: Info };
const INSIGHT_STYLES = {
  risk: "border-red-200 bg-red-50 text-red-700",
  positive: "border-emerald-200 bg-emerald-50 text-emerald-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
};

export default function Analytics() {
  const [allTickets] = useLiveQuery(() => Tickets.list(), []);
  const [users] = useLiveQuery(() => Users.list(), []);
  const [csat] = useLiveQuery(() => CsatResponses.list(), []);
  const [range, setRange] = useState("30");

  const tickets = useMemo(() => filterByRange(allTickets, range ? Number(range) : null), [allTickets, range]);
  const k = useMemo(() => kpis(tickets, csat), [tickets, csat]);
  const insights = useMemo(() => generateExecutiveInsights(tickets, k), [tickets, k]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold"><BarChart3 className="h-6 w-6" /> Reports &amp; Analytics</h1>
          <p className="text-sm text-muted-foreground">Executive overview of the IT service desk's performance.</p>
        </div>
        <ExportBar range={range} onRangeChange={setRange} tickets={tickets} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard icon={Ticket} label="Total Tickets" value={k.total} />
        <StatCard icon={Clock} label="Open / Backlog" value={k.backlog} tone="warning" />
        <StatCard icon={ShieldCheck} label="SLA Compliance" value={`${k.slaCompliance}%`} tone={k.slaCompliance >= 85 ? "success" : "danger"} />
        <StatCard icon={Clock} label="Avg Resolution" value={k.avgResolutionMins ? `${Math.round(k.avgResolutionMins / 60)}h` : "-"} />
        <StatCard icon={Star} label="Avg CSAT" value={k.avgCsat || "-"} tone="success" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> AI Executive Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {insights.map((ins, i) => {
            const Icon = INSIGHT_ICONS[ins.type];
            return (
              <div key={i} className={`flex items-start gap-2 rounded-md border p-3 text-sm ${INSIGHT_STYLES[ins.type]}`}>
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{ins.text}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Ticket Volume Trend</CardTitle></CardHeader>
          <CardContent><TrendChart data={trendSeries(tickets, 14)} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tickets by Status</CardTitle></CardHeader>
          <CardContent><StatusPie data={byStatus(tickets)} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top Categories</CardTitle></CardHeader>
          <CardContent><CategoryBar data={byCategory(tickets)} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Agent Performance</CardTitle></CardHeader>
          <CardContent><AgentTable data={agentPerformance(tickets, users, csat)} /></CardContent>
        </Card>
      </div>
    </div>
  );
}
