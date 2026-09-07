import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogIn } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/AuthContext";
import { safeReturnTo } from "@/lib/authReturnTo";
import { Users } from "@/api/entities";

const DEMO_ACCOUNTS = [
  { label: "Employee", email: "employee@omnidesk.dev" },
  { label: "IT Agent", email: "agent@omnidesk.dev" },
  { label: "Admin", email: "admin@omnidesk.dev" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      toast.success("Welcome back!");
      navigate(safeReturnTo() || "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function quickLogin(demoEmail) {
    try {
      await login(demoEmail, "demo1234");
      toast.success("Signed in with demo account");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.message || "Could not sign in with the demo account.");
    }
  }

  const hasUsers = Users.list().length > 0;

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Access the OmniDesk IT service management portal."
      footer={
        <span>
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Register
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          <LogIn className="h-4 w-4" /> Sign in
        </Button>
      </form>

      <div className="my-4 flex items-center gap-2">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">OR</span>
        <Separator className="flex-1" />
      </div>

      <Button variant="outline" className="w-full" onClick={() => navigate("/oauth-consent")}>
        <GoogleIcon /> Continue with Google
      </Button>

      {hasUsers && (
        <div className="mt-6 rounded-md border border-dashed border-border p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Quick demo sign-in (password: demo1234)</p>
          <div className="flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map((d) => (
              <Button key={d.email} type="button" size="sm" variant="secondary" onClick={() => quickLogin(d.email)}>
                {d.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
