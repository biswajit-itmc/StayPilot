"use client";

import { useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { ArrowDownRight, ArrowUpRight, BarChart3, Minus, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { getReservationActivity } from "@/lib/dashboard";
import { SectionHeader } from "./section";

type Data = ReturnType<typeof getReservationActivity>;
type Point = Data["series"][number];

// Chart colours, all >= 3:1 against both white and the page background (#f0f4f2):
// olive-deep 4.4:1, charcoal 16.8:1, axis text #5b5e58 5.9:1.
const BOOKINGS = "#657a1d";
const PREVIOUS = "#121311";
const AXIS = "#5b5e58";
const GRID = "#dde4df";

const fmt = (d: string) => format(parseISO(d), "d MMM");
const span = (a: string, b: string) => (a === b ? fmt(a) : `${fmt(a)} – ${fmt(b)}`);

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="min-w-48 rounded-lg border border-border-strong bg-surface px-3 py-2.5 shadow-pop">
      <p className="text-label">{format(parseISO(p.date), "EEE d MMM")}</p>
      <p className="mt-1.5 flex items-center gap-2 text-body">
        <span className="size-2.5 rounded-sm" style={{ background: BOOKINGS }} aria-hidden />
        <span className="tabular font-semibold">{p.bookings}</span> new bookings
      </p>
      <p className="flex items-center gap-2 text-body">
        <span className="w-2.5 border-t-2 border-dashed" style={{ borderColor: PREVIOUS }} aria-hidden />
        <span className="tabular font-semibold">{p.prevBookings}</span> on {p.prevLabel}
      </p>
      <p className="mt-1 text-meta">{p.cancellations} cancellations</p>
    </div>
  );
}

function Change({ pct, prev, days }: { pct: number | null; prev: number; days: number }) {
  if (pct === null) {
    return (
      <span>
        <Minus className="inline-block size-3.5 align-[-2px]" aria-hidden /> no bookings in the previous {days} days to compare with
      </span>
    );
  }
  const Icon = pct === 0 ? Minus : pct > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span>
      <Icon className={cn("inline-block size-3.5 align-[-2px]", pct > 0 && "text-olive-deep", pct < 0 && "text-brown-ink")} aria-hidden />
      <span className="tabular text-charcoal">
        {pct > 0 ? "+" : ""}
        {pct}%
      </span>{" "}
      vs <span className="tabular text-charcoal">{prev}</span> in the previous {days} days
    </span>
  );
}

export function ReservationActivity({ data }: { data: Data }) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const { days, range, prevRange } = data;
  const summary = `${data.bookings} new bookings from ${span(range.from, range.to)}, ${
    data.deltaPct === null ? "with no previous-period bookings to compare" : `${data.deltaPct >= 0 ? "up" : "down"} ${Math.abs(data.deltaPct)} percent on the previous ${days} days`
  }. Busiest day ${fmt(data.peak.date)} with ${data.peak.bookings} bookings.`;

  return (
    <section>
      <SectionHeader
        title="Reservation activity"
        meta={
          <>
            <span className="tabular font-medium text-charcoal">{data.bookings}</span> new bookings, {span(range.from, range.to)}
            <span className="mx-1.5">·</span>
            <Change pct={data.deltaPct} prev={data.prevBookings} days={days} />
          </>
        }
        action={
          <div className="inline-flex rounded-lg border border-border-strong bg-surface p-0.5" role="group" aria-label="Chart view">
            {(
              [
                ["chart", BarChart3, "Chart"],
                ["table", Table2, "Table"],
              ] as const
            ).map(([v, Icon, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-label transition-colors", view === v ? "bg-charcoal text-background" : "text-muted-foreground hover:text-charcoal")}
              >
                <Icon className="size-3.5" aria-hidden />
                <span className="max-sm:sr-only">{label}</span>
              </button>
            ))}
          </div>
        }
      />

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-body text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-sm" style={{ background: BOOKINGS }} aria-hidden /> New bookings (bars)
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-4 border-t-2 border-dashed" style={{ borderColor: PREVIOUS }} aria-hidden /> Previous period, {span(prevRange.from, prevRange.to)} (dashed line)
        </span>
        <span className="ml-auto hidden text-meta sm:block">
          Busiest day: <span className="text-charcoal">{fmt(data.peak.date)}</span> ({data.peak.bookings}) · {data.cancellations} cancellations
        </span>
      </div>

      {view === "chart" ? (
        <figure className="m-0 mt-3">
          <figcaption className="sr-only">{summary} Use the Table view for exact daily values.</figcaption>
          <div className="h-[260px] w-full" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.series} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} accessibilityLayer={false}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#9ea19c" }} tick={{ fill: AXIS, fontSize: 12 }} interval={Math.max(0, Math.ceil(days / 8) - 1)} minTickGap={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: AXIS, fontSize: 12 }} width={32} />
                <Tooltip cursor={{ fill: "rgba(101,122,29,0.12)" }} content={<ChartTooltip />} />
                <Bar dataKey="bookings" fill={BOOKINGS} radius={[4, 4, 0, 0]} maxBarSize={days > 30 ? 10 : days > 14 ? 14 : 28} isAnimationActive={false} />
                <Line type="linear" dataKey="prevBookings" stroke={PREVIOUS} strokeWidth={2} strokeDasharray="6 4" dot={false} activeDot={{ r: 4, fill: PREVIOUS, stroke: "#fff", strokeWidth: 2 }} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </figure>
      ) : (
        <div className="mt-3 max-h-[260px] overflow-auto rounded-xl border border-border bg-surface" tabIndex={0} role="region" aria-label="Daily reservation activity table, scrollable">
          <table className="w-full text-body">
            <caption className="sr-only">
              Daily new bookings and cancellations for {span(range.from, range.to)}, compared with the same day of the previous period
            </caption>
            <thead className="sticky top-0 bg-muted text-left">
              <tr>
                <th scope="col" className="px-4 py-2 text-eyebrow">Date</th>
                <th scope="col" className="px-4 py-2 text-right text-eyebrow">New bookings</th>
                <th scope="col" className="px-4 py-2 text-right text-eyebrow">Previous period</th>
                <th scope="col" className="px-4 py-2 text-right text-eyebrow">Cancellations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...data.series].reverse().map((p) => (
                <tr key={p.date}>
                  <th scope="row" className="px-4 py-1.5 text-left font-normal">{p.label}</th>
                  <td className="tabular px-4 py-1.5 text-right">{p.bookings}</td>
                  <td className="tabular px-4 py-1.5 text-right">
                    {p.prevBookings} <span className="text-meta">({p.prevLabel})</span>
                  </td>
                  <td className="tabular px-4 py-1.5 text-right">{p.cancellations}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 bg-muted">
              <tr>
                <th scope="row" className="px-4 py-2 text-left text-label">Total</th>
                <td className="tabular px-4 py-2 text-right text-label">{data.bookings}</td>
                <td className="tabular px-4 py-2 text-right text-label">{data.prevBookings}</td>
                <td className="tabular px-4 py-2 text-right text-label">{data.cancellations}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}
