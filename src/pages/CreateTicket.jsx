import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Sparkles, Send, Paperclip } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/lib/AuthContext";
import { Tickets, TicketHistory, Assets, Users, Notifications } from "@/api/entities";
import { CATEGORIES, SUBCATEGORIES, PRIORITIES, PRIORITY_LABELS, DEPARTMENTS, LOCATIONS, CONTACT_METHODS, nextTicketId, slaDueDate } from "@/lib/ticketConstants";
import { classifyTicket, autoRouteTicket } from "@/lib/ai";
import { runAutomationRules } from "@/lib/automation";
import { useLiveQuery } from "@/lib/query-client";

export default function CreateTicket() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assets] = useLiveQuery(() => (user ? Assets.filter({ assigned_to_id: user.id }) : []), [user?.id]);
  const [form, setForm] = useState({
    subject: "",
    description: "",
    category: CATEGORIES[0],
    subcategory: SUBCATEGORIES[CATEGORIES[0]][0],
    priority: "medium",
    department: user?.department || DEPARTMENTS[0],
    location: user?.location || LOCATIONS[0],
    contact_method: CONTACT_METHODS[0],
    related_asset_id: "",
    file: null,
  });
  const [submitting, setSubmitting] = useState(false);

  const aiPreview = useMemo(() => {
    if (!form.subject && !form.description) return null;
    return classifyTicket({ subject: form.subject, description: form.description, id: "draft" });
  }, [form.subject, form.description]);

  function set(field) {
    return (e) => {
      const value = e?.target ? (e.target.type === "file" ? e.target.files?.[0] : e.target.value) : e;
      setForm((f) => {
        const next = { ...f, [field]: value };
        if (field === "category") next.subcategory = SUBCATEGORIES[value]?.[0] || "";
        return next;
      });
    };
  }

  function applyAiSuggestion() {
    if (!aiPreview) return;
    setForm((f) => ({ ...f, category: aiPreview.category, subcategory: aiPreview.subcategory, priority: aiPreview.priority }));
    toast.success("AI suggestion applied");
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) return;
    setSubmitting(true);
    try {
      const asset = assets.find((a) => a.id === form.related_asset_id);
      const createdAt = new Date().toISOString();
      const dueDate = slaDueDate(createdAt, form.priority);
      const ticket = Tickets.create({
        display_id: nextTicketId(Tickets.count() + 1),
        subject: form.subject.trim(),
        description: form.description.trim(),
        category: form.category,
        subcategory: form.subcategory,
        priority: form.priority,
        status: "new",
        channel: "portal",
        contact_method: form.contact_method,
        department: form.department,
        location: form.location,
        requester_id: user.id,
        requester_name: user.full_name,
        requester_email: user.email,
        related_asset_id: asset?.id || null,
        related_asset_tag: asset?.asset_tag || null,
        sla_due_date: dueDate,
        escalation_level: 0,
        attachment_name: form.file?.name || null,
      });

      TicketHistory.create({ ticket_id: ticket.id, action: "Ticket created", actor_name: user.full_name });

      const ai = classifyTicket(ticket);
      Tickets.update(ticket.id, {
        ai_category: ai.category,
        ai_subcategory: ai.subcategory,
        ai_priority: ai.priority,
        ai_recommended_team: ai.recommendedTeam,
      });

      runAutomationRules(ticket, "ticket_created");

      const routed = autoRouteTicket(ticket);
      if (routed) {
        Tickets.update(ticket.id, { assigned_agent_id: routed.id, assigned_agent_name: routed.full_name, status: "assigned" });
        TicketHistory.create({ ticket_id: ticket.id, action: `Auto-routed to ${routed.full_name}`, actor_name: "System" });
        Notifications.create({ user_id: routed.id, type: "ticket_assigned", title: `New ticket: ${ticket.display_id}`, body: ticket.subject, ticket_id: ticket.id, read: false });
      } else {
        Users.filter({ role: "admin" }).forEach((a) =>
          Notifications.create({ user_id: a.id, type: "ticket_created", title: `New ticket: ${ticket.display_id}`, body: ticket.subject, ticket_id: ticket.id, read: false })
        );
      }

      toast.success(`Ticket ${ticket.display_id} created`);
      navigate(`/tickets/${ticket.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Create a Ticket</h1>
        <p className="text-sm text-muted-foreground">Describe your issue and we'll route it to the right team.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Issue Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" required value={form.subject} onChange={set("subject")} placeholder="e.g. Can't connect to office Wi-Fi" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" required rows={5} value={form.description} onChange={set("description")} placeholder="Describe what happened, when it started, and any error messages..." />
            </div>

            {aiPreview && (
              <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="flex-1">
                  <p>
                    AI suggests: <strong>{aiPreview.category}</strong> / {aiPreview.subcategory} · Priority{" "}
                    <strong>{PRIORITY_LABELS[aiPreview.priority]}</strong> · Route to {aiPreview.recommendedTeam}
                  </p>
                  {aiPreview.duplicates.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Similar existing tickets: {aiPreview.duplicates.map((d) => d.display_id).join(", ")}
                    </p>
                  )}
                  <Button type="button" size="sm" variant="link" className="h-auto p-0 text-xs" onClick={applyAiSuggestion}>
                    Use this suggestion
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onChange={set("category")}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Subcategory</Label>
                <Select value={form.subcategory} onChange={set("subcategory")}>
                  {(SUBCATEGORIES[form.category] || []).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onChange={set("priority")}>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Preferred contact method</Label>
                <Select value={form.contact_method} onChange={set("contact_method")}>
                  {CONTACT_METHODS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select value={form.department} onChange={set("department")}>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Select value={form.location} onChange={set("location")}>
                  {LOCATIONS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </Select>
              </div>
            </div>

            {assets.length > 0 && (
              <div className="space-y-1.5">
                <Label>Related asset (optional)</Label>
                <Select value={form.related_asset_id} onChange={set("related_asset_id")}>
                  <option value="">None</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.asset_tag})</option>
                  ))}
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Attachment (optional)</Label>
              <label className="flex h-9 w-fit cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 text-sm text-muted-foreground hover:bg-secondary">
                <Paperclip className="h-4 w-4" />
                {form.file?.name || "Attach a file"}
                <input type="file" className="hidden" onChange={set("file")} />
              </label>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" disabled={submitting}>
          <Send className="h-4 w-4" /> Submit Ticket
        </Button>
      </form>
    </div>
  );
}
