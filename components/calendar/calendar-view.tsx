"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, addMonths, eachDayOfInterval, endOfMonth, format, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Reservation } from "@/types";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { MessageDialog } from "@/components/guests/message-dialog";
import { CancelDialog } from "@/components/reservations/cancel-dialog";
import { ReservationDetails } from "@/components/reservations/reservation-details";
import { ReservationDialog } from "@/components/reservations/reservation-dialog";
import { SegmentedControl } from "@/components/shared/segmented-control";
import { SimpleSelect } from "@/components/shared/simple-select";
import { useAppData } from "@/hooks/use-app-data";
import { roomLabel } from "@/data/rooms";
import { TODAY_ISO, iso } from "@/lib/dates";
import { isLive } from "@/lib/model";
import { cn } from "@/lib/utils";
import { DayBoard } from "./day-board";
import { Timeline, barStyle, statusIcon } from "./timeline";

type View = "day" | "week" | "month";
const LEGEND = ["Confirmed", "Pending", "Checked In", "Checked Out"] as const;

export function CalendarView() {
  const router = useRouter();
  const { model: m, actions, openIntent } = useAppData();

  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState(TODAY_ISO);
  const [property, setProperty] = useState("all");
  const [unit, setUnit] = useState("all");
  const [showCancelled, setShowCancelled] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ mode: "new"; roomId?: string; date?: string } | { mode: "edit"; reservation: Reservation } | null>(null);
  const [cancelling, setCancelling] = useState<Reservation | null>(null);
  const [messaging, setMessaging] = useState<Reservation | null>(null);

  const anchorDate = parseISO(anchor);
  const days = useMemo(() => {
    if (view === "day") return [anchor];
    if (view === "week") {
      const start = startOfWeek(anchorDate, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => iso(addDays(start, i)));
    }
    return eachDayOfInterval({ start: startOfMonth(anchorDate), end: endOfMonth(anchorDate) }).map(iso);
  }, [view, anchor, anchorDate]);

  const visibleProperties = m.properties.filter((p) => p.status === "Active");
  const propertyIds = new Set(visibleProperties.map((p) => p.id));
  const propertyRooms = m.rooms.filter((r) => propertyIds.has(r.propertyId) && (property === "all" || r.propertyId === property));
  const unitOptions = [{ value: "all", label: property === "all" ? "All units" : "All units in property" }, ...propertyRooms.filter(() => property !== "all").map((r) => ({ value: r.id, label: `${roomLabel(r)} · ${r.type}` }))];
  const safeUnit = unitOptions.some((o) => o.value === unit) ? unit : "all";
  const rooms = propertyRooms.filter((r) => safeUnit === "all" || r.id === safeUnit);

  const inRange = useMemo(() => {
    const ids = new Set(rooms.map((r) => r.id));
    return m.reservations.filter((r) => ids.has(r.roomId) && r.checkIn <= days[days.length - 1] && r.checkOut >= days[0] && (showCancelled || isLive(r)));
  }, [m.reservations, rooms, days, showCancelled]);
  const legendCounts = useMemo(() => {
    const c: Record<string, number> = {};
    inRange.forEach((r) => (c[r.status] = (c[r.status] ?? 0) + 1));
    return c;
  }, [inRange]);

  const move = (dir: -1 | 1) =>
    setAnchor(iso(view === "month" ? addMonths(anchorDate, dir) : addDays(anchorDate, dir * (view === "week" ? 7 : 1))));

  const label =
    view === "day"
      ? format(anchorDate, "EEEE d MMMM yyyy")
      : view === "week"
        ? `${format(parseISO(days[0]), "d MMM")} – ${format(parseISO(days[6]), "d MMM yyyy")}`
        : format(anchorDate, "MMMM yyyy");

  const create = (roomId?: string, date?: string) => {
    if (date && date < TODAY_ISO) {
      toast.info("Past dates can't be booked", { description: "Choose today or a later date." });
      return;
    }
    setDialog({ mode: "new", roomId, date });
  };

  const selected = selectedId ? (m.by.reservation.get(selectedId) ?? null) : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Calendar"
        description="Every stay on one timeline. Click a booking to open it, or an empty day to book that unit."
        actions={
          <Button variant="accent" onClick={() => create()}>
            <Plus /> New reservation
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1" role="group" aria-label="Navigate dates">
          <Button variant="outline" size="icon" onClick={() => move(-1)} aria-label={`Previous ${view}`}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" onClick={() => setAnchor(TODAY_ISO)} disabled={days.includes(TODAY_ISO) && anchor === TODAY_ISO}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => move(1)} aria-label={`Next ${view}`}>
            <ChevronRight />
          </Button>
        </div>
        <h2 className="tabular min-w-0 text-section" aria-live="polite">
          {label}
        </h2>
        <div className="ml-auto flex flex-wrap items-center gap-2 sm:gap-3">
          <SimpleSelect label="Property" value={property} onChange={(v) => { setProperty(v); setUnit("all"); }} className="w-full sm:w-48" options={[{ value: "all", label: "All properties" }, ...visibleProperties.map((p) => ({ value: p.id, label: p.name }))]} />
          <SimpleSelect label="Unit" value={safeUnit} onChange={setUnit} className="w-[calc(50%-0.25rem)] sm:w-48" options={unitOptions} disabled={property === "all"} />
          <SegmentedControl
            label="Calendar view"
            value={view}
            onChange={setView}
            options={[
              { value: "day", label: "Day" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
            ]}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-body" aria-label="Legend">
        {LEGEND.map((s) => (
          <span key={s} className="inline-flex items-center gap-2">
            <span aria-hidden className={cn("inline-flex h-4 w-7 items-center justify-center rounded-sm border", barStyle[s])}>{(() => { const I = statusIcon[s]; return <I className="size-3" />; })()}</span> {s}
            <span className="tabular text-meta">{legendCounts[s] ?? 0}</span>
          </span>
        ))}
        <label className="ml-auto inline-flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} className="size-4 accent-[var(--olive-deep)]" />
          Show cancelled
        </label>
      </div>

      {view === "day" ? (
        <DayBoard m={m} date={anchor} rooms={rooms} showCancelled={showCancelled} onSelect={setSelectedId} onCreate={create} />
      ) : rooms.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border-strong px-6 py-14 text-center text-body text-muted-foreground">No units to show for this selection.</p>
      ) : (
        <>
          {inRange.length === 0 && (
            <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border-strong bg-surface px-5 py-4">
              <p className="text-body text-muted-foreground">
                <span className="text-label !text-charcoal">No bookings in this period.</span> Every unit shown is free from {format(parseISO(days[0]), "d MMM")} to {format(parseISO(days[days.length - 1]), "d MMM yyyy")}.
              </p>
              <Button variant="outline" size="sm" onClick={() => create(undefined, days[0] < TODAY_ISO ? TODAY_ISO : days[0])}>
                <Plus /> New reservation
              </Button>
            </div>
          )}
          <p className="text-meta">Keyboard: focus the timeline, then use the arrow keys to move between units and days. Enter opens a booking, or starts a new one on a free day.</p>
        <Timeline m={m} days={days} rooms={rooms} showCancelled={showCancelled} dayWidth={view === "week" ? 104 : 50} onSelect={setSelectedId} onCreate={create} />
        </>
      )}

      <ReservationDetails
        reservation={selected}
        onClose={() => setSelectedId(null)}
        onEdit={(r) => setDialog({ mode: "edit", reservation: r })}
        onCancel={setCancelling}
        onStatus={(r, s) => {
          actions.setReservationStatus(r.id, s);
          toast.success(s === "Checked In" ? "Guest checked in" : "Guest checked out", { description: r.id });
        }}
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
        preset={dialog?.mode === "new" ? { roomId: dialog.roomId, date: dialog.date } : undefined}
        onSaved={(r) => {
          setSelectedId(r.id);
          if (r.checkIn < days[0] || r.checkIn > days[days.length - 1]) setAnchor(r.checkIn);
        }}
      />
      <CancelDialog reservation={cancelling} onClose={() => setCancelling(null)} />
      <MessageDialog open={!!messaging} onOpenChange={(o) => !o && setMessaging(null)} guestId={messaging?.guestId ?? ""} reservationId={messaging?.id} />
    </div>
  );
}

