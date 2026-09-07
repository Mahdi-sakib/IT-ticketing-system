import React from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import SlaBadge from "@/components/SlaBadge";
import { formatDate } from "@/lib/utils";

export default function TicketTable({ tickets, emptyLabel = "No tickets found." }) {
  const navigate = useNavigate();

  if (!tickets.length) {
    return <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{emptyLabel}</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticket ID</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Requester</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Assigned Agent</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>SLA</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((t) => (
          <TableRow key={t.id} className="cursor-pointer" onClick={() => navigate(`/tickets/${t.id}`)}>
            <TableCell className="font-medium text-primary">{t.display_id}</TableCell>
            <TableCell className="max-w-[220px] truncate">{t.subject}</TableCell>
            <TableCell>{t.requester_name}</TableCell>
            <TableCell>{t.department}</TableCell>
            <TableCell>{t.category}</TableCell>
            <TableCell><PriorityBadge priority={t.priority} /></TableCell>
            <TableCell><StatusBadge status={t.status} /></TableCell>
            <TableCell>{t.assigned_agent_name || <span className="text-muted-foreground">Unassigned</span>}</TableCell>
            <TableCell>{formatDate(t.created_date, false)}</TableCell>
            <TableCell><SlaBadge dueDate={t.sla_due_date} status={t.status} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
