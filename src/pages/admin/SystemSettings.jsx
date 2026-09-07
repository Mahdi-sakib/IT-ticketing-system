import React, { useState } from "react";
import { toast } from "sonner";
import { Plus, Settings, Zap, ShieldAlert, RotateCcw, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AutomationRules, logAudit } from "@/api/entities";
import { useAuth } from "@/lib/AuthContext";
import { useLiveQuery } from "@/lib/query-client";
import { processSlaEscalations } from "@/lib/ai";
import { resetDatabase } from "@/api/db";
import { SLA_POLICY, PRIORITY_LABELS } from "@/lib/ticketConstants";
import { formatDate } from "@/lib/utils";

const TRIGGER_TYPES = ["ticket_created", "ticket_updated", "sla_breach"];
const emptyForm = { name: "", description: "", trigger_type: "ticket_created", conditions: "", actions: "", priority_order: 1, enabled: true };

export default function SystemSettings() {
  const { user } = useAuth();
  const [rules] = useLiveQuery(() => AutomationRules.list("priority_order"), []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  function openNew() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(r) { setEditing(r); setForm({ ...emptyForm, ...r }); setOpen(true); }
  function set(field) {
    return (e) => {
      const value = e?.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e;
      setForm((f) => ({ ...f, [field]: value }));
    };
  }

  function save() {
    if (editing) {
      AutomationRules.update(editing.id, form);
      logAudit({ userId: user.id, userName: user.full_name, action: "update", entity: "AutomationRule", entityId: editing.id, before: editing, after: form });
      toast.success("Rule updated");
    } else {
      const created = AutomationRules.create({ ...form, last_run: null, run_count: 0 });
      logAudit({ userId: user.id, userName: user.full_name, action: "create", entity: "AutomationRule", entityId: created.id, after: form });
      toast.success("Automation rule created");
    }
    setOpen(false);
  }

  function toggleEnabled(r) {
    AutomationRules.update(r.id, { enabled: !r.enabled });
  }

  function deleteRule(r) {
    AutomationRules.delete(r.id);
    toast.success("Rule deleted");
  }

  function runEscalations() {
    const { escalated, checked } = processSlaEscalations();
    toast.success(`Checked ${checked} open tickets — escalated ${escalated}.`);
  }

  function handleReset() {
    if (!confirm("This will erase all local demo data and reload the app. Continue?")) return;
    resetDatabase();
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold"><Settings className="h-6 w-6" /> System Settings</h1>
        <p className="text-sm text-muted-foreground">SLA policies, automation rules, and system administration.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>SLA Policy (by priority)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Priority</TableHead><TableHead>First Response Target</TableHead><TableHead>Resolution Target</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(SLA_POLICY).map(([priority, policy]) => (
                <TableRow key={priority}>
                  <TableCell>{PRIORITY_LABELS[priority]}</TableCell>
                  <TableCell>{policy.response} min</TableCell>
                  <TableCell>{policy.resolution >= 60 ? `${policy.resolution / 60}h` : `${policy.resolution} min`}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-3 text-xs text-muted-foreground">To change these targets, edit src/lib/ticketConstants.js (SLA_POLICY) — a future release can move this to an editable database-backed policy.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2"><Zap className="h-4 w-4" /> No-Code Automation Rules</CardTitle>
          <Button size="sm" onClick={openNew}><Plus className="h-4 w-4" /> New Rule</Button>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No automation rules yet. Create one to auto-set priority, category, or routing on new tickets.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead><TableHead>Trigger</TableHead><TableHead>Conditions</TableHead>
                  <TableHead>Actions</TableHead><TableHead>Runs</TableHead><TableHead>Enabled</TableHead><TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="cursor-pointer font-medium" onClick={() => openEdit(r)}>{r.name}</TableCell>
                    <TableCell><Badge variant="outline">{r.trigger_type}</Badge></TableCell>
                    <TableCell className="max-w-[160px] truncate font-mono text-xs">{r.conditions || "always"}</TableCell>
                    <TableCell className="max-w-[160px] truncate font-mono text-xs">{r.actions}</TableCell>
                    <TableCell>{r.run_count || 0}</TableCell>
                    <TableCell><Checkbox checked={r.enabled} onChange={() => toggleEnabled(r)} /></TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteRule(r)}><Trash2 className="h-3.5 w-3.5 text-red-600" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> SLA / Escalation Engine</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Manually trigger a scan for breached SLAs and escalate them (this also runs automatically in the background while the app is open).</p>
          <Button variant="outline" onClick={runEscalations}>Run Escalation Check</Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader><CardTitle className="text-destructive">Danger Zone</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Erase all local demo data (tickets, users, assets, etc.) and reseed from scratch.</p>
          <Button variant="destructive" onClick={handleReset}><RotateCcw className="h-4 w-4" /> Reset Demo Data</Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)} className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Rule" : "New Automation Rule"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Name</Label><Input value={form.name} onChange={set("name")} placeholder="Auto-escalate cybersecurity tickets" /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={set("description")} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Trigger</Label><Select value={form.trigger_type} onChange={set("trigger_type")}>{TRIGGER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</Select></div>
              <div className="space-y-1.5"><Label>Priority Order</Label><Input type="number" value={form.priority_order} onChange={set("priority_order")} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Conditions</Label>
              <Input value={form.conditions} onChange={set("conditions")} placeholder="category=Cybersecurity" />
              <p className="text-xs text-muted-foreground">Format: field=value; field2=value2 (leave blank to always match)</p>
            </div>
            <div className="space-y-1.5">
              <Label>Actions</Label>
              <Input value={form.actions} onChange={set("actions")} placeholder="priority=critical; assign_team=Security Team" />
              <p className="text-xs text-muted-foreground">Supported fields: priority, category, subcategory, status, department, assign_team, escalate</p>
            </div>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.enabled} onChange={set("enabled")} /> Enabled</label>
            {editing?.last_run && <p className="text-xs text-muted-foreground">Last ran {formatDate(editing.last_run)} · {editing.run_count} total runs</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save Changes" : "Create Rule"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
