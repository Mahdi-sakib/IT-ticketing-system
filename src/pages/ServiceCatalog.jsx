import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Store, Laptop, KeyRound, Mail, Wifi, UserPlus, Package, Printer, ShieldCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/AuthContext";
import { Tickets, TicketHistory, ServiceRequests } from "@/api/entities";
import { nextTicketId, slaDueDate } from "@/lib/ticketConstants";

const CATALOG = [
  { key: "new_laptop", name: "Request New Laptop/Desktop", icon: Laptop, category: "Hardware Issue", subcategory: "Peripheral failure", priority: "low", slaDays: 5, description: "Request a new laptop or desktop for yourself or a new hire." },
  { key: "password_reset", name: "Password Reset", icon: KeyRound, category: "Account / Access", subcategory: "Password reset", priority: "medium", slaDays: 1, description: "Reset your account password or unlock your account." },
  { key: "new_mailbox", name: "New Email Mailbox", icon: Mail, category: "Email / Outlook", subcategory: "Sync issue", priority: "medium", slaDays: 2, description: "Provision a new email mailbox for a new employee." },
  { key: "vpn_access", name: "VPN Access Request", icon: Wifi, category: "VPN", subcategory: "Access request", priority: "medium", slaDays: 2, description: "Request remote VPN access to the corporate network." },
  { key: "new_hire", name: "New Employee Onboarding", icon: UserPlus, category: "Account / Access", subcategory: "New access request", priority: "high", slaDays: 3, description: "Full IT setup for a new employee: accounts, hardware, access." },
  { key: "software_license", name: "Software License Request", icon: Package, category: "Software Issue", subcategory: "License", priority: "low", slaDays: 3, description: "Request a license for approved business software." },
  { key: "printer_setup", name: "Printer Setup", icon: Printer, category: "Printer / Scanner", subcategory: "Network printer", priority: "low", slaDays: 3, description: "Set up access to a network printer." },
  { key: "security_review", name: "Security Access Review", icon: ShieldCheck, category: "Cybersecurity", subcategory: "Policy violation", priority: "medium", slaDays: 5, description: "Request a review of your account's security permissions." },
];

export default function ServiceCatalog() {
  const { user } = useAuth();
  const navigate = useNavigate();

  function requestItem(item) {
    const createdAt = new Date().toISOString();
    const dueDate = slaDueDate(createdAt, item.priority);
    const ticket = Tickets.create({
      display_id: nextTicketId(Tickets.count() + 1),
      subject: item.name,
      description: item.description,
      category: item.category,
      subcategory: item.subcategory,
      priority: item.priority,
      status: "new",
      channel: "service_catalog",
      contact_method: "Email",
      department: user.department,
      location: user.location,
      requester_id: user.id,
      requester_name: user.full_name,
      requester_email: user.email,
      sla_due_date: dueDate,
      escalation_level: 0,
      is_service_request: true,
    });
    TicketHistory.create({ ticket_id: ticket.id, action: "Service request created", actor_name: user.full_name });
    ServiceRequests.create({
      ticket_id: ticket.id,
      catalog_item: item.name,
      requested_by_id: user.id,
      requested_by_name: user.full_name,
      status: "submitted",
      sla_days: item.slaDays,
    });
    toast.success(`Requested: ${item.name}`);
    navigate(`/tickets/${ticket.id}`);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold"><Store className="h-6 w-6" /> Service Catalog</h1>
        <p className="text-sm text-muted-foreground">Pre-defined IT services you can request with one click.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATALOG.map((item) => (
          <Card key={item.key}>
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <CardTitle className="mt-1">{item.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">{item.description}</p>
              <div className="mb-3 flex items-center gap-2">
                <Badge variant="outline">SLA: {item.slaDays}d</Badge>
              </div>
              <Button className="w-full" onClick={() => requestItem(item)}>Request</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
