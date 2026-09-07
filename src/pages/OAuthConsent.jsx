import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ShieldCheck, Mail, IdCard } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/AuthContext";
import { Users } from "@/api/entities";
import { ROLES } from "@/lib/ticketConstants";
import { safeReturnTo } from "@/lib/authReturnTo";

const DEMO_GOOGLE_EMAIL = "demo.google.user@omnidesk.dev";

export default function OAuthConsent() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  function allow() {
    setLoading(true);
    try {
      const existing = Users.filter({ email: DEMO_GOOGLE_EMAIL })[0];
      if (existing) {
        login(DEMO_GOOGLE_EMAIL, existing.password);
      } else {
        const created = Users.create({
          full_name: "Demo Google User",
          email: DEMO_GOOGLE_EMAIL,
          password: "google-oauth",
          role: ROLES.EMPLOYEE,
          department: "Operations",
          location: "Head Office - Dhaka",
          disabled: false,
          employee_id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
          auth_provider: "google",
        });
        login(created.email, created.password);
      }
      toast.success("Signed in with Google (demo)");
      navigate(safeReturnTo() || "/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.message || "Could not complete Google sign-in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-6">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-col items-center gap-3 text-center">
            <GoogleIcon className="h-8 w-8" />
            <p className="text-sm text-muted-foreground">
              <strong>OmniDesk IT</strong> wants to access your Google Account
            </p>
          </div>
          <div className="mb-5 space-y-3 rounded-lg border border-border p-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" /> View your email address
            </div>
            <div className="flex items-center gap-3 text-sm">
              <IdCard className="h-4 w-4 text-muted-foreground" /> View your basic profile info
            </div>
            <div className="flex items-center gap-3 text-sm">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" /> Sign you in securely (SSO)
            </div>
          </div>
          <p className="mb-4 text-center text-xs text-muted-foreground">
            This is a simulated OAuth consent screen for demo purposes — no real Google account is contacted.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => navigate("/login")}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={allow} disabled={loading}>
              Allow
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
