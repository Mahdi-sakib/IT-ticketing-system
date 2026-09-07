import React, { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, ShieldQuestion } from "lucide-react";
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
import { Problems, Users, logAudit } from "@/api/entities";
import { useLiveQuery } from "@/lib/query-client";
import { formatDate } from "@/lib/utils";
import { CATEGORIES, PRIORITIES, PRIORITY_LABELS } from "@/lib/ticketConstants";

const PROBLEM_STATUSES = ["open", "investigating", "root_cause_identified", "resolved", "closed"];
const STATUS_LABELS = { open: "Open", investigating: "Investigating", root_cause_identified: "Root Cause Identified", resolved: "Resolved", closed: "Closed" };
const STATUS_TONE = { open: "default", investigating: "warning", root_cause_identified: "secondary", resolved: "success", closed: "outline" };

const emptyForm = {
  title: "", description: "", category: CATEGORIES[0], priority: "medium", status: "open",
  root_cause: "", workaround: "", owner_id: "", related_ticket_ids: "",
};

export default function ProblemsPage() {
  const { user } = useAuth();
  const { isStaff } = useRole();
  const [problems] = useLiveQuery(() => Problems.list("-created_date"), []);
  const [agents] = useLiveQuery(() => Users.filter({ role: "agent" }), []);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = problems.filter((p) => {
    if (statusFilter && p.status !== statusFilter) return false;
    if (search && !`${p.title}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function openNew() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(p) {
    setEditing(p);
    setForm({ ...emptyForm, ...p, related_ticket_ids: (p.related_ticket_ids || []).join(", ") });
    setOpen(true);
  }
  function set(field) { return (e) => setForm((f) => ({ ...f, [field]: e.target.value })); }

  function save() {
    const owner = agents.find((a) => a.id === form.owner_id);
    const fields = {
      ...form,
      owner_name: owner?.full_name || null,
      related_ticket_ids: form.related_ticket_ids.split(",").map((s) => s.trim()).filter(Boolean),
    };
    if (editing) {
      Problems.update(editing.id, fields);
      logAudit({ userId: user.id, userName: user.full_name, action: "update", entity: "Problem", entityId: editing.id, before: editing, after: fields });
      toast.success("Problem updated");
    } else {
      const created = Problems.create({ ...fields, display_id: `PRB-${String(problems.length + 1).padStart(4, "0")}` });
      logAudit({ userId: user.id, userName: user.full_name, action: "create", entity: "Problem", entityId: created.id, after: fields });
      toast.success("Problem record created");
    }
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Problem Management</h1>
          <p className="text-sm text-muted-foreground">Investigate root causes behind recurring incidents.</p>
        </div>
        {isStaff && <Button onClick={openNew}><Plus className="h-4 w-4" /> New Problem</Button>}
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-5">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search problems..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select className="w-52" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {PROBLEM_STATUSES.map((s) => (<option key={s} value={s}>{STATUS_LABELS[s]}</option>))}
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
              <ShieldQuestion className="h-8 w-8" />
              <p className="text-sm">No problem records found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id} className={isStaff ? "cursor-pointer" : ""} onClick={() => isStaff && openEdit(p)}>
                    <TableCell className="font-medium text-primary">{p.display_id}</TableCell>
                    <TableCell className="max-w-[260px] truncate">{p.title}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell>{PRIORITY_LABELS[p.priority]}</TableCell>
                    <TableCell><Badge variant={STATUS_TONE[p.status]}>{STATUS_LABELS[p.status]}</Badge></TableCell>
                    <TableCell>{p.owner_name || "-"}</TableCell>
                    <TableCell>{formatDate(p.created_date, false)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)} className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? editing.display_id : "New Problem Record"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={set("title")} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={set("description")} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Category</Label><Select value={form.category} onChange={set("category")}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></div>
              <div className="space-y-1.5"><Label>Priority</Label><Select value={form.priority} onChange={set("priority")}>{PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}</Select></div>
              <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onChange={set("status")}>{PROBLEM_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</Select></div>
            </div>
            <div className="space-y-1.5"><Label>Owner</Label><Select value={form.owner_id} onChange={set("owner_id")}><option value="">Unassigned</option>{agents.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}</Select></div>
            <div className="space-y-1.5"><Label>Root Cause</Label><Textarea rows={2} value={form.root_cause} onChange={set("root_cause")} /></div>
            <div className="space-y-1.5"><Label>Workaround</Label><Textarea rows={2} value={form.workaround} onChange={set("workaround")} /></div>
            <div className="space-y-1.5"><Label>Related Ticket IDs (comma-separated)</Label><Input value={form.related_ticket_ids} onChange={set("related_ticket_ids")} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save Changes" : "Create Problem"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
