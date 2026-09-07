// Heuristic "AI" layer (classification, summarization, routing, chatbot,
// SLA escalation). No external LLM key required, so the app works fully
// offline out of the box — see README.md for how to swap in a real model
// (e.g. the Claude API) by replacing the body of these functions.
import { Tickets, Users, Notifications, TicketHistory } from "@/api/entities";
import { CATEGORIES, SUBCATEGORIES, PRIORITIES, slaState } from "@/lib/ticketConstants";

const KEYWORD_MAP = [
  { category: "Cybersecurity", keywords: ["phishing", "virus", "malware", "hacked", "suspicious email", "ransomware"], priority: "critical" },
  { category: "Network / Internet", keywords: ["network", "wifi", "internet", "vpn", "can't connect", "no connectivity"], priority: "high" },
  { category: "VPN", keywords: ["vpn"], priority: "high" },
  { category: "Server", keywords: ["server", "downtime", "outage", "down"], priority: "critical" },
  { category: "Email / Outlook", keywords: ["email", "outlook", "mailbox", "inbox"], priority: "medium" },
  { category: "Printer / Scanner", keywords: ["printer", "scanner", "print", "paper jam"], priority: "low" },
  { category: "Account / Access", keywords: ["password", "locked out", "access", "login", "account"], priority: "medium" },
  { category: "Microsoft 365", keywords: ["teams", "onedrive", "sharepoint", "office 365", "m365"], priority: "medium" },
  { category: "SAP / ERP", keywords: ["sap", "erp", "transaction"], priority: "high" },
  { category: "Hardware Issue", keywords: ["hardware", "broken", "not turning on", "monitor", "keyboard", "mouse"], priority: "medium" },
  { category: "Laptop / Desktop", keywords: ["laptop", "desktop", "pc ", "blue screen", "boot"], priority: "medium" },
  { category: "Software Issue", keywords: ["software", "crash", "install", "license", "update"], priority: "medium" },
];

function textOf(ticket) {
  return `${ticket.subject || ""} ${ticket.description || ""}`.toLowerCase();
}

export function classifyTicket(ticket) {
  const text = textOf(ticket);
  let best = null;
  for (const rule of KEYWORD_MAP) {
    const hit = rule.keywords.find((k) => text.includes(k));
    if (hit) {
      best = rule;
      break;
    }
  }
  const category = best?.category || ticket.category || "Other";
  const suggestedPriority = best?.priority || "medium";
  const subcats = SUBCATEGORIES[category] || [];
  const subcategory = subcats[0] || "General";

  const allTickets = Tickets.list();
  const duplicates = allTickets
    .filter((t) => t.id !== ticket.id)
    .filter((t) => textOf(t).split(" ").filter((w) => w.length > 4 && text.includes(w)).length >= 3)
    .slice(0, 3);

  const recommendedTeam =
    category === "SAP / ERP"
      ? "SAP Support"
      : category === "Cybersecurity"
      ? "Security Team"
      : category === "Network / Internet" || category === "VPN" || category === "Server"
      ? "Network Support"
      : "IT Helpdesk";

  return {
    category,
    subcategory,
    priority: suggestedPriority,
    urgency: suggestedPriority === "critical" ? "immediate" : suggestedPriority === "high" ? "soon" : "normal",
    recommendedTeam,
    duplicates: duplicates.map((d) => ({ id: d.id, display_id: d.display_id, subject: d.subject })),
    confidence: best ? 0.82 : 0.4,
  };
}

export function summarizeTicket(ticket, comments = []) {
  const agentNotes = comments.filter((c) => c.is_internal).map((c) => c.body);
  const publicReplies = comments.filter((c) => !c.is_internal && c.author_role !== "employee").map((c) => c.body);

  return {
    problem_summary: ticket.description?.slice(0, 240) || ticket.subject,
    actions_taken:
      publicReplies.length || agentNotes.length
        ? [...agentNotes, ...publicReplies].slice(0, 4).join(" • ")
        : "No actions logged yet.",
    current_status: ticket.status,
    root_cause: ticket.root_cause || "Not yet determined.",
    next_steps:
      ticket.status === "pending"
        ? "Waiting on requester for more information."
        : ticket.status === "resolved" || ticket.status === "closed"
        ? "No further action required."
        : "Continue investigation and update the requester.",
  };
}

export function resolutionSummary(ticket, comments = []) {
  const s = summarizeTicket(ticket, comments);
  return `Resolved "${ticket.subject}" (${ticket.display_id}). Root cause: ${s.root_cause}. Actions: ${s.actions_taken}.`;
}

export function autoRouteTicket(ticket) {
  const agents = Users.filter({ role: "agent", disabled: false });
  if (agents.length === 0) return null;
  const openTickets = Tickets.filter({}).filter((t) => !["resolved", "closed"].includes(t.status));
  const load = Object.fromEntries(agents.map((a) => [a.id, 0]));
  openTickets.forEach((t) => {
    if (t.assigned_agent_id && load[t.assigned_agent_id] !== undefined) load[t.assigned_agent_id]++;
  });
  const skilled = agents.filter((a) => (a.skills || []).includes(ticket.category));
  const pool = skilled.length ? skilled : agents;
  const chosen = pool.sort((a, b) => (load[a.id] ?? 0) - (load[b.id] ?? 0))[0];
  return chosen;
}

