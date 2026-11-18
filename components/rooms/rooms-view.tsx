"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BatteryLow, BedDouble, MoreHorizontal, Pencil, Plus, Search, Wifi, WifiOff, Wrench, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import type { Room, RoomState } from "@/types";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { SimpleSelect } from "@/components/shared/simple-select";
import { RoomStateBadge } from "@/components/shared/status-badges";
import { useAppData, useIntent } from "@/hooks/use-app-data";
import { roomLabel } from "@/data/rooms";
import { TODAY_ISO, shift } from "@/lib/dates";
import { currentStay, findConflicts, isActiveStay, isLive, nextReservation, roomState, type Model } from "@/lib/model";
import { cn } from "@/lib/utils";
import { RoomDetails } from "./room-details";
import { RoomDialog } from "./room-dialog";

const STATES: RoomState[] = ["Available", "Occupied", "Reserved", "Maintenance"];
const stateBar: Record<RoomState, string> = {
  Available: "bg-mint",
  Occupied: "bg-charcoal",
  Reserved: "bg-lime",
  Maintenance: "bg-brown",
};

const AVAILABILITY = [
  { value: "any", label: "Any availability" },
  { value: "tonight", label: "Free tonight (after check-outs)" },
  { value: "tomorrow", label: "Free tomorrow night" },
  { value: "3", label: "Free for the next 3 nights" },
  { value: "7", label: "Free for the next 7 nights" },
];

function freeFor(m: Model, r: Room, availability: string): boolean {
  if (availability === "any") return true;
  if (r.status === "Maintenance") return false;
  const [from, nights] = availability === "tonight" ? [TODAY_ISO, 1] : availability === "tomorrow" ? [shift(TODAY_ISO, 1), 1] : [TODAY_ISO, Number(availability)];
  return findConflicts(m, r.id, from, shift(from, nights)).length === 0;
}

