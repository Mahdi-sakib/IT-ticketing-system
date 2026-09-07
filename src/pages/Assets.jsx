import React, { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Boxes, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/AuthContext";
import { useRole } from "@/lib/useRole";
import { Assets, Users, logAudit } from "@/api/entities";
import { useLiveQuery } from "@/lib/query-client";
import { formatDate } from "@/lib/utils";
import { DEPARTMENTS, LOCATIONS } from "@/lib/ticketConstants";

const ASSET_TYPES = ["Laptop", "Desktop", "Monitor", "Printer", "Server", "Network Device", "Mobile Device", "Peripheral", "Software License", "Other"];
const ASSET_STATUSES = ["in_use", "in_stock", "in_repair", "retired", "lost"];
const STATUS_LABELS = { in_use: "In Use", in_stock: "In Stock", in_repair: "In Repair", retired: "Retired", lost: "Lost/Missing" };
const STATUS_TONE = { in_use: "default", in_stock: "secondary", in_repair: "warning", retired: "outline", lost: "destructive" };

const emptyForm = {
  asset_tag: "", name: "", type: ASSET_TYPES[0], status: "in_stock", manufacturer: "", model: "",
  serial_number: "", purchase_date: "", purchase_cost: "", warranty_end: "", vendor: "",
  assigned_to_id: "", location: LOCATIONS[0], department: DEPARTMENTS[0], notes: "",
};

export default function AssetsPage() {
  const { user } = useAuth();
  const { isStaff } = useRole();
  const [assets] = useLiveQuery(() => Assets.list("-created_date"), []);
  const [users] = useLiveQuery(() => Users.list(), []);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = assets.filter((a) => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (search && !`${a.name} ${a.asset_tag} ${a.serial_number}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, asset_tag: `AST-${String(assets.length + 1).padStart(4, "0")}` });
    setOpen(true);
  }

  function openEdit(asset) {
    setEditing(asset);
    setForm({ ...emptyForm, ...asset });
    setOpen(true);
  }

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function save() {
    const owner = users.find((u) => u.id === form.assigned_to_id);
    const fields = { ...form, assigned_to_name: owner?.full_name || null };
    if (editing) {
      if (editing.assigned_to_id && editing.assigned_to_id !== form.assigned_to_id) {
        fields.previous_holders = [...(editing.previous_holders || []), editing.assigned_to_name].filter(Boolean);
      }
      Assets.update(editing.id, fields);
      logAudit({ userId: user.id, userName: user.full_name, action: "update", entity: "Asset", entityId: editing.id, before: editing, after: fields });
      toast.success("Asset updated");
    } else {
      const created = Assets.create({ ...fields, previous_holders: [], depreciation_percent: 0, maintenance_history: [] });
      logAudit({ userId: user.id, userName: user.full_name, action: "create", entity: "Asset", entityId: created.id, after: fields });
      toast.success("Asset added");
    }
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Asset Management</h1>
          <p className="text-sm text-muted-foreground">Track hardware, software licenses, and their full lifecycle.</p>
        </div>
        {isStaff && (
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" /> Add Asset
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-5">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search by name, tag, serial..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select className="w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {ASSET_STATUSES.map((s) => (<option key={s} value={s}>{STATUS_LABELS[s]}</option>))}
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
              <Boxes className="h-8 w-8" />
              <p className="text-sm">No assets found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Warranty Ends</TableHead>
                  <TableHead>Depreciation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id} className={isStaff ? "cursor-pointer" : ""} onClick={() => isStaff && openEdit(a)}>
                    <TableCell className="font-medium text-primary">{a.asset_tag}</TableCell>
                    <TableCell>{a.name}</TableCell>
                    <TableCell>{a.type}</TableCell>
                    <TableCell><Badge variant={STATUS_TONE[a.status]}>{STATUS_LABELS[a.status] || a.status}</Badge></TableCell>
                    <TableCell>{a.assigned_to_name || <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                    <TableCell>{a.department}</TableCell>
                    <TableCell>{formatDate(a.warranty_end, false)}</TableCell>
                    <TableCell className="w-32">
                      <div className="flex items-center gap-2">
                        <Progress value={a.depreciation_percent || 0} className="w-16" />
                        <span className="text-xs">{a.depreciation_percent || 0}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.asset_tag}` : "Add Asset"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Asset Tag</Label><Input value={form.asset_tag} onChange={set("asset_tag")} /></div>
            <div className="space-y-1.5"><Label>Name</Label><Input value={form.name} onChange={set("name")} /></div>
            <div className="space-y-1.5"><Label>Type</Label><Select value={form.type} onChange={set("type")}>{ASSET_TYPES.map((t) => <option key={t}>{t}</option>)}</Select></div>
            <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onChange={set("status")}>{ASSET_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</Select></div>
            <div className="space-y-1.5"><Label>Manufacturer</Label><Input value={form.manufacturer} onChange={set("manufacturer")} /></div>
            <div className="space-y-1.5"><Label>Model</Label><Input value={form.model} onChange={set("model")} /></div>
            <div className="space-y-1.5"><Label>Serial Number</Label><Input value={form.serial_number} onChange={set("serial_number")} /></div>
            <div className="space-y-1.5"><Label>Vendor</Label><Input value={form.vendor} onChange={set("vendor")} /></div>
            <div className="space-y-1.5"><Label>Purchase Date</Label><Input type="date" value={form.purchase_date?.slice(0, 10) || ""} onChange={set("purchase_date")} /></div>
            <div className="space-y-1.5"><Label>Purchase Cost</Label><Input type="number" value={form.purchase_cost} onChange={set("purchase_cost")} /></div>
            <div className="space-y-1.5"><Label>Warranty End</Label><Input type="date" value={form.warranty_end?.slice(0, 10) || ""} onChange={set("warranty_end")} /></div>
            <div className="space-y-1.5">
              <Label>Assigned To</Label>
              <Select value={form.assigned_to_id} onChange={set("assigned_to_id")}>
                <option value="">Unassigned</option>
                {users.map((u) => (<option key={u.id} value={u.id}>{u.full_name}</option>))}
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Department</Label><Select value={form.department} onChange={set("department")}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</Select></div>
            <div className="space-y-1.5"><Label>Location</Label><Select value={form.location} onChange={set("location")}>{LOCATIONS.map((l) => <option key={l}>{l}</option>)}</Select></div>
            <div className="col-span-2 space-y-1.5"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={set("notes")} /></div>
          </div>
          {editing?.maintenance_history?.length > 0 && (
            <div className="mt-3 rounded-md border border-border p-2 text-xs text-muted-foreground">
              <p className="mb-1 flex items-center gap-1 font-medium"><Wrench className="h-3 w-3" /> Maintenance History</p>
              {editing.maintenance_history.map((m, i) => <p key={i}>{m}</p>)}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save Changes" : "Add Asset"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
