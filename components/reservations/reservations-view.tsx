"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, CalendarSearch, MoreHorizontal, Plus, Search, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import type { Reservation, ReservationStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { MessageDialog } from "@/components/guests/message-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { SimpleSelect } from "@/components/shared/simple-select";
import { PaymentBadge, ReservationStatusBadge } from "@/components/shared/status-badges";
import { useAppData, useIntent } from "@/hooks/use-app-data";
import { roomLabel } from "@/data/rooms";
import { TODAY_ISO, formatStayDate, formatStayTime, shift } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { CancelDialog } from "./cancel-dialog";
import { ReservationDetails } from "./reservation-details";
import { ReservationDialog } from "./reservation-dialog";

const STATUS_TABS: (ReservationStatus | "all")[] = ["all", "Confirmed", "Pending", "Checked In", "Checked Out", "Cancelled"];
const SOURCES = [{ value: "all", label: "All sources" }, ...["Direct", "Booking.com", "Airbnb", "Expedia", "Corporate"].map((s) => ({ value: s, label: s }))];
const DATES = [
  { value: "current", label: "Upcoming and last 7 days" },
  { value: "today-in", label: "Arriving today" },
  { value: "today-out", label: "Departing today" },
  { value: "next7", label: "Check-in in the next 7 days" },
  { value: "next30", label: "Check-in in the next 30 days" },
  { value: "last30", label: "Check-in in the last 30 days" },
  { value: "all", label: "All dates" },
  { value: "custom", label: "Custom check-in range" },
];
const PAGE_SIZE = 15;
const RECENT_DAYS = 7;
const d = formatStayDate;
const t = formatStayTime;
const TH = "h-10 px-5 text-[11px]";
const TD = "px-5 py-2.5";

function inDates(r: Reservation, preset: string, from: string, to: string) {
  switch (preset) {
    case "current":
      // Stays that have not ended yet, plus those that ended within the last week, so recent Checked Out stays stay reachable.
      return r.checkOut >= shift(TODAY_ISO, -RECENT_DAYS);
    case "today-in":
      return r.checkIn === TODAY_ISO;
    case "today-out":
      return r.checkOut === TODAY_ISO;
    case "next7":
      return r.checkIn >= TODAY_ISO && r.checkIn <= shift(TODAY_ISO, 7);
    case "next30":
      return r.checkIn >= TODAY_ISO && r.checkIn <= shift(TODAY_ISO, 30);
    case "last30":
      return r.checkIn >= shift(TODAY_ISO, -29) && r.checkIn <= TODAY_ISO;
    case "custom":
      return (!from || r.checkIn >= from) && (!to || r.checkIn <= to);
    default:
      return true;
  }
}

