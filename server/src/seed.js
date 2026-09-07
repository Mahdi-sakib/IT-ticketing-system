// Populates the database with realistic demo data the first time the
// server runs against an empty DB (see index.js), and whenever an admin
// uses Admin > System Settings > Reset Demo Data. Mirrors the fixtures the
// app used to generate client-side in src/lib/seedData.js — moved here so
// the data (and the password hashing) lives on the server, not the browser.
import { v4 as uuid } from "uuid";
import { createItem } from "./store.js";
import { nextTicketId, slaDueDate, SLA_POLICY } from "../../src/lib/ticketConstants.js";

function daysAgo(n, hours = 0) {
  return new Date(Date.now() - n * 86400000 - hours * 3600000).toISOString();
}

function doc(fields) {
  const now = new Date().toISOString();
  return { id: uuid(), created_date: now, updated_date: now, ...fields };
}

export async function seedDatabase() {
  // ---- Users ---------------------------------------------------------
  const admin = await createItem("users", doc({
    full_name: "Farhana Karim", email: "admin@omnidesk.dev", password: "demo1234",
    role: "admin", department: "IT", location: "Head Office - Dhaka",
    employee_id: "EMP-1001", disabled: false, phone: "+880 1711-000001",
  }));
  const agent1 = await createItem("users", doc({
    full_name: "Tanvir Ahmed", email: "agent@omnidesk.dev", password: "demo1234",
    role: "agent", department: "IT", location: "Head Office - Dhaka",
    employee_id: "EMP-1002", disabled: false, phone: "+880 1711-000002",
    skills: ["Network / Internet", "VPN", "Server", "Cybersecurity", "SAP / ERP"],
  }));
  const agent2 = await createItem("users", doc({
    full_name: "Nusrat Jahan", email: "agent2@omnidesk.dev", password: "demo1234",
    role: "agent", department: "IT", location: "Head Office - Dhaka",
    employee_id: "EMP-1003", disabled: false, phone: "+880 1711-000003",
    skills: ["Hardware Issue", "Laptop / Desktop", "Printer / Scanner", "Software Issue", "Microsoft 365"],
  }));
  const emp1 = await createItem("users", doc({
    full_name: "Employee Demo", email: "employee@omnidesk.dev", password: "demo1234",
    role: "employee", department: "Finance", location: "Head Office - Dhaka",
    employee_id: "EMP-2001", disabled: false, phone: "+880 1811-100001",
  }));
  const emp2 = await createItem("users", doc({
    full_name: "Rafiul Islam", email: "rafiul.islam@omnidesk.dev", password: "demo1234",
    role: "employee", department: "Sales", location: "Head Office - Dhaka",
    employee_id: "EMP-2002", disabled: false, phone: "+880 1811-100002",
  }));
  const emp3 = await createItem("users", doc({
    full_name: "Sadia Afrin", email: "sadia.afrin@omnidesk.dev", password: "demo1234",
    role: "employee", department: "Marketing", location: "Chattogram Branch",
    employee_id: "EMP-2003", disabled: false, phone: "+880 1811-100003",
  }));

  // ---- Assets ----------------------------------------------------------
  await createItem("assets", doc({
    asset_tag: "AST-0001", name: "Dell Latitude 5420", type: "Laptop", status: "in_use",
    manufacturer: "Dell", model: "Latitude 5420", serial_number: "DL5420-88213",
    purchase_date: daysAgo(540), purchase_cost: 95000, warranty_end: daysAgo(-190),
    vendor: "Ryans Computers", assigned_to_id: emp1.id, assigned_to_name: emp1.full_name,
    previous_holders: [], location: emp1.location, department: emp1.department,
    maintenance_history: ["RAM upgraded to 16GB (8 months ago)"], depreciation_percent: 38, notes: "Primary work laptop.",
  }));
  await createItem("assets", doc({
    asset_tag: "AST-0002", name: "HP LaserJet Pro M404", type: "Printer", status: "in_use",
    manufacturer: "HP", model: "LaserJet Pro M404dn", serial_number: "HPLJ-40213",
    purchase_date: daysAgo(700), purchase_cost: 32000, warranty_end: daysAgo(30),
    vendor: "Computer Source", assigned_to_id: null, assigned_to_name: null,
    previous_holders: [], location: "Head Office - Dhaka", department: "IT",
    maintenance_history: [], depreciation_percent: 55, notes: "3rd floor shared printer.",
  }));
  await createItem("assets", doc({
    asset_tag: "AST-0003", name: "Lenovo ThinkPad T14", type: "Laptop", status: "in_use",
    manufacturer: "Lenovo", model: "ThinkPad T14 Gen 3", serial_number: "LNV-T14-55901",
    purchase_date: daysAgo(210), purchase_cost: 110000, warranty_end: daysAgo(-520),
    vendor: "Star Tech", assigned_to_id: emp2.id, assigned_to_name: emp2.full_name,
    previous_holders: [], location: emp2.location, department: emp2.department,
    maintenance_history: [], depreciation_percent: 14, notes: "",
  }));
  await createItem("assets", doc({
    asset_tag: "AST-0004", name: "Dell OptiPlex 3080", type: "Desktop", status: "in_repair",
    manufacturer: "Dell", model: "OptiPlex 3080", serial_number: "DOP-3080-11045",
    purchase_date: daysAgo(1100), purchase_cost: 65000, warranty_end: daysAgo(370),
    vendor: "Ryans Computers", assigned_to_id: null, assigned_to_name: null,
    previous_holders: [emp3.full_name], location: "Head Office - Dhaka", department: "IT",
    maintenance_history: ["Power supply replaced (2 years ago)", "Sent for motherboard diagnosis (this week)"], depreciation_percent: 82, notes: "Awaiting repair quote.",
  }));

  // ---- CMDB --------------------------------------------------------------
  const ciApp = await createItem("configuration_items", doc({
    name: "app-server-01", ci_type: "Server", environment: "production", status: "operational",
    owner_team: "IT", hostname: "app-server-01.internal", ip_address: "10.0.1.10",
    location: "Head Office - Dhaka", dependencies: [], related_asset_tag: "", notes: "Primary application server.",
  }));
  await createItem("configuration_items", doc({
    name: "db-primary", ci_type: "Database", environment: "production", status: "operational",
    owner_team: "IT", hostname: "db-primary.internal", ip_address: "10.0.1.20",
    location: "Head Office - Dhaka", dependencies: [ciApp.name], related_asset_tag: "", notes: "Primary PostgreSQL instance.",
  }));
  await createItem("configuration_items", doc({
    name: "vpn-gateway", ci_type: "Network Device", environment: "production", status: "operational",
    owner_team: "IT", hostname: "vpn01.internal", ip_address: "10.0.0.1",
    location: "Head Office - Dhaka", dependencies: [], related_asset_tag: "", notes: "Site-to-site + remote access VPN gateway.",
  }));
  await createItem("configuration_items", doc({
    name: "exchange-connector", ci_type: "Service", environment: "production", status: "degraded",
    owner_team: "IT", hostname: "", ip_address: "", location: "Cloud (Microsoft 365)",
    dependencies: [], related_asset_tag: "", notes: "Hybrid mail flow connector — intermittent delays reported.",
  }));

  // ---- Change Requests -----------------------------------------------------
  await createItem("change_requests", doc({
    display_id: "CHG-0001", title: "Upgrade VPN gateway firmware", description: "Apply vendor security patch to the VPN gateway.",
    type: "standard", risk_level: "low", category: "VPN",
    impact_analysis: "Brief VPN interruption (~5 min) expected during upgrade window.",
    implementation_plan: "Apply firmware update via vendor console during off-hours.",
    rollback_plan: "Revert to previous firmware snapshot.", testing_plan: "Verify VPN connectivity post-upgrade with test accounts.",
    scheduled_date: daysAgo(20), status: "completed", requested_by_name: agent1.full_name, owner_name: agent1.full_name,
    cab_required: false, approver_name: admin.full_name, approval_notes: "Approved — low risk.", affected_ci_ids: ["vpn-gateway"],
  }));
  await createItem("change_requests", doc({
    display_id: "CHG-0002", title: "Migrate email to new Exchange tenant", description: "Migrate all mailboxes to the new Microsoft 365 tenant.",
    type: "normal", risk_level: "high", category: "Email / Outlook",
    impact_analysis: "All users will experience email downtime for up to 2 hours.",
    implementation_plan: "Phased migration by department, starting with IT.",
    rollback_plan: "Fail back to legacy tenant DNS records.", testing_plan: "Pilot migration with IT department first.",
    scheduled_date: daysAgo(-5), status: "pending_approval", requested_by_name: admin.full_name, owner_name: agent2.full_name,
    cab_required: true, approver_name: "", approval_notes: "", affected_ci_ids: ["exchange-connector"],
  }));
  await createItem("change_requests", doc({
    display_id: "CHG-0003", title: "Emergency patch — critical server vulnerability", description: "Apply out-of-band security patch (CVE-2026-XXXX) to app-server-01.",
    type: "emergency", risk_level: "medium", category: "Server",
    impact_analysis: "Server restart required; ~10 minute downtime.",
    implementation_plan: "Apply patch and restart service during a maintenance window.",
    rollback_plan: "Restore from last known-good snapshot.", testing_plan: "Smoke-test application after restart.",
    scheduled_date: daysAgo(2), status: "approved", requested_by_name: agent1.full_name, owner_name: agent1.full_name,
    cab_required: true, approver_name: admin.full_name, approval_notes: "Approved on emergency basis.", affected_ci_ids: ["app-server-01"],
  }));

  // ---- Problems ----------------------------------------------------------
  await createItem("problems", doc({
    display_id: "PRB-0001", title: "Recurring VPN disconnects for remote staff", description: "Multiple remote employees report the VPN client disconnecting every 30-45 minutes.",
    category: "VPN", priority: "high", status: "investigating", root_cause: "", workaround: "Reconnect manually; investigating gateway session timeout settings.",
    owner_id: agent1.id, owner_name: agent1.full_name, related_ticket_ids: [],
  }));
  await createItem("problems", doc({
    display_id: "PRB-0002", title: "Printer queue jams on 3rd floor", description: "Print jobs frequently stall in the queue on the 3rd floor shared printer.",
    category: "Printer / Scanner", priority: "low", status: "resolved", root_cause: "Outdated printer driver causing queue corruption.",
    workaround: "Reinstalled updated driver on affected machines.", owner_id: agent2.id, owner_name: agent2.full_name, related_ticket_ids: [],
  }));

  // ---- Major Incidents -----------------------------------------------------
  await createItem("major_incidents", doc({
    display_id: "MI-0001", title: "Exchange Online mail delivery disruption", description: "Company-wide delays in sending and receiving external email via Microsoft 365.",
    severity: "SEV1", status: "resolved", impact: "Delayed email delivery for all staff (15-40 minutes).",
    affected_services: "Microsoft 365, Exchange Online", commander_name: agent1.full_name,
    started_at: daysAgo(9), resolved_at: daysAgo(9, -3),
    updates: [
      { time: daysAgo(9), text: "Major incident declared — mail delivery delays reported company-wide.", author: agent1.full_name },
      { time: daysAgo(9, -1), text: "Identified as a Microsoft 365 service degradation (confirmed via admin center).", author: agent1.full_name },
      { time: daysAgo(9, -3), text: "Microsoft resolved the underlying issue. Mail flow back to normal.", author: agent1.full_name },
    ],
  }));

  // ---- Knowledge Base ------------------------------------------------------
  const kb = [
    { title: "How to Reset Your Password", category: "Account / Access", content: "1. Go to the login page and click 'Forgot password'.\n2. Enter your work email.\n3. Follow the link to set a new password (at least 6 characters).\nIf you don't receive anything, contact the IT Helpdesk.", tags: ["password", "login", "account"] },
    { title: "Connecting to the Company VPN", category: "VPN", content: "1. Open the VPN client and ensure it's updated to the latest version.\n2. Enter your network username and password.\n3. Select the 'Head Office' gateway and connect.\nIf you can't connect, check your internet connection first, then contact IT.", tags: ["vpn", "remote", "network"] },
    { title: "Troubleshooting Common Printer Issues", category: "Printer / Scanner", content: "1. Confirm the printer is powered on and has paper/toner.\n2. Remove and re-add the printer in your OS settings.\n3. Restart the print spooler service.\nStill stuck? Log a ticket with the printer name and error message.", tags: ["printer", "scanner", "print"] },
    { title: "Setting Up Outlook on Your Mobile Device", category: "Email / Outlook", content: "1. Download the Outlook app from your app store.\n2. Sign in with your work email and password.\n3. Approve the sign-in on your desktop if prompted (SSO).\nContact IT if multi-factor authentication is not working.", tags: ["email", "outlook", "mobile"] },
    { title: "How to Request New Hardware", category: "Hardware Issue", content: "Use the Service Catalog > 'Request New Laptop/Desktop' to submit a hardware request. Include your role and any specific requirements. Requests typically take 3-5 business days depending on stock.", tags: ["hardware", "laptop", "request"] },
    { title: "Reporting a Phishing Email", category: "Cybersecurity", content: "1. Do not click any links or download attachments.\n2. Forward the email to the IT Security team or create a ticket under Cybersecurity.\n3. Delete the email after reporting.\nNever enter your credentials on a page you weren't expecting.", tags: ["phishing", "security", "email"] },
  ];
  for (let i = 0; i < kb.length; i++) {
    await createItem("knowledge_base", doc({ ...kb[i], status: "published", author_name: i % 2 ? agent2.full_name : agent1.full_name, view_count: 12 + i * 7, helpful_count: 3 + i }));
  }

  // ---- Automation Rules ----------------------------------------------------
  await createItem("automation_rules", doc({ name: "Escalate Cybersecurity Tickets", description: "Automatically mark cybersecurity tickets as critical and route to Security.", trigger_type: "ticket_created", conditions: "category=Cybersecurity", actions: "priority=critical; assign_team=Security Team", priority_order: 1, enabled: true, last_run: null, run_count: 0 }));
  await createItem("automation_rules", doc({ name: "Route VPN Issues to Network Support", description: "Route VPN category tickets straight to the Network Support team.", trigger_type: "ticket_created", conditions: "category=VPN", actions: "assign_team=Network Support", priority_order: 2, enabled: true, last_run: null, run_count: 0 }));
  await createItem("automation_rules", doc({ name: "Flag Server Outages as Critical", description: "Server-related tickets are automatically treated as critical priority.", trigger_type: "ticket_created", conditions: "category=Server", actions: "priority=critical", priority_order: 3, enabled: true, last_run: null, run_count: 0 }));

  // ---- SLA Policy reference rows -------------------------------------------
  for (const [priority, policy] of Object.entries(SLA_POLICY)) {
    await createItem("sla_policies", doc({ priority, response_minutes: policy.response, resolution_minutes: policy.resolution }));
  }

  // ---- Tickets ---------------------------------------------------------------
  const specs = [
    { subject: "Can't connect to office Wi-Fi", description: "My laptop keeps dropping the office Wi-Fi connection every few minutes since this morning.", category: "Network / Internet", subcategory: "Wi-Fi", priority: "high", status: "resolved", requester: emp1, agent: agent1, daysAgo: 12, resolve: true },
    { subject: "Outlook not syncing new emails", description: "I stopped receiving new emails in Outlook since yesterday afternoon. Sent items work fine.", category: "Email / Outlook", subcategory: "Sync issue", priority: "medium", status: "resolved", requester: emp2, agent: agent2, daysAgo: 10, resolve: true },
    { subject: "Suspicious phishing email received", description: "I received an email claiming to be from HR asking me to reset my password via an external link.", category: "Cybersecurity", subcategory: "Phishing report", priority: "critical", status: "resolved", requester: emp3, agent: agent1, daysAgo: 8, resolve: true },
    { subject: "Laptop won't turn on", description: "My laptop screen stays black even after holding the power button. Charging light is on.", category: "Laptop / Desktop", subcategory: "Won't boot", priority: "high", status: "in_progress", requester: emp1, agent: agent2, daysAgo: 0.1 },
    { subject: "Need VPN access for remote work", description: "I'll be working from home next week and need VPN access set up on my laptop.", category: "VPN", subcategory: "Access request", priority: "medium", status: "assigned", requester: emp2, agent: agent1, daysAgo: 0.2 },
    { subject: "3rd floor printer jamming repeatedly", description: "The shared printer on the 3rd floor jams almost every print job today.", category: "Printer / Scanner", subcategory: "Paper jam", priority: "low", status: "closed", requester: emp3, agent: agent2, daysAgo: 15, resolve: true },
    { subject: "SAP login shows access denied", description: "I can't log into SAP this morning — it says my account doesn't have access to this module.", category: "SAP / ERP", subcategory: "Access request", priority: "high", status: "pending", requester: emp1, agent: agent1, daysAgo: 0.1 },
    { subject: "Teams calls dropping frequently", description: "My Microsoft Teams calls disconnect randomly during client meetings.", category: "Microsoft 365", subcategory: "Teams", priority: "medium", status: "new", requester: emp2, agent: null, daysAgo: 0.1 },
    { subject: "Requesting a second monitor", description: "Could I get a second monitor for my desk to improve productivity?", category: "Hardware Issue", subcategory: "Peripheral failure", priority: "low", status: "new", requester: emp3, agent: null, daysAgo: 0.05 },
    { subject: "Password reset locked me out", description: "After resetting my password I'm now locked out of my account entirely.", category: "Account / Access", subcategory: "Locked account", priority: "high", status: "assigned", requester: emp1, agent: agent2, daysAgo: 0.1 },
    { subject: "Server response times very slow", description: "The internal app server has been responding very slowly since this morning, affecting the whole Sales team.", category: "Server", subcategory: "Performance", priority: "critical", status: "in_progress", requester: emp2, agent: agent1, daysAgo: 0.3 },
    { subject: "Software license expired for Adobe", description: "My Adobe Creative Cloud license shows as expired even though it was renewed last month.", category: "Software Issue", subcategory: "License", priority: "medium", status: "resolved", requester: emp3, agent: agent2, daysAgo: 20, resolve: true },
    { subject: "OneDrive sync stuck at 99%", description: "OneDrive has been stuck syncing a folder at 99% for two days.", category: "Microsoft 365", subcategory: "OneDrive", priority: "low", status: "open", requester: emp1, agent: agent2, daysAgo: 0.3 },
    { subject: "Malware warning from antivirus", description: "My antivirus software flagged a suspicious file after I opened an attachment. Please check my laptop.", category: "Cybersecurity", subcategory: "Malware", priority: "critical", status: "resolved", requester: emp2, agent: agent1, daysAgo: 6, resolve: true },
    { subject: "New employee onboarding — IT setup", description: "We have a new hire starting Monday and need accounts, laptop, and email set up.", category: "Account / Access", subcategory: "New access request", priority: "high", status: "assigned", requester: emp3, agent: agent2, daysAgo: 0.05, isServiceRequest: true },
  ];

  for (let i = 0; i < specs.length; i++) {
    const s = specs[i];
    const createdAt = daysAgo(s.daysAgo);
    const dueDate = slaDueDate(createdAt, s.priority);
    const fields = {
      display_id: nextTicketId(i + 1),
      subject: s.subject, description: s.description, category: s.category, subcategory: s.subcategory,
      priority: s.priority, status: s.status, channel: s.isServiceRequest ? "service_catalog" : "portal",
      contact_method: "Email", department: s.requester.department, location: s.requester.location,
      requester_id: s.requester.id, requester_name: s.requester.full_name, requester_email: s.requester.email,
      sla_due_date: dueDate, escalation_level: 0, created_date: createdAt, updated_date: createdAt,
      is_service_request: !!s.isServiceRequest,
    };
    if (s.agent) {
      fields.assigned_agent_id = s.agent.id;
      fields.assigned_agent_name = s.agent.full_name;
    }
    if (s.status !== "new") {
      fields.first_response_at = new Date(new Date(createdAt).getTime() + 25 * 60000).toISOString();
    }
    if (s.resolve) {
      fields.resolved_at = new Date(new Date(createdAt).getTime() + Math.random() * 6 * 3600000 + 3600000).toISOString();
      fields.resolution_summary = `Resolved "${s.subject}" after investigation by ${s.agent?.full_name || "the IT team"}.`;
      if (s.status === "closed") fields.status = "closed";
    }

    const ticket = await createItem("tickets", { id: uuid(), ...fields });

    await createItem("ticket_history", doc({ ticket_id: ticket.id, action: "Ticket created", actor_name: s.requester.full_name, created_date: createdAt }));
    if (s.agent) {
      await createItem("ticket_history", doc({ ticket_id: ticket.id, action: `Assigned to ${s.agent.full_name}`, actor_name: "System", created_date: createdAt }));
    }
    if (s.resolve) {
      await createItem("ticket_history", doc({ ticket_id: ticket.id, action: "Ticket resolved", actor_name: s.agent?.full_name || "System", created_date: fields.resolved_at }));
    }

    if (i < 4) {
      await createItem("ticket_comments", doc({ ticket_id: ticket.id, author_id: s.requester.id, author_name: s.requester.full_name, author_role: "employee", body: "Any update on this? It's affecting my work.", is_internal: false, created_date: createdAt }));
      if (s.agent) {
        await createItem("ticket_comments", doc({ ticket_id: ticket.id, author_id: s.agent.id, author_name: s.agent.full_name, author_role: "agent", body: "Thanks for reporting this — we're looking into it now and will update you shortly.", is_internal: false, created_date: new Date(new Date(createdAt).getTime() + 30 * 60000).toISOString() }));
        await createItem("ticket_comments", doc({ ticket_id: ticket.id, author_id: s.agent.id, author_name: s.agent.full_name, author_role: "agent", body: "Internal note: checked logs, likely a config issue upstream.", is_internal: true, created_date: new Date(new Date(createdAt).getTime() + 45 * 60000).toISOString() }));
      }
    }

    if (s.resolve && Math.random() > 0.3) {
      await createItem("csat_responses", doc({
        ticket_id: ticket.id, ticket_display_id: ticket.display_id, rating: 3 + Math.round(Math.random() * 2),
        comment: "Quick and helpful response, thanks!", respondent_id: s.requester.id, respondent_name: s.requester.full_name,
        agent_name: s.agent?.full_name || null, department: s.requester.department, category: s.category,
      }));
    }
  }
}
