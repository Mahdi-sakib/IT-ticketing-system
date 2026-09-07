import React from "react";
import { Link } from "react-router-dom";
import { Ticket, ListChecks, Clock, CheckCircle2, Plus, BookOpen, Store } from "lucide-react";
import StatCard from "@/components/StatCard";
import TicketTable from "@/components/TicketTable";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { Tickets, KnowledgeBaseArticles } from "@/api/entities";
import { useLiveQuery } from "@/lib/query-client";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [myTickets] = useLiveQuery(() => (user ? Tickets.filter({ requester_id: user.id }, "-created_date") : []), [user?.id]);
  const [articles] = useLiveQuery(() => KnowledgeBaseArticles.list("-created_date").slice(0, 4), []);

  const open = myTickets.filter((t) => !["resolved", "closed"].includes(t.status));
  const resolved = myTickets.filter((t) => ["resolved", "closed"].includes(t.status));
  const pending = myTickets.filter((t) => t.status === "pending");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Welcome back, {user?.full_name?.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground">Here's what's happening with your IT requests.</p>
        </div>
        <Link to="/tickets/new">
          <Button>
            <Plus className="h-4 w-4" /> New Ticket
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Ticket} label="Total Tickets" value={myTickets.length} />
        <StatCard icon={ListChecks} label="Open" value={open.length} tone="warning" />
        <StatCard icon={Clock} label="Awaiting You" value={pending.length} tone="danger" />
        <StatCard icon={CheckCircle2} label="Resolved" value={resolved.length} tone="success" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>My Recent Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <TicketTable tickets={myTickets.slice(0, 8)} emptyLabel="You haven't submitted any tickets yet." />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Store className="h-4 w-4" /> Quick Links
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Link to="/service-catalog"><Button variant="outline" className="w-full justify-start">Browse Service Catalog</Button></Link>
              <Link to="/knowledge-base"><Button variant="outline" className="w-full justify-start">Search Knowledge Base</Button></Link>
              <Link to="/tickets/mine"><Button variant="outline" className="w-full justify-start">View All My Tickets</Button></Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4" /> Popular Articles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {articles.length === 0 && <p className="text-sm text-muted-foreground">No articles yet.</p>}
              {articles.map((a) => (
                <Link key={a.id} to="/knowledge-base" className="block truncate text-sm text-primary hover:underline">
                  {a.title}
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