export function ReservationsView() {
  const router = useRouter();
  const { model: m, actions, openIntent } = useAppData();

  const [query, setQuery] = useState("");
  const [property, setProperty] = useState("all");
  const [source, setSource] = useState("all");
  const [status, setStatus] = useState<ReservationStatus | "all">("all");
  const [datePreset, setDatePreset] = useState("current");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [asc, setAsc] = useState(true);
  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ mode: "new"; roomId?: string; date?: string; guestId?: string } | { mode: "edit"; reservation: Reservation } | null>(null);
  const [cancelling, setCancelling] = useState<Reservation | null>(null);
  const [messaging, setMessaging] = useState<Reservation | null>(null);

  useIntent(["reservation", "new-reservation", "reservations"], (i) => {
    if (i.type === "reservation") setSelectedId(i.id);
    if (i.type === "new-reservation") setDialog({ mode: "new", roomId: i.roomId, date: i.date, guestId: i.guestId });
    if (i.type === "reservations") setProperty(i.propertyId);
  });

  const q = query.trim().toLowerCase();
  const rangeError = datePreset === "custom" && from && to && from > to ? "The start date must be on or before the end date." : null;

  // Everything except the status tab, so the tab counts reflect the other filters.
  const base = useMemo(() => {
    const list = m.reservations.filter((r) => {
      if (property !== "all" && r.propertyId !== property) return false;
      if (source !== "all" && r.source !== source) return false;
      if (rangeError) return false;
      if (!inDates(r, datePreset, from, to)) return false;
      if (!q) return true;
      const g = m.by.guest.get(r.guestId)!;
      const room = m.by.room.get(r.roomId)!;
      return [r.id, g.name, g.email, roomLabel(room), m.by.property.get(r.propertyId)?.name ?? ""].some((s) => s.toLowerCase().includes(q));
    });
    return list;
  }, [m, property, source, datePreset, from, to, q, rangeError]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: base.length, Confirmed: 0, Pending: 0, "Checked In": 0, "Checked Out": 0, Cancelled: 0 };
    base.forEach((r) => (c[r.status] += 1));
    return c;
  }, [base]);

  const rows = useMemo(() => {
    const filtered = status === "all" ? base : base.filter((r) => r.status === status);
    return [...filtered].sort((a, b) => (asc ? 1 : -1) * (a.checkIn.localeCompare(b.checkIn) || a.id.localeCompare(b.id)));
  }, [base, status, asc]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const selected = selectedId ? (m.by.reservation.get(selectedId) ?? null) : null;
  const filtersActive = q !== "" || property !== "all" || source !== "all" || status !== "all" || datePreset !== "current";

  const reset = () => {
    setQuery("");
    setProperty("all");
    setSource("all");
    setStatus("all");
    setDatePreset("current");
    setFrom("");
    setTo("");
    setPage(1);
  };
  const filter = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  const setStatusOf = (r: Reservation, s: "Checked In" | "Checked Out") => {
    actions.setReservationStatus(r.id, s);
    const g = m.by.guest.get(r.guestId)?.name;
    toast.success(s === "Checked In" ? `${g} checked in` : `${g} checked out`, { description: r.id });
  };

  const menu = (r: Reservation) => (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${r.id}`} />}>
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => setSelectedId(r.id)}>View details</DropdownMenuItem>
        <DropdownMenuItem disabled={r.status === "Cancelled"} onClick={() => setDialog({ mode: "edit", reservation: r })}>
          Edit reservation
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!(r.status === "Confirmed" && r.checkIn <= TODAY_ISO)} onClick={() => setStatusOf(r, "Checked In")}>
          Check in
        </DropdownMenuItem>
        <DropdownMenuItem disabled={r.status !== "Checked In"} onClick={() => setStatusOf(r, "Checked Out")}>
          Check out
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMessaging(r)}>Message guest</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={!(r.status === "Confirmed" || r.status === "Pending")} onClick={() => setCancelling(r)}>
          Cancel reservation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reservations"
        description="Every booking across your properties. Search, filter and act on stays from one list."
        actions={
          <Button variant="accent" onClick={() => setDialog({ mode: "new" })}>
            <Plus /> New reservation
          </Button>
        }
      />

      <div role="tablist" aria-label="Filter by status" className="-mx-1 flex gap-0.5 overflow-x-auto border-b border-border px-1">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={status === s}
            onClick={() => filter(setStatus)(s)}
            className={cn("-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2 text-[14px] font-medium leading-5 transition-colors", status === s ? "border-charcoal text-charcoal" : "border-transparent text-muted-foreground hover:text-charcoal")}
          >
            {s === "all" ? "All" : s}
            <span className={cn("tabular rounded-full px-1.5 text-[11px] font-medium leading-[18px]", status === s ? "bg-muted !text-charcoal" : "bg-muted/60 !text-muted-foreground")}>{counts[s]}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3" role="search" aria-label="Reservation filters">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative min-w-0 flex-1 basis-56 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => filter(setQuery)(e.target.value)}
              placeholder="Search ID, guest, unit or email"
              aria-label="Search reservations by ID, guest, unit or email"
              className="h-9.5 w-full rounded-lg border border-input bg-surface pl-9 pr-8 text-[13px] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button type="button" onClick={() => filter(setQuery)("")} aria-label="Clear search" className="absolute right-2 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:text-charcoal">
                <X className="size-3.5" aria-hidden />
              </button>
            )}
          </div>
          <SimpleSelect label="Property" value={property} onChange={filter(setProperty)} className={"w-full sm:w-48"} options={[{ value: "all", label: "All properties" }, ...m.properties.map((p) => ({ value: p.id, label: p.name }))]} />
          <SimpleSelect label="Booking source" value={source} onChange={filter(setSource)} className={"w-full sm:w-40"} options={SOURCES} />
          <SimpleSelect label="Dates" value={datePreset} onChange={filter(setDatePreset)} className={"w-full sm:w-60"} options={DATES} />
          {filtersActive && (
            <Button variant="ghost" onClick={reset} className="h-9.5">
              Clear filters
            </Button>
          )}
        </div>
        {datePreset === "custom" && (
          <div className="flex flex-wrap items-end gap-3">
            <label className="block w-[calc(50%-0.375rem)] sm:w-40">
              <span className="mb-1 block text-label">Check-in from</span>
              <input type="date" value={from} onChange={(e) => filter(setFrom)(e.target.value)} className="h-9.5 w-full rounded-lg border border-input bg-surface px-2.5 text-[13px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40" aria-invalid={!!rangeError} />
            </label>
            <label className="block w-[calc(50%-0.375rem)] sm:w-40">
              <span className="mb-1 block text-label">to</span>
              <input type="date" value={to} onChange={(e) => filter(setTo)(e.target.value)} className="h-9.5 w-full rounded-lg border border-input bg-surface px-2.5 text-[13px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40" aria-invalid={!!rangeError} />
            </label>
            {rangeError && (
              <p role="alert" className="pb-2 text-body text-brown-ink">
                {rangeError}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {rows.length === 0 ? (
          <EmptyState
            icon={CalendarSearch}
            title="No reservations match"
            description={rangeError ?? (filtersActive ? "Nothing fits these filters. Widen the date range or clear them." : "There are no reservations yet.")}
            action={
              filtersActive ? (
                <Button variant="outline" onClick={reset}>
                  Clear filters
                </Button>
              ) : (
                <Button variant="accent" onClick={() => setDialog({ mode: "new" })}>
                  <Plus /> New reservation
                </Button>
              )
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className={TH}>Reservation</TableHead>
                  <TableHead className={cn(TH, "hidden md:table-cell")}>Property / unit</TableHead>
                  <TableHead className={TH} aria-sort={asc ? "ascending" : "descending"}>
                    <button type="button" onClick={() => setAsc((v) => !v)} className="inline-flex min-h-6 items-center gap-1 uppercase tracking-[0.08em] hover:text-charcoal" aria-label={`Sort by check-in, currently ${asc ? "earliest" : "latest"} first`}>
                      Check-in {asc ? <ArrowUp className="size-3" aria-hidden /> : <ArrowDown className="size-3" aria-hidden />}
                    </button>
                  </TableHead>
                  <TableHead className={cn(TH, "hidden sm:table-cell")}>Check-out</TableHead>
                  <TableHead className={cn(TH, "hidden sm:table-cell")}>Status</TableHead>
                  <TableHead className={cn(TH, "hidden xl:table-cell")}>Payment</TableHead>
                  <TableHead className="h-10 w-12 px-2">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((r) => {
                  const g = m.by.guest.get(r.guestId)!;
                  const room = m.by.room.get(r.roomId)!;
                  const prop = m.by.property.get(r.propertyId)!;
                  return (
                    <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelectedId(r.id)}>
                      <TableCell className={TD}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(r.id);
                          }}
                          className="text-left"
                        >
                          <span className="block text-[13px] font-medium leading-5">{g.name}</span>
                          <span className="block text-[12px] leading-4 text-muted-foreground">
                            {r.id}
                            <span className="md:hidden">
                              {" · "}
                              {roomLabel(room)}
                            </span>
                            <span aria-hidden className="text-border-strong">
                              {" · "}
                            </span>
                            {r.source || "Source unavailable"}
                          </span>
                          <span className="mt-1.5 block sm:hidden">
                            <ReservationStatusBadge status={r.status} subtle />
                          </span>
                        </button>
                      </TableCell>
                      <TableCell className={cn(TD, "hidden md:table-cell")}>
                        <span className="block text-[13px] leading-5">{roomLabel(room)}</span>
                        <span className="block text-[12px] leading-4 text-muted-foreground">{prop.name}</span>
                      </TableCell>
                      <TableCell className={cn(TD, "tabular")}>
                        <span className="block text-[13px] font-medium leading-5">
                          <span className="sm:hidden">{format(parseISO(r.checkIn), "d MMM")}</span>
                          <span className="hidden sm:inline">{d(r.checkIn)}</span>
                        </span>
                        {t(r.checkInTime) && <span className="block text-[12px] leading-4 text-muted-foreground">{t(r.checkInTime)}</span>}
                        <span className="block text-[12px] leading-4 text-muted-foreground sm:hidden">to {format(parseISO(r.checkOut), "d MMM")}</span>
                      </TableCell>
                      <TableCell className={cn(TD, "tabular hidden sm:table-cell")}>
                        <span className="block text-[13px] font-medium leading-5">{d(r.checkOut)}</span>
                        {t(r.checkOutTime) && <span className="block text-[12px] leading-4 text-muted-foreground">{t(r.checkOutTime)}</span>}
                      </TableCell>
                      <TableCell className={cn(TD, "hidden sm:table-cell")}>
                        <ReservationStatusBadge status={r.status} subtle />
                      </TableCell>
                      <TableCell className={cn(TD, "hidden xl:table-cell")}>
                        <PaymentBadge status={r.paymentStatus} />
                      </TableCell>
                      <TableCell className="py-3 pl-0 pr-3" onClick={(e) => e.stopPropagation()}>
                        {menu(r)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Pagination page={current} pageSize={PAGE_SIZE} total={rows.length} onPage={setPage} noun="reservations" />
          </>
        )}
      </div>

      <ReservationDetails
        reservation={selected}
        onClose={() => setSelectedId(null)}
        onEdit={(r) => setDialog({ mode: "edit", reservation: r })}
        onCancel={setCancelling}
        onStatus={setStatusOf}
        onMessage={setMessaging}
        onOpenGuest={(id) => {
          openIntent({ type: "guest", id });
          router.push("/guests");
        }}
      />

      <ReservationDialog
        open={dialog !== null}
        onOpenChange={(o) => !o && setDialog(null)}
        reservation={dialog?.mode === "edit" ? dialog.reservation : undefined}
        preset={dialog?.mode === "new" ? { roomId: dialog.roomId, date: dialog.date, guestId: dialog.guestId } : undefined}
        onSaved={(r) => setSelectedId(r.id)}
      />
      <CancelDialog reservation={cancelling} onClose={() => setCancelling(null)} />
      <MessageDialog open={!!messaging} onOpenChange={(o) => !o && setMessaging(null)} guestId={messaging?.guestId ?? ""} reservationId={messaging?.id} />
    </div>
  );
}
