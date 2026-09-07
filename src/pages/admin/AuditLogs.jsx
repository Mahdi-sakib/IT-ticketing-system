import React, { useState } from "react";
import { Search, FileClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { AuditLogs } from "@/api/entities";
import { useLiveQuery } from "@/lib/query-client";
import { formatDate } from "@/lib/utils";

const ACTION_TONE = {
  create: "success", update: "secondary", delete: "destructive", disable: "warning",
  enable: "success", reset_password: "warning", approved: "success", rejected: "destructive", declare: "destructive",
};

export default function AuditLogsPage() {
  const [logs] = useLiveQuery(() => AuditLogs.list("-created_date"), []);
  const [search, setSearch] = useState("");

  const filtered = logs.filter((l) =>
    !search || `${l.user_name} ${l.action} ${l.entity}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold"><FileClock className="h-6 w-6" /> Audit Logs</h1>
        <p className="text-sm text-muted-foreground">Full, immutable record of administrative and data changes.</p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search by user, action, entity..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No audit events recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 200).map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="whitespace-nowrap text-xs">{formatDate(l.created_date)}</TableCell>
                    <TableCell>{l.user_name}</TableCell>
                    <TableCell><Badge variant={ACTION_TONE[l.action] || "outline"}>{l.action}</Badge></TableCell>
                    <TableCell>{l.entity}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{l.entity_id?.slice(0, 8)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.ip_address}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
