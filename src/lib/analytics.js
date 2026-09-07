import { differenceInMinutes, subDays, format, isAfter } from "date-fns";

export function filterByRange(tickets, days) {
  if (!days) return tickets;
  const cutoff = subDays(new Date(), days);
  return tickets.filter((t) => isAfter(new Date(t.created_date), cutoff));
}

export function kpis(tickets, csatResponses = []) {
  const total = tickets.length;
  const backlog = tickets.filter((t) => !["resolved", "closed"].includes(t.status)).length;
  const resolved = tickets.filter((t) => t.resolved_at);
  const avgResolutionMins = average(
    resolved.map((t) => differenceInMinutes(new Date(t.resolved_at), new Date(t.created_date)))
  );
  const responded = tickets.filter((t) => t.first_response_at);
  const avgFirstResponseMins = average(
    responded.map((t) => differenceInMinutes(new Date(t.first_response_at), new Date(t.created_date)))
  );
  const slaTotal = resolved.length;
  const slaMet = resolved.filter((t) => new Date(t.resolved_at) <= new Date(t.sla_due_date)).length;
  const slaCompliance = slaTotal ? Math.round((slaMet / slaTotal) * 100) : 100;
  const avgCsat = average(csatResponses.map((c) => c.rating));

  return {
    total,
    backlog,
    avgResolutionMins: Math.round(avgResolutionMins),
    avgFirstResponseMins: Math.round(avgFirstResponseMins),
    slaCompliance,
    avgCsat: Math.round(avgCsat * 10) / 10,
  };
}

function average(arr) {
  const nums = arr.filter((n) => Number.isFinite(n));
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function trendSeries(tickets, days = 14) {
  const days_ = Array.from({ length: days }, (_, i) => subDays(new Date(), days - 1 - i));
  return days_.map((day) => {
    const key = format(day, "MMM d");
    const dayStr = format(day, "yyyy-MM-dd");
    const created = tickets.filter((t) => t.created_date?.startsWith(dayStr)).length;
    const resolved = tickets.filter((t) => t.resolved_at?.startsWith(dayStr)).length;
    return { day: key, created, resolved };
  });
}

export function byCategory(tickets) {
  const map = {};
  tickets.forEach((t) => {
    map[t.category] = (map[t.category] || 0) + 1;
  });
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

export function byStatus(tickets) {
  const map = {};
  tickets.forEach((t) => {
    map[t.status] = (map[t.status] || 0) + 1;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

export function agentPerformance(tickets, users, csatResponses = []) {
  const agents = users.filter((u) => u.role === "agent");
  return agents
    .map((agent) => {
      const assigned = tickets.filter((t) => t.assigned_agent_id === agent.id);
      const resolved = assigned.filter((t) => t.resolved_at);
      const avgResolutionMins = average(
        resolved.map((t) => differenceInMinutes(new Date(t.resolved_at), new Date(t.created_date)))
      );
      const csat = csatResponses.filter((c) => c.agent_name === agent.full_name);
      return {
        id: agent.id,
        name: agent.full_name,
        assigned: assigned.length,
        resolved: resolved.length,
        avgResolutionMins: Math.round(avgResolutionMins),
        avgCsat: Math.round(average(csat.map((c) => c.rating)) * 10) / 10,
      };
    })
    .sort((a, b) => b.resolved - a.resolved);
}

export function toCsv(rows, columns) {
  const header = columns.map((c) => c.label).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const val = typeof c.value === "function" ? c.value(row) : row[c.value];
          const str = val === undefined || val === null ? "" : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(",")
    )
    .join("\n");
  return `${header}\n${body}`;
}

export function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function printAsPdf() {
  window.print();
}
