import type { AccessStatus, AccessTask, ActivityItem, Guest, GuestMessage, GuestNote, Lock, Property, PropertyId, Reservation, Room, RoomState } from "@/types";
import { TODAY_ISO, NOW, shift, stamp } from "@/lib/dates";
import { roomLabel } from "@/data/rooms";

/** Everything the prototype knows. The app holds one mutable copy in React state; seeds live in /data. */
export type Dataset = {
  properties: Property[];
  rooms: Room[];
  guests: Guest[];
  reservations: Reservation[];
  locks: Lock[];
  tasks: AccessTask[];
  notes: GuestNote[];
  messages: GuestMessage[];
  /** Events created by actions in this session; the dashboard merges them into its activity feed. */
  activity: ActivityItem[];
};

export type Model = Dataset & {
  by: {
    property: Map<string, Property>;
    room: Map<string, Room>;
    guest: Map<string, Guest>;
    reservation: Map<string, Reservation>;
    lockByRoom: Map<string, Lock>;
    taskByReservation: Map<string, AccessTask>;
    reservationsByGuest: Map<string, Reservation[]>;
    reservationsByRoom: Map<string, Reservation[]>;
  };
};

export function buildModel(d: Dataset): Model {
  const reservationsByGuest = new Map<string, Reservation[]>();
  const reservationsByRoom = new Map<string, Reservation[]>();
  for (const r of d.reservations) {
    (reservationsByGuest.get(r.guestId) ?? reservationsByGuest.set(r.guestId, []).get(r.guestId)!).push(r);
    (reservationsByRoom.get(r.roomId) ?? reservationsByRoom.set(r.roomId, []).get(r.roomId)!).push(r);
  }
  for (const list of reservationsByRoom.values()) list.sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  for (const list of reservationsByGuest.values()) list.sort((a, b) => b.checkIn.localeCompare(a.checkIn));
  return {
    ...d,
    by: {
      property: new Map(d.properties.map((p) => [p.id, p])),
      room: new Map(d.rooms.map((r) => [r.id, r])),
      guest: new Map(d.guests.map((g) => [g.id, g])),
      reservation: new Map(d.reservations.map((r) => [r.id, r])),
      lockByRoom: new Map(d.locks.map((l) => [l.roomId, l])),
      taskByReservation: new Map(d.tasks.map((t) => [t.reservationId, t])),
      reservationsByGuest,
      reservationsByRoom,
    },
  };
}

/** The slice of the model that the dashboard reports on: properties that are open for business. */
export function operatingModel(m: Model): Model {
  const ids = new Set(m.properties.filter((p) => p.status === "Active").map((p) => p.id));
  return buildModel({
    ...m,
    properties: m.properties.filter((p) => ids.has(p.id)),
    rooms: m.rooms.filter((r) => ids.has(r.propertyId)),
    reservations: m.reservations.filter((r) => ids.has(r.propertyId)),
    locks: m.locks.filter((l) => ids.has(l.propertyId)),
    tasks: m.tasks.filter((t) => ids.has(t.propertyId)),
  });
}

/* ───────── Reservation helpers ───────── */

export const isLive = (r: Reservation) => r.status !== "Cancelled";
/** Holds the unit on the night of `date` (check-in <= date < check-out). */
export const occupiesNight = (r: Reservation, date: string) =>
  isLive(r) && r.checkIn <= date && date < r.checkOut && !(r.status === "Checked Out" && date >= TODAY_ISO); // an early check-out frees the unit from today on
export const nightsOf = (r: Pick<Reservation, "checkIn" | "checkOut">) =>
  Math.round((Date.parse(r.checkOut) - Date.parse(r.checkIn)) / 86_400_000);

/** Reservations that clash with a proposed stay in a unit (cancelled ones never clash). */
export function findConflicts(m: Model, roomId: string, checkIn: string, checkOut: string, ignoreId?: string): Reservation[] {
  return (m.by.reservationsByRoom.get(roomId) ?? []).filter((r) => r.id !== ignoreId && isLive(r) && r.checkIn < checkOut && checkIn < r.checkOut);
}

export const unitName = (m: Model, roomId: string) => {
  const r = m.by.room.get(roomId);
  return r ? roomLabel(r) : roomId;
};

/* ───────── Unit state ───────── */

