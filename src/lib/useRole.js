import { useAuth } from "@/lib/AuthContext";
import { ROLES } from "@/lib/ticketConstants";

export function useRole() {
  const { role } = useAuth();
  return {
    role,
    isEmployee: role === ROLES.EMPLOYEE,
    isAgent: role === ROLES.AGENT,
    isAdmin: role === ROLES.ADMIN,
    isStaff: role === ROLES.AGENT || role === ROLES.ADMIN,
  };
}
