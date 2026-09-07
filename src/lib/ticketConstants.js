export const ROLES = {
  EMPLOYEE: "employee",
  AGENT: "agent",
  ADMIN: "admin",
};

export const TICKET_STATUSES = [
  "new",
  "open",
  "assigned",
  "in_progress",
  "pending",
  "resolved",
  "closed",
];

export const STATUS_LABELS = {
  new: "New",
  open: "Open",
  assigned: "Assigned",
  in_progress: "In Progress",
  pending: "Pending",
  resolved: "Resolved",
  closed: "Closed",
};

export const PRIORITIES = ["low", "medium", "high", "critical"];

export const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const CATEGORIES = [
  "Hardware Issue",
  "Software Issue",
  "Network / Internet",
  "Email / Outlook",
  "Printer / Scanner",
  "Laptop / Desktop",
  "Server",
  "Account / Access",
  "Microsoft 365",
  "SAP / ERP",
  "Cybersecurity",
  "VPN",
  "Other",
];

export const SUBCATEGORIES = {
  "Hardware Issue": ["Won't turn on", "Overheating", "Physical damage", "Peripheral failure"],
  "Software Issue": ["Application crash", "Installation", "License", "Update failure"],
  "Network / Internet": ["No connectivity", "Slow connection", "Wi-Fi", "DNS / routing"],
  "Email / Outlook": ["Cannot send/receive", "Sync issue", "Mailbox full", "Spam/phishing"],
  "Printer / Scanner": ["Not printing", "Paper jam", "Driver issue", "Network printer"],
  "Laptop / Desktop": ["Won't boot", "Blue screen", "Battery", "Performance"],
  Server: ["Downtime", "Performance", "Backup failure", "Configuration"],
  "Account / Access": ["Password reset", "Locked account", "New access request", "Permission change"],
  "Microsoft 365": ["Teams", "OneDrive", "SharePoint", "Licensing"],
  "SAP / ERP": ["Login issue", "Transaction error", "Access request", "Report issue"],
  Cybersecurity: ["Phishing report", "Malware", "Suspicious activity", "Policy violation"],
  VPN: ["Cannot connect", "Slow VPN", "Access request"],
  Other: ["General inquiry", "Feedback", "Other"],
};

export const DEPARTMENTS = [
  "IT",
  "Finance",
  "Human Resources",
  "Sales",
  "Marketing",
  "Operations",
  "Engineering",
  "Legal",
  "Procurement",
  "Customer Support",
];

export const LOCATIONS = ["Head Office - Dhaka", "Chattogram Branch", "Sylhet Branch", "Remote / Home"];

export const CONTACT_METHODS = ["Email", "Phone", "Microsoft Teams"];

// Response / resolution targets in minutes, per priority.
export const SLA_POLICY = {
  critical: { response: 15, resolution: 120 },
  high: { response: 30, resolution: 240 },
  medium: { response: 120, resolution: 480 },
  low: { response: 240, resolution: 1440 },
};

export const STATUS_COLORS = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  open: "bg-indigo-50 text-indigo-700 border-indigo-200",
  assigned: "bg-violet-50 text-violet-700 border-violet-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  pending: "bg-orange-50 text-orange-700 border-orange-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-slate-100 text-slate-600 border-slate-200",
};

export const PRIORITY_COLORS = {
  low: "bg-slate-100 text-slate-600 border-slate-200",
  medium: "bg-blue-50 text-blue-700 border-blue-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  critical: "bg-red-50 text-red-700 border-red-200",
};

export function nextTicketId(seq) {
  const year = new Date().getFullYear();
  return `IT-${year}-${String(seq).padStart(6, "0")}`;
}

export function slaDueDate(createdAt, priority) {
  const mins = SLA_POLICY[priority]?.resolution ?? 480;
  return new Date(new Date(createdAt).getTime() + mins * 60000).toISOString();
}

export function slaState(dueDate, status) {
  if (status === "resolved" || status === "closed") return "met";
  const remainingMs = new Date(dueDate).getTime() - Date.now();
  const totalWindow = 8 * 3600 * 1000;
  if (remainingMs <= 0) return "breached";
  if (remainingMs <= totalWindow * 0.2) return "warning";
  return "ok";
}
