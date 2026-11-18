import { addDays, format, isValid, parse, parseISO } from "date-fns";

/** Fixed "today" so the prototype's dummy data is deterministic (no hydration drift). */
export const TODAY = new Date(2026, 10, 17);
export const NOW = new Date(2026, 10, 17, 9, 42);
export const TODAY_ISO = "2026-11-17";

/** How the demo reference moment is shown to people ("Tue 17 Nov 2026, 09:42"). */
export const DEMO_REFERENCE_LABEL = format(NOW, "EEE d MMM yyyy, HH:mm");
export const DEMO_REFERENCE_TIME = format(NOW, "HH:mm");

/** Stay dates and times are shown the same way everywhere: "10 Nov 2026" and "3:00 PM". */
export const formatStayDate = (isoDate: string) => format(parseISO(isoDate), "d MMM yyyy");
/** "HH:mm" -> "3:00 PM". Null when the value is missing or malformed, so callers can omit it instead of showing a wrong time. */
export function formatStayTime(hhmm?: string | null): string | null {
  if (!hhmm) return null;
  const v = parse(hhmm, "HH:mm", new Date(2000, 0, 1));
  return isValid(v) ? format(v, "h:mm a") : null;
}

export const iso = (d: Date) => format(d, "yyyy-MM-dd");
export const shift = (isoDate: string, days: number) => iso(addDays(parseISO(isoDate), days));
export const daysBetween = (a: string, b: string) =>
  Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000);

export function timeAgo(isoDateTime: string, now: Date = NOW): string {
  const mins = Math.max(1, Math.round((now.getTime() - new Date(isoDateTime).getTime()) / 60_000));
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

export const clock = (isoDateTime: string) => format(new Date(isoDateTime), "HH:mm");

/** Timezone-neutral stamp ("2026-11-17T09:42"); parses as local time on server and client alike. */
export const stamp = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm");
export const minutesAgo = (mins: number) => stamp(new Date(NOW.getTime() - mins * 60_000));
