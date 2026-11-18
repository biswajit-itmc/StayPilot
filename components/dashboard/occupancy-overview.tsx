import { cn } from "@/lib/utils";
import type { getOccupancyBreakdown, getPropertyOccupancy } from "@/lib/dashboard";
import { SectionHeader } from "./section";

type Breakdown = ReturnType<typeof getOccupancyBreakdown>;
type PerProperty = ReturnType<typeof getPropertyOccupancy>;

export function OccupancyOverview({ breakdown, perProperty, pct }: { breakdown: Breakdown; perProperty: PerProperty; pct: number }) {
  const segments = [
    { key: "stay", label: "Staying over", value: breakdown.stayovers, className: "bg-charcoal" },
    { key: "arr", label: "Arriving today", value: breakdown.arriving, className: "bg-olive-deep" },
    { key: "avail", label: "Available", value: breakdown.available, className: "bg-muted ring-1 ring-inset ring-muted-foreground/70" },
    { key: "oos", label: "Out of service", value: breakdown.outOfService, className: "bg-brown" },
  ];
  return (
    <section>
      <SectionHeader title="Occupancy tonight" meta={`${breakdown.sellable} sellable of ${breakdown.total} units`} />

      <p className="tabular mt-5 text-[2rem] font-semibold leading-none tracking-tight">
        {pct}
        <span className="text-section text-muted-foreground">%</span>
      </p>

      <div className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={segments.map((s) => `${s.label} ${s.value}`).join(", ")}>
        {segments.map((s) => (
          <span key={s.key} className={cn("first:rounded-l-full last:rounded-r-full", s.className)} style={{ flexGrow: s.value, flexBasis: 0 }} title={`${s.label}: ${s.value}`} />
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-body">
            <span className={cn("size-2.5 rounded-sm", s.className)} aria-hidden />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="tabular ml-auto font-medium">{s.value}</span>
          </li>
        ))}
      </ul>

      {perProperty.length > 1 && (
        <ul className="mt-6 space-y-3 border-t border-border pt-5">
          {perProperty.map((p) => (
            <li key={p.id}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-label">{p.name}</span>
                <span className="tabular shrink-0 text-meta">
                  {p.occupied}/{p.sellable} · <span className="font-medium !text-charcoal">{p.pct}%</span>
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-border-strong" role="img" aria-label={`${p.name} ${p.pct}% occupied`}>
                <div className="h-full rounded-full bg-olive-deep" style={{ width: `${p.pct}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
