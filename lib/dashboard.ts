import type { ActivityItem, PropertyId, QueueItem, Reservation } from "@/types";
import { TODAY_ISO, daysBetween, minutesAgo, shift } from "@/lib/dates";
import { format, parseISO } from "date-fns";
import { HISTORY_DAYS } from "@/data/reservations";
import { roomLabel } from "@/data/rooms";
import { isLive as live, occupiesNight, type Model } from "@/lib/model";

export type PropertyFilter = "all" | PropertyId;

const inScope = (filter: PropertyFilter) => (p: PropertyId) => filter === "all" || p === filter;

export const sellableRooms = (m: Model, filter: PropertyFilter) =>
  m.rooms.filter((r) => r.status === "Active" && inScope(filter)(r.propertyId));

/**
 * Percentage change from `prev` to `now`, rounded to a whole percent.
 * Returns null when `prev` is 0 (the change is undefined), except 0 -> 0 which is 0%.
 */
export function pctChange(now: number, prev: number): number | null {
  if (prev === 0) return now === 0 ? 0 : null;
  return Math.round(((now - prev) / prev) * 100);
}

/* ───────── Metrics ───────── */

export function getMetrics(m: Model, filter: PropertyFilter) {
  const scoped = m.reservations.filter((r) => inScope(filter)(r.propertyId) && live(r));
  const day = TODAY_ISO;
  const weekAgo = shift(day, -7);
  const yesterday = shift(day, -1);

  const active = (d: string) => scoped.filter((r) => r.checkIn <= d && d <= r.checkOut).length;
  const arrivals = (d: string) => scoped.filter((r) => r.checkIn === d).length;
  const departures = (d: string) => scoped.filter((r) => r.checkOut === d).length;
  const sellable = sellableRooms(m, filter).length;
  const occupancy = (d: string) =>
    sellable === 0 ? 0 : Math.round((scoped.filter((r) => occupiesNight(r, d)).length / sellable) * 100);

  const props = m.properties.filter((p) => inScope(filter)(p.id));
  const totalUnits = m.rooms.filter((r) => inScope(filter)(r.propertyId)).length;

  return {
    properties: { value: props.length, units: totalUnits, outOfService: totalUnits - sellable },
    active: { value: active(day), deltaPct: pctChange(active(day), active(weekAgo)) },
    arrivals: { value: arrivals(day), delta: arrivals(day) - arrivals(yesterday) },
    departures: { value: departures(day), delta: departures(day) - departures(yesterday) },
    occupancy: { value: occupancy(day), deltaPts: occupancy(day) - occupancy(weekAgo) },
  };
}

/* ───────── Reservation activity ───────── */

export type DateRange = { from: string; to: string };

/** The longest range the dashboard accepts; its preceding period must also exist in the demo history. */
export const MAX_RANGE_DAYS = 90;
export const EARLIEST_RANGE_START = shift(TODAY_ISO, -(HISTORY_DAYS - MAX_RANGE_DAYS));

export const rangeLength = (r: DateRange) => daysBetween(r.from, r.to) + 1;

/** The period of equal length that ends the day before `r` starts. */
export const previousRange = (r: DateRange): DateRange => {
  const n = rangeLength(r);
  return { from: shift(r.from, -n), to: shift(r.from, -1) };
};

export const presetRange = (days: number): DateRange => ({ from: shift(TODAY_ISO, -(days - 1)), to: TODAY_ISO });

export function validateRange(r: DateRange): string | null {
  if (!r.from || !r.to) return "Choose both a start and an end date.";
  if (r.from > r.to) return "The start date must be on or before the end date.";
  if (r.to > TODAY_ISO) return "The end date cannot be after the demo reference date.";
  if (rangeLength(r) > MAX_RANGE_DAYS) return `Choose a range of at most ${MAX_RANGE_DAYS} days.`;
  if (r.from < EARLIEST_RANGE_START) return "That range is too far back for the demo history.";
  return null;
}

type DayCounts = { bookings: number; cancellations: number };
// Bookings are counted on the day they were made; cancellations on the day they were cancelled.
const indexCache = new WeakMap<Reservation[], Map<string, Map<string, DayCounts>>>();

