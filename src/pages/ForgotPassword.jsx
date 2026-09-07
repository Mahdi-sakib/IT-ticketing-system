import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MailCheck, KeyRound } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users } from "@/api/entities";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    setSent(true);
  }

  const userExists = Users.filter({ email: email.trim().toLowerCase() }).length > 0;

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your work email and we'll help you reset it."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      {!sent ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </div>
          <Button type="submit" className="w-full">
            <MailCheck className="h-4 w-4" /> Send reset instructions
          </Button>
        </form>
      ) : (
        <div className="space-y-4 text-center">
          <MailCheck className="mx-auto h-10 w-10 text-primary" />
          <p className="text-sm text-muted-foreground">
            If an account exists for <strong>{email}</strong>, reset instructions have been sent.
          </p>
          {userExists && (
            <div className="rounded-md border border-dashed border-border p-3 text-left">
              <p className="mb-2 text-xs text-muted-foreground">
                Demo mode — no real email is sent. Continue to reset your password now:
              </p>
              <Button
                size="sm"
                className="w-full"
                onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`)}
              >
                <KeyRound className="h-3.5 w-3.5" /> Continue to reset password
              </Button>
            </div>
          )}
        </div>
      )}
    </AuthLayout>
  );
}
