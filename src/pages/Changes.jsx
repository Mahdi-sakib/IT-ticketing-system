import React, { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, GitPullRequest, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/lib/AuthContext";
import { useRole } from "@/lib/useRole";
import { ChangeRequests, Users, logAudit } from "@/api/entities";
import { useLiveQuery } from "@/lib/query-client";
import { formatDate } from "@/lib/utils";
import { CATEGORIES } from "@/lib/ticketConstants";

const CHANGE_TYPES = ["standard", "normal", "emergency"];
const RISK_LEVELS = ["low", "medium", "high"];
const CHANGE_STATUSES = ["draft", "pending_approval", "approved", "scheduled", "in_progress", "completed", "rejected", "rolled_back"];
const STATUS_LABELS = {
  draft: "Draft", pending_approval: "Pending Approval", approved: "Approved", scheduled: "Scheduled",
  in_progress: "In Progress", completed: "Completed", rejected: "Rejected", rolled_back: "Rolled Back",
};
const STATUS_TONE = {
  draft: "outline", pending_approval: "warning", approved: "secondary", scheduled: "secondary",
  in_progress: "warning", completed: "success", rejected: "destructive", rolled_back: "destructive",
};

const emptyForm = {
  title: "", description: "", type: "normal", risk_level: "medium", category: CATEGORIES[0],
  impact_analysis: "", implementation_plan: "", rollback_plan: "", testing_plan: "",
  scheduled_date: "", status: "draft", cab_required: false, owner_id: "", approval_notes: "", affected_ci_ids: "",
};

export default function Changes() {
  const { user } = useAuth();
  const { isStaff, isAdmin } = useRole();
  const [changes] = useLiveQuery(() => ChangeRequests.list("-created_date"), []);
  const [agents] = useLiveQuery(() => Users.filter({ role: "agent" }), []);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = changes.filter((c) => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (search && !`${c.title}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function openNew() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(c) {
    setEditing(c);
    setForm({ ...emptyForm, ...c, scheduled_date: c.scheduled_date?.slice(0, 16) || "", affected_ci_ids: (c.affected_ci_ids || []).join(", ") });
    setOpen(true);
  }
  function set(field) {
    return (e) => {
      const value = e?.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e;
      setForm((f) => ({ ...f, [field]: value }));
    };
  }

  function save() {
    const owner = agents.find((a) => a.id === form.owner_id);
    const fields = { ...form, owner_name: owner?.full_name || null, affected_ci_ids: form.affected_ci_ids.split(",").map((s) => s.trim()).filter(Boolean) };
    if (editing) {
      ChangeRequests.update(editing.id, fields);
      logAudit({ userId: user.id, userName: user.full_name, action: "update", entity: "ChangeRequest", entityId: editing.id, before: editing, after: fields });
      toast.success("Change request updated");
    } else {
      const created = ChangeRequests.create({
        ...fields,
        display_id: `CHG-${String(changes.length + 1).padStart(4, "0")}`,
        requested_by_name: user.full_name,
      });
      logAudit({ userId: user.id, userName: user.full_name, action: "create", entity: "ChangeRequest", entityId: created.id, after: fields });
      toast.success("Change request submitted");
    }
    setOpen(false);
  }

  function decide(change, status) {
    ChangeRequests.update(change.id, { status, approver_name: user.full_name });
    logAudit({ userId: user.id, userName: user.full_name, action: status, entity: "ChangeRequest", entityId: change.id });
    toast.success(`Change ${status === "approved" ? "approved" : "rejected"}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Change Management</h1>
          <p className="text-sm text-muted-foreground">Plan, review, and approve changes through the CAB process.</p>
        </div>
        {isStaff && <Button onClick={openNew}><Plus className="h-4 w-4" /> New Change</Button>}
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-5">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search changes..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select className="w-52" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {CHANGE_STATUSES.map((s) => (<option key={s} value={s}>{STATUS_LABELS[s]}</option>))}
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
              <GitPullRequest className="h-8 w-8" />
              <p className="text-sm">No change requests found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Requested By</TableHead>
                  {isAdmin && <TableHead>Approve</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="cursor-pointer font-medium text-primary" onClick={() => isStaff && openEdit(c)}>{c.display_id}</TableCell>
                    <TableCell className="max-w-[220px] cursor-pointer truncate" onClick={() => isStaff && openEdit(c)}>{c.title}</TableCell>
                    <TableCell className="capitalize">{c.type}</TableCell>
                    <TableCell className="capitalize">{c.risk_level}</TableCell>
                    <TableCell><Badge variant={STATUS_TONE[c.status]}>{STATUS_LABELS[c.status]}</Badge></TableCell>
                    <TableCell>{formatDate(c.scheduled_date)}</TableCell>
                    <TableCell>{c.requested_by_name}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        {c.status === "pending_approval" ? (
                          <div className="flex gap-1">
                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => decide(c, "approved")}><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /></Button>
                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => decide(c, "rejected")}><XCircle className="h-3.5 w-3.5 text-red-600" /></Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">{c.approver_name || "-"}</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)} className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? editing.display_id : "New Change Request"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={set("title")} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={set("description")} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Type</Label><Select value={form.type} onChange={set("type")}>{CHANGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</Select></div>
              <div className="space-y-1.5"><Label>Risk Level</Label><Select value={form.risk_level} onChange={set("risk_level")}>{RISK_LEVELS.map((r) => <option key={r} value={r}>{r}</option>)}</Select></div>
              <div className="space-y-1.5"><Label>Category</Label><Select value={form.category} onChange={set("category")}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></div>
            </div>
            <div className="space-y-1.5"><Label>Impact Analysis</Label><Textarea rows={2} value={form.impact_analysis} onChange={set("impact_analysis")} /></div>
            <div className="space-y-1.5"><Label>Implementation Plan</Label><Textarea rows={2} value={form.implementation_plan} onChange={set("implementation_plan")} /></div>
            <div className="space-y-1.5"><Label>Rollback Plan</Label><Textarea rows={2} value={form.rollback_plan} onChange={set("rollback_plan")} /></div>
            <div className="space-y-1.5"><Label>Testing Plan</Label><Textarea rows={2} value={form.testing_plan} onChange={set("testing_plan")} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Scheduled Date/Time</Label><Input type="datetime-local" value={form.scheduled_date} onChange={set("scheduled_date")} /></div>
              <div className="space-y-1.5"><Label>Owner</Label><Select value={form.owner_id} onChange={set("owner_id")}><option value="">Unassigned</option>{agents.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}</Select></div>
            </div>
            <div className="space-y-1.5"><Label>Affected CI IDs (comma-separated)</Label><Input value={form.affected_ci_ids} onChange={set("affected_ci_ids")} /></div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.cab_required} onChange={set("cab_required")} /> Requires CAB approval
            </label>
            <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onChange={set("status")}>{CHANGE_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</Select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save Changes" : "Submit Change"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
