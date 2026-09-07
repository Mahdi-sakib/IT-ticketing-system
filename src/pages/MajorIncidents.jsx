import React, { useState } from "react";
import { toast } from "sonner";
import { Plus, Siren, MessageSquarePlus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/lib/AuthContext";
import { useRole } from "@/lib/useRole";
import { MajorIncidents, Users, Notifications, logAudit } from "@/api/entities";
import { useLiveQuery } from "@/lib/query-client";
import { formatDate, timeAgo } from "@/lib/utils";

const SEVERITIES = ["SEV1", "SEV2", "SEV3", "SEV4"];
const SEVERITY_TONE = { SEV1: "destructive", SEV2: "warning", SEV3: "secondary", SEV4: "outline" };
const STATUSES = ["active", "monitoring", "resolved"];
const STATUS_TONE = { active: "destructive", monitoring: "warning", resolved: "success" };

const emptyForm = { title: "", description: "", severity: "SEV2", impact: "", affected_services: "", commander_id: "" };

export default function MajorIncidentsPage() {
  const { user } = useAuth();
  const { isStaff, isAdmin } = useRole();
  const [incidents] = useLiveQuery(() => MajorIncidents.list("-created_date"), []);
  const [agents] = useLiveQuery(() => Users.filter({ role: ["agent", "admin"] }), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [updateOpen, setUpdateOpen] = useState(null);
  const [updateText, setUpdateText] = useState("");

  function set(field) { return (e) => setForm((f) => ({ ...f, [field]: e.target.value })); }

  function declare() {
    const commander = agents.find((a) => a.id === form.commander_id);
    const created = MajorIncidents.create({
      ...form,
      display_id: `MI-${String(incidents.length + 1).padStart(4, "0")}`,
      status: "active",
      commander_name: commander?.full_name || user.full_name,
      started_at: new Date().toISOString(),
      updates: [{ time: new Date().toISOString(), text: "Major incident declared.", author: user.full_name }],
    });
    logAudit({ userId: user.id, userName: user.full_name, action: "declare", entity: "MajorIncident", entityId: created.id, after: form });
    Users.filter({ role: ["agent", "admin"] }).forEach((a) =>
      Notifications.create({ user_id: a.id, type: "major_incident", title: `Major Incident Declared: ${created.title}`, body: created.impact, read: false })
    );
    toast.success("Major incident declared — team notified");
    setOpen(false);
    setForm(emptyForm);
  }

  function addUpdate(incident) {
    if (!updateText.trim()) return;
    const updates = [...(incident.updates || []), { time: new Date().toISOString(), text: updateText.trim(), author: user.full_name }];
    MajorIncidents.update(incident.id, { updates });
    setUpdateText("");
    setUpdateOpen(null);
  }

  function changeStatus(incident, status) {
    const fields = { status };
    if (status === "resolved") fields.resolved_at = new Date().toISOString();
    MajorIncidents.update(incident.id, {
      ...fields,
      updates: [...(incident.updates || []), { time: new Date().toISOString(), text: `Status changed to ${status}.`, author: user.full_name }],
    });
    toast.success(`Incident marked as ${status}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Major Incident Management</h1>
          <p className="text-sm text-muted-foreground">Coordinate response to critical, service-wide incidents.</p>
        </div>
        {isStaff && (
          <Button variant="destructive" onClick={() => setOpen(true)}>
            <Siren className="h-4 w-4" /> Declare Major Incident
          </Button>
        )}
      </div>

      {incidents.length === 0 && (
        <Card><CardContent className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground"><Siren className="h-8 w-8" /><p className="text-sm">No major incidents recorded.</p></CardContent></Card>
      )}

      <div className="space-y-4">
        {incidents.map((inc) => (
          <Card key={inc.id} className={inc.status === "active" ? "border-red-300" : ""}>
            <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <Badge variant={SEVERITY_TONE[inc.severity]}>{inc.severity}</Badge>
                  <Badge variant={STATUS_TONE[inc.status]}>{inc.status}</Badge>
                  <span className="text-xs text-muted-foreground">{inc.display_id}</span>
                </div>
                <CardTitle>{inc.title}</CardTitle>
              </div>
              {isStaff && inc.status !== "resolved" && (
                <Select className="w-40" value={inc.status} onChange={(e) => changeStatus(inc, e.target.value)}>
                  {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
                </Select>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{inc.description}</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                <p><strong>Commander:</strong> {inc.commander_name}</p>
                <p><strong>Impact:</strong> {inc.impact}</p>
                <p><strong>Affected:</strong> {inc.affected_services}</p>
                <p><strong>Started:</strong> {formatDate(inc.started_at)}</p>
              </div>
              <div className="rounded-md border border-border">
                <div className="border-b border-border px-3 py-2 text-xs font-semibold">Timeline</div>
                <div className="max-h-48 space-y-2 overflow-y-auto p-3">
                  {(inc.updates || []).slice().reverse().map((u, i) => (
                    <div key={i} className="text-sm">
                      <span className="text-xs text-muted-foreground">{timeAgo(u.time)} · {u.author}</span>
                      <p>{u.text}</p>
                    </div>
                  ))}
                </div>
                {isStaff && inc.status !== "resolved" && (
                  <div className="flex items-center gap-2 border-t border-border p-2">
                    <Input
                      placeholder="Post a status update..."
                      value={updateOpen === inc.id ? updateText : ""}
                      onFocus={() => setUpdateOpen(inc.id)}
                      onChange={(e) => setUpdateText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addUpdate(inc)}
                    />
                    <Button size="icon" onClick={() => addUpdate(inc)}><MessageSquarePlus className="h-4 w-4" /></Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)} className="max-w-lg">
          <DialogHeader><DialogTitle>Declare Major Incident</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={set("title")} placeholder="e.g. Company-wide email outage" /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={set("description")} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Severity</Label><Select value={form.severity} onChange={set("severity")}>{SEVERITIES.map((s) => <option key={s}>{s}</option>)}</Select></div>
              <div className="space-y-1.5"><Label>Incident Commander</Label><Select value={form.commander_id} onChange={set("commander_id")}><option value="">Me ({user?.full_name})</option>{agents.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}</Select></div>
            </div>
            <div className="space-y-1.5"><Label>Business Impact</Label><Input value={form.impact} onChange={set("impact")} placeholder="e.g. All employees unable to send/receive email" /></div>
            <div className="space-y-1.5"><Label>Affected Services</Label><Input value={form.affected_services} onChange={set("affected_services")} placeholder="e.g. Microsoft 365, Exchange Online" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={declare}>Declare Incident</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
