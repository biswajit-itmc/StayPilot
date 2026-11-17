"use client";

import { BatteryLow, CalendarPlus, Pencil, Users, Wifi, WifiOff, Wrench } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Room } from "@/types";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { ReservationStatusBadge, RoomStateBadge } from "@/components/shared/status-badges";
import { useAppData } from "@/hooks/use-app-data";
import { roomLabel } from "@/data/rooms";
import { TODAY_ISO, timeAgo } from "@/lib/dates";
import { currentStay, isLive, nextReservation, roomState } from "@/lib/model";

export function RoomDetails({
  room,
  onClose,
  onEdit,
  onToggleMaintenance,
  onNewReservation,
  onOpenReservation,
}: {
  room: Room | null;
  onClose: () => void;
  onEdit: (r: Room) => void;
  onToggleMaintenance: (r: Room) => void;
  onNewReservation: (r: Room) => void;
  onOpenReservation: (id: string) => void;
}) {
  const { model: m } = useAppData();
  const property = room ? m.by.property.get(room.propertyId) : undefined;
  const lock = room ? m.by.lockByRoom.get(room.id) : undefined;
  const stay = room ? currentStay(m, room.id) : undefined;
  const upcoming = room ? (m.by.reservationsByRoom.get(room.id) ?? []).filter((r) => isLive(r) && r.checkIn >= TODAY_ISO && r.status !== "Checked Out").slice(0, 6) : [];
  const next = room ? nextReservation(m, room.id) : undefined;
  const past = room ? (m.by.reservationsByRoom.get(room.id) ?? []).filter((r) => r.status === "Checked Out").length : 0;

  return (
    <Sheet open={!!room} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
        {room && (
          <div className="space-y-6 p-6">
            <header className="pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="text-page-title">{roomLabel(room)}</SheetTitle>
                <RoomStateBadge state={roomState(m, room)} />
              </div>
              <SheetDescription className="mt-1">
                {room.type} · {property?.name}
              </SheetDescription>
            </header>

            <dl className="grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-surface">
              <div className="px-3 py-3">
                <dt className="text-meta">Capacity</dt>
                <dd className="tabular mt-0.5 flex items-center gap-1 text-section">
                  <Users className="size-4 text-muted-foreground" aria-hidden /> {room.capacity}
                </dd>
              </div>
              <div className="px-3 py-3">
                <dt className="text-meta">Nightly rate</dt>
                <dd className="tabular mt-0.5 text-section">€{room.nightlyRate}</dd>
              </div>
              <div className="px-3 py-3">
                <dt className="text-meta">Stays to date</dt>
                <dd className="tabular mt-0.5 text-section">{past}</dd>
              </div>
            </dl>

            {room.notes && <p className="rounded-lg bg-muted p-3 text-body">{room.notes}</p>}

            <section aria-labelledby="rd-lock">
              <h3 id="rd-lock" className="text-card-title">
                Smart lock
              </h3>
              {lock ? (
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                  {lock.status === "Online" ? <Wifi className="size-4 text-olive-deep" aria-hidden /> : <WifiOff className="size-4 text-brown-ink" aria-hidden />}
                  <div className="min-w-0 flex-1">
                    <p className="text-label">{lock.id}</p>
                    <p className="text-meta">
                      {lock.status === "Online" ? "Online" : "Offline"} · last seen {timeAgo(lock.lastSeen)}
                    </p>
                  </div>
                  <span className="tabular inline-flex items-center gap-1 text-label">
                    {lock.battery < 20 && <BatteryLow className="size-4 text-brown-ink" aria-hidden />}
                    {lock.battery}%
                    <span className="sr-only"> battery</span>
                  </span>
                </div>
              ) : (
                <p className="mt-2 text-body text-muted-foreground">No smart lock assigned to this unit.</p>
              )}
            </section>

            <section aria-labelledby="rd-stay">
              <h3 id="rd-stay" className="text-card-title">
                {stay ? "In the unit now" : "Next reservation"}
              </h3>
              {stay || next ? (
                <ul className="mt-2 divide-y divide-border border-y border-border">
                  {[stay ?? next].filter(Boolean).map((r) => (
                    <li key={r!.id}>
                      <button type="button" onClick={() => onOpenReservation(r!.id)} className="flex w-full items-center justify-between gap-3 py-2.5 text-left hover:bg-accent/40">
                        <span className="min-w-0">
                          <span className="block truncate text-label">{m.by.guest.get(r!.guestId)?.name}</span>
                          <span className="tabular text-meta">
                            {format(parseISO(r!.checkIn), "d MMM")} – {format(parseISO(r!.checkOut), "d MMM")}
                          </span>
                        </span>
                        <ReservationStatusBadge status={r!.status} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-body text-muted-foreground">Nothing booked yet. The unit is free.</p>
              )}
            </section>

            {upcoming.length > 1 && (
              <section aria-labelledby="rd-up">
                <h3 id="rd-up" className="text-card-title">
                  Coming up
                </h3>
                <ul className="mt-2 divide-y divide-border border-y border-border">
                  {upcoming.map((r) => (
                    <li key={r.id}>
                      <button type="button" onClick={() => onOpenReservation(r.id)} className="flex w-full items-center justify-between gap-3 py-2 text-left hover:bg-accent/40">
                        <span className="tabular text-body">
                          {format(parseISO(r.checkIn), "d MMM")} – {format(parseISO(r.checkOut), "d MMM")}
                        </span>
                        <span className="min-w-0 truncate text-meta">{m.by.guest.get(r.guestId)?.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="flex flex-wrap gap-2 border-t border-border pt-5">
              <Button onClick={() => onNewReservation(room)} disabled={room.status === "Maintenance" || property?.status !== "Active"}>
                <CalendarPlus /> New reservation
              </Button>
              <Button variant="outline" onClick={() => onEdit(room)}>
                <Pencil /> Edit
              </Button>
              <Button variant="outline" onClick={() => onToggleMaintenance(room)}>
                <Wrench /> {room.status === "Maintenance" ? "Return to service" : "Mark maintenance"}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
