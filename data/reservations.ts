import type { BookingSource, PaymentStatus, PropertyId, Reservation } from "@/types";
import { TODAY_ISO, daysBetween, shift } from "@/lib/dates";
import { mulberry32, pick, weighted } from "@/lib/random";
import { properties } from "./properties";
import { rooms } from "./rooms";
import { GUEST_COUNT, RETURNING_POOL, guests } from "./guests";

const rand = mulberry32(2026);

/** Booking history reaches back this many days so any 90-day range and its preceding 90 days are fully populated. */
export const HISTORY_DAYS = 260;
const START = shift(TODAY_ISO, -HISTORY_DAYS);
const END = shift(TODAY_ISO, 100);

const nightsFor = (p: PropertyId) =>
  weighted(
    rand,
    p === "prp_alma"
      ? ([[3, 2], [4, 3], [5, 3], [7, 3], [10, 1]] as const)
      : p === "prp_north"
        ? ([[2, 3], [3, 3], [4, 2], [6, 2], [7, 1]] as const)
        : ([[1, 2], [2, 4], [3, 4], [4, 2], [5, 1]] as const)
  );

const gap = () => weighted(rand, [[0, 3], [1, 4], [2, 2], [3, 1]] as const);

const sourceFor = (p: PropertyId): BookingSource =>
  weighted(
    rand,
    p === "prp_alma"
      ? ([["Direct", 4], ["Airbnb", 4], ["Booking.com", 2]] as const)
      : p === "prp_north"
        ? ([["Airbnb", 5], ["Booking.com", 3], ["Direct", 2]] as const)
        : ([["Booking.com", 4], ["Direct", 3], ["Expedia", 2], ["Airbnb", 1], ["Corporate", 1]] as const)
  );

const hotelIn = ["14:00", "15:00", "15:00", "16:00", "17:30", "19:00"] as const;
const hotelOut = ["10:00", "11:00", "11:00", "12:00"] as const;

const NOTES = [
  "Late arrival expected after 22:00.",
  "Requested a baby cot and high chair.",
  "Celebrating an anniversary; welcome note requested.",
  "Needs airport transfer on arrival.",
  "Allergic to feather pillows.",
  "Prefers a high floor and a quiet room.",
  "Travelling with a small dog.",
  "Early check-in requested if the room is ready.",
] as const;

const paymentFor = (status: Reservation["status"], source: BookingSource, future: boolean): PaymentStatus => {
  if (status === "Cancelled") return weighted(rand, [["Refunded", 4], ["Unpaid", 6]] as const);
  if (status === "Pending") return "Unpaid";
  if (!future) return weighted(rand, [["Paid", 94], ["Partial", 4], ["Unpaid", 2]] as const);
  if (source === "Direct") return weighted(rand, [["Partial", 6], ["Paid", 2], ["Unpaid", 2]] as const);
  if (source === "Corporate") return weighted(rand, [["Unpaid", 7], ["Paid", 3]] as const);
  return weighted(rand, [["Paid", 5], ["Unpaid", 5]] as const);
};

type Draft = Omit<Reservation, "id">;
const drafts: Draft[] = [];
const operating = new Set(properties.filter((p) => p.status === "Active").map((p) => p.id));

for (const room of rooms) {
  // Rooms in maintenance, and properties that are still onboarding, take no bookings.
  if (room.status !== "Active" || !operating.has(room.propertyId)) continue;
  let cursor = shift(START, Math.floor(rand() * 4));
  while (cursor < END) {
    const start = shift(cursor, gap());
    const nights = nightsFor(room.propertyId);
    const end = shift(start, nights);
    cursor = end;
    if (start >= END) break;

    const villa = room.propertyId === "prp_alma";
    const guest = rand() < 0.35 ? guests[Math.floor(rand() ** 2 * RETURNING_POOL)] : guests[Math.floor(rand() * GUEST_COUNT)];
    // Every stay was booked `lead` days before arrival. A stay whose booking date would still be in the
    // future is simply not on the books yet (the unit stays vacant), so far-out dates fill more slowly.
    const lead = 1 + Math.floor(-Math.log(1 - rand()) * 30);
    const createdAt = shift(start, -lead);
    if (createdAt > TODAY_ISO) continue;

    const cancelled = rand() < 0.06;
    let status: Draft["status"];
    if (cancelled) status = "Cancelled";
    else if (end < TODAY_ISO) status = "Checked Out";
    else if (start < TODAY_ISO) status = "Checked In";
    else status = rand() < 0.06 ? "Pending" : "Confirmed";

    const adults = Math.max(1, Math.min(room.capacity, 1 + Math.floor(rand() * room.capacity)));
    const total = Math.round(nights * room.nightlyRate * (0.9 + rand() * 0.2));

    let instructionsSent: boolean;
    if (start < TODAY_ISO) instructionsSent = true;
    else if (start === TODAY_ISO) instructionsSent = rand() < 0.72;
    else if (start <= shift(TODAY_ISO, 2)) instructionsSent = rand() < 0.3;
    else instructionsSent = false;

    const source = sourceFor(room.propertyId);
    drafts.push({
      guestId: guest.id,
      roomId: room.id,
      propertyId: room.propertyId,
      checkIn: start,
      checkOut: end,
      checkInTime: villa ? "16:00" : pick(rand, hotelIn),
      checkOutTime: villa ? "10:00" : pick(rand, hotelOut),
      adults,
      source,
      status,
      paymentStatus: paymentFor(status, source, start >= TODAY_ISO),
      notes: rand() < 0.1 ? pick(rand, NOTES) : undefined,
      total,
      createdAt,
      cancelledAt: cancelled ? shift(createdAt, Math.floor(rand() * (Math.min(daysBetween(createdAt, start), daysBetween(createdAt, TODAY_ISO)) + 1))) : undefined,
      instructionsSent,
    });
  }
}

drafts.sort((a, b) => (a.checkIn === b.checkIn ? a.roomId.localeCompare(b.roomId) : a.checkIn.localeCompare(b.checkIn)));

export const reservations: Reservation[] = drafts.map((d, i) => ({ ...d, id: `RSV-${24000 + i}` }));

// Two OTA bookings starting in the next few days could not be matched to a unit.
const eligible = reservations.filter(
  (r) =>
    r.status === "Confirmed" &&
    r.source !== "Direct" &&
    r.source !== "Corporate" &&
    r.checkIn > shift(TODAY_ISO, 1) &&
    r.checkIn <= shift(TODAY_ISO, 6)
);
[eligible[2], eligible[8]].forEach((r) => r && (r.mappingIssue = true));

// A guest's "customer since" date is their first booking.
const firstBooked = new Map<string, string>();
for (const r of reservations) {
  const seen = firstBooked.get(r.guestId);
  if (!seen || r.createdAt < seen) firstBooked.set(r.guestId, r.createdAt);
}
for (const g of guests) g.createdAt = firstBooked.get(g.id) ?? shift(TODAY_ISO, -400 - (Number(g.id.slice(4)) % 200));

/** Overlaps the night of `date` (check-in <= date < check-out), excluding cancellations. */
export const occupiesNight = (r: Reservation, date: string) =>
  r.status !== "Cancelled" && r.checkIn <= date && date < r.checkOut;