function dailyIndexOf(m: Model) {
  const cached = indexCache.get(m.reservations);
  if (cached) return cached;
  const index = new Map<string, Map<string, DayCounts>>();
  for (const r of m.reservations) {
    const byDate = index.get(r.propertyId) ?? new Map<string, DayCounts>();
    index.set(r.propertyId, byDate);
    const created = byDate.get(r.createdAt) ?? { bookings: 0, cancellations: 0 };
    created.bookings += 1;
    byDate.set(r.createdAt, created);
    if (r.cancelledAt) {
      const cancelled = byDate.get(r.cancelledAt) ?? { bookings: 0, cancellations: 0 };
      cancelled.cancellations += 1;
      byDate.set(r.cancelledAt, cancelled);
    }
  }
  indexCache.set(m.reservations, index);
  return index;
}

function dailyCounts(m: Model, filter: PropertyFilter, date: string): DayCounts {
  const dailyIndex = dailyIndexOf(m);
  let bookings = 0;
  let cancellations = 0;
  for (const p of m.properties) {
    if (!inScope(filter)(p.id)) continue;
    const c = dailyIndex.get(p.id)?.get(date);
    if (c) {
      bookings += c.bookings;
      cancellations += c.cancellations;
    }
  }
  return { bookings, cancellations };
}

export type ActivityPoint = {
  date: string;
  label: string;
  bookings: number;
  cancellations: number;
  /** Same position in the preceding period of equal length. */
  prevDate: string;
  prevLabel: string;
  prevBookings: number;
};

export function getReservationActivity(m: Model, filter: PropertyFilter, range: DateRange) {
  const n = rangeLength(range);
  const prev = previousRange(range);
  const series: ActivityPoint[] = [];
  for (let i = 0; i < n; i++) {
    const date = shift(range.from, i);
    const prevDate = shift(prev.from, i);
    const cur = dailyCounts(m, filter, date);
    series.push({
      date,
      label: format(parseISO(date), "d MMM"),
      bookings: cur.bookings,
      cancellations: cur.cancellations,
      prevDate,
      prevLabel: format(parseISO(prevDate), "d MMM"),
      prevBookings: dailyCounts(m, filter, prevDate).bookings,
    });
  }
  const bookings = series.reduce((s, p) => s + p.bookings, 0);
  const prevBookings = series.reduce((s, p) => s + p.prevBookings, 0);
  return {
    series,
    days: n,
    range,
    prevRange: prev,
    bookings,
    prevBookings,
    cancellations: series.reduce((s, p) => s + p.cancellations, 0),
    deltaPct: pctChange(bookings, prevBookings),
    peak: series.reduce((a, b) => (b.bookings > a.bookings ? b : a), series[0]),
  };
}

/* ───────── Occupancy ───────── */

export function getOccupancyBreakdown(m: Model, filter: PropertyFilter) {
  const scoped = m.reservations.filter((r) => inScope(filter)(r.propertyId) && live(r));
  const all = m.rooms.filter((r) => inScope(filter)(r.propertyId));
  const sellable = all.filter((r) => r.status === "Active");
  const stayovers = scoped.filter((r) => r.checkIn < TODAY_ISO && occupiesNight(r, TODAY_ISO)).length;
  const arriving = scoped.filter((r) => r.checkIn === TODAY_ISO).length;
  const outOfService = all.length - sellable.length;
  const available = Math.max(0, sellable.length - stayovers - arriving);
  return { total: all.length, sellable: sellable.length, stayovers, arriving, available, outOfService };
}

export function getPropertyOccupancy(m: Model, filter: PropertyFilter) {
  return m.properties
    .filter((p) => inScope(filter)(p.id))
    .map((p) => {
      const sellable = sellableRooms(m, p.id).length;
      const occupied = m.reservations.filter((r) => r.propertyId === p.id && occupiesNight(r, TODAY_ISO)).length;
      return { id: p.id, name: p.name, city: p.city, occupied, sellable, pct: sellable ? Math.round((occupied / sellable) * 100) : 0 };
    });
}

export function getOccupancyOutlook(m: Model, filter: PropertyFilter, days = 14) {
  const sellable = sellableRooms(m, filter).length;
  const scoped = m.reservations.filter((r) => inScope(filter)(r.propertyId));
  return Array.from({ length: days }, (_, i) => {
    const d = shift(TODAY_ISO, i);
    const occupied = scoped.filter((r) => occupiesNight(r, d)).length;
    return { date: d, label: format(parseISO(d), "EEE d"), occupied, sellable, pct: sellable ? Math.round((occupied / sellable) * 100) : 0 };
  });
}

