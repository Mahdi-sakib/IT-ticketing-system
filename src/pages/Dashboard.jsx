import React from "react";
import { useRole } from "@/lib/useRole";
import EmployeeDashboard from "@/pages/EmployeeDashboard";
import AgentDashboard from "@/pages/AgentDashboard";

export default function Dashboard() {
  const { isStaff } = useRole();
  return isStaff ? <AgentDashboard /> : <EmployeeDashboard />;
}
