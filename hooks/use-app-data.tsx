"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, useSyncExternalStore } from "react";
import type {
  AccessTask,
  ActivityItem,
  Guest,
  GuestMessage,
  GuestNote,
  Lock,
  Property,
  PropertyStatus,
  Reservation,
  ReservationStatus,
  Room,
} from "@/types";
import { seed } from "@/data";
import { roomLabel } from "@/data/rooms";
import { NOW, TODAY_ISO, shift, stamp } from "@/lib/dates";
import { buildModel, isLive, operatingModel, unitName, type Dataset, type Model } from "@/lib/model";
import type { GuestInput, MessageInput, PropertyInput, RoomInput } from "@/lib/schemas";

/** Where a link from another module (search, dashboard) wants a page to open. Pages consume and clear it. */
export type Intent =
  | { type: "reservation"; id: string }
  | { type: "guest"; id: string }
  | { type: "property"; id: string }
  | { type: "room"; id: string }
  | { type: "rooms"; propertyId: string }
  | { type: "new-room"; propertyId: string }
  | { type: "reservations"; propertyId: string }
  | { type: "new-reservation"; roomId?: string; date?: string; guestId?: string };

export type ReservationDraft = Omit<Reservation, "id" | "createdAt" | "instructionsSent" | "cancelledAt" | "mappingIssue">;

type Action =
  | { type: "property/add"; property: Property }
  | { type: "property/update"; id: string; patch: Partial<Property> }
  | { type: "room/add"; room: Room; lock?: Lock }
  | { type: "room/update"; id: string; patch: Partial<Room> }
  | { type: "reservation/add"; reservation: Reservation; task?: AccessTask; guest?: Guest }
  | { type: "reservation/update"; id: string; patch: Partial<Reservation> }
  | { type: "reservation/cancel"; id: string; refund: boolean }
  | { type: "guest/add"; guest: Guest }
  | { type: "guest/update"; id: string; patch: Partial<Guest> }
  | { type: "note/add"; note: GuestNote }
  | { type: "message/add"; message: GuestMessage }
  | { type: "task/complete"; reservationId: string }
  | { type: "reservation/instructions"; id: string }
  | { type: "mapping/resolve"; id: string }
  | { type: "activity/add"; item: ActivityItem };

function reducer(s: Dataset, a: Action): Dataset {
  switch (a.type) {
    case "property/add":
      return { ...s, properties: [...s.properties, a.property] };
    case "property/update":
      return { ...s, properties: s.properties.map((p) => (p.id === a.id ? { ...p, ...a.patch } : p)) };
    case "room/add":
      return { ...s, rooms: [...s.rooms, a.room], locks: a.lock ? [...s.locks, a.lock] : s.locks };
    case "room/update":
      return { ...s, rooms: s.rooms.map((r) => (r.id === a.id ? { ...r, ...a.patch } : r)) };
    case "reservation/add":
      return {
        ...s,
        reservations: [...s.reservations, a.reservation],
        tasks: a.task ? [...s.tasks, a.task] : s.tasks,
        guests: a.guest ? [...s.guests, a.guest] : s.guests,
      };
    case "reservation/update":
      return {
        ...s,
        reservations: s.reservations.map((r) => (r.id === a.id ? { ...r, ...a.patch } : r)),
        // Moving a stay to another unit moves its access task with it.
        tasks: a.patch.roomId ? s.tasks.map((t) => (t.reservationId === a.id ? { ...t, roomId: a.patch.roomId!, propertyId: a.patch.propertyId ?? t.propertyId } : t)) : s.tasks,
      };
    case "reservation/cancel":
      return {
        ...s,
        reservations: s.reservations.map((r) =>
          r.id === a.id
            ? { ...r, status: "Cancelled", cancelledAt: TODAY_ISO, mappingIssue: false, paymentStatus: a.refund && (r.paymentStatus === "Paid" || r.paymentStatus === "Partial") ? "Refunded" : r.paymentStatus }
            : r
        ),
        tasks: s.tasks.filter((t) => t.reservationId !== a.id),
      };
    case "guest/add":
      return { ...s, guests: [...s.guests, a.guest] };
    case "guest/update":
      return { ...s, guests: s.guests.map((g) => (g.id === a.id ? { ...g, ...a.patch } : g)) };
    case "note/add":
      return { ...s, notes: [a.note, ...s.notes] };
    case "message/add":
      return { ...s, messages: [...s.messages, a.message] };
    case "task/complete":
      return { ...s, tasks: s.tasks.map((t) => (t.reservationId === a.reservationId ? { ...t, status: "Completed", failureReason: undefined } : t)) };
    case "reservation/instructions":
      return { ...s, reservations: s.reservations.map((r) => (r.id === a.id ? { ...r, instructionsSent: true } : r)) };
    case "mapping/resolve":
      return { ...s, reservations: s.reservations.map((r) => (r.id === a.id ? { ...r, mappingIssue: false } : r)) };
    case "activity/add":
      return { ...s, activity: [a.item, ...s.activity] };
  }
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const initials = (name: string) => {
  const words = name.split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words.map((w) => w[0]).join("") : name.slice(0, 2)).toUpperCase().slice(0, 3);
};

