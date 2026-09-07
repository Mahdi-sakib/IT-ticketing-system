import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Users, absorb } from "@/api/entities";
import { getToken, setToken } from "@/api/authToken";
import { ROLES } from "@/lib/ticketConstants";

const PREVIEW_KEY = "omnidesk_it_preview_role";
const AuthCtx = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function authRequest(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export function AuthProvider({ children }) {
  const [previewRole, setPreviewRole] = useState(() => {
    try {
      return localStorage.getItem(PREVIEW_KEY) || null;
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setUser((current) => (current ? Users.get(current.id) || current : current));
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Session expired"))))
      .then(({ user: found }) => setUser(found))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    try {
      if (previewRole) localStorage.setItem(PREVIEW_KEY, previewRole);
      else localStorage.removeItem(PREVIEW_KEY);
    } catch {
      // ignore
    }
  }, [previewRole]);

  const login = useCallback(async (email, password) => {
    const { token, user: found } = await authRequest("/auth/login", { email, password });
    setToken(token);
    setUser(found);
    return found;
  }, []);

  const register = useCallback(async (fields) => {
    const { token, user: created } = await authRequest("/auth/register", fields);
    absorb("users", created);
    setToken(token);
    setUser(created);
    return created;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setPreviewRole(null);
  }, []);

  const updateProfile = useCallback(
    (fields) => {
      if (!user) return;
      Users.update(user.id, fields);
      refresh();
    },
    [user, refresh]
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
