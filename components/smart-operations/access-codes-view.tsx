"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SimpleSelect } from "@/components/shared/simple-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppData } from "@/hooks/use-app-data";
import { DEMO_REFERENCE_TIME, TODAY_ISO } from "@/lib/dates";
import { roomLabel } from "@/data/rooms";
import { DetailDrawer, DetailGrid, MetricStrip, ModuleFrame, Panel, StatePill, Timeline, dateLabel } from "./shared";

type AccessStatus = "Scheduled" | "Active" | "Expired" | "Revoked" | "Failed";
type AccessRecord = {
  id: string;
  reservationId: string;
  guest: string;
  guestId: string;
  propertyId: string;
  property: string;
  unit: string;
  lock: string;
  validFrom: string;
  validUntil: string;
  status: AccessStatus;
  maskedCode: string;
};

const accessStatuses = ["all", "Scheduled", "Active", "Expired", "Revoked", "Failed"];

export function AccessCodesView() {
  const { model: m } = useAppData();
  const candidates = useMemo(() => {
    const window = m.reservations.filter((reservation) => reservation.checkIn >= "2026-11-12" && reservation.checkIn <= "2026-11-24");
    const examples = [
      window.find((reservation) => reservation.status === "Cancelled"),
      window.find((reservation) => m.by.taskByReservation.get(reservation.id)?.status === "Failed"),
      window.find((reservation) => reservation.checkOut < TODAY_ISO || (reservation.checkOut === TODAY_ISO && reservation.checkOutTime <= DEMO_REFERENCE_TIME)),
      window.find((reservation) => reservation.checkIn <= TODAY_ISO && reservation.checkOut >= TODAY_ISO && m.by.taskByReservation.get(reservation.id)?.status === "Completed"),
      window.find((reservation) => reservation.checkIn > TODAY_ISO && reservation.status !== "Cancelled"),
    ].filter((reservation) => reservation !== undefined);
    const unique = new Map([...examples, ...window.sort((a, b) => a.checkIn.localeCompare(b.checkIn))].map((reservation) => [reservation.id, reservation]));
    return [...unique.values()].slice(0, 18);
  }, [m]);
  const eligibleReservations = m.reservations
    .filter((reservation) => reservation.status !== "Cancelled" && reservation.checkIn >= TODAY_ISO)
    .slice(0, 100);
  const initial = useMemo(() => candidates.slice(0, 18).map((reservation, index): AccessRecord => {
    const guest = m.by.guest.get(reservation.guestId);
    const room = m.by.room.get(reservation.roomId);
    const property = m.by.property.get(reservation.propertyId);
    const task = m.by.taskByReservation.get(reservation.id);
    const status: AccessStatus = reservation.status === "Cancelled"
      ? "Revoked"
      : task?.status === "Failed"
        ? "Failed"
        : reservation.checkOut < TODAY_ISO || (reservation.checkOut === TODAY_ISO && reservation.checkOutTime <= DEMO_REFERENCE_TIME)
          ? "Expired"
          : reservation.checkIn <= TODAY_ISO && task?.status === "Completed"
            ? "Active"
            : "Scheduled";
    return {
      id: task?.id ?? `SIM-${reservation.id}`,
      reservationId: reservation.id,
      guest: guest?.name ?? "Guest",
      guestId: reservation.guestId,
      propertyId: reservation.propertyId,
      property: property?.name ?? reservation.propertyId,
      unit: room ? roomLabel(room) : reservation.roomId,
      lock: m.by.lockByRoom.get(reservation.roomId)?.id ?? `Illustrative lock · ${reservation.roomId}`,
      validFrom: `${reservation.checkIn}T${reservation.checkInTime}`,
      validUntil: `${reservation.checkOut}T${reservation.checkOutTime}`,
      status,
      maskedCode: `**** ${String(4821 + index * 137).slice(-4)}`,
    };
  }), [candidates, m]);
  const [records, setRecords] = useState<AccessRecord[]>(initial);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<AccessRecord | null>(null);
  const [dialog, setDialog] = useState<"create" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");

  const matches = records.filter((record) => {
    const text = `${record.guest} ${record.reservationId} ${record.property} ${record.unit} ${record.lock}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (statusFilter === "all" || record.status === statusFilter);
  });
  const updateDates = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validFrom || !validUntil || validFrom >= validUntil) {
      toast.error("Choose a valid access window", { description: "The end time must be after the start time." });
      return;
    }
    if (dialog === "edit" && editId) {
      setRecords((rows) => rows.map((row) => row.id === editId ? { ...row, validFrom, validUntil } : row));
      toast.success("Validity window updated", { description: "Saved in this prototype only; no door credential was changed." });
    } else {
      const reservation = m.by.reservation.get(reservationId);
      if (!reservation || reservation.status === "Cancelled") {
        toast.error("Choose an active reservation", { description: "Access tasks can only be associated with an eligible reservation." });
        return;
      }
      const guest = m.by.guest.get(reservation.guestId);
      const room = m.by.room.get(reservation.roomId);
      const property = m.by.property.get(reservation.propertyId);
      const row: AccessRecord = {
        id: `SIM-${Date.now()}`,
        reservationId: reservation.id,
        guest: guest?.name ?? "Guest",
        guestId: reservation.guestId,
        propertyId: reservation.propertyId,
        property: property?.name ?? reservation.propertyId,
        unit: room ? roomLabel(room) : reservation.roomId,
        lock: m.by.lockByRoom.get(reservation.roomId)?.id ?? `Illustrative lock · ${reservation.roomId}`,
        validFrom,
        validUntil,
        status: "Scheduled",
        maskedCode: "**** 7304",
      };
      setRecords((rows) => [row, ...rows]);
      toast.success("Access task created (simulated)", { description: "A masked sample record was added locally. No PIN was generated." });
    }
    setDialog(null);
    setSelected(null);
  };
  const openEdit = (record: AccessRecord) => {
    setEditId(record.id);
    setValidFrom(record.validFrom);
    setValidUntil(record.validUntil);
    setDialog("edit");
  };
  const openCreate = () => {
    const eligible = eligibleReservations[0];
    setReservationId(eligible?.id ?? "");
    setValidFrom(eligible ? `${eligible.checkIn}T${eligible.checkInTime}` : "");
    setValidUntil(eligible ? `${eligible.checkOut}T${eligible.checkOutTime}` : "");
    setEditId(null);
    setDialog("create");
  };

  return (
    <ModuleFrame title="Access codes" description="Review guest access tasks and their planned validity windows. Codes shown are fictional and masked.">
      <MetricStrip items={[
        { label: "Access tasks", value: records.length, detail: "Local demonstration records" },
        { label: "Scheduled", value: records.filter((row) => row.status === "Scheduled").length },
        { label: "Active", value: records.filter((row) => row.status === "Active").length },
        { label: "Requires attention", value: records.filter((row) => row.status === "Failed").length, detail: "Failed sample workflows" },
      ]} />
      <Panel title="Guest access tasks" detail="Masked values are examples, not working door credentials." action={<Button variant="accent" onClick={openCreate}><Plus /> Create access task</Button>}>
        <div className="flex flex-wrap gap-3 border-b border-border p-4">
          <div className="relative min-w-56 flex-1 sm:max-w-sm"><Search aria-hidden className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search guest, reservation, unit" aria-label="Search access tasks" className="pl-9" /></div>
          <SimpleSelect label="Status" value={statusFilter} onChange={setStatusFilter} className="w-full sm:w-44" options={accessStatuses.map((status) => ({ value: status, label: status === "all" ? "All statuses" : status }))} />
        </div>
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Guest / reservation</TableHead><TableHead className="hidden lg:table-cell">Property / unit</TableHead><TableHead className="hidden xl:table-cell">Associated lock</TableHead><TableHead>Validity window</TableHead><TableHead>Status</TableHead><TableHead>Code</TableHead></TableRow></TableHeader>
          <TableBody>
            {matches.map((record) => <TableRow key={record.id} className="cursor-pointer" onClick={() => setSelected(record)}>
              <TableCell><button type="button" className="text-left"><span className="block text-label">{record.guest}</span><span className="text-meta">{record.reservationId} · {record.id}</span></button></TableCell>
              <TableCell className="hidden lg:table-cell"><span className="block text-body">{record.property}</span><span className="text-meta">{record.unit}</span></TableCell>
              <TableCell className="hidden text-body xl:table-cell">{record.lock}</TableCell>
              <TableCell><span className="block text-body">{dateLabel(record.validFrom)} · {record.validFrom.slice(11, 16)}</span><span className="text-meta">Until {dateLabel(record.validUntil)} · {record.validUntil.slice(11, 16)}</span></TableCell>
              <TableCell><StatePill value={record.status} /></TableCell>
              <TableCell className="font-mono text-body">{record.maskedCode}</TableCell>
            </TableRow>)}
            {matches.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No access tasks match these filters.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Panel>
      <DetailDrawer open={!!selected} onOpenChange={(open) => !open && setSelected(null)} title="Access task details" description={selected ? `${selected.id} · simulation only` : undefined}>
        {selected && <>
          <DetailGrid items={[
            { label: "Guest", value: selected.guest },
            { label: "Reservation", value: selected.reservationId },
            { label: "Property", value: selected.property },
            { label: "Room / unit", value: selected.unit },
            { label: "Illustrative lock", value: selected.lock },
            { label: "Fictional masked code", value: selected.maskedCode },
            { label: "Valid from", value: `${dateLabel(selected.validFrom)} · ${selected.validFrom.slice(11, 16)}` },
            { label: "Valid until", value: `${dateLabel(selected.validUntil)} · ${selected.validUntil.slice(11, 16)}` },
          ]} />
          <section><h3 className="mb-3 text-card-title">Access history</h3><Timeline items={[
            { title: selected.status === "Failed" ? "Preparation flagged for review" : "Access task recorded", detail: "Sample event stored in local prototype state; no credential generated.", time: "17 Nov 2026 · 09:18" },
            { title: "Reservation linked", detail: `${selected.reservationId} · ${selected.guest} · ${selected.unit}`, time: "17 Nov 2026 · 09:12" },
          ]} /></section>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => openEdit(selected)}>Edit validity window</Button>
            <Button variant="destructive" disabled={selected.status === "Revoked" || selected.status === "Expired"} onClick={() => {
              setRecords((rows) => rows.map((row) => row.id === selected.id ? { ...row, status: "Revoked" } : row));
              setSelected({ ...selected, status: "Revoked" });
              toast("Access task revoked (simulated)", { description: "The local sample status changed only. No door credential was revoked." });
            }}>Simulate revoke</Button>
          </div>
        </>}
      </DetailDrawer>
      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{dialog === "edit" ? "Edit validity window" : "Create access task"}</DialogTitle><DialogDescription>Simulation only. This creates a local task record with a fictional masked code; it does not generate a credential or contact a lock.</DialogDescription></DialogHeader>
          <form onSubmit={updateDates} className="space-y-4">
            {dialog === "create" && <label className="block space-y-1.5"><span className="text-label">Reservation</span><select className="h-9.5 w-full rounded-lg border border-input bg-surface px-3 text-body" value={reservationId} onChange={(event) => {
              const next = m.by.reservation.get(event.target.value);
              setReservationId(event.target.value);
              if (next) { setValidFrom(`${next.checkIn}T${next.checkInTime}`); setValidUntil(`${next.checkOut}T${next.checkOutTime}`); }
            }} required><option value="">Select a reservation</option>{eligibleReservations.map((reservation) => <option key={reservation.id} value={reservation.id}>{reservation.id} · {m.by.guest.get(reservation.guestId)?.name} · {reservation.checkIn}</option>)}</select></label>}
            <label className="block space-y-1.5"><span className="text-label">Valid from</span><Input type="datetime-local" value={validFrom} onChange={(event) => setValidFrom(event.target.value)} required /></label>
            <label className="block space-y-1.5"><span className="text-label">Valid until</span><Input type="datetime-local" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} required /></label>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button><Button type="submit">{dialog === "edit" ? "Save window" : "Create simulated task"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ModuleFrame>
  );
}
