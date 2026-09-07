import React, { useState } from "react";
import { toast } from "sonner";
import { Sparkles, UserPlus, Wand2, CheckCircle2, XCircle, HelpCircle, PauseCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tickets, TicketHistory, Users, Notifications } from "@/api/entities";
import { useAuth } from "@/lib/AuthContext";
import { PRIORITIES, PRIORITY_LABELS, TICKET_STATUSES, STATUS_LABELS } from "@/lib/ticketConstants";
import { classifyTicket, autoRouteTicket, resolutionSummary } from "@/lib/ai";
import { useLiveQuery } from "@/lib/query-client";

function logHistory(ticketId, action, actorName) {
  TicketHistory.create({ ticket_id: ticketId, action, actor_name: actorName });
}

function notifyEmployee(ticket, title, body) {
  if (!ticket.requester_id) return;
  Notifications.create({ user_id: ticket.requester_id, type: "ticket_update", title, body, ticket_id: ticket.id, read: false });
}

export default function AgentActions({ ticket }) {
  const { user } = useAuth();
  const [agents] = useLiveQuery(() => Users.filter({ role: "agent" }), []);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolutionText, setResolutionText] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoText, setInfoText] = useState("");

  function assignTo(agent) {
    Tickets.update(ticket.id, {
      assigned_agent_id: agent.id,
      assigned_agent_name: agent.full_name,
      status: ticket.status === "new" ? "assigned" : ticket.status,
    });
    logHistory(ticket.id, `Assigned to ${agent.full_name}`, user.full_name);
    Notifications.create({ user_id: agent.id, type: "ticket_assigned", title: `Ticket assigned: ${ticket.display_id}`, body: ticket.subject, ticket_id: ticket.id, read: false });
    toast.success(`Assigned to ${agent.full_name}`);
  }

  function pickUp() {
    assignTo(user);
  }

  function smartAssign() {
    const best = autoRouteTicket(ticket);
    if (!best) return toast.error("No available agents to route to.");
    assignTo(best);
  }

  function changeStatus(status) {
    const fields = { status };
    if (status === "resolved") fields.resolved_at = new Date().toISOString();
    Tickets.update(ticket.id, fields);
    logHistory(ticket.id, `Status changed to ${STATUS_LABELS[status]}`, user.full_name);
    notifyEmployee(ticket, `Ticket ${STATUS_LABELS[status].toLowerCase()}`, ticket.subject);
    toast.success(`Marked as ${STATUS_LABELS[status]}`);
  }

  function changePriority(priority) {
    Tickets.update(ticket.id, { priority });
    logHistory(ticket.id, `Priority changed to ${PRIORITY_LABELS[priority]}`, user.full_name);
    toast.success("Priority updated");
  }

  function runClassifier() {
    const result = classifyTicket(ticket);
    Tickets.update(ticket.id, {
      ai_category: result.category,
      ai_subcategory: result.subcategory,
      ai_priority: result.priority,
      ai_recommended_team: result.recommendedTeam,
    });
    logHistory(ticket.id, "AI classification suggested", "AI Assistant");
    toast.success(`AI suggests: ${result.category} / ${PRIORITY_LABELS[result.priority]} → ${result.recommendedTeam}`);
  }

  function applyAiSuggestion() {
    if (!ticket.ai_category) return;
    Tickets.update(ticket.id, { category: ticket.ai_category, subcategory: ticket.ai_subcategory, priority: ticket.ai_priority });
    logHistory(ticket.id, "Applied AI classification", user.full_name);
    toast.success("AI suggestion applied");
  }

  function requestInfo() {
    Tickets.update(ticket.id, { status: "pending" });
    logHistory(ticket.id, "Requested more information from requester", user.full_name);
    notifyEmployee(ticket, "More information needed", infoText || "The IT team needs more details to continue.");
    setInfoOpen(false);
    setInfoText("");
    toast.success("Marked as pending — requester notified");
  }

  function resolve() {
    const summary = resolutionText || resolutionSummary(ticket);
    Tickets.update(ticket.id, { status: "resolved", resolved_at: new Date().toISOString(), resolution_summary: summary });
    logHistory(ticket.id, "Ticket resolved", user.full_name);
    notifyEmployee(ticket, "Your ticket has been resolved", summary);
    setResolveOpen(false);
    toast.success("Ticket resolved");
  }

  function closeTicket() {
    Tickets.update(ticket.id, { status: "closed" });
    logHistory(ticket.id, "Ticket closed", user.full_name);
    notifyEmployee(ticket, "Ticket closed", ticket.subject);
    toast.success("Ticket closed");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Agent Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!ticket.assigned_agent_id && (
          <div className="flex gap-2">
            <Button className="flex-1" variant="outline" onClick={pickUp}>
              <UserPlus className="h-4 w-4" /> Pick up
            </Button>
            <Button className="flex-1" variant="outline" onClick={smartAssign}>
              <Wand2 className="h-4 w-4" /> Smart Assign
            </Button>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-muted-foreground">Reassign to</label>
          <Select value={ticket.assigned_agent_id || ""} onChange={(e) => {
            const agent = agents.find((a) => a.id === e.target.value);
            if (agent) assignTo(agent);
          }}>
            <option value="">Select agent...</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.full_name}</option>
            ))}
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Priority</label>
          <Select value={ticket.priority} onChange={(e) => changePriority(e.target.value)}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
            ))}
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select value={ticket.status} onChange={(e) => changeStatus(e.target.value)}>
            {TICKET_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </Select>
        </div>

        <Button variant="outline" className="w-full" onClick={runClassifier}>
          <Sparkles className="h-4 w-4" /> AI: Classify &amp; Suggest
        </Button>
        {ticket.ai_category && (
          <div className="rounded-md border border-primary/20 bg-primary/5 p-2 text-xs">
            <p><strong>AI suggests:</strong> {ticket.ai_category} / {ticket.ai_subcategory} · {PRIORITY_LABELS[ticket.ai_priority]} · Route to {ticket.ai_recommended_team}</p>
            <Button size="sm" variant="link" className="h-auto p-0 text-xs" onClick={applyAiSuggestion}>Apply suggestion</Button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button variant="outline" onClick={() => setInfoOpen(true)}>
            <HelpCircle className="h-4 w-4" /> Request Info
          </Button>
          <Button variant="outline" onClick={() => changeStatus("pending")}>
            <PauseCircle className="h-4 w-4" /> Mark Pending
          </Button>
          <Button onClick={() => setResolveOpen(true)}>
            <CheckCircle2 className="h-4 w-4" /> Resolve
          </Button>
          <Button variant="secondary" onClick={closeTicket}>
            <XCircle className="h-4 w-4" /> Close
          </Button>
        </div>
      </CardContent>

      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent onClose={() => setResolveOpen(false)}>
          <DialogHeader>
            <DialogTitle>Resolve ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              rows={4}
              placeholder="Resolution summary..."
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
            />
            <Button size="sm" variant="outline" onClick={() => setResolutionText(resolutionSummary(ticket))}>
              <Sparkles className="h-3.5 w-3.5" /> Draft with AI
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveOpen(false)}>Cancel</Button>
            <Button onClick={resolve}>Resolve Ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent onClose={() => setInfoOpen(false)}>
          <DialogHeader>
            <DialogTitle>Request more information</DialogTitle>
          </DialogHeader>
          <Textarea rows={4} placeholder="What do you need from the requester?" value={infoText} onChange={(e) => setInfoText(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setInfoOpen(false)}>Cancel</Button>
            <Button onClick={requestInfo}>Send &amp; Mark Pending</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
