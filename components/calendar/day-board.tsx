"use client";

import { ArrowDownToLine, ArrowUpFromLine, BedDouble, Wrench } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Reservation, Room } from "@/types";
import { ReservationStatusBadge } from "@/components/shared/status-badges";
import { roomLabel } from "@/data/rooms";
import { TODAY_ISO, formatStayTime } from "@/lib/dates";
import { accessStatusFor, isLive, nightsOf, occupiesNight, type Model } from "@/lib/model";
import { cn } from "@/lib/utils";

function Column({ title, icon: Icon, count, children, empty }: { title: string; icon: typeof BedDouble; count: number; children: React.ReactNode; empty: string }) {
  return (
    <section className="min-w-0 rounded-2xl border border-border bg-surface shadow-card" aria-label={title}>
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h3 className="flex items-center gap-2 text-card-title">
          <Icon className="size-4 text-muted-foreground" aria-hidden /> {title}
        </h3>
        <span className="tabular rounded bg-muted px-1.5 text-label">{count}</span>
      </header>
      {count === 0 ? <p className="px-4 py-8 text-center text-body text-muted-foreground">{empty}</p> : <ul className="divide-y divide-border">{children}</ul>}
    </section>
  );
}

function Item({ m, r, time, onSelect, showAccess }: { m: Model; r: Reservation; time: string; onSelect: (id: string) => void; showAccess?: boolean }) {
  const guest = m.by.guest.get(r.guestId);
  const room = m.by.room.get(r.roomId)!;
  return (
    <li>
      <button type="button" onClick={() => onSelect(r.id)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-accent/40">
        <span className="tabular w-[4.5rem] shrink-0 text-label">{time}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-label">{guest?.name}</span>
          <span className="block truncate text-meta">
            {roomLabel(room)} · {m.by.property.get(r.propertyId)?.name}
            {showAccess && ` · access ${accessStatusFor(m, r).toLowerCase()}`}
          </span>
        </span>
        <ReservationStatusBadge status={r.status} />
      </button>
    </li>
  );
}

export function DayBoard({ m, date, rooms, showCancelled, onSelect, onCreate }: { m: Model; date: string; rooms: Room[]; showCancelled: boolean; onSelect: (id: string) => void; onCreate: (roomId: string, date: string) => void }) {
  const ids = new Set(rooms.map((r) => r.id));
  const all = m.reservations.filter((r) => ids.has(r.roomId) && (showCancelled || isLive(r)));
  const arrivals = all.filter((r) => r.checkIn === date && isLive(r)).sort((a, b) => a.checkInTime.localeCompare(b.checkInTime));
  const departures = all.filter((r) => r.checkOut === date && isLive(r)).sort((a, b) => a.checkOutTime.localeCompare(b.checkOutTime));
  const stayovers = all.filter((r) => occupiesNight(r, date) && r.checkIn < date);
  const busy = new Set(all.filter((r) => isLive(r) && (occupiesNight(r, date) || r.checkIn === date)).map((r) => r.roomId));
  const vacant = rooms.filter((r) => r.status === "Active" && !busy.has(r.id));
  const maintenance = rooms.filter((r) => r.status === "Maintenance");
  const sellable = rooms.filter((r) => r.status === "Active").length;
  const occupied = sellable - vacant.length;
  const past = date < TODAY_ISO;

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-2 divide-x divide-y divide-border rounded-2xl border border-border bg-surface shadow-card sm:grid-cols-5 sm:divide-y-0">
        {[
          ["Occupied", `${occupied} / ${sellable}`],
          ["Arriving", arrivals.length],
          ["Departing", departures.length],
          ["Staying over", stayovers.length],
          ["Vacant", vacant.length],
        ].map(([k, v]) => (
          <div key={k as string} className="px-4 py-3">
            <dt className="text-eyebrow">{k}</dt>
            <dd className="tabular mt-1 text-[1.5rem] font-semibold leading-8">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-5 xl:grid-cols-3">
        <Column title="Arrivals" icon={ArrowDownToLine} count={arrivals.length} empty="No arrivals on this day.">
          {arrivals.map((r) => (
            <Item key={r.id} m={m} r={r} time={formatStayTime(r.checkInTime) ?? "—"} onSelect={onSelect} showAccess={!past} />
          ))}
        </Column>
        <Column title="Staying over" icon={BedDouble} count={stayovers.length} empty="Nobody is staying over.">
          {stayovers.map((r) => (
            <Item key={r.id} m={m} r={r} time={`${nightsOf(r)}n`} onSelect={onSelect} />
          ))}
        </Column>
        <Column title="Departures" icon={ArrowUpFromLine} count={departures.length} empty="No departures on this day.">
          {departures.map((r) => (
            <Item key={r.id} m={m} r={r} time={formatStayTime(r.checkOutTime) ?? "—"} onSelect={onSelect} />
          ))}
        </Column>
      </div>

      <section aria-label="Vacant units" className="rounded-2xl border border-border bg-surface p-4 shadow-card">
        <h3 className="flex items-center gap-2 text-card-title">
          <BedDouble className="size-4 text-muted-foreground" aria-hidden /> Vacant on {format(parseISO(date), "EEEE d MMM")}
          <span className="tabular rounded bg-muted px-1.5 text-label">{vacant.length}</span>
        </h3>
        {vacant.length === 0 ? (
          <p className="mt-2 text-body text-muted-foreground">Every unit is taken.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {vacant.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  disabled={past}
                  onClick={() => onCreate(r.id, date)}
                  title={past ? "Past dates cannot be booked" : `Book ${roomLabel(r)} from ${date}`}
                  className={cn("rounded-lg border border-border-strong bg-mint/40 px-2.5 py-1.5 text-label transition-colors", past ? "cursor-not-allowed opacity-60" : "hover:bg-mint")}
                >
                  {roomLabel(r)}
                  <span className="ml-1.5 text-meta">{m.by.property.get(r.propertyId)?.code}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {maintenance.length > 0 && (
          <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-3 text-body text-muted-foreground">
            <Wrench className="size-4" aria-hidden /> In maintenance: {maintenance.map((r) => roomLabel(r)).join(", ")}
          </p>
        )}
      </section>
    </div>
  );
}
