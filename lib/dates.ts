import { addDays, format, parseISO } from "date-fns";

/** Fixed "today" so the prototype's dummy data is deterministic (no hydration drift). */
export const TODAY = new Date(2026, 10, 17);
export const NOW = new Date(2026, 10, 17, 9, 42);
export const TODAY_ISO = "2026-11-17";

/** How the demo reference moment is shown to people ("Tue 17 Nov 2026, 09:42"). */
export const DEMO_REFERENCE_LABEL = format(NOW, "EEE d MMM yyyy, HH:mm");
export const DEMO_REFERENCE_TIME = format(NOW, "HH:mm");

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
