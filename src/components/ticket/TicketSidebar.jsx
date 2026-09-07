import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import SlaBadge from "@/components/SlaBadge";
import { formatDate } from "@/lib/utils";

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{children}</span>
    </div>
  );
}

export default function TicketSidebar({ ticket, asset }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Details</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        <Row label="Status"><StatusBadge status={ticket.status} /></Row>
        <Row label="Priority"><PriorityBadge priority={ticket.priority} /></Row>
        <Row label="Assigned Agent">{ticket.assigned_agent_name || "Unassigned"}</Row>
        <Row label="Category">{ticket.category}</Row>
        <Row label="Subcategory">{ticket.subcategory}</Row>
        <Row label="Department">{ticket.department}</Row>
        <Row label="Location">{ticket.location}</Row>
        <Row label="SLA"><SlaBadge dueDate={ticket.sla_due_date} status={ticket.status} /></Row>
        <Row label="Created">{formatDate(ticket.created_date)}</Row>
        <Row label="Due Date">{formatDate(ticket.sla_due_date)}</Row>
        {asset && <Row label="Linked Asset">{asset.name} ({asset.asset_tag})</Row>}
      </CardContent>
    </Card>
  );
}