export function currentStay(m: Model, roomId: string, date = TODAY_ISO): Reservation | undefined {
  // Still in the unit: arrived before `date` and not yet gone, or arrived today and already checked in.
  return (m.by.reservationsByRoom.get(roomId) ?? []).find(
    (r) => isLive(r) && r.status !== "Checked Out" && ((r.checkIn < date && date <= r.checkOut) || (r.checkIn === date && r.status === "Checked In"))
  );
}

/** The next arrival at or after today that is not the stay currently in the unit. */
export function nextReservation(m: Model, roomId: string, date = TODAY_ISO): Reservation | undefined {
  return (m.by.reservationsByRoom.get(roomId) ?? []).find((r) => isLive(r) && r.checkIn >= date && r.status !== "Checked Out");
}

export function roomState(m: Model, room: Room, date = TODAY_ISO): RoomState {
  if (room.status === "Maintenance") return "Maintenance";
  if (currentStay(m, room.id, date)) return "Occupied";
  const arriving = (m.by.reservationsByRoom.get(room.id) ?? []).some((r) => isLive(r) && r.checkIn === date && r.status !== "Checked Out");
  return arriving ? "Reserved" : "Available";
}

/* ───────── Property / guest rollups ───────── */

export function propertyStats(m: Model, propertyId: PropertyId) {
  const rs = m.rooms.filter((r) => r.propertyId === propertyId);
  const sellable = rs.filter((r) => r.status === "Active").length;
  const occupied = m.reservations.filter((r) => r.propertyId === propertyId && occupiesNight(r, TODAY_ISO)).length;
  return {
    units: rs.length,
    sellable,
    occupied,
    maintenance: rs.length - sellable,
    occupancy: sellable ? Math.round((occupied / sellable) * 100) : 0,
    arrivalsToday: m.reservations.filter((r) => r.propertyId === propertyId && isLive(r) && r.checkIn === TODAY_ISO).length,
    departuresToday: m.reservations.filter((r) => r.propertyId === propertyId && isLive(r) && r.checkOut === TODAY_ISO).length,
  };
}

export function guestStats(m: Model, guestId: string) {
  const rs = m.by.reservationsByGuest.get(guestId) ?? [];
  const stays = rs.filter((r) => r.status === "Checked Out" || r.status === "Checked In");
  const completed = stays.filter((r) => r.status === "Checked Out");
  const upcoming = rs
    .filter((r) => (r.status === "Confirmed" || r.status === "Pending") && r.checkIn >= TODAY_ISO)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn))[0];
  const last = [...completed].sort((a, b) => b.checkOut.localeCompare(a.checkOut))[0];
  const inHouse = rs.find((r) => r.status === "Checked In");
  return {
    total: rs.length,
    stays: stays.length,
    nights: stays.reduce((s, r) => s + nightsOf(r), 0),
    spend: completed.reduce((s, r) => s + r.total, 0),
    upcoming,
    last,
    inHouse,
    cancelled: rs.filter((r) => r.status === "Cancelled").length,
  };
}

/* ───────── Guest communication (derived from reservations + messages sent in this session) ───────── */

export function guestMessages(m: Model, guestId: string): GuestMessage[] {
  const out: GuestMessage[] = [];
  const now = stamp(NOW);
  for (const r of m.by.reservationsByGuest.get(guestId) ?? []) {
    const num = Number(r.id.slice(4));
    const push = (key: string, at: string, subject: string, body: string, channel: GuestMessage["channel"], direction: GuestMessage["direction"] = "Outbound") => {
      if (at <= now) out.push({ id: `${r.id}-${key}`, guestId, reservationId: r.id, channel, direction, subject, body, at });
    };
    push("conf", `${r.createdAt}T10:00`, r.status === "Pending" ? "Booking received, awaiting payment" : "Booking confirmation", `Hello, we have your stay for ${r.checkIn} to ${r.checkOut}. Reference ${r.id}.`, "Email");
    if (r.status === "Cancelled" && r.cancelledAt) push("cancel", `${r.cancelledAt}T11:30`, "Cancellation confirmation", `Your reservation ${r.id} has been cancelled.`, "Email");
    if (isLive(r) && r.instructionsSent) push("instr", `${shift(r.checkIn, -1)}T09:00`, "Check-in instructions", "Your arrival details and door access instructions are ready.", num % 3 === 0 ? "WhatsApp" : "Email");
    if (r.status === "Checked Out") {
      push("thanks", `${r.checkOut}T14:00`, "Thank you for staying", "We hope you enjoyed your stay. We would love your feedback.", "Email");
      if (num % 4 === 0) push("reply", `${r.checkOut}T18:20`, "Re: Thank you for staying", "Thank you, we had a lovely time and would happily return.", "Email", "Inbound");
    }
  }
  for (const msg of m.messages) if (msg.guestId === guestId) out.push(msg);
  return out.sort((a, b) => b.at.localeCompare(a.at));
}

