import type { GuestNote } from "@/types";
import { TODAY_ISO, shift } from "@/lib/dates";
import { mulberry32, pick } from "@/lib/random";
import { guests } from "./guests";

const TEMPLATES = [
  "Prefers a quiet room away from the lift.",
  "Always arrives late in the evening; keep the access window open until midnight.",
  "Allergic to nuts; flag for breakfast.",
  "Celebrates a birthday in November, welcome note appreciated.",
  "Travels with a small dog; confirmed pet-friendly unit.",
  "Asked for extra towels and a cot on every stay.",
  "Business traveller; needs an invoice with the company VAT number.",
  "Left excellent feedback last time and would be a good review candidate.",
] as const;
const STAFF = ["Sofia Almeida", "Miguel Duarte", "Inês Carvalho", "Rui Matos"] as const;

const rand = mulberry32(55);

/** A handful of internal notes on the guests who book most often. */
export const guestNotes: GuestNote[] = guests
  .slice(0, 120)
  .flatMap((g, i) => {
    if (rand() > 0.4) return [];
    const count = 1 + Math.floor(rand() * 2);
    return Array.from({ length: count }, (_, k) => ({
      id: `note_${i}_${k}`,
      guestId: g.id,
      text: pick(rand, TEMPLATES),
      author: pick(rand, STAFF),
      at: `${shift(TODAY_ISO, -Math.floor(rand() * 150))}T1${k}:30`,
    }));
  });
