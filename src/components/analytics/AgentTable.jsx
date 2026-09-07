import React from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Star } from "lucide-react";

export default function AgentTable({ data }) {
  if (!data.length) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No agent activity in this period.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Agent</TableHead>
          <TableHead>Assigned</TableHead>
          <TableHead>Resolved</TableHead>
          <TableHead>Avg. Resolution</TableHead>
          <TableHead>CSAT</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((a) => (
          <TableRow key={a.id}>
            <TableCell className="font-medium">{a.name}</TableCell>
            <TableCell>{a.assigned}</TableCell>
            <TableCell>{a.resolved}</TableCell>
            <TableCell>{a.avgResolutionMins ? `${Math.round(a.avgResolutionMins / 60)}h ${a.avgResolutionMins % 60}m` : "-"}</TableCell>
            <TableCell>
              {a.avgCsat ? (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {a.avgCsat}
                </span>
              ) : (
                "-"
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
