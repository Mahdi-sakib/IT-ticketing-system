import React, { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Network, Server } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/lib/AuthContext";
import { useRole } from "@/lib/useRole";
import { ConfigurationItems, logAudit } from "@/api/entities";
import { useLiveQuery } from "@/lib/query-client";
import { LOCATIONS, DEPARTMENTS } from "@/lib/ticketConstants";

const CI_TYPES = ["Server", "Application", "Database", "Network Device", "Storage", "Service", "Container", "Virtual Machine"];
const ENVIRONMENTS = ["production", "staging", "development", "test"];
const CI_STATUSES = ["operational", "degraded", "down", "maintenance", "decommissioned"];
const STATUS_TONE = { operational: "success", degraded: "warning", down: "destructive", maintenance: "outline", decommissioned: "secondary" };

const emptyForm = {
  name: "", ci_type: CI_TYPES[0], environment: ENVIRONMENTS[0], status: "operational",
  owner_team: DEPARTMENTS[0], hostname: "", ip_address: "", location: LOCATIONS[0],
  dependencies: "", related_asset_tag: "", notes: "",
};

export default function Cmdb() {
  const { user } = useAuth();
  const { isStaff, isAdmin } = useRole();
  const [items] = useLiveQuery(() => ConfigurationItems.list("name"), []);
  const [search, setSearch] = useState("");
  const [envFilter, setEnvFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = items.filter((c) => {
    if (envFilter && c.environment !== envFilter) return false;
    if (search && !`${c.name} ${c.hostname} ${c.ip_address}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function openNew() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(ci) {
    setEditing(ci);
    setForm({ ...emptyForm, ...ci, dependencies: (ci.dependencies || []).join(", ") });
    setOpen(true);
  }
  function set(field) { return (e) => setForm((f) => ({ ...f, [field]: e.target.value })); }

  function save() {
    const fields = { ...form, dependencies: form.dependencies.split(",").map((s) => s.trim()).filter(Boolean) };
    if (editing) {
      ConfigurationItems.update(editing.id, fields);
      logAudit({ userId: user.id, userName: user.full_name, action: "update", entity: "ConfigurationItem", entityId: editing.id, before: editing, after: fields });
      toast.success("CI updated");
    } else {
      const created = ConfigurationItems.create(fields);
      logAudit({ userId: user.id, userName: user.full_name, action: "create", entity: "ConfigurationItem", entityId: created.id, after: fields });
      toast.success("Configuration item created");
    }
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Configuration Management Database</h1>
          <p className="text-sm text-muted-foreground">Track IT infrastructure components and their relationships.</p>
        </div>
        {isStaff && <Button onClick={openNew}><Plus className="h-4 w-4" /> Add CI</Button>}
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-5">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search by name, hostname, IP..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select className="w-44" value={envFilter} onChange={(e) => setEnvFilter(e.target.value)}>
            <option value="">All environments</option>
            {ENVIRONMENTS.map((e) => (<option key={e} value={e}>{e}</option>))}
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
              <Network className="h-8 w-8" />
              <p className="text-sm">No configuration items found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner Team</TableHead>
                  <TableHead>Hostname</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Dependencies</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} className={isStaff ? "cursor-pointer" : ""} onClick={() => isStaff && openEdit(c)}>
                    <TableCell className="flex items-center gap-2 font-medium"><Server className="h-3.5 w-3.5 text-muted-foreground" />{c.name}</TableCell>
                    <TableCell>{c.ci_type}</TableCell>
                    <TableCell className="capitalize">{c.environment}</TableCell>
                    <TableCell><Badge variant={STATUS_TONE[c.status]}>{c.status}</Badge></TableCell>
                    <TableCell>{c.owner_team}</TableCell>
                    <TableCell className="font-mono text-xs">{c.hostname}</TableCell>
                    <TableCell className="font-mono text-xs">{c.ip_address}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">{(c.dependencies || []).join(", ") || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)} className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? `Edit ${editing.name}` : "Add Configuration Item"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Name</Label><Input value={form.name} onChange={set("name")} /></div>
            <div className="space-y-1.5"><Label>Type</Label><Select value={form.ci_type} onChange={set("ci_type")}>{CI_TYPES.map((t) => <option key={t}>{t}</option>)}</Select></div>
            <div className="space-y-1.5"><Label>Environment</Label><Select value={form.environment} onChange={set("environment")}>{ENVIRONMENTS.map((e) => <option key={e} value={e}>{e}</option>)}</Select></div>
            <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onChange={set("status")}>{CI_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</Select></div>
            <div className="space-y-1.5"><Label>Owner Team</Label><Select value={form.owner_team} onChange={set("owner_team")}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</Select></div>
            <div className="space-y-1.5"><Label>Location</Label><Select value={form.location} onChange={set("location")}>{LOCATIONS.map((l) => <option key={l}>{l}</option>)}</Select></div>
            <div className="space-y-1.5"><Label>Hostname</Label><Input value={form.hostname} onChange={set("hostname")} /></div>
            <div className="space-y-1.5"><Label>IP Address</Label><Input value={form.ip_address} onChange={set("ip_address")} /></div>
            <div className="space-y-1.5"><Label>Related Asset Tag</Label><Input value={form.related_asset_tag} onChange={set("related_asset_tag")} /></div>
            <div className="space-y-1.5"><Label>Dependencies (comma-separated)</Label><Input value={form.dependencies} onChange={set("dependencies")} placeholder="app-server-01, db-primary" /></div>
            <div className="col-span-2 space-y-1.5"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={set("notes")} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save Changes" : "Create CI"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
