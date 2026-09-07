import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import ScrollToTop from "@/components/ScrollToTop";
import PageNotFound from "@/lib/PageNotFound";
import Loading from "@/components/Loading";
import { ROLES } from "@/lib/ticketConstants";
import { bootstrap } from "@/api/db";
import { processSlaEscalations } from "@/lib/ai";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import OAuthConsent from "@/pages/OAuthConsent";
import Dashboard from "@/pages/Dashboard";
import CreateTicket from "@/pages/CreateTicket";
import MyTickets from "@/pages/MyTickets";
import AllTickets from "@/pages/AllTickets";
import TicketDetails from "@/pages/TicketDetails";
import Assets from "@/pages/Assets";
import Cmdb from "@/pages/Cmdb";
import Problems from "@/pages/Problems";
import Changes from "@/pages/Changes";
import MajorIncidents from "@/pages/MajorIncidents";
import KnowledgeBase from "@/pages/KnowledgeBase";
import ServiceCatalog from "@/pages/ServiceCatalog";
import Analytics from "@/pages/Analytics";
import Profile from "@/pages/Profile";
import AdminUsers from "@/pages/admin/Users";
import AuditLogs from "@/pages/admin/AuditLogs";
import SystemSettings from "@/pages/admin/SystemSettings";

const STAFF = [ROLES.AGENT, ROLES.ADMIN];

function Protected({ roles, children }) {
  return (
    <ProtectedRoute roles={roles}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

// SLA escalation writes to the server, so it can only run once someone is
// actually signed in (an anonymous visitor on /login has no auth token).
function SlaEscalationRunner() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    processSlaEscalations();
    const interval = setInterval(processSlaEscalations, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return null;
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState(null);

  useEffect(() => {
    bootstrap()
      .then(() => setReady(true))
      .catch((err) => setBootError(err));
  }, []);

  if (bootError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <p className="mb-2 text-lg font-semibold">Can't reach the OmniDesk IT server</p>
          <p className="text-sm text-muted-foreground">
            Make sure the backend is running (npm run dev inside /server), then reload this page.
          </p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading label="Loading OmniDesk IT..." />
      </div>
    );
  }

  return (
    <AuthProvider>
      <ScrollToTop />
      <SlaEscalationRunner />
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/oauth-consent" element={<OAuthConsent />} />

        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />

        <Route path="/tickets/new" element={<Protected><CreateTicket /></Protected>} />
        <Route path="/tickets/mine" element={<Protected><MyTickets /></Protected>} />
        <Route path="/tickets" element={<Protected roles={STAFF}><AllTickets /></Protected>} />
        <Route path="/tickets/:id" element={<Protected><TicketDetails /></Protected>} />

        <Route path="/service-catalog" element={<Protected><ServiceCatalog /></Protected>} />
        <Route path="/knowledge-base" element={<Protected><KnowledgeBase /></Protected>} />

        <Route path="/assets" element={<Protected roles={STAFF}><Assets /></Protected>} />
        <Route path="/cmdb" element={<Protected roles={STAFF}><Cmdb /></Protected>} />
        <Route path="/problems" element={<Protected roles={STAFF}><Problems /></Protected>} />
        <Route path="/changes" element={<Protected roles={STAFF}><Changes /></Protected>} />
        <Route path="/major-incidents" element={<Protected roles={STAFF}><MajorIncidents /></Protected>} />
        <Route path="/analytics" element={<Protected roles={STAFF}><Analytics /></Protected>} />

        <Route path="/admin/users" element={<Protected roles={[ROLES.ADMIN]}><AdminUsers /></Protected>} />
        <Route path="/admin/audit-logs" element={<Protected roles={[ROLES.ADMIN]}><AuditLogs /></Protected>} />
        <Route path="/admin/settings" element={<Protected roles={[ROLES.ADMIN]}><SystemSettings /></Protected>} />

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </AuthProvider>
  );
}
