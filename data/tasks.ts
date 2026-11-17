import type { AccessTask } from "@/types";
import { NOW, TODAY_ISO, shift, stamp } from "@/lib/dates";
import { mulberry32 } from "@/lib/random";
import { reservations } from "./reservations";
import { OFFLINE_ROOMS } from "./locks";

const rand = mulberry32(314);

/** One "prepare access window" task per upcoming or in-flight stay (today -1 .. +2). Simulated; no real lock calls. */
export const accessTasks: AccessTask[] = reservations
  .filter((r) => r.status !== "Cancelled" && r.checkIn >= shift(TODAY_ISO, -1) && r.checkIn <= shift(TODAY_ISO, 2))
  .map((r, i) => {
    const offline = OFFLINE_ROOMS.has(r.roomId) && r.checkIn <= shift(TODAY_ISO, 1);
    const due = r.checkIn <= TODAY_ISO;
    let status: AccessTask["status"];
    if (offline && r.checkIn === TODAY_ISO) status = "Failed";
    else if (r.checkIn < TODAY_ISO) status = "Completed";
    else if (due) status = rand() < 0.82 ? "Completed" : "Pending";
    else status = rand() < 0.45 ? "Completed" : "Scheduled";
    return {
      id: `TSK-${5200 + i}`,
      reservationId: r.id,
      roomId: r.roomId,
      propertyId: r.propertyId,
      kind: "Prepare access window" as const,
      status,
      createdAt: stamp(new Date(NOW.getTime() - (20 + Math.floor(rand() * 600)) * 60_000)),
      failureReason: status === "Failed" ? "Lock unreachable" : undefined,
    };
  });
