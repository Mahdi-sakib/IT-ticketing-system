import React from "react";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { toCsv, downloadCsv, printAsPdf } from "@/lib/analytics";
import { formatDate } from "@/lib/utils";

const RANGE_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "", label: "All time" },
];

export default function ExportBar({ range, onRangeChange, tickets }) {
  function exportCsv() {
    const csv = toCsv(tickets, [
      { label: "Ticket ID", value: "display_id" },
      { label: "Subject", value: "subject" },
      { label: "Requester", value: "requester_name" },
      { label: "Department", value: "department" },
      { label: "Category", value: "category" },
      { label: "Priority", value: "priority" },
      { label: "Status", value: "status" },
      { label: "Assigned Agent", value: "assigned_agent_name" },
      { label: "Created", value: (t) => formatDate(t.created_date) },
      { label: "Resolved", value: (t) => formatDate(t.resolved_at) },
    ]);
    downloadCsv(`omnidesk-tickets-${Date.now()}.csv`, csv);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={range} onChange={(e) => onRangeChange(e.target.value)} className="w-40">
        {RANGE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </Select>
      <Button variant="outline" onClick={exportCsv}>
        <Download className="h-4 w-4" /> Export CSV
      </Button>
      <Button variant="outline" onClick={printAsPdf}>
        <Printer className="h-4 w-4" /> Print / PDF
      </Button>
    </div>
  );
}
