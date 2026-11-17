import { CalendarPlus, DoorOpen, KeyRound, Lock, MessageSquare, SprayCan, type LucideIcon } from "lucide-react";
import type { ActivityItem } from "@/types";
import { DEMO_REFERENCE_TIME, timeAgo } from "@/lib/dates";
import { SectionHeader } from "./section";

const icons: Record<ActivityItem["kind"], LucideIcon> = {
  booking: CalendarPlus,
  access: KeyRound,
  lock: Lock,
  message: MessageSquare,
  housekeeping: SprayCan,
  checkin: DoorOpen,
};

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <section>
      <SectionHeader title="Recent activity" meta={`Latest operational events, up to ${DEMO_REFERENCE_TIME} demo time`} />
      {items.length === 0 ? (
        <p className="mt-4 text-body text-muted-foreground">No recent activity for this selection.</p>
      ) : (
        <ol className="relative mt-5 space-y-5 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-border">
          {items.slice(0, 7).map((a) => {
            const Icon = icons[a.kind];
            return (
              <li key={a.id} className="relative flex gap-3.5">
                <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full border border-border bg-background">
                  <Icon className="size-3.5 text-muted-foreground" aria-hidden />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-body">{a.text}</p>
                  <p className="mt-0.5 text-meta">
                    {timeAgo(a.at)} · {a.actor}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
