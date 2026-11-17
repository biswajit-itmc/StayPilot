import type { Guest } from "@/types";
import { mulberry32, pick } from "@/lib/random";

const first = ["Elena", "Tom", "Priya", "Marcus", "Aiko", "Lucas", "Sofia", "Daniel", "Amara", "Henrik", "Camille", "Noah", "Isabel", "Kenji", "Olivia", "Rafael", "Zara", "Mateo", "Hannah", "Viktor", "Leila", "Oscar", "Maya", "Felix", "Chiara", "Anders", "Beatriz", "Callum", "Dina", "Emil", "Freya", "Gabriel", "Hiro", "Ines", "Jonas", "Kira", "Liam", "Mina", "Nico", "Opal", "Paulo", "Quinn", "Rosa", "Stefan", "Tara", "Ulrich", "Vera", "Willem", "Xavier", "Yara", "Zoe", "Adrian", "Bianca", "Cedric", "Delia", "Ewan", "Fiona", "Gustavo", "Helena"];
const last = ["Martins", "Hallett", "Raman", "Weber", "Tanaka", "Moreau", "Okafor", "Duval", "Costa", "Larsen", "Berger", "Fraser", "Ito", "Silva", "Novak", "Haddad", "Romero", "Fischer", "Lindqvist", "Santos", "Becker", "Rossi", "Khan", "Petit", "Almeida", "Brandt", "Carvalho", "Dumont", "Eriksen", "Ferreira", "Garcia", "Hoffmann", "Ivanov", "Jensen", "Kowalski", "Lopes", "Mendes", "Nielsen", "Oliveira", "Pereira", "Quintero", "Ribeiro", "Schmidt", "Teixeira", "Unger", "Vidal", "Walker", "Yamamoto", "Zimmer", "Abbott", "Bishop", "Clarke", "Dawson", "Ellis", "Foster", "Grant", "Hughes", "Irving", "Jacobs"];
const countries: [string, string][] = [
  ["Portugal", "Portuguese"],
  ["United Kingdom", "English"],
  ["Germany", "German"],
  ["France", "French"],
  ["Spain", "Spanish"],
  ["Netherlands", "Dutch"],
  ["United States", "English"],
  ["Italy", "Italian"],
  ["Sweden", "Swedish"],
  ["Brazil", "Portuguese"],
];

export const GUEST_COUNT = 1200;
/** The first RETURNING_POOL guests book far more often than the rest, so some guests have long histories. */
export const RETURNING_POOL = 260;

const rand = mulberry32(7);
const seen = new Set<string>();

export const guests: Guest[] = [];
let n = 0;
while (guests.length < GUEST_COUNT) {
  const f = pick(rand, first);
  const l = pick(rand, last);
  const name = `${f} ${l}`;
  if (seen.has(name)) continue;
  seen.add(name);
  const [country, language] = pick(rand, countries);
  const r = rand();
  const num = String(n + 1).padStart(4, "0");
  guests.push({
    id: `gst_${num}`,
    name,
    email: `${f}.${l}`.toLowerCase() + `${n % 7 === 0 ? n : ""}@example.com`,
    // 555-01xx style numbers are reserved for fiction.
    phone: `+1 555 01${String(n % 100).padStart(2, "0")}`,
    country,
    language,
    status: r < 0.07 ? "VIP" : r < 0.075 ? "Blocked" : "Standard",
    createdAt: "2025-01-01",
  });
  n++;
}
