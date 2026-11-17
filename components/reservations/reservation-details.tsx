"use client";

import { CalendarX2, LogIn, LogOut, MessageSquare, Pencil, UserRound } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Reservation } from "@/types";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { PaymentBadge, ReservationStatusBadge } from "@/components/shared/status-badges";
import { useAppData } from "@/hooks/use-app-data";
import { roomLabel } from "@/data/rooms";
import { TODAY_ISO } from "@/lib/dates";
import { accessStatusFor, nightsOf } from "@/lib/model";

const d = (s: string) => format(parseISO(s), "EEE d MMM yyyy");

export function ReservationDetails({
  reservation,
  onClose,
  onEdit,
  onCancel,
  onStatus,
  onMessage,
  onOpenGuest,
}: {
  reservation: Reservation | null;
  onClose: () => void;
  onEdit: (r: Reservation) => void;
  onCancel: (r: Reservation) => void;
  onStatus: (r: Reservation, status: "Checked In" | "Checked Out") => void;
  onMessage: (r: Reservation) => void;
  onOpenGuest: (guestId: string) => void;
}) {
  const { model: m } = useAppData();
  const r = reservation;
  const guest = r ? m.by.guest.get(r.guestId) : undefined;
  const room = r ? m.by.room.get(r.roomId) : undefined;
  const property = r ? m.by.property.get(r.propertyId) : undefined;
  const lock = r ? m.by.lockByRoom.get(r.roomId) : undefined;
  const task = r ? m.by.taskByReservation.get(r.id) : undefined;
  const nights = r ? nightsOf(r) : 0;

  const timeline = r
    ? [
        { at: r.createdAt, text: `Booked via ${r.source}` },
        r.instructionsSent && r.status !== "Cancelled" ? { at: r.checkIn, text: "Check-in instructions sent" } : null,
        r.status === "Checked In" || r.status === "Checked Out" ? { at: r.checkIn, text: `Checked in at ${r.checkInTime}` } : null,
        r.status === "Checked Out" ? { at: r.checkOut, text: `Checked out at ${r.checkOutTime}` } : null,
        r.cancelledAt ? { at: r.cancelledAt, text: "Cancelled" } : null,
      ].filter(Boolean) as { at: string; text: string }[]
    : [];

  const canCheckIn = r && r.status === "Confirmed" && r.checkIn <= TODAY_ISO;
  const canCheckOut = r && r.status === "Checked In";
  const canCancel = r && (r.status === "Confirmed" || r.status === "Pending");
  const canEdit = r && r.status !== "Cancelled";

  return (
    <Sheet open={!!r} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
        {r && (
          <div className="space-y-6 p-6">
            <header className="pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="text-page-title">{r.id}</SheetTitle>
                <ReservationStatusBadge status={r.status} />
              </div>
              <SheetDescription className="mt-1">
                {property?.name} · {room ? roomLabel(room) : r.roomId} · {nights} {nights === 1 ? "night" : "nights"}
              </SheetDescription>
            </header>

            <section aria-labelledby="rs-guest" className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 id="rs-guest" className="text-card-title">
                    {guest?.name}
                  </h3>
                  <p className="text-meta">{guest?.email}</p>
                  <p className="text-meta">{guest?.phone}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => guest && onOpenGuest(guest.id)}>
                  <UserRound /> Profile
                </Button>
              </div>
            </section>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                ["Check-in", `${d(r.checkIn)} · ${r.checkInTime}`],
                ["Check-out", `${d(r.checkOut)} · ${r.checkOutTime}`],
                ["Guests", `${r.adults}`],
                ["Source", r.source],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-meta">{k}</dt>
                  <dd className="text-body">{v}</dd>
                </div>
              ))}
            </dl>

            <dl className="grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-surface">
              <div className="px-3 py-3">
                <dt className="text-meta">Total</dt>
                <dd className="tabular mt-0.5 text-section">€{r.total.toLocaleString("en-GB")}</dd>
              </div>
              <div className="px-3 py-3">
                <dt className="text-meta">Per night</dt>
                <dd className="tabular mt-0.5 text-section">€{nights ? Math.round(r.total / nights) : 0}</dd>
              </div>
              <div className="px-3 py-3">
                <dt className="text-meta">Payment</dt>
                <dd className="mt-1">
                  <PaymentBadge status={r.paymentStatus} />
                </dd>
              </div>
            </dl>

            <section aria-labelledby="rs-access">
              <h3 id="rs-access" className="text-card-title">
                Smart access
              </h3>
              <p className="mt-1 text-body text-muted-foreground">
                {r.status === "Cancelled"
                  ? "No access is planned for a cancelled stay."
                  : r.status === "Checked Out"
                    ? `Access window closed after check-out${lock ? ` · ${lock.id}` : ""}`
                    : r.status === "Checked In"
                      ? `Guest is in house${lock ? ` · ${lock.id} ${lock.status.toLowerCase()}` : " · no lock on this unit"}`
                      : `${accessStatusFor(m, r)}${task ? ` · task ${task.status.toLowerCase()}` : " · no task yet"}${lock ? ` · ${lock.id} ${lock.status.toLowerCase()}` : " · no lock on this unit"}`}
              </p>
            </section>

            {r.notes && (
              <section aria-labelledby="rs-notes">
                <h3 id="rs-notes" className="text-card-title">
                  Notes
                </h3>
                <p className="mt-1 rounded-lg bg-muted p-3 text-body">{r.notes}</p>
              </section>
            )}

            <section aria-labelledby="rs-time">
              <h3 id="rs-time" className="text-card-title">
                Timeline
              </h3>
              <ol className="mt-2 space-y-2 border-l border-border pl-4">
                {timeline.map((t, i) => (
                  <li key={i} className="relative text-body">
                    <span aria-hidden className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-charcoal" />
                    {t.text} <span className="text-meta">· {format(parseISO(t.at), "d MMM yyyy")}</span>
                  </li>
                ))}
              </ol>
            </section>

            <div className="flex flex-wrap gap-2 border-t border-border pt-5">
              {canCheckIn && (
                <Button variant="accent" onClick={() => onStatus(r, "Checked In")}>
                  <LogIn /> Check in
                </Button>
              )}
              {canCheckOut && (
                <Button variant="accent" onClick={() => onStatus(r, "Checked Out")}>
                  <LogOut /> Check out
                </Button>
              )}
              {canEdit && (
                <Button variant="outline" onClick={() => onEdit(r)}>
                  <Pencil /> Edit
                </Button>
              )}
              <Button variant="outline" onClick={() => onMessage(r)}>
                <MessageSquare /> Message guest
              </Button>
              {canCancel && (
                <Button variant="outline" onClick={() => onCancel(r)} className="text-brown-ink">
                  <CalendarX2 /> Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
