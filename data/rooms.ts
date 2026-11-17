import type { PropertyId, Room } from "@/types";

type Def = {
  propertyId: PropertyId;
  code: string;
  numbers: string[];
  type: (n: string) => string;
  capacity: (n: string) => number;
  rate: (n: string) => number;
};

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => String(from + i));
const byFloor = (map: Record<string, string | number>) => (n: string) => map[n[0]];

const defs: Def[] = [
  {
    propertyId: "prp_harbor",
    code: "HH",
    numbers: [...range(101, 110), ...range(201, 210), ...range(301, 310), ...range(401, 412)],
    type: (n) => String(byFloor({ "1": "Garden Room", "2": "Classic Double", "3": "Deluxe Double", "4": "Harbor Suite" })(n)),
    capacity: (n) => (n[0] === "4" ? 3 : 2),
    rate: (n) => Number(byFloor({ "1": 128, "2": 142, "3": 168, "4": 240 })(n)),
  },
  {
    propertyId: "prp_alma",
    code: "CA",
    numbers: ["A", "B", "C", "D", "E", "F", "G", "H"],
    type: (n) => (["A", "B"].includes(n) ? "Four-bedroom villa" : "Two-bedroom villa"),
    capacity: (n) => (["A", "B"].includes(n) ? 8 : 4),
    rate: (n) => (["A", "B"].includes(n) ? 520 : 310),
  },
  {
    propertyId: "prp_north",
    code: "NL",
    numbers: range(1, 16),
    type: (n) => (Number(n) <= 8 ? "Studio loft" : "One-bedroom loft"),
    capacity: (n) => (Number(n) <= 8 ? 2 : 3),
    rate: (n) => (Number(n) <= 8 ? 118 : 154),
  },
  {
    propertyId: "prp_sea",
    code: "SS",
    numbers: [...range(101, 108), ...range(201, 208), ...range(301, 308)],
    type: (n) => String(byFloor({ "1": "Courtyard Suite", "2": "Sea-view Suite", "3": "Terrace Suite" })(n)),
    capacity: () => 2,
    rate: (n) => Number(byFloor({ "1": 175, "2": 205, "3": 248 })(n)),
  },
  {
    propertyId: "prp_alfama",
    code: "AG",
    numbers: range(1, 6),
    type: (n) => (Number(n) <= 4 ? "Double Room" : "Family Room"),
    capacity: (n) => (Number(n) <= 4 ? 2 : 4),
    rate: (n) => (Number(n) <= 4 ? 96 : 134),
  },
];

/** Units that are out of service for maintenance (excluded from occupancy and bookings). */
const OUT_OF_SERVICE = new Set(["HH-207", "NL-9", "SS-204"]);

export const rooms: Room[] = defs.flatMap((d) =>
  d.numbers.map((n) => {
    const id = `${d.code}-${n}`;
    return {
      id,
      propertyId: d.propertyId,
      number: n,
      type: d.type(n),
      capacity: d.capacity(n),
      nightlyRate: d.rate(n),
      status: OUT_OF_SERVICE.has(id) ? ("Maintenance" as const) : ("Active" as const),
    };
  })
);


/** "Room 405", "Villa A", "Loft 12" */
export function roomLabel(r: Pick<Room, "propertyId" | "number">): string {
  if (r.propertyId === "prp_alma") return `Villa ${r.number}`;
  if (r.propertyId === "prp_north") return `Loft ${r.number}`;
  return `Room ${r.number}`;
}
