/** Illustrative content for landing-page mockups. All names and figures are fictional placeholders. */

export const navLinks = [
  { label: "Product", href: "#product" },
  { label: "Solutions", href: "#solutions" },
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
] as const;

export const mockProperties = [
  { name: "Harbor House Hotel", type: "Hotel", units: 42, location: "Lisbon", status: "Operational" },
  { name: "Casa Alma Villas", type: "Villas", units: 8, location: "Algarve", status: "Operational" },
  { name: "Northgate Lofts", type: "Apartments", units: 16, location: "Porto", status: "2 turnovers pending" },
  { name: "Seaview Suites", type: "Boutique hotel", units: 24, location: "Cascais", status: "Operational" },
] as const;

export const mockArrivals = [
  { guest: "Elena Martins", unit: "Suite 204", time: "14:00", state: "Access ready" },
  { guest: "Tom Hallett", unit: "Villa B", time: "15:30", state: "Instructions sent" },
  { guest: "Priya Raman", unit: "Loft 3", time: "16:15", state: "Awaiting ID" },
] as const;

export const calendarDays = ["Tue 17", "Wed 18", "Thu 19", "Fri 20", "Sat 21", "Sun 22", "Mon 23", "Tue 24", "Wed 25", "Thu 26"] as const;

export type Tone = "mint" | "sage" | "lime" | "charcoal" | "brown";

export const calendarRows: { unit: string; stays: { guest: string; start: number; span: number; tone: Tone }[] }[] = [
  { unit: "101 · Garden Room", stays: [{ guest: "R. Okafor", start: 0, span: 3, tone: "sage" }, { guest: "M. Duval", start: 4, span: 4, tone: "mint" }] },
  { unit: "204 · Harbor Suite", stays: [{ guest: "E. Martins", start: 1, span: 5, tone: "lime" }, { guest: "Hold", start: 7, span: 2, tone: "brown" }] },
  { unit: "205 · Harbor Suite", stays: [{ guest: "J. Weiss", start: 0, span: 2, tone: "mint" }, { guest: "A. Costa", start: 2, span: 3, tone: "sage" }, { guest: "K. Ito", start: 6, span: 4, tone: "mint" }] },
  { unit: "Villa A", stays: [{ guest: "The Hallett family", start: 0, span: 6, tone: "charcoal" }, { guest: "S. Berger", start: 7, span: 3, tone: "sage" }] },
  { unit: "Villa B", stays: [{ guest: "T. Hallett", start: 2, span: 4, tone: "lime" }, { guest: "N. Fraser", start: 7, span: 3, tone: "mint" }] },
  { unit: "Loft 3", stays: [{ guest: "P. Raman", start: 3, span: 3, tone: "sage" }, { guest: "L. Moreau", start: 6, span: 2, tone: "mint" }] },
];

export const mockLocks = [
  { unit: "Suite 204", device: "Entry lock", battery: 86, state: "Online", tone: "ok" },
  { unit: "Villa A", device: "Front door", battery: 64, state: "Online", tone: "ok" },
  { unit: "Villa B", device: "Front door", battery: 18, state: "Low battery", tone: "warn" },
  { unit: "Loft 3", device: "Entry lock", battery: 92, state: "Online", tone: "ok" },
  { unit: "Garden Room 101", device: "Entry lock", battery: 71, state: "Offline", tone: "warn" },
] as const;

export const accessFlow = [
  { title: "Reservation confirmed", detail: "A booking lands in the calendar with dates, guest and party size." },
  { title: "Unit assigned", detail: "The stay is matched to an available unit, avoiding conflicts." },
  { title: "Access task created", detail: "A task is queued so the right access window is prepared for the stay." },
  { title: "Guest instructions sent", detail: "Check-in details go out through your configured message templates." },
] as const;

export const howItWorks = [
  { title: "Add your properties", detail: "Set up hotels, villas or apartments with their rooms and units, once." },
  { title: "Manage reservations", detail: "See every stay on one calendar, across every property." },
  { title: "Coordinate guest access", detail: "Line up access windows and guest instructions around each arrival." },
  { title: "Monitor operations", detail: "Watch pending tasks and exceptions so nothing slips through." },
] as const;

export const benefits = [
  { title: "Reduce fragmented workflows", detail: "Bookings, guests, access and tasks stop living in separate tools and spreadsheets." },
  { title: "Improve operational visibility", detail: "One view of what is happening today, in every property you run." },
  { title: "Coordinate arrivals more efficiently", detail: "Know who arrives when, which unit is ready, and what still needs doing." },
  { title: "Manage multiple properties centrally", detail: "Switch between a hotel and a set of villas without switching systems." },
  { title: "Track exceptions and pending actions", detail: "Low batteries, unassigned stays and late turnovers surface in one place." },
] as const;

export const footerColumns = [
  { title: "Product", links: ["Properties", "Reservations", "Guests", "Smart access", "Reports"] },
  { title: "Solutions", links: ["Hotels", "Vacation rentals", "Property managers", "Hospitality groups"] },
  { title: "Company", links: ["About", "Careers", "Contact", "Press"] },
] as const;