type Actions = ReturnType<typeof createActions>;

export function createActions(getModel: () => Model, dispatch: (a: Action) => void) {
  let counter = 0;
  const uid = (p: string) => `${p}-${stamp(NOW).replace(/\D/g, "")}-${++counter}`;
  const log = (propertyId: string, kind: ActivityItem["kind"], text: string) =>
    dispatch({ type: "activity/add", item: { id: uid("act"), at: stamp(NOW), propertyId, kind, text, actor: "You" } });

  return {
    addProperty(input: PropertyInput): Property {
      const m = getModel();
      let code = initials(input.name);
      for (let i = 2; m.properties.some((p) => p.code === code); i++) code = initials(input.name).slice(0, 2) + i;
      let id = `prp_${slug(input.name)}`;
      for (let i = 2; m.by.property.has(id); i++) id = `prp_${slug(input.name)}_${i}`;
      const property: Property = { ...input, id, code };
      dispatch({ type: "property/add", property });
      log(id, "housekeeping", `Property ${input.name} was added.`);
      return property;
    },
    updateProperty(id: string, patch: Partial<PropertyInput>) {
      dispatch({ type: "property/update", id, patch });
      const name = patch.name ?? getModel().by.property.get(id)?.name ?? id;
      log(id, "housekeeping", `Property ${name} was updated.`);
    },
    setPropertyStatus(id: string, status: PropertyStatus) {
      dispatch({ type: "property/update", id, patch: { status } });
      const name = getModel().by.property.get(id)?.name ?? id;
      log(id, "housekeeping", status === "Archived" ? `${name} was archived.` : `${name} is now ${status.toLowerCase()}.`);
    },
    addRoom(input: RoomInput): Room {
      const m = getModel();
      const property = m.by.property.get(input.propertyId)!;
      const { assignLock, ...rest } = input;
      const room: Room = { ...rest, id: `${property.code}-${input.number.trim()}`, number: input.number.trim() };
      const lock: Lock | undefined = assignLock
        ? { id: `LCK-${room.id}`, roomId: room.id, propertyId: room.propertyId, status: "Online", battery: 100, lastSeen: stamp(NOW) }
        : undefined;
      dispatch({ type: "room/add", room, lock });
      log(room.propertyId, "housekeeping", `${roomLabel(room)} was added to ${property.name}${lock ? " with a smart lock" : ""}.`);
      return room;
    },
    updateRoom(id: string, patch: Partial<Room>) {
      dispatch({ type: "room/update", id, patch });
      const m = getModel();
      const room = m.by.room.get(id);
      if (room) log(room.propertyId, "housekeeping", `${roomLabel({ ...room, ...patch })} was updated${patch.status === "Maintenance" ? " and placed in maintenance" : ""}.`);
    },
    addReservation(draft: ReservationDraft, newGuest?: { name: string; email: string }): Reservation {
      const m = getModel();
      const max = m.reservations.reduce((mx, r) => Math.max(mx, Number(r.id.slice(4))), 0);
      let guestId = draft.guestId;
      let guest: Guest | undefined;
      if (!guestId && newGuest) {
        const gmax = m.guests.reduce((mx, g) => Math.max(mx, Number(g.id.slice(4))), 0);
        guestId = `gst_${String(gmax + 1).padStart(4, "0")}`;
        guest = { id: guestId, name: newGuest.name, email: newGuest.email, phone: "+1 555 0100", country: "Portugal", language: "English", status: "Standard", createdAt: TODAY_ISO };
      }
      const reservation: Reservation = { ...draft, guestId, id: `RSV-${max + 1}`, createdAt: TODAY_ISO, instructionsSent: false };
      const inWindow = reservation.checkIn >= shift(TODAY_ISO, -1) && reservation.checkIn <= shift(TODAY_ISO, 2) && isLive(reservation);
      const task: AccessTask | undefined = inWindow
        ? { id: `TSK-${uid("n")}`, reservationId: reservation.id, roomId: reservation.roomId, propertyId: reservation.propertyId, kind: "Prepare access window", status: reservation.checkIn <= TODAY_ISO ? "Pending" : "Scheduled", createdAt: stamp(NOW) }
        : undefined;
      dispatch({ type: "reservation/add", reservation, task, guest });
      const g = guest ?? m.by.guest.get(guestId);
      log(reservation.propertyId, "booking", `New booking ${reservation.id}: ${g?.name ?? "guest"}, ${unitName(m, reservation.roomId)}, ${reservation.checkIn} to ${reservation.checkOut}.`);
      return reservation;
    },
    updateReservation(id: string, patch: Partial<Reservation>) {
      dispatch({ type: "reservation/update", id, patch });
      const r = getModel().by.reservation.get(id);
      if (r) log(patch.propertyId ?? r.propertyId, "booking", `Reservation ${id} was updated.`);
    },
    setReservationStatus(id: string, status: ReservationStatus) {
      const m = getModel();
      const r = m.by.reservation.get(id);
      dispatch({ type: "reservation/update", id, patch: { status } });
      if (!r) return;
      const g = m.by.guest.get(r.guestId);
      const label = unitName(m, r.roomId);
      if (status === "Checked In") log(r.propertyId, "checkin", `${g?.name} checked in to ${label}.`);
      else if (status === "Checked Out") log(r.propertyId, "housekeeping", `${g?.name} checked out of ${label}. Housekeeping task created.`);
      else log(r.propertyId, "booking", `Reservation ${id} marked ${status.toLowerCase()}.`);
    },
    cancelReservation(id: string, refund: boolean) {
      const m = getModel();
      const r = m.by.reservation.get(id);
      dispatch({ type: "reservation/cancel", id, refund });
      if (r) log(r.propertyId, "booking", `Reservation ${id} for ${m.by.guest.get(r.guestId)?.name} was cancelled.`);
    },
    addGuest(input: GuestInput): Guest {
      const m = getModel();
      const gmax = m.guests.reduce((mx, g) => Math.max(mx, Number(g.id.slice(4))), 0);
      const guest: Guest = { ...input, id: `gst_${String(gmax + 1).padStart(4, "0")}`, createdAt: TODAY_ISO };
      dispatch({ type: "guest/add", guest });
      return guest;
    },
    updateGuest(id: string, patch: Partial<GuestInput>) {
      dispatch({ type: "guest/update", id, patch });
    },
    addNote(guestId: string, text: string) {
      dispatch({ type: "note/add", note: { id: uid("note"), guestId, text, author: "Sofia Almeida", at: stamp(NOW) } });
    },
    sendMessage(guestId: string, input: MessageInput, reservationId?: string) {
      dispatch({ type: "message/add", message: { id: uid("msg"), guestId, reservationId, direction: "Outbound", at: stamp(NOW), ...input } });
      const m = getModel();
      const pid = reservationId ? m.by.reservation.get(reservationId)?.propertyId : (m.by.reservationsByGuest.get(guestId) ?? [])[0]?.propertyId;
      if (pid) log(pid, "message", `${input.channel} message sent to ${m.by.guest.get(guestId)?.name}: ${input.subject}.`);
    },
    /** Dashboard queue actions. */
    prepareAccess(reservationId: string) {
      dispatch({ type: "task/complete", reservationId });
      const m = getModel();
      const r = m.by.reservation.get(reservationId);
      if (r) log(r.propertyId, "access", `Access window prepared manually for ${m.by.guest.get(r.guestId)?.name}.`);
    },
    sendInstructions(reservationId: string) {
      dispatch({ type: "reservation/instructions", id: reservationId });
      const m = getModel();
      const r = m.by.reservation.get(reservationId);
      const g = r && m.by.guest.get(r.guestId);
      if (r) log(r.propertyId, "message", `Check-in instructions sent to ${g?.name} in ${g?.language}.`);
    },
    resolveMapping(reservationId: string) {
      dispatch({ type: "mapping/resolve", id: reservationId });
    },
    log,
  };
}

