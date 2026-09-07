import React, { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Ban, CheckCircle2, KeyRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/lib/AuthContext";
import { Users, logAudit } from "@/api/entities";
import { useLiveQuery } from "@/lib/query-client";
import { ROLES, DEPARTMENTS, LOCATIONS, CATEGORIES } from "@/lib/ticketConstants";

const ROLE_TONE = { employee: "secondary", agent: "default", admin: "warning" };
const emptyForm = {
  full_name: "", email: "", password: "demo1234", role: ROLES.EMPLOYEE,
  department: DEPARTMENTS[0], location: LOCATIONS[0], skills: "",
};

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users] = useLiveQuery(() => Users.list("full_name"), []);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = users.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (search && !`${u.full_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function openNew() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(u) {
    setEditing(u);
    setForm({ ...emptyForm, ...u, password: "", skills: (u.skills || []).join(", ") });
    setOpen(true);
  }
  function set(field) { return (e) => setForm((f) => ({ ...f, [field]: e.target.value })); }

  function save() {
    const fields = { ...form, skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean) };
    if (!fields.password) delete fields.password;
    if (editing) {
      Users.update(editing.id, fields);
      logAudit({ userId: me.id, userName: me.full_name, action: "update", entity: "User", entityId: editing.id, before: editing, after: fields });
      toast.success("User updated");
    } else {
      if (Users.filter({ email: form.email }).length > 0) return toast.error("A user with this email already exists.");
      const created = Users.create({ ...fields, disabled: false, employee_id: `EMP-${Math.floor(1000 + Math.random() * 9000)}` });
      logAudit({ userId: me.id, userName: me.full_name, action: "create", entity: "User", entityId: created.id, after: fields });
      toast.success("User created");
    }
    setOpen(false);
  }

  function toggleDisabled(u) {
    Users.update(u.id, { disabled: !u.disabled });
    logAudit({ userId: me.id, userName: me.full_name, action: u.disabled ? "enable" : "disable", entity: "User", entityId: u.id });
    toast.success(u.disabled ? "User enabled" : "User disabled");
  }

  function resetPassword(u) {
    Users.update(u.id, { password: "demo1234" });
    logAudit({ userId: me.id, userName: me.full_name, action: "reset_password", entity: "User", entityId: u.id });
    toast.success(`Password reset to "demo1234" for ${u.full_name}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">User Management</h1>
          <p className="text-sm text-muted-foreground">Manage employee, agent, and admin accounts.</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> Add User</Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-5">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select className="w-40" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All roles</option>
            <option value={ROLES.EMPLOYEE}>Employee</option>
            <option value={ROLES.AGENT}>IT Agent</option>
            <option value={ROLES.ADMIN}>Admin</option>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="cursor-pointer" onClick={() => openEdit(u)}>
                    <div className="flex items-center gap-2">
                      <Avatar name={u.full_name} size="sm" />
                      <div>
                        <p className="font-medium">{u.full_name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={ROLE_TONE[u.role]}>{u.role}</Badge></TableCell>
                  <TableCell>{u.department}</TableCell>
                  <TableCell>{u.location}</TableCell>
                  <TableCell>{u.disabled ? <Badge variant="destructive">Disabled</Badge> : <Badge variant="success">Active</Badge>}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" title="Reset password" onClick={() => resetPassword(u)}>
                        <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="outline" className="h-7 w-7" title={u.disabled ? "Enable" : "Disable"} onClick={() => toggleDisabled(u)}>
                        {u.disabled ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Ban className="h-3.5 w-3.5 text-red-600" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)} className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? `Edit ${editing.full_name}` : "Add User"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5"><Label>Full Name</Label><Input value={form.full_name} onChange={set("full_name")} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={set("email")} disabled={!!editing} /></div>
            <div className="space-y-1.5"><Label>Role</Label><Select value={form.role} onChange={set("role")}><option value={ROLES.EMPLOYEE}>Employee</option><option value={ROLES.AGENT}>IT Agent</option><option value={ROLES.ADMIN}>Admin</option></Select></div>
            <div className="space-y-1.5"><Label>Department</Label><Select value={form.department} onChange={set("department")}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</Select></div>
            <div className="space-y-1.5"><Label>Location</Label><Select value={form.location} onChange={set("location")}>{LOCATIONS.map((l) => <option key={l}>{l}</option>)}</Select></div>
            <div className="space-y-1.5"><Label>{editing ? "New Password (optional)" : "Password"}</Label><Input type="text" value={form.password} onChange={set("password")} placeholder={editing ? "Leave blank to keep current" : ""} /></div>
            {form.role === ROLES.AGENT && (
              <div className="col-span-2 space-y-1.5">
                <Label>Skills / Specialties (comma-separated categories)</Label>
                <Input value={form.skills} onChange={set("skills")} placeholder={CATEGORIES.slice(0, 3).join(", ")} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save Changes" : "Create User"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