/** What the guest can currently do at the door, from the access task and whether instructions went out. */
export function accessStatusFor(m: Model, r: Reservation, override?: AccessStatus): AccessStatus {
  if (override) return override;
  const t = m.by.taskByReservation.get(r.id);
  if (!t || t.status === "Pending" || t.status === "Scheduled") return "Pending";
  if (t.status === "Failed") return "Failed";
  return r.instructionsSent ? "Ready" : "Instructions not sent";
}

/* ───────── Invariants ───────── */

/** Booking is still relevant today: in the house or arriving later. */
export const isActiveStay = (r: Reservation) => isLive(r) && r.status !== "Checked Out" && r.checkOut >= TODAY_ISO;

/**
 * Relationship rules every edit must preserve. Returns human-readable violations (empty means consistent).
 * Used by the module forms to refuse risky edits, and by the tests to prove the data stays valid.
 */
export function validateModel(m: Model): string[] {
  const out: string[] = [];
  const bad = (msg: string) => out.length < 50 && out.push(msg);
  for (const r of m.rooms) if (!m.by.property.has(r.propertyId)) bad(`room ${r.id}: unknown property ${r.propertyId}`);
  for (const l of m.locks) {
    const room = m.by.room.get(l.roomId);
    if (!room) bad(`lock ${l.id}: unknown room`);
    else if (room.propertyId !== l.propertyId) bad(`lock ${l.id}: property differs from its room`);
  }
  const ids = new Set<string>();
  for (const r of m.reservations) {
    if (ids.has(r.id)) bad(`duplicate reservation id ${r.id}`);
    ids.add(r.id);
    const room = m.by.room.get(r.roomId);
    const prop = m.by.property.get(r.propertyId);
    if (!m.by.guest.has(r.guestId)) bad(`${r.id}: unknown guest`);
    if (!room) { bad(`${r.id}: unknown room ${r.roomId}`); continue; }
    if (!prop) bad(`${r.id}: unknown property`);
    if (room.propertyId !== r.propertyId) bad(`${r.id}: property differs from its room's property`);
    if (r.checkOut <= r.checkIn) bad(`${r.id}: check-out is not after check-in`);
    if (!["Direct", "Booking.com", "Airbnb", "Expedia", "Corporate"].includes(r.source)) bad(`${r.id}: unknown source`);
    if ((r.status === "Checked In" || r.status === "Checked Out") && r.checkIn > TODAY_ISO) bad(`${r.id}: ${r.status} before its check-in date`);
    if (isActiveStay(r)) {
      if (room.status === "Maintenance") bad(`${r.id}: active stay in a unit under maintenance`);
      if (prop && prop.status !== "Active") bad(`${r.id}: active stay in a ${prop.status.toLowerCase()} property`);
      if (r.adults > room.capacity) bad(`${r.id}: ${r.adults} guests exceed capacity ${room.capacity}`);
    }
  }
  for (const [roomId, list] of m.by.reservationsByRoom) {
    const live = list.filter(isLive);
    for (let i = 1; i < live.length; i++) if (live[i].checkIn < live[i - 1].checkOut) bad(`${roomId}: ${live[i - 1].id} overlaps ${live[i].id}`);
  }
  for (const t of m.tasks) {
    const r = m.by.reservation.get(t.reservationId);
    if (!r) bad(`task ${t.id}: unknown reservation`);
    else if (!isLive(r)) bad(`task ${t.id}: belongs to a cancelled reservation`);
    else if (r.roomId !== t.roomId) bad(`task ${t.id}: room differs from its reservation`);
  }
  for (const n of m.notes) if (!m.by.guest.has(n.guestId)) bad(`note ${n.id}: unknown guest`);
  for (const g of m.messages) if (!m.by.guest.has(g.guestId)) bad(`message ${g.id}: unknown guest`);
  return out;
}