type Ctx = {
  /** Everything, including archived and onboarding properties. Used by the module pages. */
  model: Model;
  /** Only operating (Active) properties. Used by the dashboard. */
  operating: Model;
  actions: Actions;
  intent: Intent | null;
  openIntent: (i: Intent) => void;
  clearIntent: () => void;
};

const AppDataContext = createContext<Ctx | null>(null);

/** A tiny external store: state changes go through the reducer, and the derived models are rebuilt once per change. */
export function createStore(initial: Dataset) {
  let state = initial;
  let model = buildModel(state);
  let operating: Model | null = null;
  const listeners = new Set<() => void>();
  return {
    getModel: () => model,
    getOperating: () => (operating ??= operatingModel(model)),
    dispatch(action: Action) {
      state = reducer(state, action);
      model = buildModel(state);
      operating = null;
      listeners.forEach((l) => l());
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
  };
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => createStore(seed));
  const [intent, setIntent] = useReducer((_: Intent | null, i: Intent | null) => i, null);
  const model = useSyncExternalStore(store.subscribe, store.getModel, store.getModel);
  const operating = useSyncExternalStore(store.subscribe, store.getOperating, store.getOperating);
  const [actions] = useState(() => createActions(store.getModel, store.dispatch));

  const openIntent = useCallback((i: Intent) => setIntent(i), []);
  const clearIntent = useCallback(() => setIntent(null), []);

  const value = useMemo(() => ({ model, operating, actions, intent, openIntent, clearIntent }), [model, operating, actions, intent, openIntent, clearIntent]);
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used inside AppDataProvider");
  return ctx;
}

/**
 * Lets a page react to a link from another module (global search, dashboard). The handler runs once per intent,
 * then the intent is cleared so revisiting the page does not reopen the same panel.
 */
export function useIntent(types: Intent["type"][], handler: (intent: Intent) => void) {
  const { intent, clearIntent } = useAppData();
  const [seen, setSeen] = useState<Intent | null>(null);
  if (intent && intent !== seen && types.includes(intent.type)) {
    setSeen(intent);
    handler(intent);
  }
  useEffect(() => {
    if (seen && intent === seen) clearIntent();
  }, [seen, intent, clearIntent]);
}
