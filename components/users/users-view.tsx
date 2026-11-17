"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Plus, Search, UserRoundCog } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SimpleSelect } from "@/components/shared/simple-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { initialStaffUsers, STAFF_ROLES, type StaffStatus, type StaffUser } from "@/data/admin";
import { useAppData } from "@/hooks/use-app-data";
import { MetricStrip, Panel, StatePill } from "@/components/smart-operations/shared";

const emptyDraft = (): StaffUser => ({ id: "", name: "", email: "", role: "Operations", propertyIds: [], status: "Invited", lastActive: "Never" });

export function UsersView() {
  const { model: m, actions } = useAppData();
  const [users, setUsers] = useState(initialStaffUsers);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<StaffUser>(emptyDraft);
  const properties = m.properties.filter((property) => property.status !== "Archived");
  const visible = useMemo(() => users.filter((user) => {
    const assigned = user.propertyIds.map((id) => m.by.property.get(id)?.name ?? id).join(" ");
    const matchesText = `${user.name} ${user.email} ${user.role} ${assigned}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesText
      && (roleFilter === "all" || user.role === roleFilter)
      && (statusFilter === "all" || user.status === statusFilter)
      && (propertyFilter === "all" || user.propertyIds.includes(propertyFilter));
  }), [users, m, query, roleFilter, statusFilter, propertyFilter]);
  const assignedNames = (user: StaffUser) => user.propertyIds.map((id) => m.by.property.get(id)?.name ?? id);

  const openInvite = () => {
    setEditing(null);
    setDraft(emptyDraft());
    setDialogOpen(true);
  };
  const openEdit = (user: StaffUser) => {
    setEditing(user.id);
    setDraft({ ...user, propertyIds: [...user.propertyIds] });
    setDialogOpen(true);
  };
  const toggleProperty = (id: string) => setDraft((current) => ({
    ...current,
    propertyIds: current.propertyIds.includes(id) ? current.propertyIds.filter((propertyId) => propertyId !== id) : [...current.propertyIds, id],
  }));
  const saveUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = draft.email.trim().toLowerCase();
    const duplicate = users.some((user) => user.email.toLowerCase() === email && user.id !== editing);
    if (duplicate) {
      toast.error("Email already exists", { description: "Use a different demo email address." });
      return;
    }
    if (draft.role !== "Super Admin" && draft.propertyIds.length === 0) {
      toast.error("Assign at least one property", { description: "Non-admin demo users need a property assignment." });
      return;
    }
    const propertyIds = draft.role === "Super Admin" && draft.propertyIds.length === 0 ? properties.map((property) => property.id) : draft.propertyIds;
    const normalized = { ...draft, email, propertyIds };
    if (editing) {
      setUsers((items) => items.map((user) => user.id === editing ? normalized : user));
      toast.success("User updated", { description: "Role and property changes are local to this prototype." });
    } else {
      const nextId = Math.max(0, ...users.map((user) => Number(user.id.replace("USR-", "")) || 0)) + 1;
      const newUser: StaffUser = { ...normalized, id: `USR-${String(nextId).padStart(3, "0")}`, status: "Invited" };
      setUsers((items) => [newUser, ...items]);
      toast("Invitation simulated", { description: "A local invited user was added. No email was sent." });
    }
    const propertyId = propertyIds[0] ?? properties[0]?.id;
    if (propertyId) actions.log(propertyId, "housekeeping", editing ? `User access updated for ${draft.name}.` : `Demo invitation created for ${draft.name}.`);
    setDialogOpen(false);
  };
  const changeStatus = (user: StaffUser) => {
    const next: StaffStatus = user.status === "Active" ? "Inactive" : "Active";
    setUsers((items) => items.map((item) => item.id === user.id ? { ...item, status: next } : item));
    const propertyId = user.propertyIds[0] ?? properties[0]?.id;
    if (propertyId) actions.log(propertyId, "housekeeping", `${user.name} was ${next === "Active" ? "activated" : "deactivated"} in the demo user directory.`);
    toast.success(`User ${next === "Active" ? "activated" : "deactivated"}`, { description: `${user.name} · prototype state only` });
  };
  const roleOptions = [{ value: "all", label: "All roles" }, ...STAFF_ROLES.map((role) => ({ value: role, label: role }))];
  const propertyOptions = [{ value: "all", label: "All properties" }, ...properties.map((property) => ({ value: property.id, label: property.name }))];

  return (
    <div className="space-y-6">
      <PageHeader title="Users & roles" description="Manage the fictional team directory, access roles and property assignments." actions={<Button variant="accent" onClick={openInvite}><Plus /> Invite user</Button>} />
      <p className="rounded-xl border border-border bg-surface px-4 py-3 text-body text-muted-foreground"><strong className="font-semibold text-charcoal">Prototype only.</strong> Roles and account states are local demo data. Sign-in is browser-only; role-based access enforcement and email invitations are not implemented.</p>
      <MetricStrip items={[
        { label: "Team members", value: users.length, detail: "Sample directory" },
        { label: "Active", value: users.filter((user) => user.status === "Active").length },
        { label: "Invited", value: users.filter((user) => user.status === "Invited").length },
        { label: "Inactive", value: users.filter((user) => user.status === "Inactive").length },
      ]} />
      <Panel title="Team directory" detail={`${visible.length} of ${users.length} demo users`}>
        <div className="flex flex-wrap gap-3 border-b border-border p-4">
          <div className="relative min-w-56 flex-1 sm:max-w-sm"><Search aria-hidden className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email or property" aria-label="Search users" className="pl-9" /></div>
          <SimpleSelect label="Role" value={roleFilter} onChange={setRoleFilter} className="w-full sm:w-48" options={roleOptions} />
          <SimpleSelect label="Status" value={statusFilter} onChange={setStatusFilter} className="w-full sm:w-40" options={[{ value: "all", label: "All statuses" }, ...["Active", "Inactive", "Invited"].map((status) => ({ value: status, label: status }))]} />
          <SimpleSelect label="Property" value={propertyFilter} onChange={setPropertyFilter} className="w-full sm:w-56" options={propertyOptions} />
        </div>
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead className="hidden lg:table-cell">Assigned properties</TableHead><TableHead>Status</TableHead><TableHead className="hidden md:table-cell">Last active</TableHead><TableHead className="w-40">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{visible.map((user) => <TableRow key={user.id}>
            <TableCell><div className="flex items-start gap-2"><UserRoundCog className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><span className="min-w-0"><span className="block text-label">{user.name}</span><span className="block max-w-48 truncate text-meta">{user.email}</span><span className="text-meta lg:hidden">{assignedNames(user).join(", ") || "No property assigned"}</span></span></div></TableCell>
            <TableCell><StatePill value={user.role} /></TableCell>
            <TableCell className="max-w-64 text-body hidden lg:table-cell">{assignedNames(user).join(", ") || "All properties"}</TableCell>
            <TableCell><StatePill value={user.status} /></TableCell>
            <TableCell className="hidden text-body md:table-cell">{user.lastActive}</TableCell>
            <TableCell><div className="flex items-center gap-1"><Button variant="ghost" size="sm" onClick={() => openEdit(user)}>Edit</Button><Button variant="ghost" size="sm" onClick={() => changeStatus(user)}>{user.status === "Active" ? "Deactivate" : "Activate"}</Button></div></TableCell>
          </TableRow>)}
          {!visible.length && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No users match these filters. Try another role or clear the search.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Panel>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>{editing ? "Edit user" : "Invite a user"}</DialogTitle><DialogDescription>{editing ? "Update the demo user's role and property assignments." : "Invitation is simulated. No account or email will be created."}</DialogDescription></DialogHeader>
          <form onSubmit={saveUser} className="space-y-4">
            <label className="block space-y-1.5"><span className="text-label">Name</span><Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} autoComplete="name" required /></label>
            <label className="block space-y-1.5"><span className="text-label">Email</span><Input type="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} autoComplete="email" required /></label>
            <label className="block space-y-1.5"><span className="text-label">Role</span><select className="h-9 w-full rounded-lg border border-input bg-surface px-3 text-body" value={draft.role} onChange={(event) => {
              const role = STAFF_ROLES.find((item) => item === event.target.value);
              if (role) setDraft((current) => ({ ...current, role }));
            }}>{STAFF_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}</select></label>
            <fieldset className="space-y-2"><legend className="text-label">Assigned properties</legend><div className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-2">{properties.map((property) => <label key={property.id} className="flex items-center gap-2 text-body"><input type="checkbox" checked={draft.propertyIds.includes(property.id)} onChange={() => toggleProperty(property.id)} />{property.name}</label>)}</div><p className="text-meta">Super Admin users can access all listed properties. Other roles require at least one selection.</p></fieldset>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit">{editing ? "Save user" : "Simulate invitation"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
