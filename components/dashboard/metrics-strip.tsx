import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { format } from "date-fns";
import { TODAY } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { getMetrics } from "@/lib/dashboard";

type Metrics = ReturnType<typeof getMetrics>;

function Delta({ value, unit = "", label, goodWhenUp = true }: { value: number | null; unit?: string; label: string; goodWhenUp?: boolean | null }) {
  if (value === null) {
    return (
      <span className="inline-flex items-center gap-1 text-meta">
        <Minus className="size-3.5" aria-hidden />
        <span>No comparison ({label.replace("vs ", "")} had none)</span>
      </span>
    );
  }
  const Icon = value === 0 ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;
  const good = value === 0 || goodWhenUp === null ? null : value > 0 === goodWhenUp;
  return (
    <span className="inline-flex items-center gap-1 text-meta">
      <Icon className={cn("size-3.5", good === true && "text-olive-deep", good === false && "text-brown-ink")} aria-hidden />
      <span className="tabular !text-charcoal">
        {value > 0 ? "+" : ""}
        {value}
        {unit}
      </span>
      <span>{label}</span>
    </span>
  );
}

export function MetricsStrip({ m, filtered }: { m: Metrics; filtered: boolean }) {
  const cells = [
    {
      label: filtered ? "Units" : "Total properties",
      value: filtered ? m.properties.units : m.properties.value,
      foot: filtered ? `${m.properties.outOfService} out of service` : `${m.properties.units} units · ${m.properties.outOfService} out of service`,
    },
    { label: "Active reservations", value: m.active.value, foot: <Delta value={m.active.deltaPct} unit="%" label="vs last week" /> },
    { label: "Arrivals today", value: m.arrivals.value, foot: <Delta value={m.arrivals.delta} label="vs yesterday" goodWhenUp={null} /> },
    { label: "Departures today", value: m.departures.value, foot: <Delta value={m.departures.delta} label="vs yesterday" goodWhenUp={null} /> },
    {
      label: "Occupancy tonight",
      value: `${m.occupancy.value}%`,
      foot: <Delta value={m.occupancy.deltaPts} unit=" pts" label={`vs last ${format(TODAY, "EEEE")}`} />,
      bar: m.occupancy.value,
    },
  ];
  return (
    <dl className="grid grid-cols-2 divide-border rounded-xl border border-border bg-surface sm:grid-cols-3 xl:grid-cols-5 xl:divide-x [&>div]:border-b [&>div]:border-border xl:[&>div]:border-b-0">
      {cells.map((c) => (
        <div key={c.label} className="relative px-4 py-4 last:col-span-2 sm:last:col-span-1 sm:px-5">
          <dt className="text-label uppercase tracking-wide text-muted-foreground">{c.label}</dt>
          <dd className="tabular mt-1.5 text-[1.75rem] font-semibold leading-8 tracking-tight">{c.value}</dd>
          <dd className="mt-1 text-meta">{c.foot}</dd>
          {"bar" in c && (
            <span className="absolute inset-x-5 bottom-0 h-0.5 overflow-hidden rounded-full bg-muted" aria-hidden>
              <span className="block h-full rounded-full bg-olive-deep" style={{ width: `${c.bar}%` }} />
            </span>
          )}
        </div>
      ))}
    </dl>
  );
}
