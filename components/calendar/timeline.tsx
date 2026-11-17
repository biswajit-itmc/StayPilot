"use client";

import { Fragment, useEffect, useId, useRef, useState } from "react";
import { format, isWeekend, parseISO } from "date-fns";
import { Check, Clock, LogIn, LogOut, X, type LucideIcon } from "lucide-react";
import type { Reservation, ReservationStatus, Room } from "@/types";
import { roomLabel } from "@/data/rooms";
import { TODAY_ISO, daysBetween } from "@/lib/dates";
import { isLive, nightsOf, occupiesNight, type Model } from "@/lib/model";
import { cn } from "@/lib/utils";

export const barStyle: Record<ReservationStatus, string> = {
  Confirmed: "bg-sage text-charcoal border-olive-deep/50",
  Pending: "bg-lime/55 text-charcoal border-dashed border-charcoal/60",
  "Checked In": "bg-charcoal text-background border-charcoal",
  "Checked Out": "bg-muted text-muted-foreground border-border-strong",
  Cancelled: "bg-transparent text-brown-ink border-dashed border-brown-ink/60 line-through",
};

/** A glyph per status so the states stay distinguishable without colour. */
export const statusIcon: Record<ReservationStatus, LucideIcon> = {
  Confirmed: Check,
  Pending: Clock,
  "Checked In": LogIn,
  "Checked Out": LogOut,
  Cancelled: X,
};


function geometry(r: Reservation, start: string, n: number) {
  const inIdx = daysBetween(start, r.checkIn);
  const outIdx = daysBetween(start, r.checkOut);
  if (inIdx > n - 1 || outIdx < 0) return null;
  const from = Math.max(inIdx + 0.5, 0);
  const to = Math.min(outIdx + 0.5, n);
  return { left: (from / n) * 100, width: ((to - from) / n) * 100, clipL: inIdx + 0.5 < 0, clipR: outIdx + 0.5 > n };
}

