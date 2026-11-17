import type { Lock } from "@/types";
import { NOW, TODAY_ISO, shift, stamp } from "@/lib/dates";
import { mulberry32 } from "@/lib/random";
import { rooms } from "./rooms";
import { reservations } from "./reservations";

const rand = mulberry32(99);

const arrivalsOn = (d: string) =>
  reservations.filter((r) => r.checkIn === d && r.status !== "Cancelled").sort((a, b) => a.checkInTime.localeCompare(b.checkInTime));

const today = arrivalsOn(TODAY_ISO);
const tomorrow = arrivalsOn(shift(TODAY_ISO, 1));

/** Two locks serving guests who arrive today are unreachable, plus one for tomorrow. */
export const OFFLINE_ROOMS = new Set(
  [today[1]?.roomId, today[5]?.roomId, tomorrow[0]?.roomId].filter(Boolean) as string[]
);

const LOW_BATTERY_ROOMS = new Set(
  rooms
    .filter((r) => r.status === "Active" && !OFFLINE_ROOMS.has(r.id))
    .filter(() => rand() < 0.045)
    .map((r) => r.id)
);

export const locks: Lock[] = rooms
  .filter((r) => r.status === "Active")
  .map((r) => {
    const offline = OFFLINE_ROOMS.has(r.id);
    const low = LOW_BATTERY_ROOMS.has(r.id);
    const battery = low ? 8 + Math.floor(rand() * 10) : 40 + Math.floor(rand() * 60);
    const lastSeen = offline
      ? stamp(new Date(NOW.getTime() - (5 + Math.floor(rand() * 7)) * 3_600_000))
      : stamp(new Date(NOW.getTime() - Math.floor(rand() * 9 + 1) * 60_000));
    return {
      id: `LCK-${r.id}`,
      roomId: r.id,
      propertyId: r.propertyId,
      status: offline ? ("Offline" as const) : ("Online" as const),
      battery,
      lastSeen,
    };
  });

export const lockByRoom = new Map(locks.map((l) => [l.roomId, l]));
export const LOW_BATTERY_THRESHOLD = 20;
