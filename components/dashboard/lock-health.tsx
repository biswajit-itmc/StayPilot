import Link from "next/link";
import { ArrowRight, BatteryLow, WifiOff } from "lucide-react";
import { roomLabel } from "@/data/rooms";
import type { Model } from "@/lib/model";
import { timeAgo } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { getLockHealth } from "@/lib/dashboard";
import { SectionHeader } from "./section";

type Health = ReturnType<typeof getLockHealth>;

export function LockHealth({ m, health, pendingTasks, failedTasks }: { m: Model; health: Health; pendingTasks: number; failedTasks: number }) {
  const stats = [
    { label: "Connected", value: health.online, of: health.total, tone: "" },
    { label: "Offline", value: health.offline, tone: health.offline ? "text-brown-ink" : "" },
    { label: "Pending access tasks", value: pendingTasks, tone: "" },
    { label: "Failed actions", value: failedTasks, tone: failedTasks ? "text-brown-ink" : "" },
  ];
  return (
    <section className="rounded-2xl bg-mint/30 p-5">
      <SectionHeader
        title="Smart lock health"
        meta="Simulated device data"
        action={
          <Link href="/smart-locks" className="inline-flex min-h-6 items-center gap-1 text-label text-charcoal hover:underline">
            All locks <ArrowRight className="size-3.5" />
          </Link>
        }
      />
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-meta">{s.label}</dt>
            <dd className={cn("tabular mt-0.5 text-[1.75rem] font-semibold leading-8 tracking-tight", s.tone)}>
              {s.value}
              {"of" in s && <span className="text-body font-normal text-muted-foreground"> / {s.of}</span>}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 border-t border-charcoal/10 pt-4">
        <p className="text-eyebrow">Needs attention</p>
        {health.attention.length === 0 ? (
          <p className="mt-2 text-body text-muted-foreground">Every lock is online with healthy batteries.</p>
        ) : (
          <ul className="mt-2 divide-y divide-charcoal/10">
            {health.attention.slice(0, 5).map((l) => {
              const room = m.by.room.get(l.roomId)!;
              const offline = l.status === "Offline";
              return (
                <li key={l.id} className="flex items-center gap-3 py-2.5">
                  {offline ? <WifiOff className="size-4 shrink-0 text-brown-ink" aria-hidden /> : <BatteryLow className="size-4 shrink-0 text-brown-ink" aria-hidden />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-label">
                      {roomLabel(room)} · {m.by.property.get(l.propertyId)?.name}
                    </p>
                    <p className="text-meta !text-charcoal/70">{offline ? `Offline · last seen ${timeAgo(l.lastSeen)}` : `Battery ${l.battery}%`}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