export function Timeline({
  m,
  days,
  rooms,
  showCancelled,
  dayWidth,
  onSelect,
  onCreate,
}: {
  m: Model;
  days: string[];
  rooms: Room[];
  showCancelled: boolean;
  dayWidth: number;
  onSelect: (id: string) => void;
  onCreate: (roomId: string, date: string) => void;
}) {
  const n = days.length;
  const helpId = useId();
  const sellable = rooms.filter((r) => r.status === "Active").length;
  const todayIdx = days.indexOf(TODAY_ISO);
  const groups = m.properties.map((p) => ({ property: p, rooms: rooms.filter((r) => r.propertyId === p.id) })).filter((g) => g.rooms.length > 0);
  const flat = groups.flatMap((g) => g.rooms);
  const areaMin = n * dayWidth;

  // Keyboard model: the whole timeline is one tab stop. Arrow keys move a cursor over (unit, day).
  const [cursor, setCursor] = useState<{ row: number; col: number }>({ row: 0, col: Math.max(0, todayIdx) });
  const [focused, setFocused] = useState(false);
  const cursorRef = useRef<HTMLSpanElement | null>(null);
  const row = Math.min(cursor.row, flat.length - 1);
  const col = Math.min(cursor.col, n - 1);

  useEffect(() => {
    if (focused) cursorRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [focused, row, col]);

  const bookingAt = (room: Room, date: string) =>
    (m.by.reservationsByRoom.get(room.id) ?? []).find((r) => (showCancelled || isLive(r)) && r.checkIn <= date && date < r.checkOut);

  const describeCell = () => {
    const room = flat[row];
    if (!room) return "";
    const date = days[col];
    const label = `${roomLabel(room)}, ${format(parseISO(date), "EEEE d MMMM")}`;
    const b = bookingAt(room, date);
    if (b) return `${label}: ${b.id}, ${m.by.guest.get(b.guestId)?.name}, ${b.status}, ${nightsOf(b)} nights. Press Enter to open.`;
    if (room.status === "Maintenance") return `${label}: unit in maintenance, not bookable.`;
    if (date < TODAY_ISO) return `${label}: free, in the past.`;
    return `${label}: free. Press Enter to create a reservation.`;
  };

  const activate = () => {
    const room = flat[row];
    if (!room) return;
    const date = days[col];
    const b = bookingAt(room, date);
    if (b) onSelect(b.id);
    else if (room.status === "Active" && date >= TODAY_ISO) onCreate(room.id, date);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const onBar = e.target !== e.currentTarget;
    // On a booking bar Enter and Space keep their native "click" behaviour.
    if (onBar && (e.key === "Enter" || e.key === " ")) return;
    const move = (dr: number, dc: number) => {
      e.preventDefault();
      if (onBar) (e.currentTarget as HTMLElement).focus();
      setCursor({ row: Math.max(0, Math.min(flat.length - 1, row + dr)), col: Math.max(0, Math.min(n - 1, col + dc)) });
    };
    switch (e.key) {
      case "ArrowRight": return move(0, 1);
      case "ArrowLeft": return move(0, -1);
      case "ArrowDown": return move(1, 0);
      case "ArrowUp": return move(-1, 0);
      case "PageDown": return move(8, 0);
      case "PageUp": return move(-8, 0);
      case "Home": return move(0, -col);
      case "End": return move(0, n - 1 - col);
      case "Enter":
      case " ":
        e.preventDefault();
        return activate();
    }
  };

  const dayStats = days.map((d) => {
    const live = rooms.flatMap((r) => (m.by.reservationsByRoom.get(r.id) ?? []).filter((x) => isLive(x) && (x.checkIn === d || x.checkOut === d || occupiesNight(x, d))));
    return { occupied: live.filter((x) => occupiesNight(x, d)).length, arrivals: live.filter((x) => x.checkIn === d).length, departures: live.filter((x) => x.checkOut === d).length };
  });

  return (
    <div
      className="max-h-[calc(100vh-15rem)] min-h-72 overflow-auto rounded-2xl border border-border bg-surface shadow-card outline-none focus-visible:ring-3 focus-visible:ring-charcoal"
      role="application"
      aria-label="Reservation timeline"
      aria-describedby={helpId}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
    >
      <p id={helpId} className="sr-only">
        Use the arrow keys to move between units and days, Home and End to jump to the first or last day, and Enter to open a booking or create one on a free day.
      </p>
      <p className="sr-only" aria-live="polite">
        {focused ? describeCell() : ""}
      </p>
      <div className="[--label-w:112px] sm:[--label-w:176px]" style={{ minWidth: `calc(var(--label-w) + ${areaMin}px)` }}>
        {/* Header */}
        <div className="sticky top-0 z-30 flex border-b border-border bg-surface">
          <div className="sticky left-0 z-40 flex shrink-0 items-end bg-surface px-3 pb-2 text-eyebrow sm:px-4" style={{ width: "var(--label-w)" }}>
            Unit
          </div>
          <div className="relative flex-1">
            <div className="flex">
              {days.map((d, i) => {
                const date = parseISO(d);
                const isToday = d === TODAY_ISO;
                return (
                  <div key={d} className={cn("flex-1 border-l border-border px-0.5 py-1.5 text-center", isToday && "bg-accent", isWeekend(date) && !isToday && "bg-muted/60")} style={{ minWidth: dayWidth }} aria-current={isToday ? "date" : undefined}>
                    <p className="text-meta">{format(date, dayWidth < 60 ? "EEEEE" : "EEE")}</p>
                    <p className={cn("tabular text-label", isToday && "font-semibold")}>{format(date, "d")}</p>
                    {dayWidth >= 60 ? (
                      <p className="tabular text-[11px] leading-4 text-muted-foreground">
                        {sellable ? Math.round((dayStats[i].occupied / sellable) * 100) : 0}% · ↓{dayStats[i].arrivals} ↑{dayStats[i].departures}
                      </p>
                    ) : (
                      <p className="tabular text-[10px] leading-4 text-muted-foreground">{sellable ? Math.round((dayStats[i].occupied / sellable) * 100) : 0}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="relative">
          {groups.map((g) => (
            <Fragment key={g.property.id}>
              <div className="flex border-b border-border bg-muted/70">
                <div className="sticky left-0 z-20 shrink-0 bg-muted px-3 py-1.5 sm:px-4" style={{ width: "var(--label-w)" }}>
                  <span className="block truncate text-label">{g.property.name}</span>
                </div>
                <div className="flex-1 px-3 py-1.5 text-meta">{g.rooms.length} units</div>
              </div>
              {g.rooms.map((room) => {
                const rowIdx = flat.indexOf(room);
                const list = (m.by.reservationsByRoom.get(room.id) ?? []).filter((r) => showCancelled || r.status !== "Cancelled");
                return (
                  <div key={room.id} className="flex border-b border-border">
                    <div className="sticky left-0 z-20 shrink-0 bg-surface px-3 py-2 sm:px-4" style={{ width: "var(--label-w)" }}>
                      <span className="block truncate text-label">{roomLabel(room)}</span>
                      <span className="block truncate text-[11px] leading-4 text-muted-foreground">{room.type}</span>
                    </div>
                    <div
                      className={cn("relative h-12 flex-1", room.status === "Active" && "cursor-cell")}
                      style={{ backgroundImage: "linear-gradient(to right, var(--border) 1px, transparent 1px)", backgroundSize: `${100 / n}% 100%` }}
                      role="presentation"
                      onClick={(e) => {
                        if (room.status !== "Active") return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const idx = Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * n)));
                        setCursor({ row: rowIdx, col: idx });
                        onCreate(room.id, days[idx]);
                      }}
                    >
                      {days.map((d, i) =>
                        d === TODAY_ISO || isWeekend(parseISO(d)) ? (
                          <span key={d} aria-hidden className={cn("pointer-events-none absolute inset-y-0", d === TODAY_ISO ? "bg-accent/70" : "bg-muted/50")} style={{ left: `${(i / n) * 100}%`, width: `${100 / n}%` }} />
                        ) : null
                      )}
                      {room.status === "Maintenance" && (
                        <span className="pointer-events-none absolute inset-x-0 inset-y-1.5 flex items-center rounded-md border border-brown-ink/40 bg-brown/10 px-3 text-meta !text-brown-ink" style={{ backgroundImage: "repeating-linear-gradient(135deg, transparent 0 6px, rgb(154 107 83 / 0.14) 6px 12px)" }}>
                          Maintenance · not bookable
                        </span>
                      )}
                      {list.map((r) => {
                        const geo = geometry(r, days[0], n);
                        if (!geo) return null;
                        const guest = m.by.guest.get(r.guestId)?.name ?? r.guestId;
                        const Icon = statusIcon[r.status];
                        return (
                          <button
                            key={r.id}
                            type="button"
                            tabIndex={-1}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCursor({ row: rowIdx, col: Math.max(0, Math.min(n - 1, daysBetween(days[0], r.checkIn < days[0] ? days[0] : r.checkIn))) });
                              onSelect(r.id);
                            }}
                            title={`${r.id} · ${guest} · ${r.checkIn} to ${r.checkOut} · ${r.status}`}
                            aria-label={`${r.id}, ${guest}, ${r.checkIn} to ${r.checkOut}, ${nightsOf(r)} nights, ${r.status}`}
                            className={cn(
                              "absolute inset-y-1.5 flex min-w-0 items-center gap-1 overflow-hidden whitespace-nowrap border px-1.5 text-left text-label transition-[filter] hover:brightness-95",
                              barStyle[r.status],
                              geo.clipL ? "rounded-l-none border-l-0" : "ml-px rounded-l-md",
                              geo.clipR ? "rounded-r-none border-r-0" : "mr-px rounded-r-md"
                            )}
                            style={{ left: `${geo.left}%`, width: `calc(${geo.width}% - ${geo.clipL ? 0 : 1}px - ${geo.clipR ? 0 : 1}px)` }}
                          >
                            <Icon className="size-3 shrink-0" aria-hidden />
                            <span className="truncate">{dayWidth < 60 && geo.width < 12 ? "" : guest}</span>
                          </button>
                        );
                      })}
                      {focused && rowIdx === row && (
                        <span
                          ref={cursorRef}
                          aria-hidden
                          className="pointer-events-none absolute inset-y-0.5 z-20 rounded-md ring-2 ring-charcoal ring-offset-1 ring-offset-surface"
                          style={{ left: `${(col / n) * 100}%`, width: `${100 / n}%` }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </Fragment>
          ))}
          {todayIdx >= 0 && (
            <span aria-hidden className="pointer-events-none absolute inset-y-0 z-10 w-px bg-olive-deep/70" style={{ left: `calc(var(--label-w) + (100% - var(--label-w)) * ${(todayIdx + 0.5) / n})` }} />
          )}
        </div>
      </div>
    </div>
  );
}
