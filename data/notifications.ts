import type { AppNotification } from "@/types";
import { minutesAgo } from "@/lib/dates";
import { buildQueue } from "@/lib/dashboard";
import { operatingModel } from "@/lib/model";
import { seedModel } from "./index";

const queue = buildQueue(operatingModel(seedModel));
const first = (kind: string) => queue.find((q) => q.kind === kind);

/** Initial notification list, derived from the same operations queue shown on the dashboard. */
export const initialNotifications: AppNotification[] = [
  first("access-failed") && { id: "n1", title: first("access-failed")!.title, detail: first("access-failed")!.detail, at: minutesAgo(22), href: "/access-codes", read: false },
  first("lock-offline") && { id: "n2", title: first("lock-offline")!.title, detail: first("lock-offline")!.detail, at: minutesAgo(61), href: "/smart-locks", read: false },
  first("instructions") && { id: "n3", title: first("instructions")!.title, detail: first("instructions")!.detail, at: minutesAgo(94), href: "/communications", read: false },
  first("mapping") && { id: "n4", title: first("mapping")!.title, detail: first("mapping")!.detail, at: minutesAgo(180), href: "/reservations", read: true },
  { id: "n5", title: "Daily operations summary ready", detail: "Yesterday's arrivals, departures and turnovers are ready to review.", at: minutesAgo(420), href: "/reports", read: true },
].filter(Boolean) as AppNotification[];
