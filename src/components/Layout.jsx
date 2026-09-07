import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Ticket,
  ListChecks,
  BookOpen,
  Bell,
  User as UserIcon,
  Menu,
  X,
  Boxes,
  Network,
  AlertTriangle,
  GitPullRequest,
  ShieldQuestion,
  BarChart3,
  Users,
  Settings,
  FileClock,
  Store,
  LogOut,
  ChevronDown,
  LifeBuoy,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useRole } from "@/lib/useRole";
import { ROLES } from "@/lib/ticketConstants";
import { Avatar } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import NotificationCenter from "@/components/NotificationCenter";
import ChatbotWidget from "@/components/ChatbotWidget";
import { APP_NAME } from "@/lib/app-params";

const NAV = {
  [ROLES.EMPLOYEE]: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/tickets/new", label: "Create Ticket", icon: Ticket },
    { to: "/tickets/mine", label: "My Tickets", icon: ListChecks },
    { to: "/service-catalog", label: "Service Catalog", icon: Store },
    { to: "/knowledge-base", label: "Knowledge Base", icon: BookOpen },
  ],
  [ROLES.AGENT]: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/tickets", label: "All Tickets", icon: Ticket },
    { to: "/tickets/mine", label: "My Tickets", icon: ListChecks },
    { to: "/assets", label: "Assets", icon: Boxes },
    { to: "/cmdb", label: "CMDB", icon: Network },
    { to: "/problems", label: "Problems", icon: ShieldQuestion },
    { to: "/changes", label: "Changes", icon: GitPullRequest },
    { to: "/major-incidents", label: "Major Incidents", icon: AlertTriangle },
    { to: "/knowledge-base", label: "Knowledge Base", icon: BookOpen },
    { to: "/analytics", label: "Reports", icon: BarChart3 },
  ],
  [ROLES.ADMIN]: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/tickets", label: "Tickets", icon: Ticket },
    { to: "/assets", label: "Assets", icon: Boxes },
    { to: "/cmdb", label: "CMDB", icon: Network },
    { to: "/problems", label: "Problems", icon: ShieldQuestion },
    { to: "/changes", label: "Changes", icon: GitPullRequest },
    { to: "/major-incidents", label: "Major Incidents", icon: AlertTriangle },
    { to: "/service-catalog", label: "Service Catalog", icon: Store },
    { to: "/knowledge-base", label: "Knowledge Base", icon: BookOpen },
    { to: "/analytics", label: "Reports", icon: BarChart3 },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/audit-logs", label: "Audit Logs", icon: FileClock },
    { to: "/admin/settings", label: "System Settings", icon: Settings },
  ],
};

export default function Layout({ children }) {
  const { user, role, realRole, previewRole, setPreviewRole, logout } = useAuth();
  const { isStaff } = useRole();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const items = NAV[role] || NAV[ROLES.EMPLOYEE];

  return (
    <div className="min-h-screen bg-secondary/40">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform border-r border-border bg-white transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LifeBuoy className="h-4 w-4" />
          </div>
          <span className="font-semibold">{APP_NAME}</span>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-white px-4">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />

          {isStaff && (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-xs text-muted-foreground">Preview as</span>
              <select
                value={previewRole || realRole}
                onChange={(e) => setPreviewRole(e.target.value === realRole ? null : e.target.value)}
                className="h-8 rounded-md border border-border bg-white px-2 text-xs"
              >
                <option value={ROLES.EMPLOYEE}>Employee</option>
                <option value={ROLES.AGENT}>IT Agent</option>
                {realRole === ROLES.ADMIN && <option value={ROLES.ADMIN}>Admin</option>}
              </select>
            </div>
          )}

          <NotificationCenter />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-secondary">
                <Avatar name={user?.full_name} size="sm" />
                <span className="hidden text-sm font-medium sm:block">{user?.full_name}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.full_name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <UserIcon className="h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { logout(); navigate("/login"); }}>
                <LogOut className="h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="mx-auto max-w-7xl p-4 sm:p-6">{children}</main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <ChatbotWidget />
    </div>
  );
}