export function RoomsView() {
  const router = useRouter();
  const { model: m, actions, openIntent } = useAppData();

  const [property, setProperty] = useState("all");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [availability, setAvailability] = useState("any");
  const [state, setState] = useState<RoomState | "all">("all");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Room | "new" | null>(null);
  const [maintenanceFor, setMaintenanceFor] = useState<Room | null>(null);

  useIntent(["room", "rooms", "new-room"], (i) => {
    if (i.type === "room") setSelectedId(i.id);
    if (i.type === "rooms") setProperty(i.propertyId);
    if (i.type === "new-room") {
      setProperty(i.propertyId);
      setEditing("new");
    }
  });

  const q = query.trim().toLowerCase();
  const typeOptions = useMemo(() => {
    const types = Array.from(new Set(m.rooms.filter((r) => property === "all" || r.propertyId === property).map((r) => r.type))).sort();
    return [{ value: "all", label: "All room types" }, ...types.map((t) => ({ value: t, label: t }))];
  }, [m.rooms, property]);
  const safeType = typeOptions.some((o) => o.value === type) ? type : "all";

  // Everything except the state filter, so the state counts below stay meaningful while one state is selected.
  const base = useMemo(
    () =>
      m.rooms
        .filter(
          (r) =>
            (property === "all" || r.propertyId === property) &&
            (safeType === "all" || r.type === safeType) &&
            (!q || [roomLabel(r), r.type, r.id].some((s) => s.toLowerCase().includes(q))) &&
            freeFor(m, r, availability)
        )
        .map((r) => ({ room: r, state: roomState(m, r) })),
    [m, property, safeType, q, availability]
  );
  const counts = useMemo(() => {
    const c: Record<RoomState, number> = { Available: 0, Occupied: 0, Reserved: 0, Maintenance: 0 };
    base.forEach((b) => (c[b.state] += 1));
    return c;
  }, [base]);
  const rows = base.filter((b) => state === "all" || b.state === state);
  const groups = m.properties
    .map((p) => ({ property: p, rows: rows.filter((r) => r.room.propertyId === p.id) }))
    .filter((g) => g.rows.length > 0);
  const filtersActive = property !== "all" || q !== "" || safeType !== "all" || availability !== "any" || state !== "all";
  const selected = selectedId ? (m.by.room.get(selectedId) ?? null) : null;

  const clear = () => {
    setProperty("all");
    setQuery("");
    setType("all");
    setAvailability("any");
    setState("all");
  };

  const toggleMaintenance = (r: Room) => {
    if (r.status === "Maintenance") {
      actions.updateRoom(r.id, { status: "Active" });
      toast.success(`${roomLabel(r)} is back in service`);
      return;
    }
    // Maintenance would strand any booking still in or arriving at the unit, so it is refused until they are moved.
    const stays = (m.by.reservationsByRoom.get(r.id) ?? []).filter(isActiveStay);
    if (stays.length > 0) {
      toast.error("This unit has active bookings", {
        description: `${stays.length} ${stays.length === 1 ? "reservation is" : "reservations are"} booked here. Move or cancel ${stays.length === 1 ? "it" : "them"} first.`,
        action: {
          label: "View",
          onClick: () => {
            openIntent({ type: "reservations", propertyId: r.propertyId });
            router.push("/reservations");
          },
        },
      });
      return;
    }
    setMaintenanceFor(r);
  };

  const menu = (r: Room) => (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${roomLabel(r)}`} />}>
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => setSelectedId(r.id)}>View details</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setEditing(r)}>
          <Pencil /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toggleMaintenance(r)}>
          <Wrench /> {r.status === "Maintenance" ? "Return to service" : "Mark maintenance"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={r.status === "Maintenance" || m.by.property.get(r.propertyId)?.status !== "Active"}
          onClick={() => {
            openIntent({ type: "new-reservation", roomId: r.id });
            router.push("/reservations");
          }}
        >
          New reservation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rooms & Units"
        description="Every unit across your properties, what state it is in right now, and who is next."
        actions={
          <Button variant="accent" onClick={() => setEditing("new")}>
            <Plus /> Add unit
          </Button>
        }
      />

      {/* Unit board: tonight's state at a glance. Each state doubles as a filter. */}
      <section aria-label="Unit states tonight">
        <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={STATES.map((s) => `${s} ${counts[s]}`).join(", ")}>
          {STATES.map((s) => (
            <span key={s} className={cn("first:rounded-l-full last:rounded-r-full", stateBar[s], counts[s] === 0 && "hidden")} style={{ flexGrow: counts[s], flexBasis: 0 }} />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STATES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={state === s}
              onClick={() => setState(state === s ? "all" : s)}
              className={cn("flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors", state === s ? "border-charcoal bg-surface shadow-card" : "border-border hover:border-border-strong hover:bg-surface/60")}
            >
              <span className="flex items-center gap-2 text-label">
                <span aria-hidden className={cn("size-2.5 rounded-sm", stateBar[s])} />
                {s}
              </span>
              <span className="tabular text-section">{counts[s]}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3" role="search" aria-label="Unit filters">
        <SimpleSelect label="Property" value={property} onChange={setProperty} className="w-full sm:w-52" options={[{ value: "all", label: "All properties" }, ...m.properties.map((p) => ({ value: p.id, label: p.name }))]} />
        <SimpleSelect label="Room type" value={safeType} onChange={setType} className="w-[calc(50%-0.25rem)] sm:w-44" options={typeOptions} />
        <SimpleSelect label="Availability" value={availability} onChange={setAvailability} className="w-[calc(50%-0.25rem)] sm:w-56" options={AVAILABILITY} />
        <div className="relative min-w-0 flex-1 basis-48 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search units"
            aria-label="Search units by name or type"
            className="h-9.5 w-full rounded-lg border border-input bg-surface pl-9 pr-8 text-body outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:text-charcoal">
              <X className="size-3.5" aria-hidden />
            </button>
          )}
        </div>
        {filtersActive && (
          <Button variant="ghost" size="sm" onClick={clear}>
            Clear filters
          </Button>
        )}
        <p className="ml-auto text-meta" aria-live="polite">
          <span className="tabular !text-charcoal">{rows.length}</span> units
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong">
          {property !== "all" && !m.rooms.some((r) => r.propertyId === property) ? (
            <EmptyState
              icon={BedDouble}
              title={`${m.by.property.get(property)?.name ?? "This property"} has no units yet`}
              description="Add its rooms or units so it can take bookings and assign smart locks."
              action={
                <Button variant="accent" onClick={() => setEditing("new")}>
                  <Plus /> Add the first unit
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={BedDouble}
              title="No units match"
              description={filtersActive ? "No unit fits these filters. Try a wider availability window or clear them." : "Add a unit to get started."}
              action={
                filtersActive ? (
                  <Button variant="outline" onClick={clear}>
                    Clear filters
                  </Button>
                ) : (
                  <Button variant="accent" onClick={() => setEditing("new")}>
                    <Plus /> Add unit
                  </Button>
                )
              }
            />
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Unit</TableHead>
                <TableHead className="hidden sm:table-cell">Capacity</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="hidden lg:table-cell">Smart lock</TableHead>
                <TableHead className="hidden md:table-cell">Next reservation</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g) => {
                const sell = g.rows.filter((r) => r.room.status === "Active").length;
                const busy = g.rows.filter((r) => r.state === "Occupied").length;
                return (
                  <Fragment key={g.property.id}>
                    <TableRow className="bg-muted/60 hover:bg-muted/60">
                      <TableCell colSpan={6} className="py-2">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="text-label">{g.property.name}</span>
                          <span className="text-meta">
                            {g.property.city} · {g.rows.length} units shown · {busy} of {sell} in service occupied
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                    {g.rows.map(({ room: r, state: st }) => {
                      const lock = m.by.lockByRoom.get(r.id);
                      const stay = currentStay(m, r.id);
                      const next = nextReservation(m, r.id);
                      const shown = stay ? nextAfter(m, r.id, stay.id) : next;
                      return (
                        <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelectedId(r.id)}>
                          <TableCell>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedId(r.id);
                              }}
                              className="text-left"
                            >
                              <span className="block text-label">{roomLabel(r)}</span>
                              <span className="block text-meta">{r.type}</span>
                              <span className="mt-0.5 block text-meta md:hidden">
                                sleeps {r.capacity} · {shown ? `next ${m.by.guest.get(shown.guestId)?.name.split(" ")[0]}, ${format(parseISO(shown.checkIn), "d MMM")}` : "nothing booked"}
                              </span>
                            </button>
                          </TableCell>
                          <TableCell className="tabular hidden sm:table-cell">{r.capacity}</TableCell>
                          <TableCell>
                            <RoomStateBadge state={st} />
                            {stay && <span className="tabular mt-0.5 block text-meta">until {format(parseISO(stay.checkOut), "d MMM")}</span>}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {lock ? (
                              <span className="inline-flex items-center gap-2 text-body">
                                {lock.status === "Online" ? <Wifi className="size-4 text-olive-deep" aria-hidden /> : <WifiOff className="size-4 text-brown-ink" aria-hidden />}
                                <span>
                                  {lock.id}
                                  <span className="block text-meta">
                                    {lock.status}
                                    {lock.battery < 20 && (
                                      <>
                                        {" · "}
                                        <BatteryLow className="inline size-3 align-[-1px]" aria-hidden /> {lock.battery}%
                                      </>
                                    )}
                                  </span>
                                </span>
                              </span>
                            ) : (
                              <span className="text-meta">None assigned</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {shown ? (
                              <>
                                <span className="block text-body">{m.by.guest.get(shown.guestId)?.name}</span>
                                <span className="tabular block text-meta">
                                  {format(parseISO(shown.checkIn), "d MMM")} – {format(parseISO(shown.checkOut), "d MMM")}
                                </span>
                              </>
                            ) : (
                              <span className="text-meta">Nothing booked</span>
                            )}
                          </TableCell>
                          <TableCell className="pl-0" onClick={(e) => e.stopPropagation()}>
                            {menu(r)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <RoomDetails
        room={selected}
        onClose={() => setSelectedId(null)}
        onEdit={(r) => setEditing(r)}
        onToggleMaintenance={toggleMaintenance}
        onNewReservation={(r) => {
          openIntent({ type: "new-reservation", roomId: r.id });
          router.push("/reservations");
        }}
        onOpenReservation={(id) => {
          openIntent({ type: "reservation", id });
          router.push("/reservations");
        }}
      />

      <RoomDialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} room={editing && editing !== "new" ? editing : undefined} defaultPropertyId={property === "all" ? undefined : property} onSaved={(r) => setSelectedId(r.id)} />

      <ConfirmDialog
        open={!!maintenanceFor}
        onOpenChange={(o) => !o && setMaintenanceFor(null)}
        title={`Put ${maintenanceFor ? roomLabel(maintenanceFor) : "this unit"} in maintenance?`}
        description="No reservations are booked in this unit. While it is in maintenance it cannot be booked."
        confirmLabel="Start maintenance"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (!maintenanceFor) return;
          actions.updateRoom(maintenanceFor.id, { status: "Maintenance" });
          toast.success(`${roomLabel(maintenanceFor)} is in maintenance`);
        }}
      >
      </ConfirmDialog>
    </div>
  );
}

/** The booking after the stay that is currently in the unit. */
function nextAfter(m: Model, roomId: string, currentId: string) {
  return (m.by.reservationsByRoom.get(roomId) ?? []).find((r) => r.id !== currentId && isLive(r) && r.checkIn >= TODAY_ISO && r.status !== "Checked Out");
}