export function processSlaEscalations() {
  const tickets = Tickets.list().filter((t) => !["resolved", "closed"].includes(t.status));
  let escalated = 0;
  tickets.forEach((t) => {
    const state = slaState(t.sla_due_date, t.status);
    if (state === "breached" && t.escalation_level < 3) {
      const nextLevel = (t.escalation_level || 0) + 1;
      Tickets.update(t.id, { escalation_level: nextLevel });
      TicketHistory.create({
        ticket_id: t.id,
        action: `SLA breached — escalated to level ${nextLevel}`,
        actor_name: "System",
      });
      const admins = Users.filter({ role: nextLevel >= 2 ? "admin" : "agent" });
      admins.forEach((a) =>
        Notifications.create({
          user_id: a.id,
          type: "sla_breach",
          title: `SLA breached: ${t.display_id}`,
          body: t.subject,
          ticket_id: t.id,
          read: false,
        })
      );
      escalated++;
    }
  });
  return { escalated, checked: tickets.length };
}

const CHATBOT_KB_HINTS = [
  { match: ["password", "reset"], reply: "You can reset your password from the login screen using “Forgot password”. If that doesn't work I can raise a ticket for the IT team." },
  { match: ["vpn"], reply: "For VPN issues: confirm you're on the latest client, restart it, and check your internet connection. Still stuck? I can open a ticket for Network Support." },
  { match: ["printer"], reply: "Try: check the printer is powered on and has paper, then remove and re-add it in your OS printer settings. Want me to log a ticket if that doesn't help?" },
  { match: ["email", "outlook"], reply: "For Outlook sync issues, try Outlook > File > Account Settings > Repair. I can also open a ticket for the Email team." },
];

export function helpdeskChatbotReply(message, kbArticles = []) {
  const text = message.toLowerCase();
  const hinted = CHATBOT_KB_HINTS.find((h) => h.match.some((m) => text.includes(m)));
  if (hinted) return { reply: hinted.reply, escalate: false };

  const related = kbArticles.filter((a) => a.title.toLowerCase().split(" ").some((w) => w.length > 3 && text.includes(w)));
  if (related.length) {
    return {
      reply: `I found a relevant Knowledge Base article: "${related[0].title}". Does that resolve your issue, or should I create a ticket for IT?`,
      escalate: false,
      articles: related.slice(0, 3),
    };
  }
  return {
    reply: "I couldn't find a quick fix for that in the Knowledge Base. I can create a ticket and route it to the right IT team — want me to do that?",
    escalate: true,
  };
}

export function predictSlaRisk(ticket) {
  const state = slaState(ticket.sla_due_date, ticket.status);
  return state === "warning" || state === "breached";
}

// Heuristic "Executive Insights" — summarizes trends across all tickets into
// plain-language callouts for leadership, without needing an LLM call.
export function generateExecutiveInsights(tickets, kpisObj) {
  const insights = [];
  const open = tickets.filter((t) => !["resolved", "closed"].includes(t.status));

  if (kpisObj.slaCompliance < 85) {
    insights.push({
      type: "risk",
      text: `SLA compliance is at ${kpisObj.slaCompliance}%, below the 85% target. Consider reallocating agents to high-volume categories.`,
    });
  } else {
    insights.push({ type: "positive", text: `SLA compliance is healthy at ${kpisObj.slaCompliance}%.` });
  }

  const categoryCounts = {};
  tickets.forEach((t) => { categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1; });
  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];
  if (topCategory) {
    insights.push({
      type: "info",
      text: `"${topCategory[0]}" is the top ticket driver (${topCategory[1]} tickets). A targeted knowledge base article or automation rule could reduce volume.`,
    });
  }

  const criticalOpen = open.filter((t) => t.priority === "critical");
  if (criticalOpen.length > 0) {
    insights.push({ type: "risk", text: `${criticalOpen.length} critical-priority ticket(s) are currently open and require immediate attention.` });
  }

  if (kpisObj.avgCsat && kpisObj.avgCsat < 3.5) {
    insights.push({ type: "risk", text: `Average CSAT score is ${kpisObj.avgCsat}/5 — below target. Review recent resolutions for quality gaps.` });
  } else if (kpisObj.avgCsat) {
    insights.push({ type: "positive", text: `Customer satisfaction is strong at ${kpisObj.avgCsat}/5.` });
  }

  const backlogRatio = tickets.length ? kpisObj.backlog / tickets.length : 0;
  if (backlogRatio > 0.4) {
    insights.push({ type: "risk", text: `${kpisObj.backlog} tickets (${Math.round(backlogRatio * 100)}% of total) are still open — backlog is growing faster than resolution capacity.` });
  }

  return insights;
}
