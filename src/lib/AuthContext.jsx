import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Users } from "@/api/entities";
import { ROLES } from "@/lib/ticketConstants";

const SESSION_KEY = "omnidesk_it_session";
const AuthCtx = createContext(null);

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(() => loadSession()?.userId ?? null);
  const [previewRole, setPreviewRole] = useState(() => loadSession()?.previewRole ?? null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!userId) {
      setUser(null);
      setLoading(false);
      return;
    }
    const found = Users.get(userId);
    setUser(found);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId, previewRole }));
  }, [userId, previewRole]);

  const login = useCallback((email, password) => {
    const found = Users.filter({ email }).find((u) => u.password === password);
    if (!found) throw new Error("Invalid email or password.");
    if (found.disabled) throw new Error("This account has been disabled. Contact your IT administrator.");
    setUserId(found.id);
    // Also set `user` synchronously (not just `userId`) so `isAuthenticated`
    // is already true on the very next render — otherwise a caller that
    // navigates right after login() would hit ProtectedRoute before the
    // userId->refresh() effect has had a chance to run, bouncing back to
    // the login page.
    setUser(found);
    return found;
  }, []);

  const register = useCallback((fields) => {
    const exists = Users.filter({ email: fields.email }).length > 0;
    if (exists) throw new Error("An account with this email already exists.");
    const created = Users.create({
      role: ROLES.EMPLOYEE,
      disabled: false,
      employee_id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      ...fields,
    });
    setUserId(created.id);
    setUser(created);
    return created;
  }, []);

  const logout = useCallback(() => {
    setUserId(null);
    setPreviewRole(null);
  }, []);

  const updateProfile = useCallback(
    (fields) => {
      if (!userId) return;
      Users.update(userId, fields);
      refresh();
    },
    [userId, refresh]
  );

  const effectiveRole = previewRole || user?.role || ROLES.EMPLOYEE;

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    role: effectiveRole,
    realRole: user?.role,
    previewRole,
    setPreviewRole: user?.role === ROLES.ADMIN || user?.role === ROLES.AGENT ? setPreviewRole : () => {},
    login,
    register,
    logout,
    updateProfile,
    refresh,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
