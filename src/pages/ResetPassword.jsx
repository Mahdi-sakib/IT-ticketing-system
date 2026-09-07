import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users } from "@/api/entities";
import { getQueryParam } from "@/lib/app-params";

export default function ResetPassword() {
  const email = (getQueryParam("email") || "").toLowerCase();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    const user = Users.filter({ email }).find(Boolean);
    if (!user) return setError("We couldn't find an account for this email.");
    Users.update(user.id, { password });
    toast.success("Password updated — please sign in.");
    navigate("/login", { replace: true });
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle={email ? `For ${email}` : "Choose a new password for your account."}
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <Button type="submit" className="w-full">
          <KeyRound className="h-4 w-4" /> Update password
        </Button>
      </form>
    </AuthLayout>
  );
}