/* ───────── Arrivals / departures ───────── */

export const getArrivals = (m: Model, filter: PropertyFilter) =>
  m.reservations
    .filter((r) => inScope(filter)(r.propertyId) && live(r) && r.checkIn === TODAY_ISO)
    .sort((a, b) => a.checkInTime.localeCompare(b.checkInTime));

export const getDepartures = (m: Model, filter: PropertyFilter) =>
  m.reservations
    .filter((r) => inScope(filter)(r.propertyId) && live(r) && r.checkOut === TODAY_ISO)
    .sort((a, b) => a.checkOutTime.localeCompare(b.checkOutTime));

export function describe(m: Model, r: Reservation) {
  const room = m.by.room.get(r.roomId)!;
  const property = m.by.property.get(r.propertyId)!;
  return { guest: m.by.guest.get(r.guestId)!, room, roomName: roomLabel(room), property };
}

/* ───────── Smart-lock health ───────── */

export function getLockHealth(m: Model, filter: PropertyFilter) {
  const ls = m.locks.filter((l) => inScope(filter)(l.propertyId));
  const tasks = m.tasks.filter((t) => inScope(filter)(t.propertyId));
  return {
    total: ls.length,
    online: ls.filter((l) => l.status === "Online").length,
    offline: ls.filter((l) => l.status === "Offline").length,
    lowBattery: ls.filter((l) => l.status === "Online" && l.battery < 20).length,
    pendingTasks: tasks.filter((t) => t.status === "Pending").length,
    failedTasks: tasks.filter((t) => t.status === "Failed").length,
    attention: ls
      .filter((l) => l.status === "Offline" || l.battery < 20)
      .sort((a, b) => (a.status === b.status ? a.battery - b.battery : a.status === "Offline" ? -1 : 1)),
  };
}

/* ───────── Operations queue (derived from data) ───────── */

const sevRank = { high: 0, medium: 1, low: 2 } as const;

export function buildQueue(m: Model): QueueItem[] {
  const items: QueueItem[] = [];
  const arrivalsToday = m.reservations.filter((r) => r.checkIn === TODAY_ISO && live(r));

  for (const t of m.tasks.filter((t) => t.status === "Failed")) {
    const r = m.reservations.find((x) => x.id === t.reservationId)!;
    const d = describe(m, r);
    items.push({
      id: `q-${t.id}`,
      kind: "access-failed",
      severity: "high",
      title: `Access task failed · ${d.property.name.split(" ")[0]} ${d.roomName}`,
      detail: `${d.guest.name} arrives ${r.checkInTime}. ${t.failureReason}.`,
      propertyId: r.propertyId,
      reservationId: r.id,
      taskId: t.id,
      action: "Retry task",
    });
  }

  for (const l of m.locks.filter((l) => l.status === "Offline")) {
    const next = m.reservations.find((r) => r.roomId === l.roomId && live(r) && r.checkIn >= TODAY_ISO && r.checkIn <= shift(TODAY_ISO, 2));
    if (next && m.tasks.some((t) => t.reservationId === next.id && t.status === "Failed")) continue;
    const d = describe(m, next ?? m.reservations[0]);
    items.push({
      id: `q-${l.id}`,
      kind: "lock-offline",
      severity: next?.checkIn === TODAY_ISO ? "high" : "medium",
      title: `Lock offline · ${m.by.property.get(l.propertyId)!.name.split(" ")[0]} ${roomLabel(m.by.room.get(l.roomId)!)}`,
      detail: next ? `${d.guest.name} arrives ${next.checkIn === TODAY_ISO ? "today" : "tomorrow"} ${next.checkInTime}. Not seen for hours.` : "Not seen for hours.",
      propertyId: l.propertyId,
      lockId: l.id,
      reservationId: next?.id,
      action: "Run diagnostics",
    });
  }

  for (const t of m.tasks.filter((t) => t.status === "Pending")) {
    const r = m.reservations.find((x) => x.id === t.reservationId)!;
    if (r.checkIn !== TODAY_ISO) continue;
    const d = describe(m, r);
    items.push({
      id: `q-${t.id}`,
      kind: "access-pending",
      severity: "medium",
      title: `Access task pending · ${d.property.name.split(" ")[0]} ${d.roomName}`,
      detail: `${d.guest.name} arrives ${r.checkInTime}. Access window not prepared yet.`,
      propertyId: r.propertyId,
      reservationId: r.id,
      taskId: t.id,
      action: "Prepare now",
    });
  }

  for (const r of arrivalsToday.filter((r) => !r.instructionsSent && m.by.taskByReservation.get(r.id)?.status === "Completed")) {
    const d = describe(m, r);
    items.push({
      id: `q-msg-${r.id}`,
      kind: "instructions",
      severity: "medium",
      title: `Guest instructions not sent · ${d.guest.name}`,
      detail: `${d.property.name} ${d.roomName}, arriving ${r.checkInTime}.`,
      propertyId: r.propertyId,
      reservationId: r.id,
      action: "Send now",
    });
  }

  for (const r of m.reservations.filter((r) => r.mappingIssue)) {
    items.push({
      id: `q-map-${r.id}`,
      kind: "mapping",
      severity: "low",
      title: `Reservation mapping issue · ${r.id}`,
      detail: `${r.source} booking for ${m.by.guest.get(r.guestId)!.name} could not be matched to a unit.`,
      propertyId: r.propertyId,
      reservationId: r.id,
      action: "Map to unit",
    });
  }

  return items.sort((a, b) => sevRank[a.severity] - sevRank[b.severity]);
}

