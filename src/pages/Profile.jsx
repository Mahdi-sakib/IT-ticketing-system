import React, { useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/AuthContext";
import { DEPARTMENTS, LOCATIONS } from "@/lib/ticketConstants";

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    phone: user?.phone || "",
    department: user?.department || DEPARTMENTS[0],
    location: user?.location || LOCATIONS[0],
  });
  const [password, setPassword] = useState("");

  function set(field) { return (e) => setForm((f) => ({ ...f, [field]: e.target.value })); }

  function save() {
    updateProfile(form);
    toast.success("Profile updated");
  }

  function changePassword() {
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");
    updateProfile({ password });
    setPassword("");
    toast.success("Password changed");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Avatar name={user?.full_name} size="lg" />
        <div>
          <h1 className="text-2xl font-semibold">{user?.full_name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="outline">{user?.email}</Badge>
            <Badge>{user?.role}</Badge>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5"><Label>Full Name</Label><Input value={form.full_name} onChange={set("full_name")} /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={set("phone")} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Department</Label><Select value={form.department} onChange={set("department")}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</Select></div>
            <div className="space-y-1.5"><Label>Location</Label><Select value={form.location} onChange={set("location")}>{LOCATIONS.map((l) => <option key={l}>{l}</option>)}</Select></div>
          </div>
          <Button onClick={save}><Save className="h-4 w-4" /> Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
        <CardContent className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5"><Label>New Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button variant="outline" onClick={changePassword}>Update Password</Button>
        </CardContent>
      </Card>
    </div>
  );
}
