// No-Code Automation Engine — lets admins define simple "if this, then that"
// rules (see src/pages/SystemSettings.jsx for the rule builder UI) without
// writing code. Conditions/actions are small "field=value; field2=value2"
// strings so they're easy to edit in a plain text input.
import { AutomationRules, Tickets, TicketHistory } from "@/api/entities";

function parsePairs(str = "") {
  return str
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const [key, ...rest] = pair.split("=");
      return [key.trim().toLowerCase(), rest.join("=").trim()];
    });
}

function matchesConditions(ticket, conditions) {
  const pairs = parsePairs(conditions);
  if (!pairs.length) return true;
  return pairs.every(([key, value]) => {
    const field = ticket[key];
    if (field === undefined) return false;
    if (typeof field === "string") return field.toLowerCase().includes(value.toLowerCase());
    return String(field) === value;
  });
}

function applyActions(ticket, actions) {
  const pairs = parsePairs(actions);
  const updates = {};
  pairs.forEach(([key, value]) => {
    if (["priority", "category", "subcategory", "status", "department"].includes(key)) {
      updates[key] = value;
    } else if (key === "assign_team") {
      updates.ai_recommended_team = value;
    } else if (key === "escalate") {
      updates.escalation_level = (ticket.escalation_level || 0) + 1;
    }
  });
  return updates;
}

export function runAutomationRules(ticket, triggerType = "ticket_created") {
  const rules = AutomationRules.filter({ enabled: true })
    .filter((r) => r.trigger_type === triggerType)
    .sort((a, b) => (a.priority_order || 0) - (b.priority_order || 0));

  let current = ticket;
  const applied = [];

  rules.forEach((rule) => {
    if (!matchesConditions(current, rule.conditions)) return;
    const updates = applyActions(current, rule.actions);
    if (Object.keys(updates).length) {
      current = Tickets.update(current.id, updates) || current;
      TicketHistory.create({ ticket_id: current.id, action: `Automation rule "${rule.name}" applied`, actor_name: "Automation Engine" });
      applied.push(rule.name);
    }
    AutomationRules.update(rule.id, { last_run: new Date().toISOString(), run_count: (rule.run_count || 0) + 1 });
  });

  return { ticket: current, applied };
}