/* ───────── Recent activity (derived) ───────── */

const ago = minutesAgo;

export function buildActivity(m: Model): ActivityItem[] {
  const out: ActivityItem[] = [];
  let n = 0;
  const add = (a: Omit<ActivityItem, "id">) => out.push({ ...a, id: `act-${n++}` });

  const recent = m.reservations
    .filter((r) => live(r) && r.createdAt >= shift(TODAY_ISO, -1))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
    .slice(0, 4);
  [8, 27, 63, 118].forEach((mins, i) => {
    const r = recent[i];
    if (!r) return;
    const d = describe(m, r);
    add({ at: ago(mins), propertyId: r.propertyId, kind: "booking", actor: r.source, text: `New booking ${r.id}: ${d.guest.name}, ${d.property.name} ${d.roomName}, ${shortDate(r.checkIn)} to ${shortDate(r.checkOut)}.` });
  });

  const done = m.tasks.filter((t) => t.status === "Completed" && t.createdAt).slice(0, 3);
  [14, 41, 86].forEach((mins, i) => {
    const t = done[i];
    if (!t) return;
    const r = m.reservations.find((x) => x.id === t.reservationId)!;
    const d = describe(m, r);
    add({ at: ago(mins), propertyId: t.propertyId, kind: "access", actor: "Automation", text: `Access window prepared for ${d.guest.name} (${d.roomName}, ${d.property.name}).` });
  });

  const failed = m.tasks.find((t) => t.status === "Failed");
  if (failed) {
    const r = m.reservations.find((x) => x.id === failed.reservationId)!;
    const d = describe(m, r);
    add({ at: ago(22), propertyId: failed.propertyId, kind: "access", actor: "Automation", text: `Access task failed for ${d.guest.name} (${d.roomName}): lock unreachable.` });
  }

  const offline = m.locks.find((l) => l.status === "Offline");
  if (offline) {
    add({ at: offline.lastSeen, propertyId: offline.propertyId, kind: "lock", actor: "System", text: `${offline.id} stopped responding.` });
  }

  const sent = m.reservations.filter((r) => r.checkIn === TODAY_ISO && live(r) && r.instructionsSent).slice(0, 3);
  [5, 33, 71].forEach((mins, i) => {
    const r = sent[i];
    if (!r) return;
    const d = describe(m, r);
    add({ at: ago(mins), propertyId: r.propertyId, kind: "message", actor: "Automation", text: `Check-in instructions sent to ${d.guest.name} in ${d.guest.language}.` });
  });

  const turned = m.reservations.filter((r) => r.checkOut === shift(TODAY_ISO, -1) && live(r)).slice(0, 2);
  [155, 190].forEach((mins, i) => {
    const r = turned[i];
    if (!r) return;
    const d = describe(m, r);
    add({ at: ago(mins), propertyId: r.propertyId, kind: "housekeeping", actor: m.by.property.get(r.propertyId)!.manager, text: `${d.roomName} at ${d.property.name} marked ready after turnover.` });
  });

  return [...m.activity, ...out].sort((a, b) => b.at.localeCompare(a.at));
}

const shortDate = (d: string) => format(parseISO(d), "d MMM");
