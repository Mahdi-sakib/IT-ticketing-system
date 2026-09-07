import { makeCollection, absorb } from "./db";

export { absorb };

// One collection per OmniDesk IT entity.
export const Users = makeCollection("users");
export const Tickets = makeCollection("tickets");
export const TicketComments = makeCollection("ticket_comments");
export const TicketHistory = makeCollection("ticket_history");
export const Assets = makeCollection("assets");
export const KnowledgeBaseArticles = makeCollection("knowledge_base");
export const MajorIncidents = makeCollection("major_incidents");
export const Notifications = makeCollection("notifications");
export const Problems = makeCollection("problems");
export const ChangeRequests = makeCollection("change_requests");
export const ConfigurationItems = makeCollection("configuration_items");
export const ServiceRequests = makeCollection("service_requests");
export const SlaPolicies = makeCollection("sla_policies");
export const CsatResponses = makeCollection("csat_responses");
export const AutomationRules = makeCollection("automation_rules");
export const AuditLogs = makeCollection("audit_logs");

export function logAudit({ userId, userName, action, entity, entityId, before, after }) {
  AuditLogs.create({
    user_id: userId,
    user_name: userName,
    action,
    entity,
    entity_id: entityId,
    previous_value: before ? JSON.stringify(before) : null,
    new_value: after ? JSON.stringify(after) : null,
    ip_address: "127.0.0.1",
    device_info: navigator.userAgent,
  });
}
